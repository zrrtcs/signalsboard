using Microsoft.EntityFrameworkCore;
using Signalsboard.Hospital.Api.Data;
using Signalsboard.Hospital.Api.Domain;

var builder = WebApplication.CreateBuilder(args);

// Add PostgreSQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<HospitalDbContext>(options =>
    options.UseNpgsql(connectionString)
);

builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString);

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

app.MapHealthChecks("/health");

app.Run();

// Make Program accessible for integration testing
public partial class Program { }
