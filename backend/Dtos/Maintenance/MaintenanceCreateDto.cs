using backend.Domain.Enums;

namespace backend.Dtos.Maintenance;

public class MaintenanceCreateDto
{
    public required int PropertyId { get; set; }
    public int? UnitId { get; set; }
    public int? TenantId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;
}
