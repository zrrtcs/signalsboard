using Signalsboard.Hospital.Contracts.Models;
using Xunit;

namespace Signalsboard.Hospital.Api.Tests.Models;

public class VitalSignsTests
{
    public class AlertThresholds
    {
        [Theory]
        [InlineData(45, AlertSeverity.Critical)]  // Very low HR
        [InlineData(55, AlertSeverity.Medium)]    // Low HR
        [InlineData(75, AlertSeverity.Low)]       // Normal HR
        [InlineData(110, AlertSeverity.Medium)]   // High HR
        [InlineData(130, AlertSeverity.Critical)] // Very high HR
        public void Should_Correctly_Assess_Heart_Rate_Alerts(int heartRate, AlertSeverity expectedSeverity)
        {
            // Arrange
            var vitals = new VitalSigns { HeartRate = heartRate };
            
            // Act
            var severity = vitals.AssessHeartRateAlert();
            
            // Assert
            Assert.Equal(expectedSeverity, severity);
        }
        
        [Theory]
        [InlineData(85, AlertSeverity.Critical)]  // Dangerously low
        [InlineData(91, AlertSeverity.High)]      // Low oxygen
        [InlineData(93, AlertSeverity.Medium)]    // Borderline
        [InlineData(98, AlertSeverity.Low)]       // Normal
        public void Should_Correctly_Assess_SpO2_Alerts(int spO2, AlertSeverity expectedSeverity)
        {
            var vitals = new VitalSigns { SpO2 = spO2 };
            
            var severity = vitals.AssessSpO2Alert();
            
            Assert.Equal(expectedSeverity, severity);
        }
        
        [Theory]
        [InlineData(180, 110, AlertSeverity.Critical)] // Hypertensive crisis
        [InlineData(165, 100, AlertSeverity.High)]     // Stage 2 hypertension
        [InlineData(145, 95, AlertSeverity.Medium)]    // Stage 1 hypertension
        [InlineData(120, 80, AlertSeverity.Low)]       // Normal
        public void Should_Correctly_Assess_Blood_Pressure_Alerts(int systolic, int diastolic, AlertSeverity expectedSeverity)
        {
            var vitals = new VitalSigns { BpSystolic = systolic, BpDiastolic = diastolic };
            
            var severity = vitals.AssessBloodPressureAlert();
            
            Assert.Equal(expectedSeverity, severity);
        }
    }
    
    public class DataValidation
    {
        [Fact]
        public void Should_Identify_Invalid_Vital_Signs()
        {
            // Arrange - Impossible vital signs
            var vitals = new VitalSigns 
            { 
                HeartRate = -10,    // Negative HR
                SpO2 = 110,         // Over 100%
                BpSystolic = 300    // Impossible BP
            };
            
            // Act & Assert
            Assert.False(vitals.IsValid());
        }
        
        [Fact]
        public void Should_Validate_Normal_Vital_Signs()
        {
            var vitals = new VitalSigns 
            { 
                HeartRate = 75,
                SpO2 = 98,
                BpSystolic = 120,
                BpDiastolic = 80,
                Temperature = 36.5m
            };
            
            Assert.True(vitals.IsValid());
        }
    }
    
    public class TimeBasedAnalysis
    {
        [Fact]
        public void Should_Identify_Stale_Readings()
        {
            var vitals = new VitalSigns 
            { 
                RecordedAt = DateTime.UtcNow.AddMinutes(-30) // 30 minutes old
            };
            
            var isStale = vitals.IsStale(TimeSpan.FromMinutes(15));
            
            Assert.True(isStale);
        }
        
        [Fact]
        public void Should_Identify_Fresh_Readings()
        {
            var vitals = new VitalSigns 
            { 
                RecordedAt = DateTime.UtcNow.AddMinutes(-5) // 5 minutes old
            };
            
            var isStale = vitals.IsStale(TimeSpan.FromMinutes(15));
            
            Assert.False(isStale);
        }
    }
}