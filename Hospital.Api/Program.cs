using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Signalsboard.Hospital.Api.Data;
using Signalsboard.Hospital.Api.Domain;
using Signalsboard.Hospital.Api.Hubs;
using Signalsboard.Hospital.Api.Services;
using static Signalsboard.Hospital.Api.Data.SeedData;

var builder = WebApplication.CreateBuilder(args);

// Add PostgreSQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<HospitalDbContext>(options =>
    options.UseNpgsql(connectionString)
);

builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString);

// Add CORS for React development server
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite default port
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// Add SignalR for real-time communication
builder.Services.AddSignalR();

// Add application services
builder.Services.AddScoped<AlertService>();
// Register VitalSignsSimulatorService as both Singleton (for DI) and HostedService (for background execution)
builder.Services.AddSingleton<VitalSignsSimulatorService>();
builder.Services.AddHostedService(provider => provider.GetRequiredService<VitalSignsSimulatorService>());

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

// Serve static files (React frontend from wwwroot)
app.UseStaticFiles();

// Fallback to index.html for SPA client-side routing
app.MapFallbackToFile("index.html");

// Apply EF migrations and seed data with error handling
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<HospitalDbContext>();
        var logger = app.Services.GetRequiredService<ILogger<Program>>();

        try
        {
            // Run pending migrations (safe - idempotent)
            logger.LogInformation("⏳ Running database migrations...");
            context.Database.Migrate();
            logger.LogInformation("✅ Migrations completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Migration failed");
            throw;
        }

        try
        {
            // Seed initial data if needed
            logger.LogInformation("🌱 Seeding database...");
            Initialize(context);
            logger.LogInformation("✅ Database seeding completed");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "⚠️ Seeding encountered an issue (may be non-critical)");
        }
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "❌ Critical: Database initialization failed. Application cannot start.");
    throw;
}

// Hospital API Endpoints
app.MapGet("/api/wards", async (HospitalDbContext db) =>
{
    var wards = await db.Wards
        .OrderBy(w => w.Name)
        .ToListAsync();
    return Results.Ok(wards);
})
.WithName("GetWards")
.WithOpenApi();

app.MapGet("/api/patients", async (HospitalDbContext db, string? wardId = null) =>
{
    var query = db.Patients.AsQueryable();

    if (!string.IsNullOrEmpty(wardId))
    {
        query = query.Where(p => p.Bed != null && p.Bed.WardId == wardId);
    }

    // ✅ OPTIMIZATION: Load patients WITHOUT vitals first (fast)
    var patients = await query
        .Include(p => p.Bed)
        .ThenInclude(b => b!.Ward)
        .AsNoTracking()  // Read-only optimization
        .OrderBy(p => p.Name)
        .ToListAsync();

    // ✅ OPTIMIZATION: Load ONLY last 20 vitals per patient at DB level using window function
    var patientIds = patients.Select(p => p.Id).ToList();

    // Use SQL window function to get exactly 20 vitals per patient at database level
    // ROW_NUMBER() OVER (PARTITION BY PatientId ORDER BY RecordedAt DESC) as rn
    // WHERE rn <= 20
    var allRecentVitals = await db.VitalSigns
        .FromSqlInterpolated($@"
            WITH RankedVitals AS (
                SELECT
                    ""Id"", ""PatientId"", ""HeartRate"", ""SpO2"",
                    ""BpSystolic"", ""BpDiastolic"", ""Temperature"", ""RecordedAt"",
                    ROW_NUMBER() OVER (PARTITION BY ""PatientId"" ORDER BY ""RecordedAt"" DESC) as rn
                FROM public.""VitalSigns""
                WHERE ""PatientId"" = ANY({patientIds.ToArray()})
            )
            SELECT
                ""Id"", ""PatientId"", ""HeartRate"", ""SpO2"",
                ""BpSystolic"", ""BpDiastolic"", ""Temperature"", ""RecordedAt""
            FROM RankedVitals
            WHERE rn <= 20
            ORDER BY ""PatientId"", ""RecordedAt"" DESC
        ")
        .AsNoTracking()  // Read-only optimization
        .ToListAsync();

    // Group vitals by patient (data is already filtered to 20 per patient from database)
    var vitalsByPatient = allRecentVitals
        .GroupBy(v => v.PatientId)
        .ToDictionary(
            g => g.Key,
            g => g
                .OrderBy(v => v.RecordedAt)  // Chronological for sparklines
                .ToList()
        );

    // Project to DTO
    var patientsDto = patients.Select(p => new
    {
        p.Id,
        p.Mrn,
        p.Name,
        p.Status,
        p.AdmittedAt,
        p.AttendingPhysician,
        p.PrimaryDiagnosis,
        p.InjectionModeEnabled,
        Bed = p.Bed != null ? new
        {
            p.Bed.Id,
            p.Bed.Number,
            p.Bed.WardId,
            p.Bed.Status,
            p.Bed.BedType,
            Ward = p.Bed.Ward != null ? new
            {
                p.Bed.Ward.Id,
                p.Bed.Ward.Name,
                p.Bed.Ward.Capacity,
                p.Bed.Ward.Location
            } : (object?)null
        } : (object?)null,
        VitalSigns = vitalsByPatient.TryGetValue(p.Id, out var vitals)
            ? vitals.Select(v => new
            {
                v.Id,
                v.PatientId,
                v.HeartRate,
                v.SpO2,
                v.BpSystolic,
                v.BpDiastolic,
                v.Temperature,
                v.RecordedAt
            }).Cast<object>().ToList()
            : new List<object>()
    }).ToList();

    return Results.Ok(patientsDto);
})
.WithName("GetPatients")
.WithOpenApi();

app.MapGet("/api/patients/{id}/trend", async (HospitalDbContext db, string id, int minutes = 240) =>
{
    var trends = await db.VitalSigns
        .Where(v => v.PatientId == id &&
                   v.RecordedAt >= DateTime.UtcNow.AddMinutes(-minutes))
        .OrderBy(v => v.RecordedAt)
        .ToListAsync();

    return Results.Ok(trends);
})
.WithName("GetPatientTrend")
.WithOpenApi();

// Manual vital signs injection endpoint for testing
app.MapPost("/api/vitals/inject", async (
    HospitalDbContext db,
    AlertService alertService,
    IHubContext<VitalsHub, IVitalsClient> hubContext,
    VitalSignsSimulatorService simulatorService,
    VitalSignsInjectionRequest request) =>
{
    var patient = await db.Patients
        .Include(p => p.Bed)
        .ThenInclude(b => b!.Ward)
        .FirstOrDefaultAsync(p => p.Id == request.PatientId);

    if (patient == null)
        return Results.NotFound($"Patient {request.PatientId} not found");

    var vitals = new VitalSigns
    {
        Id = Guid.NewGuid().ToString(),
        PatientId = request.PatientId,
        HeartRate = request.HeartRate,
        SpO2 = request.SpO2,
        BpSystolic = request.BpSystolic,
        BpDiastolic = request.BpDiastolic,
        RecordedAt = DateTime.UtcNow
    };

    if (!vitals.IsValid())
        return Results.BadRequest("Invalid vital signs values");

    // Record injected vitals so simulator can use as baseline if injection mode is enabled
    simulatorService.RecordInjectedVitals(request.PatientId, vitals);

    db.VitalSigns.Add(vitals);

    // Generate and save alerts
    var alerts = alertService.GenerateAlertsForVitals(vitals);
    if (alerts.Any())
    {
        db.Alerts.AddRange(alerts);
        alertService.UpdatePatientStatus(patient, vitals);

        foreach (var alert in alerts)
        {
            await hubContext.Clients.All.ReceiveAlert(new AlertNotification(
                alert.Id,
                patient.Id,
                patient.Name,
                alert.AlertType,
                alert.Severity,
                alert.Message,
                alert.TriggeredAt
            ));
        }
    }

    await db.SaveChangesAsync();

    // Broadcast vital update via SignalR
    var update = new VitalSignsUpdate(
        patient.Id,
        patient.Name,
        patient.Bed?.Number,
        patient.Bed?.Ward?.Name,
        vitals.HeartRate,
        vitals.SpO2,
        vitals.BpSystolic,
        vitals.BpDiastolic,
        vitals.CalculateAlertSeverity().ToString(),
        vitals.RecordedAt
    );

    await hubContext.Clients.All.ReceiveVitalUpdate(update);

    return Results.Ok(update);
})
.WithName("InjectVitalSigns")
.WithOpenApi();

// Toggle injection mode for a patient
// When enabled, simulator uses injected vitals as baseline with drift pattern
app.MapPost("/api/simulator/patient/{id}/injection-mode", async (
    string id,
    bool enabled,
    HospitalDbContext db,
    VitalSignsSimulatorService simulatorService,
    IHubContext<VitalsHub, IVitalsClient> hubContext) =>
{
    // Fetch patient from database
    var patient = await db.Patients.FirstOrDefaultAsync(p => p.Id == id);
    if (patient == null)
        return Results.NotFound($"Patient {id} not found");

    // Update database (source of truth)
    patient.InjectionModeEnabled = enabled;
    await db.SaveChangesAsync();

    // Update in-memory simulator state
    simulatorService.SetInjectionMode(id, enabled);

    // Broadcast change to all connected clients (same pattern as vital updates)
    var change = new InjectionModeChange(
        patient.Id,
        patient.Name,
        enabled,
        DateTime.UtcNow
    );
    await hubContext.Clients.All.ReceiveInjectionModeChange(change);

    var modeStatus = enabled ? "ENABLED" : "DISABLED";
    return Results.Ok(new { patientId = id, injectionMode = modeStatus });
})
.WithName("ToggleInjectionMode")
.WithOpenApi();

// Nurse Attending endpoint - source of truth is database
app.MapPost("/api/patients/{id}/nurse-attending", async (
    string id,
    bool attending,
    HospitalDbContext db,
    IHubContext<VitalsHub, IVitalsClient> hubContext) =>
{
    // Fetch patient from database
    var patient = await db.Patients.FirstOrDefaultAsync(p => p.Id == id);
    if (patient == null)
        return Results.NotFound($"Patient {id} not found");

    // Update database (source of truth)
    patient.NurseAttending = attending;
    await db.SaveChangesAsync();

    // Broadcast change to all connected clients
    var change = new NurseAttendingChange(
        patient.Id,
        patient.Name,
        attending,
        DateTime.UtcNow
    );
    await hubContext.Clients.All.ReceiveNurseAttendingChange(change);

    var status = attending ? "ATTENDING" : "IDLE";
    return Results.Ok(new { patientId = id, nurseAttending = status });
})
.WithName("ToggleNurseAttending")
.WithOpenApi();

app.MapHealthChecks("/health");

// Map SignalR Hub
app.MapHub<VitalsHub>("/hubs/vitals");

app.Run();

// Make Program accessible for integration testing
public partial class Program { }

/// <summary>
/// Request DTO for manual vital signs injection via testing tool
/// </summary>
public record VitalSignsInjectionRequest(
    string PatientId,
    int? HeartRate,
    int? SpO2,
    int? BpSystolic,
    int? BpDiastolic
);
