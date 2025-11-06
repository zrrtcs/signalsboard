using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Signalsboard.Hospital.Api.Domain;

[Table("vital_signs")]
public class VitalSigns
{
    [Key]
    [Column("id")]
    [MaxLength(50)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("patient_id")]
    [MaxLength(50)]
    [Required]
    public string PatientId { get; set; } = null!;

    [Column("heart_rate")]
    public int? HeartRate { get; set; }

    [Column("bp_systolic")]
    public int? BpSystolic { get; set; }

    [Column("bp_diastolic")]
    public int? BpDiastolic { get; set; }

    [Column("spo2")]
    public int? SpO2 { get; set; }

    [Column("temperature", TypeName = "decimal(4,1)")]
    public decimal? Temperature { get; set; }

    [Column("recorded_at")]
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    [Column("recorded_by")]
    [MaxLength(100)]
    public string? RecordedBy { get; set; }

    // Navigation properties
    [ForeignKey("PatientId")]
    public virtual Patient Patient { get; set; } = null!;

    // Business Logic Methods
    public AlertSeverity AssessHeartRateAlert()
    {
        if (!this.HeartRate.HasValue) return AlertSeverity.Low;
        
        return this.HeartRate.Value switch
        {
            <= 45 or >= 130 => AlertSeverity.Critical,
            <= 55 or >= 110 => AlertSeverity.Medium,
            _ => AlertSeverity.Low
        };
    }

    public AlertSeverity AssessSpO2Alert()
    {
        if (!this.SpO2.HasValue) return AlertSeverity.Low;
        
        return this.SpO2.Value switch
        {
            < 88 => AlertSeverity.Critical,
            < 92 => AlertSeverity.High,
            < 94 => AlertSeverity.Medium,
            _ => AlertSeverity.Low
        };
    }

    public AlertSeverity AssessBloodPressureAlert()
    {
        if (!this.BpSystolic.HasValue || !this.BpDiastolic.HasValue) return AlertSeverity.Low;
        
        // Check for hypertensive crisis
        if (this.BpSystolic >= 180 || this.BpDiastolic >= 110)
            return AlertSeverity.Critical;
            
        // Stage 2 hypertension
        if (this.BpSystolic >= 160 || this.BpDiastolic >= 100)
            return AlertSeverity.High;
            
        // Stage 1 hypertension
        if (this.BpSystolic >= 140 || this.BpDiastolic >= 90)
            return AlertSeverity.Medium;
            
        return AlertSeverity.Low;
    }

    public bool IsValid()
    {
        // Check for medically impossible values
        if (this.HeartRate.HasValue && (this.HeartRate <= 0 || this.HeartRate > 300))
            return false;
            
        if (this.SpO2.HasValue && (this.SpO2 <= 0 || this.SpO2 > 100))
            return false;
            
        if (this.BpSystolic.HasValue && (this.BpSystolic <= 0 || this.BpSystolic > 300))
            return false;
            
        if (this.BpDiastolic.HasValue && (this.BpDiastolic <= 0 || this.BpDiastolic > 200))
            return false;
            
        if (this.Temperature.HasValue && (this.Temperature < 30 || this.Temperature > 45))
            return false;
            
        return true;
    }

    public bool IsStale(TimeSpan threshold)
    {
        return DateTime.UtcNow - this.RecordedAt > threshold;
    }

    public AlertSeverity CalculateAlertSeverity()
    {
        var hrAlert = this.AssessHeartRateAlert();
        var spo2Alert = this.AssessSpO2Alert();
        var bpAlert = this.AssessBloodPressureAlert();

        // Return the highest severity among all vital signs
        var maxSeverity = new[] { hrAlert, spo2Alert, bpAlert }.Max();
        return maxSeverity;
    }
}