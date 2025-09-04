using backend.Dtos.Leases;

namespace backend.Services.Interfaces;

public interface ILeaseService
{
    Task<IEnumerable<LeaseReadDto>> GetAllAsync(int? unitId = null, int? tenantId = null, bool? active = null);
    Task<LeaseReadDto?> GetByIdAsync(int id);
    Task<LeaseReadDto> CreateAsync(LeaseCreateDto dto, string actor);
    Task<LeaseReadDto?> UpdateAsync(int id, LeaseUpdateDto dto, string actor);
    Task<bool> DeleteAsync(int id, string actor);
}
