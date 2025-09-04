namespace backend.Dtos.Properties;

public class PropertyCreateDto
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string Zip { get; set; }
    public required string Country { get; set; }
}
