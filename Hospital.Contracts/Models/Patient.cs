using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hospital.Contracts.Models;

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
}