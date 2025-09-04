namespace backend.Dtos.Leases;

public class LeaseCreateDto
{
    public required int UnitId { get; set; }
    public required int TenantId { get; set; }
    public required DateTime StartDateUtc { get; set; }
    public required DateTime EndDateUtc { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
}
