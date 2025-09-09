using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hospital.Contracts.Models;

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
}