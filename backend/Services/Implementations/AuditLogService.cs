using backend.Domain.Entities;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AuditLogService : IAuditLogService
{
    private readonly IUnitOfWork _uow;

    public AuditLogService(IUnitOfWork uow)
    {
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
    }

    public async Task WriteAsync(string actor, string action, string entityName, int? entityId = null, string? details = null)
    {
        var auditLog = new AuditLog
        {
            Actor = actor,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details
        };

        // Use the AuditLog repository via UnitOfWork
        await _uow.GetRepository<AuditLog>().AddAsync(auditLog);
        await _uow.SaveChangesAsync();
    }
}