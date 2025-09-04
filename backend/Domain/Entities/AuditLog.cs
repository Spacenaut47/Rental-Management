namespace backend.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public required string Actor { get; set; }           // username/email
    public required string Action { get; set; }          // Created/Updated/Deleted
    public required string EntityName { get; set; }      // Property/Unit/Tenant/etc
    public int? EntityId { get; set; }
    public string? Details { get; set; }                 // JSON or message
    public DateTime AtUtc { get; set; } = DateTime.UtcNow;
}
