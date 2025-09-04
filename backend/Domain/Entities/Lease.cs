namespace backend.Domain.Entities;

public class Lease
{
    public int Id { get; set; }
    public required int UnitId { get; set; }
    public required int TenantId { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime EndDateUtc { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public Unit? Unit { get; set; }
    public Tenant? Tenant { get; set; }
}
