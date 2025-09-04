using backend.Dtos.Payments;

namespace backend.Services.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<PaymentReadDto>> GetForLeaseAsync(int leaseId);
    Task<PaymentReadDto> CreateAsync(PaymentCreateDto dto, string actor);
    Task<decimal> GetTotalPaidAsync(int leaseId);
}
