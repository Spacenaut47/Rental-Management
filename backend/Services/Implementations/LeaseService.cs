using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Domain.Entities;
using backend.Dtos.Leases;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class LeaseService : ILeaseService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public LeaseService(IUnitOfWork uow, IMapper mapper, IAuditLogService audit)
    {
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _audit = audit ?? throw new ArgumentNullException(nameof(audit));
    }

    public async Task<IEnumerable<LeaseReadDto>> GetAllAsync(int? unitId = null, int? tenantId = null, bool? active = null)
    {
        var q = _uow.GetRepository<Lease>().Query().AsNoTracking();
        if (unitId.HasValue) q = q.Where(l => l.UnitId == unitId.Value);
        if (tenantId.HasValue) q = q.Where(l => l.TenantId == tenantId.Value);

        if (active.HasValue)
        {
            var now = DateTime.UtcNow;
            q = active.Value
                ? q.Where(l => l.IsActive && l.StartDateUtc <= now && now < l.EndDateUtc)
                : q.Where(l => !l.IsActive || l.StartDateUtc > now || now >= l.EndDateUtc);
        }

        return await q.ProjectTo<LeaseReadDto>(_mapper.ConfigurationProvider).ToListAsync();
    }

    public async Task<LeaseReadDto?> GetByIdAsync(int id)
    {
        var q = _uow.GetRepository<Lease>().Query().AsNoTracking().Where(l => l.Id == id);
        return await q.ProjectTo<LeaseReadDto>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();
    }

    public async Task<LeaseReadDto> CreateAsync(LeaseCreateDto dto, string actor)
    {
        var unitExists = await _uow.GetRepository<Unit>().Query().AnyAsync(u => u.Id == dto.UnitId);
        if (!unitExists) throw new ArgumentException("Unit does not exist.");

        var tenantExists = await _uow.GetRepository<Tenant>().Query().AnyAsync(t => t.Id == dto.TenantId);
        if (!tenantExists) throw new ArgumentException("Tenant does not exist.");

        var overlap = await _uow.GetRepository<Lease>().Query().AnyAsync(l =>
            l.UnitId == dto.UnitId &&
            l.IsActive &&
            l.StartDateUtc < dto.EndDateUtc &&
            dto.StartDateUtc < l.EndDateUtc);
        if (overlap) throw new InvalidOperationException("Unit already has an active overlapping lease.");

        var entity = _mapper.Map<Lease>(dto);
        entity.IsActive = true;

        await _uow.GetRepository<Lease>().AddAsync(entity);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(Lease), entity.Id, $"Lease for Unit {entity.UnitId} to Tenant {entity.TenantId}");

        return _mapper.Map<LeaseReadDto>(entity);
    }

    public async Task<LeaseReadDto?> UpdateAsync(int id, LeaseUpdateDto dto, string actor)
    {
        var repo = _uow.GetRepository<Lease>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return null;

        var unitExists = await _uow.GetRepository<Unit>().Query().AnyAsync(u => u.Id == dto.UnitId);
        if (!unitExists) throw new ArgumentException("Unit does not exist.");

        var tenantExists = await _uow.GetRepository<Tenant>().Query().AnyAsync(t => t.Id == dto.TenantId);
        if (!tenantExists) throw new ArgumentException("Tenant does not exist.");

        var overlap = await repo.Query().AnyAsync(l =>
            l.Id != id &&
            l.UnitId == dto.UnitId &&
            l.IsActive &&
            l.StartDateUtc < dto.EndDateUtc &&
            dto.StartDateUtc < l.EndDateUtc);
        if (overlap) throw new InvalidOperationException("Unit already has an active overlapping lease.");

        _mapper.Map(dto, existing);
        existing.IsActive = true;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        repo.Update(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Updated", nameof(Lease), existing.Id, $"Lease {existing.Id} updated");

        return _mapper.Map<LeaseReadDto>(existing);
    }

    public async Task<bool> DeleteAsync(int id, string actor)
    {
        var repo = _uow.GetRepository<Lease>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return false;

        var hasPayments = await _uow.GetRepository<Payment>().Query().AnyAsync(p => p.LeaseId == id);
        if (hasPayments) throw new InvalidOperationException("Cannot delete a lease with payment history.");

        repo.Remove(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Deleted", nameof(Lease), id, $"Lease {id} deleted");

        return true;
    }
}
