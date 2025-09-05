using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Leases;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class LeaseService : ILeaseService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public LeaseService(AppDbContext db, IUnitOfWork uow, IMapper mapper, IAuditLogService audit)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _audit = audit ?? throw new ArgumentNullException(nameof(audit));
    }

    public async Task<IEnumerable<LeaseReadDto>> GetAllAsync(int? unitId = null, int? tenantId = null, bool? active = null)
    {
        var q = _db.Leases.AsNoTracking();

        if (unitId.HasValue) q = q.Where(l => l.UnitId == unitId.Value);
        if (tenantId.HasValue) q = q.Where(l => l.TenantId == tenantId.Value);
        if (active.HasValue) q = q.Where(l => l.IsActive == active.Value);

        return await q.ProjectTo<LeaseReadDto>(_mapper.ConfigurationProvider).ToListAsync();
    }

    public async Task<LeaseReadDto?> GetByIdAsync(int id)
    {
        return await _db.Leases
            .AsNoTracking()
            .Where(l => l.Id == id)
            .ProjectTo<LeaseReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<LeaseReadDto> CreateAsync(LeaseCreateDto dto, string actor)
    {
        // Ensure Unit & Tenant exist
        var unitExists = await _db.Units.AnyAsync(u => u.Id == dto.UnitId);
        if (!unitExists) throw new ArgumentException("Unit does not exist.");
        var tenantExists = await _db.Tenants.AnyAsync(t => t.Id == dto.TenantId);
        if (!tenantExists) throw new ArgumentException("Tenant does not exist.");

        // Ensure no overlapping ACTIVE lease for this unit
        var overlap = await _db.Leases.AnyAsync(l =>
            l.UnitId == dto.UnitId &&
            l.IsActive &&
            l.StartDateUtc < dto.EndDateUtc &&
            dto.StartDateUtc < l.EndDateUtc
        );
        if (overlap) throw new InvalidOperationException("Unit already has an active overlapping lease.");

        var entity = _mapper.Map<Lease>(dto);
        entity.IsActive = true;

        await _uow.GetRepository<Lease>().AddAsync(entity); // <-- awaited
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(Lease), entity.Id, $"Lease for Unit {entity.UnitId} to Tenant {entity.TenantId}");

        return _mapper.Map<LeaseReadDto>(entity);
    }

    public async Task<LeaseReadDto?> UpdateAsync(int id, LeaseUpdateDto dto, string actor)
    {
        var repo = _uow.GetRepository<Lease>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return null;

        // if changing dates/unit, re-check overlap
        if (dto.UnitId != existing.UnitId || dto.StartDateUtc != existing.StartDateUtc || dto.EndDateUtc != existing.EndDateUtc || dto.IsActive != existing.IsActive)
        {
            var overlap = await _db.Leases.AnyAsync(l =>
                l.Id != id &&
                l.UnitId == dto.UnitId &&
                l.IsActive &&
                l.StartDateUtc < dto.EndDateUtc &&
                dto.StartDateUtc < l.EndDateUtc
            );
            if (overlap) throw new InvalidOperationException("Unit already has an active overlapping lease.");
        }

        _mapper.Map(dto, existing);
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

        repo.Remove(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Deleted", nameof(Lease), id, $"Lease {id} deleted");

        return true;
    }
}
