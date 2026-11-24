using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Domain.Entities;
using backend.Dtos.Maintenance;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class MaintenanceService : IMaintenanceService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public MaintenanceService(IUnitOfWork uow, IMapper mapper, IAuditLogService audit)
    {
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _audit = audit ?? throw new ArgumentNullException(nameof(audit));
    }

    public async Task<IEnumerable<MaintenanceReadDto>> GetAsync(int? propertyId = null, int? unitId = null, int? tenantId = null)
    {
        var q = _uow.GetRepository<MaintenanceRequest>().Query().AsNoTracking();
        if (propertyId.HasValue) q = q.Where(m => m.PropertyId == propertyId.Value);
        if (unitId.HasValue) q = q.Where(m => m.UnitId == unitId.Value);
        if (tenantId.HasValue) q = q.Where(m => m.TenantId == tenantId.Value);

        return await q
            .OrderByDescending(m => m.CreatedAtUtc)
            .ProjectTo<MaintenanceReadDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<MaintenanceReadDto?> GetByIdAsync(int id)
    {
        var q = _uow.GetRepository<MaintenanceRequest>().Query()
            .AsNoTracking()
            .Where(m => m.Id == id);

        return await q.ProjectTo<MaintenanceReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<MaintenanceReadDto> CreateAsync(MaintenanceCreateDto dto, string actor)
    {
        // basic referential checks
        var propertyExists = await _uow.GetRepository<Property>().Query().AnyAsync(p => p.Id == dto.PropertyId);
        if (!propertyExists)
            throw new ArgumentException("Property does not exist.");
        if (dto.UnitId.HasValue)
        {
            var unit = await _uow.GetRepository<Unit>().Query().FirstOrDefaultAsync(u => u.Id == dto.UnitId.Value);
            if (unit is null) throw new ArgumentException("Unit does not exist.");
            if (unit.PropertyId != dto.PropertyId) throw new ArgumentException("Unit does not belong to the specified property.");
        }
        if (dto.TenantId.HasValue)
        {
            var tenantExists = await _uow.GetRepository<Tenant>().Query().AnyAsync(t => t.Id == dto.TenantId.Value);
            if (!tenantExists)
                throw new ArgumentException("Tenant does not exist.");

            if (dto.UnitId.HasValue)
            {
                var linked = await _uow.GetRepository<Lease>().Query()
                    .AnyAsync(l => l.TenantId == dto.TenantId.Value && l.UnitId == dto.UnitId.Value);
                if (!linked)
                    throw new ArgumentException("Tenant is not associated with the specified unit.");
            }
        }

        var entity = _mapper.Map<MaintenanceRequest>(dto);
        await _uow.GetRepository<MaintenanceRequest>().AddAsync(entity);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(MaintenanceRequest), entity.Id, entity.Title);

        return _mapper.Map<MaintenanceReadDto>(entity);
    }

    public async Task<MaintenanceReadDto?> UpdateAsync(int id, MaintenanceUpdateDto dto, string actor)
    {
        var repo = _uow.GetRepository<MaintenanceRequest>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return null;

        _mapper.Map(dto, existing);
        existing.UpdatedAtUtc = DateTime.UtcNow;

        repo.Update(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Updated", nameof(MaintenanceRequest), id, existing.Title);

        return _mapper.Map<MaintenanceReadDto>(existing);
    }

    public async Task<bool> DeleteAsync(int id, string actor)
    {
        var repo = _uow.GetRepository<MaintenanceRequest>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return false;

        repo.Remove(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Deleted", nameof(MaintenanceRequest), id, existing.Title);

        return true;
    }
}