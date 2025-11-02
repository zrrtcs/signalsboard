using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Signalsboard.Hospital.Api.Data;
using Signalsboard.Hospital.Api.Domain;
using Signalsboard.Hospital.Api.Hubs;
using Signalsboard.Hospital.Api.Services;

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
builder.Services.AddHostedService<VitalSignsSimulatorService>();

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

// Apply EF migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HospitalDbContext>();

    // Apply pending migrations
    context.Database.Migrate();

    // Development-only sample data seeding
    // TODO: Move to separate SeedData service
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

    var patients = await query
        .Include(p => p.Bed)
        .ThenInclude(b => b!.Ward)
        .Include(p => p.VitalSigns.OrderByDescending(v => v.RecordedAt).Take(1))
        .OrderBy(p => p.Name)
        .ToListAsync();

    return Results.Ok(patients);
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
