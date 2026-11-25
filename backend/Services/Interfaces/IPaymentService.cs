using backend.Dtos.Payments;

namespace backend.Services.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<PaymentReadDto>> GetForLeaseAsync(int leaseId);
    Task<PaymentReadDto> CreateAsync(PaymentCreateDto dto, string actor);
    Task<PaymentReadDto?> UpdateAsync(int id, PaymentUpdateDto dto, string actor);
    Task<bool> DeleteAsync(int id, string actor);
    Task<decimal> GetTotalPaidAsync(int leaseId);
}
