using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Signalsboard.Hospital.Api.Domain;

[Table("staff")]
public class Staff
{
    [Key]
    [Column("id")]
    [MaxLength(50)]
    public string Id { get; set; } = null!;

    [Column("name")]
    [MaxLength(200)]
    [Required]
    public string Name { get; set; } = null!;

    [Column("role")]
    [MaxLength(50)]
    [Required]
    public string Role { get; set; } = null!; // nurse|doctor|technician

    [Column("ward_id")]
    [MaxLength(50)]
    public string? WardId { get; set; }

    [Column("shift")]
    [MaxLength(20)]
    [Required]
    public string Shift { get; set; } = "day"; // day|night|evening

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    // Navigation properties
    [ForeignKey("WardId")]
    public virtual Ward? Ward { get; set; }
}