using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Signalsboard.Hospital.Api.Domain;

[Table("patients")]
public class Patient
{
    [Key]
    [Column("id")]
    [MaxLength(50)]
    public string Id { get; set; } = null!;

    [Column("mrn")]
    [MaxLength(50)]
    [Required]
    public string Mrn { get; set; } = null!;

    [Column("name")]
    [MaxLength(200)]
    [Required]
    public string Name { get; set; } = null!;

    [Column("bed_id")]
    [MaxLength(50)]
    public string? BedId { get; set; }

    [Column("status")]
    [MaxLength(20)]
    [Required]
    public string Status { get; set; } = "stable"; // stable|watch|critical

    [Column("admitted_at")]
    public DateTime AdmittedAt { get; set; } = DateTime.UtcNow;

    [Column("attending_physician")]
    [MaxLength(200)]
    public string? AttendingPhysician { get; set; }

    [Column("primary_diagnosis")]
    [MaxLength(500)]
    public string? PrimaryDiagnosis { get; set; }

    // Navigation properties
    [ForeignKey("BedId")]
    public virtual Bed? Bed { get; set; }
    
    public virtual ICollection<VitalSigns> VitalSigns { get; set; } = new List<VitalSigns>();
    public virtual ICollection<Alert> Alerts { get; set; } = new List<Alert>();

    // Business Logic Methods
    public bool IsInCriticalCondition()
    {
        return this.Status.Equals("critical", StringComparison.OrdinalIgnoreCase);
    }

    public VitalSigns? GetLatestVitals()
    {
        return this.VitalSigns?.OrderByDescending(v => v.RecordedAt).FirstOrDefault();
    }

    public AlertSeverity CalculateRiskLevel()
    {
        var latestVitals = this.GetLatestVitals();
        if (latestVitals == null)
            return AlertSeverity.Low;

        // Critical patient status overrides vital signs
        if (this.IsInCriticalCondition())
            return AlertSeverity.High;

        // Check for multiple critical vital signs
        var criticalCount = 0;
        
        if (latestVitals.HeartRate.HasValue)
        {
            var hrSeverity = latestVitals.AssessHeartRateAlert();
            if (hrSeverity == AlertSeverity.Critical) criticalCount++;
        }
        
        if (latestVitals.SpO2.HasValue)
        {
            var spo2Severity = latestVitals.AssessSpO2Alert();
            if (spo2Severity == AlertSeverity.Critical) criticalCount++;
        }
        
        if (latestVitals.BpSystolic.HasValue && latestVitals.BpDiastolic.HasValue)
        {
            var bpSeverity = latestVitals.AssessBloodPressureAlert();
            if (bpSeverity == AlertSeverity.Critical) criticalCount++;
        }

        return criticalCount >= 2 ? AlertSeverity.High : 
               criticalCount == 1 ? AlertSeverity.Medium : 
               AlertSeverity.Low;
    }
}