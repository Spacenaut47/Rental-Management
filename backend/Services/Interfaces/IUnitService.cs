using backend.Dtos.Units;

namespace backend.Services.Interfaces;

public interface IUnitService
{
    Task<IEnumerable<UnitReadDto>> GetAllAsync(int? propertyId = null);
    Task<UnitReadDto?> GetByIdAsync(int id);
    Task<UnitReadDto> CreateAsync(UnitCreateDto dto, string actor);
    Task<UnitReadDto?> UpdateAsync(int id, UnitUpdateDto dto, string actor);
    Task<bool> DeleteAsync(int id, string actor);
}
