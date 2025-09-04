using backend.Dtos.Maintenance;

namespace backend.Services.Interfaces;

public interface IMaintenanceService
{
    Task<IEnumerable<MaintenanceReadDto>> GetAsync(int? propertyId = null, int? unitId = null, int? tenantId = null);
    Task<MaintenanceReadDto?> GetByIdAsync(int id);
    Task<MaintenanceReadDto> CreateAsync(MaintenanceCreateDto dto, string actor);
    Task<MaintenanceReadDto?> UpdateAsync(int id, MaintenanceUpdateDto dto, string actor);
    Task<bool> DeleteAsync(int id, string actor);
}
