using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Signalsboard.Hospital.Api.Data;
using Signalsboard.Hospital.Api.Domain;
using Signalsboard.Hospital.Api.Hubs;

namespace Signalsboard.Hospital.Api.Services;

/// <summary>
/// Background service that simulates realistic vital signs updates for demonstration purposes.
/// Generates medically plausible vital sign trends with gradual drift and occasional critical events.
/// </summary>
public class VitalSignsSimulatorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHubContext<VitalsHub, IVitalsClient> _hubContext;
    private readonly ILogger<VitalSignsSimulatorService> _logger;
    private readonly Random _random = new();

    // Simulation parameters
    private const int UpdateIntervalMs = 2500; // Update every 2.5 seconds
    private const int PatientsToUpdatePerCycle = 3; // Update 3-5 patients per cycle
    private const double AbnormalVitalsProbability = 0.20; // 20% chance
    private const double CriticalVitalsProbability = 0.05; // 5% chance

    public VitalSignsSimulatorService(
        IServiceProvider serviceProvider,
        IHubContext<VitalsHub, IVitalsClient> hubContext,
        ILogger<VitalSignsSimulatorService> logger)
    {
        _serviceProvider = serviceProvider;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Vital Signs Simulator starting...");

        // Wait for database to be ready
        await Task.Delay(3000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SimulateVitalSignsUpdate(stoppingToken);
                await Task.Delay(UpdateIntervalMs, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in vital signs simulation cycle");
                await Task.Delay(5000, stoppingToken); // Back off on error
            }
        }

        _logger.LogInformation("Vital Signs Simulator stopped.");
    }

    private async Task SimulateVitalSignsUpdate(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HospitalDbContext>();
        var alertService = scope.ServiceProvider.GetRequiredService<AlertService>();

        // Get random patients to update
        var allPatients = await dbContext.Patients
            .Include(p => p.Bed)
            .ThenInclude(b => b!.Ward)
            .Include(p => p.VitalSigns.OrderByDescending(v => v.RecordedAt).Take(1))
            .ToListAsync(stoppingToken);

        if (allPatients.Count == 0)
        {
            _logger.LogWarning("No patients found in database for simulation");
            return;
        }

        // Select random subset to update
        var patientsToUpdate = allPatients
            .OrderBy(_ => _random.Next())
            .Take(_random.Next(PatientsToUpdatePerCycle, PatientsToUpdatePerCycle + 3))
            .ToList();

        foreach (var patient in patientsToUpdate)
        {
            var latestVitals = patient.GetLatestVitals();
            var newVitals = GenerateRealisticVitals(latestVitals);

            newVitals.PatientId = patient.Id;
            dbContext.VitalSigns.Add(newVitals);

            // Generate alerts if vitals are abnormal
            var alerts = alertService.GenerateAlertsForVitals(newVitals);
            if (alerts.Any())
            {
                dbContext.Alerts.AddRange(alerts);
                alertService.UpdatePatientStatus(patient, newVitals);

                // Broadcast alert notifications
                foreach (var alert in alerts)
                {
                    await _hubContext.Clients.All.ReceiveAlert(new AlertNotification(
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

            // Broadcast vital signs update
            var update = new VitalSignsUpdate(
                patient.Id,
                patient.Name,
                patient.Bed?.Number,
                patient.Bed?.Ward?.Name,
                newVitals.HeartRate,
                newVitals.SpO2,
                newVitals.BpSystolic,
                newVitals.BpDiastolic,
                newVitals.CalculateAlertSeverity().ToString(),
                newVitals.RecordedAt
            );

            await _hubContext.Clients.All.ReceiveVitalUpdate(update);

            _logger.LogInformation("Simulated vitals for patient {PatientId}: HR={HR}, SpO2={SpO2}, BP={BP}/{BPDia}, Severity={Severity}",
                patient.Id, newVitals.HeartRate, newVitals.SpO2, newVitals.BpSystolic, newVitals.BpDiastolic, update.AlertSeverity);
        }

        await dbContext.SaveChangesAsync(stoppingToken);
    }

    /// <summary>
    /// Generates realistic vital signs with gradual drift from previous values.
    /// Occasionally introduces abnormal or critical values for demo purposes.
    /// </summary>
    private VitalSigns GenerateRealisticVitals(VitalSigns? previous)
    {
        var vitals = new VitalSigns
        {
            RecordedAt = DateTime.UtcNow
        };

        // Determine if this should be an abnormal event
        var shouldBeAbnormal = _random.NextDouble() < AbnormalVitalsProbability;
        var shouldBeCritical = _random.NextDouble() < CriticalVitalsProbability;

        // Generate heart rate with realistic drift
        var baseHR = previous?.HeartRate ?? 75;
        if (shouldBeCritical)
        {
            vitals.HeartRate = _random.Next(0, 100) < 50 ? _random.Next(35, 45) : _random.Next(140, 180);
        }
        else if (shouldBeAbnormal)
        {
            vitals.HeartRate = _random.Next(0, 100) < 50 ? _random.Next(50, 60) : _random.Next(110, 130);
        }
        else
        {
            // Gradual drift ±5 BPM, constrained to normal range
            var drift = _random.Next(-5, 6);
            vitals.HeartRate = Math.Clamp(baseHR + drift, 60, 100);
        }

        // Generate SpO2 with realistic behavior
        var baseSpO2 = previous?.SpO2 ?? 98;
        if (shouldBeCritical)
        {
            vitals.SpO2 = _random.Next(82, 88);
        }
        else if (shouldBeAbnormal)
        {
            vitals.SpO2 = _random.Next(90, 94);
        }
        else
        {
            // SpO2 typically very stable in healthy patients
            var drift = _random.Next(-1, 2);
            vitals.SpO2 = Math.Clamp(baseSpO2 + drift, 95, 100);
        }

        // Generate blood pressure
        var baseSystolic = previous?.BpSystolic ?? 120;
        var baseDiastolic = previous?.BpDiastolic ?? 80;

        if (shouldBeCritical)
        {
            vitals.BpSystolic = _random.Next(170, 200);
            vitals.BpDiastolic = _random.Next(105, 120);
        }
        else if (shouldBeAbnormal)
        {
            vitals.BpSystolic = _random.Next(145, 165);
            vitals.BpDiastolic = _random.Next(92, 105);
        }
        else
        {
            // Gradual drift ±8 mmHg for systolic, ±5 for diastolic
            var sysDrift = _random.Next(-8, 9);
            var diasDrift = _random.Next(-5, 6);
            vitals.BpSystolic = Math.Clamp(baseSystolic + sysDrift, 100, 140);
            vitals.BpDiastolic = Math.Clamp(baseDiastolic + diasDrift, 60, 90);
        }

        return vitals;
    }
}
