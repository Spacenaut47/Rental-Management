using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Tenants;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class TenantService(AppDbContext db, IUnitOfWork uow, IMapper mapper, IAuditLogService audit) : ITenantService
{
    private readonly AppDbContext _db = db;
    private readonly IUnitOfWork _uow = uow;
    private readonly IMapper _mapper = mapper;
    private readonly IAuditLogService _audit = audit;

    public async Task<IEnumerable<TenantReadDto>> GetAllAsync(string? search = null)
    {
        var q = _db.Tenants.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(t => t.FirstName.Contains(s) || t.LastName.Contains(s) || t.Email.Contains(s));
        }
        return await q.ProjectTo<TenantReadDto>(_mapper.ConfigurationProvider).ToListAsync();
    }

    public async Task<TenantReadDto?> GetByIdAsync(int id)
    {
        return await _db.Tenants
            .AsNoTracking()
            .Where(t => t.Id == id)
            .ProjectTo<TenantReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<TenantReadDto> CreateAsync(TenantCreateDto dto, string actor)
    {
        if (await _db.Tenants.AnyAsync(t => t.Email == dto.Email))
            throw new ArgumentException("A tenant with this email already exists.");

        var entity = _mapper.Map<Tenant>(dto);
        
        // Use the repository through UnitOfWork instead of calling AddAsync on UnitOfWork directly
        await _uow.GetRepository<Tenant>().AddAsync(entity);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(Tenant), entity.Id, $"{entity.FirstName} {entity.LastName}");

        return _mapper.Map<TenantReadDto>(entity);
    }

    public async Task<TenantReadDto?> UpdateAsync(int id, TenantUpdateDto dto, string actor)
    {
        var existing = await _uow.GetRepository<Tenant>().GetByIdAsync(id);
        if (existing is null) return null;

        if (!string.Equals(existing.Email, dto.Email, StringComparison.OrdinalIgnoreCase) &&
            await _db.Tenants.AnyAsync(t => t.Email == dto.Email))
            throw new ArgumentException("A tenant with this email already exists.");

        _mapper.Map(dto, existing);
        existing.UpdatedAt = DateTime.UtcNow;

        _uow.GetRepository<Tenant>().Update(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Updated", nameof(Tenant), existing.Id, $"{existing.FirstName} {existing.LastName}");

        return _mapper.Map<TenantReadDto>(existing);
    }

    public async Task<bool> DeleteAsync(int id, string actor)
    {
        var repo = _uow.GetRepository<Tenant>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return false;

        repo.Remove(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Deleted", nameof(Tenant), id, $"{existing.FirstName} {existing.LastName}");

        return true;
    }
}