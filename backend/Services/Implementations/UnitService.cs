using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Units;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class UnitService(AppDbContext db, IUnitOfWork uow, IMapper mapper, IAuditLogService audit) : IUnitService
{
    private readonly AppDbContext _db = db;
    private readonly IUnitOfWork _uow = uow;
    private readonly IMapper _mapper = mapper;
    private readonly IAuditLogService _audit = audit;

    public async Task<IEnumerable<UnitReadDto>> GetAllAsync(int? propertyId = null)
    {
        var query = _db.Units.AsNoTracking();
        if (propertyId.HasValue) query = query.Where(u => u.PropertyId == propertyId.Value);
        return await query.ProjectTo<UnitReadDto>(_mapper.ConfigurationProvider).ToListAsync();
    }

    public async Task<UnitReadDto?> GetByIdAsync(int id)
    {
        return await _db.Units
            .AsNoTracking()
            .Where(u => u.Id == id)
            .ProjectTo<UnitReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<UnitReadDto> CreateAsync(UnitCreateDto dto, string actor)
    {
        // Ensure property exists
        var propExists = await _db.Properties.AnyAsync(p => p.Id == dto.PropertyId);
        if (!propExists) throw new ArgumentException("Property does not exist.");

        var entity = _mapper.Map<Unit>(dto);
        await _uow.Units.AddAsync(entity);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Created", nameof(Unit), entity.Id, $"Unit {entity.UnitNumber} @ Property {entity.PropertyId}");

        return _mapper.Map<UnitReadDto>(entity);
    }

    public async Task<UnitReadDto?> UpdateAsync(int id, UnitUpdateDto dto, string actor)
    {
        var existing = await _uow.Units.GetByIdAsync(id);
        if (existing is null) return null;

        // If PropertyId is changed, ensure the new property exists
        if (dto.PropertyId != existing.PropertyId)
        {
            var propExists = await _db.Properties.AnyAsync(p => p.Id == dto.PropertyId);
            if (!propExists) throw new ArgumentException("Property does not exist.");
        }

        _mapper.Map(dto, existing);
        _uow.Units.Update(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Updated", nameof(Unit), existing.Id, $"Unit {existing.UnitNumber} updated");

        return _mapper.Map<UnitReadDto>(existing);
    }

    public async Task<bool> DeleteAsync(int id, string actor)
    {
        var existing = await _uow.Units.GetByIdAsync(id);
        if (existing is null) return false;

        _uow.Units.Remove(existing);
        await _uow.SaveChangesAsync();

        await _audit.WriteAsync(actor, "Deleted", nameof(Unit), id, $"Unit {existing.UnitNumber} deleted");

        return true;
    }
}
