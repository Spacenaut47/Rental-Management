namespace backend.Domain.Entities;

public class Unit
{
    public int Id { get; set; }
    public required int PropertyId { get; set; }
    public required string UnitNumber { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public decimal Rent { get; set; }
    public int SizeSqFt { get; set; }
    public bool IsOccupied { get; set; }

    public Property? Property { get; set; }
}
