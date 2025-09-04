using backend.Domain.Enums;

namespace backend.Dtos.Payments;

public class PaymentReadDto
{
    public int Id { get; set; }
    public int LeaseId { get; set; }
    public DateTime PaidOnUtc { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
}
