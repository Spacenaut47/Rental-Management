using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Payments;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class PaymentService(AppDbContext db, IUnitOfWork uow, IMapper mapper, IAuditLogService audit) : IPaymentService
{
    private readonly AppDbContext _db = db;
    private readonly IUnitOfWork _uow = uow;
    private readonly IMapper _mapper = mapper;
    private readonly IAuditLogService _audit = audit;

    public async Task<IEnumerable<PaymentReadDto>> GetForLeaseAsync(int leaseId)
    {
        return await _db.Payments
            .AsNoTracking()
            .Where(p => p.LeaseId == leaseId)
            .OrderByDescending(p => p.PaidOnUtc)
            .ProjectTo<PaymentReadDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<PaymentReadDto> CreateAsync(PaymentCreateDto dto, string actor)
    {
        var lease = await _db.Leases.FirstOrDefaultAsync(l => l.Id == dto.LeaseId);
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
        var totalAsDouble = await _db.Payments
        .Where(p => p.LeaseId == leaseId)
        .Select(p => (double)p.Amount)  
        .SumAsync();

        return Convert.ToDecimal(totalAsDouble);
    }
}
