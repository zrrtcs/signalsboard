using Signalsboard.Hospital.Api.Domain;

namespace Signalsboard.Hospital.Api.Services;

/// <summary>
/// Service responsible for generating and managing alerts based on patient vital signs.
/// Implements medical alert thresholds and patient status escalation logic.
/// </summary>
public class AlertService
{
    /// <summary>
    /// Generates alerts for abnormal vital signs.
    /// Only creates alerts for Medium severity and above to avoid alert fatigue.
    /// </summary>
    /// <param name="vitals">The vital signs to evaluate</param>
    /// <returns>List of Alert entities to be persisted</returns>
    public List<Alert> GenerateAlertsForVitals(VitalSigns vitals)
    {
        var alerts = new List<Alert>();

        // Check Heart Rate
        var hrSeverity = vitals.AssessHeartRateAlert();
        if (hrSeverity >= AlertSeverity.Medium)
        {
            alerts.Add(CreateAlert(
                patientId: vitals.PatientId,
                alertType: hrSeverity == AlertSeverity.Critical ? "hr_critical" : "hr_abnormal",
                severity: hrSeverity,
                message: FormatHeartRateMessage(vitals.HeartRate!.Value, hrSeverity)
            ));
        }

        // Check SpO2 (Oxygen Saturation)
        var spo2Severity = vitals.AssessSpO2Alert();
        if (spo2Severity >= AlertSeverity.Medium)
        {
            alerts.Add(CreateAlert(
                patientId: vitals.PatientId,
                alertType: spo2Severity == AlertSeverity.Critical ? "spo2_critical" : "spo2_low",
                severity: spo2Severity,
                message: FormatSpO2Message(vitals.SpO2!.Value, spo2Severity)
            ));
        }

        // Check Blood Pressure
        var bpSeverity = vitals.AssessBloodPressureAlert();
        if (bpSeverity >= AlertSeverity.Medium)
        {
            alerts.Add(CreateAlert(
                patientId: vitals.PatientId,
                alertType: bpSeverity == AlertSeverity.Critical ? "bp_crisis" : "bp_high",
                severity: bpSeverity,
                message: FormatBloodPressureMessage(vitals.BpSystolic!.Value, vitals.BpDiastolic!.Value, bpSeverity)
            ));
        }

        return alerts;
    }

    /// <summary>
    /// Updates patient status based on their current vital signs and alert severity.
    /// Critical vitals escalate patient to "critical", high severity to "watch".
    /// </summary>
    public void UpdatePatientStatus(Patient patient, VitalSigns vitals)
    {
        var overallSeverity = vitals.CalculateAlertSeverity();

        patient.Status = overallSeverity switch
        {
            AlertSeverity.Critical => "critical",
            AlertSeverity.High => "watch",
            _ => patient.Status // Don't downgrade status automatically
        };
    }

    private Alert CreateAlert(string patientId, string alertType, AlertSeverity severity, string message)
    {
        return new Alert
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = patientId,
            AlertType = alertType,
            Severity = severity.ToString(),
            Message = message,
            TriggeredAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    private string FormatHeartRateMessage(int heartRate, AlertSeverity severity)
    {
        var prefix = severity == AlertSeverity.Critical ? "CRITICAL" : "WARNING";
        return $"{prefix}: Heart Rate {heartRate} BPM (Normal: 60-100 BPM)";
    }

    private string FormatSpO2Message(int spo2, AlertSeverity severity)
    {
        var prefix = severity == AlertSeverity.Critical ? "CRITICAL" : "WARNING";
        return $"{prefix}: Oxygen Saturation {spo2}% (Normal: >95%)";
    }

    private string FormatBloodPressureMessage(int systolic, int diastolic, AlertSeverity severity)
    {
        var prefix = severity == AlertSeverity.Critical ? "CRITICAL" : "WARNING";
        return $"{prefix}: Blood Pressure {systolic}/{diastolic} mmHg (Normal: <140/90 mmHg)";
    }
}
