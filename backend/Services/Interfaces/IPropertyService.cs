using backend.Dtos.Properties;

namespace backend.Services.Interfaces;

public interface IPropertyService
{
    Task<IEnumerable<PropertyReadDto>> GetAllAsync();
    Task<PropertyReadDto?> GetByIdAsync(int id);
    Task<PropertyReadDto> CreateAsync(PropertyCreateDto dto);
    Task<PropertyReadDto?> UpdateAsync(int id, PropertyUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}
