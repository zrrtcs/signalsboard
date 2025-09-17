using Hospital.Contracts.Models;
using Xunit;

namespace Hospital.Api.Tests.Integration;

public class MedicalSafetyTests
{
    [Fact]
    public void Critical_Heart_Rate_Must_Generate_Critical_Alert()
    {
        // Arrange - This is life or death
        var dangerousVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = "test-patient-001",
            HeartRate = 180, // CRITICAL: Could indicate cardiac emergency
            BpSystolic = 120,
            BpDiastolic = 80,
            SpO2 = 98,
            RecordedAt = DateTime.UtcNow
        };

        // Act - Calculate alert severity
        var alertLevel = dangerousVitals.CalculateAlertSeverity();

        // Assert - System MUST recognize this as critical
        Assert.Equal(AlertSeverity.Critical, alertLevel);
    }

    [Fact]
    public void Low_Oxygen_Must_Generate_Critical_Alert()
    {
        // Arrange - Hypoxemia is immediately life-threatening
        var hypoxicVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = "test-patient-002",
            HeartRate = 95,
            BpSystolic = 110,
            BpDiastolic = 70,
            SpO2 = 85, // CRITICAL: Below 88% is life-threatening
            RecordedAt = DateTime.UtcNow
        };

        // Act
        var alertLevel = hypoxicVitals.CalculateAlertSeverity();

        // Assert - Must be critical alert
        Assert.Equal(AlertSeverity.Critical, alertLevel);
    }

    [Fact]
    public void Hypertensive_Crisis_Must_Generate_Critical_Alert()
    {
        // Arrange - Stroke risk
        var hypertensiveVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = "test-patient-003",
            HeartRate = 95,
            BpSystolic = 185, // CRITICAL: Hypertensive crisis threshold is 180
            BpDiastolic = 115, // CRITICAL: Hypertensive crisis threshold is 110
            SpO2 = 98,
            RecordedAt = DateTime.UtcNow
        };

        // Act
        var alertLevel = hypertensiveVitals.CalculateAlertSeverity();

        // Assert - Must trigger critical alert
        Assert.Equal(AlertSeverity.Critical, alertLevel);
    }

    [Fact]
    public void Multiple_Abnormal_Vitals_Must_Generate_High_Alert()
    {
        // Arrange - Pattern of deterioration
        var deterioratingVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = "test-patient-004",
            HeartRate = 115, // Elevated
            BpSystolic = 165, // High but not crisis
            BpDiastolic = 95, // High
            SpO2 = 91, // Low but not critical
            RecordedAt = DateTime.UtcNow
        };

        // Act
        var alertLevel = deterioratingVitals.CalculateAlertSeverity();

        // Assert - Should be at least High severity
        Assert.True(alertLevel >= AlertSeverity.High,
            $"Expected High or Critical alert, got {alertLevel}");
    }

    [Fact]
    public void Normal_Vitals_Should_Generate_Low_Alert()
    {
        // Arrange - Healthy patient
        var normalVitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = "test-patient-005",
            HeartRate = 75, // Normal
            BpSystolic = 120, // Normal
            BpDiastolic = 80, // Normal
            SpO2 = 98, // Normal
            RecordedAt = DateTime.UtcNow
        };

        // Act
        var alertLevel = normalVitals.CalculateAlertSeverity();

        // Assert - Should be low risk
        Assert.Equal(AlertSeverity.Low, alertLevel);
    }

    [Fact]
    public void Invalid_Vitals_Must_Be_Rejected()
    {
        // Arrange - Medically impossible values
        var invalidVitals = new VitalSigns
        {
            HeartRate = 500, // Impossible
            SpO2 = 150, // Impossible (max is 100%)
            BpSystolic = -50 // Impossible
        };

        // Act & Assert
        Assert.False(invalidVitals.IsValid(),
            "System must reject medically impossible vital signs");
    }
}