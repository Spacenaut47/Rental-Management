using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Properties;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class PropertyService(AppDbContext db, IUnitOfWork uow, IMapper mapper) : IPropertyService
{
    private readonly AppDbContext _db = db;
    private readonly IUnitOfWork _uow = uow;
    private readonly IMapper _mapper = mapper;

    public async Task<IEnumerable<PropertyReadDto>> GetAllAsync()
    {
        return await _db.Properties
            .AsNoTracking()
            .ProjectTo<PropertyReadDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<PropertyReadDto?> GetByIdAsync(int id)
    {
        return await _db.Properties
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

        _uow.Properties.Remove(existing);
        await _uow.SaveChangesAsync();
        return true;
    }
}
