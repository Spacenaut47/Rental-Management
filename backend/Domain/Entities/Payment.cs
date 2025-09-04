using backend.Domain.Enums;

namespace backend.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public required int LeaseId { get; set; }
    public DateTime PaidOnUtc { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public string? Reference { get; set; }
    public string? Notes { get; set; }

    public Lease? Lease { get; set; }
}
