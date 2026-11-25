using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Domain.Entities;
using backend.Dtos.Units;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class UnitService : IUnitService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public UnitService(IUnitOfWork uow, IMapper mapper, IAuditLogService audit)
    {
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _audit = audit ?? throw new ArgumentNullException(nameof(audit));
    }

    public async Task<IEnumerable<UnitReadDto>> GetAllAsync(int? propertyId = null)
    {
        var query = _uow.Units.Query().AsNoTracking();
        if (propertyId.HasValue)
            query = query.Where(u => u.PropertyId == propertyId.Value);
        return await query
            .OrderByDescending(u => u.Id)
            .ProjectTo<UnitReadDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<UnitReadDto?> GetByIdAsync(int id)
    {
        return await _uow.Units.Query()
            .AsNoTracking()
            .Where(u => u.Id == id)
            .ProjectTo<UnitReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<UnitReadDto> CreateAsync(UnitCreateDto dto, string actor)
    {
        // Ensure property exists
        var propExists = await _uow.Properties.Query().AnyAsync(p => p.Id == dto.PropertyId);
        if (!propExists) throw new ArgumentException("Property does not exist.");

        var entity = _mapper.Map<Unit>(dto);
        await _uow.Units.AddAsync(entity);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(Unit), entity.Id, $"Unit {entity.UnitNumber} @ Property {entity.PropertyId}");

        return await ToReadDtoAsync(entity);
    }

    public async Task<UnitReadDto?> UpdateAsync(int id, UnitUpdateDto dto, string actor)
    {
        var existing = await _uow.Units.GetByIdAsync(id);
        if (existing is null) return null;

        if (dto.PropertyId != existing.PropertyId)
        {
            var propExists = await _uow.Properties.Query().AnyAsync(p => p.Id == dto.PropertyId);
            if (!propExists) throw new ArgumentException("Property does not exist.");

            var hasLeases = await _uow.GetRepository<Lease>().Query().AnyAsync(l => l.UnitId == id);
            var hasMaintenance = await _uow.GetRepository<MaintenanceRequest>().Query().AnyAsync(m => m.UnitId == id);
            if (hasLeases || hasMaintenance)
                throw new InvalidOperationException("Cannot move a unit that is referenced by leases or maintenance requests.");
        }

        _mapper.Map(dto, existing);
        _uow.Units.Update(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Updated", nameof(Unit), existing.Id, $"Unit {existing.UnitNumber} updated");

        return await ToReadDtoAsync(existing);
    }

    private async Task<UnitReadDto> ToReadDtoAsync(Unit unit)
    {
        var dto = _mapper.Map<UnitReadDto>(unit);
        var now = DateTime.UtcNow;
        dto.IsOccupied = await _uow.GetRepository<Lease>().Query().AnyAsync(l =>
            l.UnitId == unit.Id &&
            l.IsActive &&
            l.StartDateUtc <= now &&
            l.EndDateUtc > now);
        return dto;
    }

    public async Task<bool> DeleteAsync(int id, string actor)
    {
        var existing = await _uow.Units.GetByIdAsync(id);
        if (existing is null) return false;

        var hasLeases = await _uow.GetRepository<Lease>().Query().AnyAsync(l => l.UnitId == id);
        if (hasLeases) throw new InvalidOperationException("Cannot delete a unit that is referenced by leases.");

        var hasMaintenance = await _uow.GetRepository<MaintenanceRequest>().Query().AnyAsync(m => m.UnitId == id);
        if (hasMaintenance) throw new InvalidOperationException("Cannot delete a unit with maintenance requests.");

        _uow.Units.Remove(existing);
        await _uow.SaveChangesAsync();
        await _audit.WriteAsync(actor, "Deleted", nameof(Unit), id, $"Unit {existing.UnitNumber} deleted");
        return true;
    }
}