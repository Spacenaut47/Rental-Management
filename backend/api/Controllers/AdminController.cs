using backend.Security;
using backend.Repositories.Interfaces;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAudit([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? entity = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var auditRepo = _unitOfWork.GetRepository<AuditLog>();
        var q = auditRepo.Query().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(entity)) q = q.Where(a => a.EntityName == entity);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(a => a.AtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }
}