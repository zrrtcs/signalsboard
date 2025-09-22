using Signalsboard.Hospital.Api.Domain;
using Xunit;

namespace Signalsboard.Hospital.Api.Tests.Models;

public class PatientTests
{
    public class RiskAssessment
    {
        [Fact]
        public void Should_Identify_Critical_Patients()
        {
            // Arrange
            var patient = new Patient { Status = "critical" };

            // Act & Assert
            Assert.True(patient.IsInCriticalCondition());
        }

        [Fact]
        public void Should_Not_Flag_Stable_Patients_As_Critical()
        {
            var patient = new Patient { Status = "stable" };
            Assert.False(patient.IsInCriticalCondition());
        }

        [Theory]
        [InlineData("stable", false)]
        [InlineData("watch", false)]
        [InlineData("critical", true)]
        public void Should_Correctly_Assess_Patient_Status(string status, bool expectedCritical)
        {
            var patient = new Patient { Status = status };
            Assert.Equal(expectedCritical, patient.IsInCriticalCondition());
        }
    }

    public class VitalSigns
    {
        [Fact]
        public void Should_Return_Latest_Vital_Signs()
        {
            // Arrange
            var patient = new Patient
            {
                VitalSigns = new List<Hospital.Api.Domain.VitalSigns>
                {
                    new() { RecordedAt = DateTime.UtcNow.AddHours(-2), HeartRate = 70 },
                    new() { RecordedAt = DateTime.UtcNow.AddHours(-1), HeartRate = 85 },
                    new() { RecordedAt = DateTime.UtcNow, HeartRate = 92 }
                }
            };

            // Act
            var latest = patient.GetLatestVitals();

            // Assert
            Assert.NotNull(latest);
            Assert.Equal(92, latest.HeartRate);
        }

        [Fact]
        public void Should_Return_Null_When_No_Vitals_Exist()
        {
            var patient = new Patient { VitalSigns = new List<Hospital.Api.Domain.VitalSigns>() };
            
            var latest = patient.GetLatestVitals();
            
            Assert.Null(latest);
        }
    }

    public class AlertRiskCalculation
    {
        [Fact]
        public void Should_Calculate_High_Risk_For_Critical_Vitals()
        {
            // Arrange
            var patient = new Patient
            {
                Status = "critical",
                VitalSigns = new List<Hospital.Api.Domain.VitalSigns>
                {
                    new() 
                    { 
                        HeartRate = 150,  // High HR
                        SpO2 = 88,        // Low oxygen
                        BpSystolic = 180, // High BP
                        RecordedAt = DateTime.UtcNow 
                    }
                }
            };

            // Act
            var riskLevel = patient.CalculateRiskLevel();

            // Assert
            Assert.Equal(AlertSeverity.High, riskLevel);
        }

        [Fact]
        public void Should_Calculate_Low_Risk_For_Stable_Vitals()
        {
            var patient = new Patient
            {
                Status = "stable",
                VitalSigns = new List<Hospital.Api.Domain.VitalSigns>
                {
                    new() 
                    { 
                        HeartRate = 75,   // Normal HR
                        SpO2 = 98,        // Normal oxygen
                        BpSystolic = 120, // Normal BP
                        RecordedAt = DateTime.UtcNow 
                    }
                }
            };

            var riskLevel = patient.CalculateRiskLevel();
            Assert.Equal(AlertSeverity.Low, riskLevel);
        }
    }
}