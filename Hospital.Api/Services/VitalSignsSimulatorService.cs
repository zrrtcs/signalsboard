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
    private const double AbnormalVitalsProbability = 0.15; // 15% chance of abnormal
    private const double CriticalVitalsProbability = 0.08; // 8% chance of critical event

    // Injection mode tracking (per-patient)
    private Dictionary<string, bool> _injectionModeEnabled = new();
    private Dictionary<string, VitalSigns> _lastInjectedVitals = new();

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

        // Load injection mode state from database
        await LoadInjectionModeFromDatabase();

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
            var newVitals = GenerateRealisticVitals(patient.Id, latestVitals);

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
    /// If injection mode is enabled, uses last injected vitals as baseline with drift.
    /// Otherwise generates normally with occasional abnormal/critical events.
    /// </summary>
    private VitalSigns GenerateRealisticVitals(string patientId, VitalSigns? previous)
    {
        var vitals = new VitalSigns
        {
            RecordedAt = DateTime.UtcNow
        };

        // Check if injection mode is enabled for this patient
        var isInjectionMode = _injectionModeEnabled.TryGetValue(patientId, out var enabled) && enabled;
        var injectedVitals = isInjectionMode && _lastInjectedVitals.TryGetValue(patientId, out var injected) ? injected : null;

        // In injection mode: use injected vitals as baseline
        // Normal mode: use previous vitals or defaults
        var baselinePrevious = injectedVitals ?? previous;

        // Determine if this should be an abnormal event (only in normal mode)
        var shouldBeAbnormal = !isInjectionMode && _random.NextDouble() < AbnormalVitalsProbability;
        var shouldBeCritical = !isInjectionMode && _random.NextDouble() < CriticalVitalsProbability;

        // Generate heart rate with realistic drift
        var baseHR = baselinePrevious?.HeartRate ?? 75;
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
            // Gradual drift ±5 BPM
            // In injection mode: allow critical values to persist with drift
            // Normal mode: constrain to safe range (60-100)
            var drift = _random.Next(-5, 6);
            vitals.HeartRate = isInjectionMode
                ? baseHR + drift
                : Math.Clamp(baseHR + drift, 60, 100);
        }

        // Generate SpO2 with realistic behavior
        var baseSpO2 = baselinePrevious?.SpO2 ?? 98;
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
            // SpO2 typically very stable in healthy patients (±1-2%)
            // In injection mode: allow critical values to persist with drift
            // Normal mode: constrain to safe range (95-100)
            var drift = _random.Next(-1, 2);
            vitals.SpO2 = isInjectionMode
                ? baseSpO2 + drift
                : Math.Clamp(baseSpO2 + drift, 95, 100);
        }

        // Generate blood pressure
        var baseSystolic = baselinePrevious?.BpSystolic ?? 120;
        var baseDiastolic = baselinePrevious?.BpDiastolic ?? 80;

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
            // In injection mode: allow critical values to persist with drift
            // Normal mode: constrain to safe range
            var sysDrift = _random.Next(-8, 9);
            var diasDrift = _random.Next(-5, 6);
            vitals.BpSystolic = isInjectionMode
                ? baseSystolic + sysDrift
                : Math.Clamp(baseSystolic + sysDrift, 100, 140);
            vitals.BpDiastolic = isInjectionMode
                ? baseDiastolic + diasDrift
                : Math.Clamp(baseDiastolic + diasDrift, 60, 90);
        }

        return vitals;
    }

    /// <summary>
    /// Toggle injection mode for a specific patient.
    /// When enabled, simulator uses last injected vitals as baseline with drift.
    /// When disabled, clears injected baseline and resumes normal random simulation.
    /// </summary>
    public void SetInjectionMode(string patientId, bool enabled)
    {
        _injectionModeEnabled[patientId] = enabled;

        // When disabling injection mode, clear the stored injected vitals
        // so the simulator resumes generating from the current vital baseline
        if (!enabled)
        {
            _lastInjectedVitals.Remove(patientId);
        }

        var modeStatus = enabled ? "ENABLED" : "DISABLED";
        _logger.LogInformation("Injection mode {Status} for patient {PatientId}", modeStatus, patientId);
    }

    /// <summary>
    /// Record injected vitals for a patient.
    /// The simulator will use these as baseline values when injection mode is enabled.
    /// </summary>
    public void RecordInjectedVitals(string patientId, VitalSigns vitals)
    {
        _lastInjectedVitals[patientId] = vitals;
        _logger.LogInformation(
            "Injected vitals recorded for patient {PatientId}: HR={HR}, SpO2={SpO2}, BP={BP}/{BPDia}",
            patientId, vitals.HeartRate, vitals.SpO2, vitals.BpSystolic, vitals.BpDiastolic);
    }

    /// <summary>
    /// Load injection mode state from database on startup.
    /// Ensures simulator respects persisted toggle state after server restart.
    /// </summary>
    private async Task LoadInjectionModeFromDatabase()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<HospitalDbContext>();

            var patientsWithInjectionMode = await dbContext.Patients
                .Where(p => p.InjectionModeEnabled)
                .Select(p => p.Id)
                .ToListAsync();

            foreach (var patientId in patientsWithInjectionMode)
            {
                _injectionModeEnabled[patientId] = true;
                _logger.LogInformation("Loaded injection mode ENABLED for patient {PatientId}", patientId);
            }

            _logger.LogInformation("Injection mode state loaded from database. {Count} patients in injection mode", patientsWithInjectionMode.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading injection mode state from database");
        }
    }

    /// <summary>
    /// Public function to compute patient status from vital signs.
    /// Returns: critical, watch, or stable based on alert severity assessment.
    /// </summary>
    public string ComputePatientStatus(VitalSigns vitals)
    {
        if (vitals == null)
            return "stable";

        var severity = vitals.CalculateAlertSeverity();
        return severity switch
        {
            AlertSeverity.Critical => "critical",
            AlertSeverity.High => "watch",
            _ => "stable"
        };
    }
}
