using backend.Domain.Enums;

namespace backend.Dtos.Payments;

public class PaymentCreateDto
{
    public required int LeaseId { get; set; }
    public required decimal Amount { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public string? Reference { get; set; }
    public string? Notes { get; set; }
}
