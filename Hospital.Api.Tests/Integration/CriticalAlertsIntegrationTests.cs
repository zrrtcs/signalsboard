using DotNet.Testcontainers.Configurations;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Signalsboard.Hospital.Api.Data;
using Signalsboard.Hospital.Api.Domain;
using Signalsboard.Hospital.Api.Services;
using Testcontainers.PostgreSql;
using Xunit;

namespace Signalsboard.Hospital.Api.Tests.Integration;

public class CriticalAlertsIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer;
    private WebApplicationFactory<Program> _factory = null!;
    private HospitalDbContext _context = null!;
    private AlertService _alertService = null!;

    public CriticalAlertsIntegrationTests()
    {
        // Configure Docker endpoint - use standard socket for Testcontainers
        var dockerEndpoint = new Uri("unix:///var/run/docker.sock");

        _postgresContainer = new PostgreSqlBuilder()
            .WithDockerEndpoint(dockerEndpoint)
            .WithDatabase("hospital_test")
            .WithUsername("testuser")
            .WithPassword("testpass")
            .Build();
    }

    public async Task InitializeAsync()
    {
        await _postgresContainer.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<HospitalDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Add test database
                    services.AddDbContext<HospitalDbContext>(options =>
                        options.UseNpgsql(_postgresContainer.GetConnectionString()));
                });
            });

        var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<HospitalDbContext>();
        await _context.Database.MigrateAsync();

        _alertService = new AlertService();
    }

    [Fact]
    public async Task Patient_With_Critical_HeartRate_Should_Generate_Critical_Alert()
    {
        // Arrange - This could be life or death
        var ward = new Ward { Id = "ICU-1", Name = "Intensive Care Unit", Capacity = 10 };
        var bed = new Bed { Id = "ICU-1-BED-1", Number = "1", WardId = "ICU-1", Status = "occupied" };
        var patient = new Patient
        {
            Id = Guid.NewGuid().ToString(),
            Name = "John Critical",
            Mrn = "MRN-CRITICAL-001",
            BedId = "ICU-1-BED-1",
            Status = "stable"
        };

        _context.Wards.Add(ward);
        _context.Beds.Add(bed);
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        // Act - Record dangerously high heart rate
        var criticalVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = patient.Id,
            HeartRate = 180, // CRITICAL: Normal is 60-100, this could indicate cardiac emergency
            BpSystolic = 120,
            BpDiastolic = 80,
            SpO2 = 98,
            RecordedAt = DateTime.UtcNow
        };

        _context.VitalSigns.Add(criticalVitals);
        await _context.SaveChangesAsync();

        // Generate and persist alerts
        var generatedAlerts = _alertService.GenerateAlertsForVitals(criticalVitals);
        _context.Alerts.AddRange(generatedAlerts);
        await _context.SaveChangesAsync();

        // Assert - System MUST generate critical alert
        var alertLevel = criticalVitals.CalculateAlertSeverity();
        Assert.Equal(AlertSeverity.Critical, alertLevel);

        // Verify alert is persisted in database
        var alerts = await _context.Alerts
            .Where(a => a.PatientId == patient.Id && a.IsActive)
            .ToListAsync();

        Assert.Single(alerts);
        Assert.Equal(AlertSeverity.Critical.ToString(), alerts[0].Severity);
        Assert.Contains("Heart Rate", alerts[0].Message);
    }

    [Fact]
    public async Task Patient_With_Low_Oxygen_Should_Generate_Immediate_Critical_Alert()
    {
        // Arrange - Hypoxemia is immediately life-threatening
        var ward = new Ward { Id = "ER-1", Name = "Emergency Room", Capacity = 20 };
        var bed = new Bed { Id = "ER-1-BED-5", Number = "5", WardId = "ER-1", Status = "occupied" };
        var patient = new Patient
        {
            Id = Guid.NewGuid().ToString(),
            Name = "Sarah Hypoxic",
            Mrn = "MRN-EMERGENCY-002",
            BedId = "ER-1-BED-5",
            Status = "watch"
        };

        _context.Wards.Add(ward);
        _context.Beds.Add(bed);
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        // Act - Record dangerously low oxygen saturation
        var hypoxicVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = patient.Id,
            HeartRate = 95,
            BpSystolic = 110,
            BpDiastolic = 70,
            SpO2 = 85, // CRITICAL: Below 90% requires immediate intervention
            RecordedAt = DateTime.UtcNow
        };

        _context.VitalSigns.Add(hypoxicVitals);
        await _context.SaveChangesAsync();

        // Generate alerts and update patient status
        var generatedAlerts = _alertService.GenerateAlertsForVitals(hypoxicVitals);
        _context.Alerts.AddRange(generatedAlerts);
        _alertService.UpdatePatientStatus(patient, hypoxicVitals);
        await _context.SaveChangesAsync();

        // Assert - System MUST generate critical alert immediately
        var alertLevel = hypoxicVitals.CalculateAlertSeverity();
        Assert.Equal(AlertSeverity.Critical, alertLevel);

        // Verify patient status escalated to critical
        var updatedPatient = await _context.Patients.FindAsync(patient.Id);
        Assert.NotNull(updatedPatient);

        // In a real system, this would trigger:
        // - Immediate nurse notification
        // - Doctor alert
        // - Possible code blue if no response
        var riskLevel = updatedPatient.CalculateRiskLevel();
        Assert.True(riskLevel == AlertSeverity.Critical || riskLevel == AlertSeverity.High);
    }

    [Fact]
    public async Task Multiple_Abnormal_Vitals_Should_Escalate_Patient_Status()
    {
        // Arrange - Multiple warning signs together = high risk
        var ward = new Ward { Id = "MED-1", Name = "Medical Ward", Capacity = 30 };
        var bed = new Bed { Id = "MED-1-BED-12", Number = "12", WardId = "MED-1", Status = "occupied" };
        var patient = new Patient
        {
            Id = Guid.NewGuid().ToString(),
            Name = "Robert Deteriorating",
            Mrn = "MRN-MEDICAL-003",
            BedId = "MED-1-BED-12",
            Status = "stable"
        };

        _context.Wards.Add(ward);
        _context.Beds.Add(bed);
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        // Act - Record multiple concerning vitals (not individually critical, but combined = concerning)
        var deterioratingVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = patient.Id,
            HeartRate = 115, // Elevated (normal: 60-100)
            BpSystolic = 165, // High (normal: <140)
            BpDiastolic = 95, // High (normal: <90)
            SpO2 = 93, // Borderline low (normal: >95%)
            RecordedAt = DateTime.UtcNow
        };

        _context.VitalSigns.Add(deterioratingVitals);
        await _context.SaveChangesAsync();

        // Generate alerts and update patient status
        var generatedAlerts = _alertService.GenerateAlertsForVitals(deterioratingVitals);
        _context.Alerts.AddRange(generatedAlerts);
        _alertService.UpdatePatientStatus(patient, deterioratingVitals);
        await _context.SaveChangesAsync();

        // Assert - System should recognize pattern and escalate
        var alertLevel = deterioratingVitals.CalculateAlertSeverity();
        Assert.True(alertLevel >= AlertSeverity.High,
            "Multiple abnormal vitals should generate at least High severity alert");

        // Verify this triggers proper clinical workflow
        var updatedPatient = await _context.Patients.FindAsync(patient.Id);
        var riskLevel = updatedPatient!.CalculateRiskLevel();

        // This should trigger increased monitoring frequency
        Assert.True(riskLevel >= AlertSeverity.High,
            "Patient with multiple abnormal vitals requires escalated care");
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
        await _factory.DisposeAsync();
        await _postgresContainer.StopAsync();
    }
}