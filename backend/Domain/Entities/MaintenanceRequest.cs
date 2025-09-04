using backend.Domain.Enums;

namespace backend.Domain.Entities;

public class MaintenanceRequest
{
    public int Id { get; set; }
    public required int PropertyId { get; set; }
    public int? UnitId { get; set; }         // optional (e.g., common area)
    public int? TenantId { get; set; }       // optional (staff may file)
    public required string Title { get; set; }
    public string? Description { get; set; }
    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Open;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}
