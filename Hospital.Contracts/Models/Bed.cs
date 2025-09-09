using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hospital.Contracts.Models;

[Table("beds")]
public class Bed
{
    [Key]
    [Column("id")]
    [MaxLength(50)]
    public string Id { get; set; } = null!;

    [Column("number")]
    [MaxLength(20)]
    [Required]
    public string Number { get; set; } = null!;

    [Column("ward_id")]
    [MaxLength(50)]
    [Required]
    public string WardId { get; set; } = null!;

    [Column("status")]
    [MaxLength(20)]
    [Required]
    public string Status { get; set; } = "available"; // occupied|available|maintenance

    [Column("bed_type")]
    [MaxLength(20)]
    [Required]
    public string BedType { get; set; } = "standard"; // standard|icu|isolation

    // Navigation properties
    [ForeignKey("WardId")]
    public virtual Ward Ward { get; set; } = null!;
    
    public virtual Patient? Patient { get; set; }
}