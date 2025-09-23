using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Domain.Entities;
using backend.Dtos.Payments;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public PaymentService(IUnitOfWork uow, IMapper mapper, IAuditLogService audit)
    {
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _audit = audit ?? throw new ArgumentNullException(nameof(audit));
    }

    public async Task<IEnumerable<PaymentReadDto>> GetForLeaseAsync(int leaseId)
    {
        var q = _uow.GetRepository<Payment>().Query()
            .AsNoTracking()
            .Where(p => p.LeaseId == leaseId)
            .OrderByDescending(p => p.PaidOnUtc);

        return await q.ProjectTo<PaymentReadDto>(_mapper.ConfigurationProvider).ToListAsync();
    }

    public async Task<PaymentReadDto> CreateAsync(PaymentCreateDto dto, string actor)
    {
        var lease = await _uow.GetRepository<Lease>().Query().FirstOrDefaultAsync(l => l.Id == dto.LeaseId);
        if (lease is null) throw new ArgumentException("Lease does not exist.");
        if (!lease.IsActive) throw new InvalidOperationException("Cannot record payment on inactive lease.");
        if (dto.Amount <= 0) throw new ArgumentException("Amount must be positive.");

        var entity = _mapper.Map<Payment>(dto);
        await _uow.GetRepository<Payment>().AddAsync(entity);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(Payment), entity.Id, $"Payment {entity.Amount} for Lease {entity.LeaseId}");

        return _mapper.Map<PaymentReadDto>(entity);
    }

    public async Task<decimal> GetTotalPaidAsync(int leaseId)
    {
        var total = await _uow.GetRepository<Payment>().Query()
            .Where(p => p.LeaseId == leaseId)
            .Select(p => p.Amount)
            .SumAsync();

        return total;
    }
}