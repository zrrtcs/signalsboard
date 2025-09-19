using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Signalsboard.Hospital.Contracts.Models;

[Table("wards")]
public class Ward
{
    [Key]
    [Column("id")]
    [MaxLength(50)]
    public string Id { get; set; } = null!;

    [Column("name")]
    [MaxLength(100)]
    [Required]
    public string Name { get; set; } = null!;

    [Column("capacity")]
    public int Capacity { get; set; }

    [Column("location")]
    [MaxLength(200)]
    public string? Location { get; set; }

    // Navigation properties
    public virtual ICollection<Bed> Beds { get; set; } = new List<Bed>();
    public virtual ICollection<Staff> Staff { get; set; } = new List<Staff>();
}