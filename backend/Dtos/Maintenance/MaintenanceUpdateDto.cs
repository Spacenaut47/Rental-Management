using backend.Domain.Enums;

namespace backend.Dtos.Maintenance;

public class MaintenanceUpdateDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public MaintenancePriority Priority { get; set; }
    public MaintenanceStatus Status { get; set; }
}
