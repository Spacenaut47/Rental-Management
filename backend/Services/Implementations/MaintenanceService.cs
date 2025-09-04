using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Maintenance;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class MaintenanceService(AppDbContext db, IUnitOfWork uow, IMapper mapper, IAuditLogService audit) : IMaintenanceService
{
    private readonly AppDbContext _db = db;
    private readonly IUnitOfWork _uow = uow;
    private readonly IMapper _mapper = mapper;
    private readonly IAuditLogService _audit = audit;

    public async Task<IEnumerable<MaintenanceReadDto>> GetAsync(int? propertyId = null, int? unitId = null, int? tenantId = null)
    {
        var q = _db.MaintenanceRequests.AsNoTracking();
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
        return await _db.MaintenanceRequests
            .AsNoTracking()
            .Where(m => m.Id == id)
            .ProjectTo<MaintenanceReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<MaintenanceReadDto> CreateAsync(MaintenanceCreateDto dto, string actor)
    {
        // basic referential checks
        if (!await _db.Properties.AnyAsync(p => p.Id == dto.PropertyId))
            throw new ArgumentException("Property does not exist.");
        if (dto.UnitId.HasValue && !await _db.Units.AnyAsync(u => u.Id == dto.UnitId.Value))
            throw new ArgumentException("Unit does not exist.");
        if (dto.TenantId.HasValue && !await _db.Tenants.AnyAsync(t => t.Id == dto.TenantId.Value))
            throw new ArgumentException("Tenant does not exist.");

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
