namespace Signalsboard.Hospital.Contracts.DTOs;

public class WardDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int Capacity { get; set; }
    public string? Location { get; set; }
}