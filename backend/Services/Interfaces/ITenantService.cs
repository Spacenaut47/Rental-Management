using backend.Dtos.Tenants;

namespace backend.Services.Interfaces;

public interface ITenantService
{
    Task<IEnumerable<TenantReadDto>> GetAllAsync(string? search = null);
    Task<TenantReadDto?> GetByIdAsync(int id);
    Task<TenantReadDto> CreateAsync(TenantCreateDto dto, string actor);
    Task<TenantReadDto?> UpdateAsync(int id, TenantUpdateDto dto, string actor);
    Task<bool> DeleteAsync(int id, string actor);
}
