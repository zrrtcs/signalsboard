using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Signalsboard.Hospital.Contracts.Models;

[Table("alerts")]
public class Alert
{
    [Key]
    [Column("id")]
    [MaxLength(50)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("patient_id")]
    [MaxLength(50)]
    [Required]
    public string PatientId { get; set; } = null!;

    [Column("alert_type")]
    [MaxLength(50)]
    [Required]
    public string AlertType { get; set; } = null!; // hr_high|bp_critical|spo2_low

    [Column("severity")]
    [MaxLength(20)]
    [Required]
    public string Severity { get; set; } = null!; // yellow|red|critical

    [Column("message")]
    [MaxLength(500)]
    [Required]
    public string Message { get; set; } = null!;

    [Column("triggered_at")]
    public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;

    [Column("acknowledged_at")]
    public DateTime? AcknowledgedAt { get; set; }

    [Column("acknowledged_by")]
    [MaxLength(100)]
    public string? AcknowledgedBy { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    // Navigation properties
    [ForeignKey("PatientId")]
    public virtual Patient Patient { get; set; } = null!;
}