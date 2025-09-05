using backend.Data;
using backend.Domain.Entities;
using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _db;

    public AuditLogService(AppDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task WriteAsync(string actor, string action, string entityName, int? entityId = null, string? details = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Actor = actor,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details
        });
        await _db.SaveChangesAsync();
    }
}
