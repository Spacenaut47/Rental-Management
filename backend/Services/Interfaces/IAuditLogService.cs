namespace backend.Services.Interfaces;

public interface IAuditLogService
{
    Task WriteAsync(string actor, string action, string entityName, int? entityId = null, string? details = null);
}
