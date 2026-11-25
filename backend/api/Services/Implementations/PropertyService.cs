using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Domain.Entities;
using backend.Dtos.Properties;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class PropertyService : IPropertyService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public PropertyService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    public async Task<IEnumerable<PropertyReadDto>> GetAllAsync()
    {
        return await _uow.Properties
            .Query()
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ProjectTo<PropertyReadDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<PropertyReadDto?> GetByIdAsync(int id)
    {
        return await _uow.Properties
            .Query()
            .AsNoTracking()
            .Where(p => p.Id == id)
            .ProjectTo<PropertyReadDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<PropertyReadDto> CreateAsync(PropertyCreateDto dto)
    {
        var entity = _mapper.Map<Property>(dto);
        await _uow.Properties.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return _mapper.Map<PropertyReadDto>(entity);
    }

    public async Task<PropertyReadDto?> UpdateAsync(int id, PropertyUpdateDto dto)
    {
        var existing = await _uow.Properties.GetByIdAsync(id);
        if (existing is null) return null;

        _mapper.Map(dto, existing);
        existing.UpdatedAt = DateTime.UtcNow;

        _uow.Properties.Update(existing);
        await _uow.SaveChangesAsync();

        return _mapper.Map<PropertyReadDto>(existing);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _uow.Properties.GetByIdAsync(id);
        if (existing is null) return false;

        var hasUnits = await _uow.Units.Query().AnyAsync(u => u.PropertyId == id);
        if (hasUnits)
            throw new InvalidOperationException("Cannot delete a property that still has units.");

        var hasMaintenance = await _uow.GetRepository<MaintenanceRequest>().Query().AnyAsync(m => m.PropertyId == id);
        if (hasMaintenance)
            throw new InvalidOperationException("Cannot delete a property with maintenance requests.");

        _uow.Properties.Remove(existing);
        await _uow.SaveChangesAsync();
        return true;
    }
}