using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Domain.Entities;
using backend.Dtos.Tenants;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class TenantService : ITenantService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public TenantService(IUnitOfWork uow, IMapper mapper, IAuditLogService audit)
    {
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _audit = audit ?? throw new ArgumentNullException(nameof(audit));
    }

    public async Task<IEnumerable<TenantReadDto>> GetAllAsync(string? search = null)
    {
        var q = _uow.GetRepository<Tenant>().Query().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            var normalized = s.ToUpperInvariant();
            q = q.Where(t => t.FirstName.Contains(s) || t.LastName.Contains(s) || t.NormalizedEmail.Contains(normalized));
        }
        return await q.ProjectTo<TenantReadDto>(_mapper.ConfigurationProvider).ToListAsync();
    }

    public async Task<TenantReadDto?> GetByIdAsync(int id)
    {
        return await _uow.GetRepository<Tenant>().Query()
            .AsNoTracking()
            .Where(t => t.Id == id)
            .ProjectTo<TenantReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<TenantReadDto> CreateAsync(TenantCreateDto dto, string actor)
    {
        var normalizedEmail = dto.Email.Trim().ToUpperInvariant();
        var exists = await _uow.GetRepository<Tenant>().Query().AnyAsync(t => t.NormalizedEmail == normalizedEmail);
        if (exists)
            throw new ArgumentException("A tenant with this email already exists.");

        var entity = _mapper.Map<Tenant>(dto);
        entity.Email = dto.Email.Trim();
        entity.NormalizedEmail = normalizedEmail;
        await _uow.GetRepository<Tenant>().AddAsync(entity);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(Tenant), entity.Id, $"{entity.FirstName} {entity.LastName}");

        return _mapper.Map<TenantReadDto>(entity);
    }

    public async Task<TenantReadDto?> UpdateAsync(int id, TenantUpdateDto dto, string actor)
    {
        var repo = _uow.GetRepository<Tenant>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return null;

        var normalizedEmail = dto.Email.Trim().ToUpperInvariant();
        if (!string.Equals(existing.NormalizedEmail, normalizedEmail, StringComparison.Ordinal) &&
            await repo.Query().AnyAsync(t => t.NormalizedEmail == normalizedEmail))
            throw new ArgumentException("A tenant with this email already exists.");

        _mapper.Map(dto, existing);
        existing.Email = dto.Email.Trim();
        existing.NormalizedEmail = normalizedEmail;
        existing.UpdatedAt = DateTime.UtcNow;

        repo.Update(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Updated", nameof(Tenant), existing.Id, $"{existing.FirstName} {existing.LastName}");

        return _mapper.Map<TenantReadDto>(existing);
    }

    public async Task<bool> DeleteAsync(int id, string actor)
    {
        var repo = _uow.GetRepository<Tenant>();
        var existing = await repo.GetByIdAsync(id);
        if (existing is null) return false;

        var hasLeases = await _uow.GetRepository<Lease>().Query().AnyAsync(l => l.TenantId == id);
        if (hasLeases) throw new InvalidOperationException("Cannot delete a tenant that is referenced by leases.");

        var hasMaintenance = await _uow.GetRepository<MaintenanceRequest>().Query().AnyAsync(m => m.TenantId == id);
        if (hasMaintenance) throw new InvalidOperationException("Cannot delete a tenant with maintenance requests.");

        repo.Remove(existing);
        await _uow.SaveChangesAsync();
        await _audit.WriteAsync(actor, "Deleted", nameof(Tenant), id, $"{existing.FirstName} {existing.LastName}");
        return true;
    }
}