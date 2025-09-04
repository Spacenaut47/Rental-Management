using backend.Dtos.Leases;
using backend.Security;
using backend.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = Policies.StaffAndUp)]
public class LeasesController(ILeaseService service, IValidator<LeaseCreateDto> validator) : ControllerBase
{
    private readonly ILeaseService _service = service;
    private readonly IValidator<LeaseCreateDto> _validator = validator;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaseReadDto>>> GetAll([FromQuery] int? unitId, [FromQuery] int? tenantId, [FromQuery] bool? active)
        => Ok(await _service.GetAllAsync(unitId, tenantId, active));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LeaseReadDto>> GetById(int id)
    {
        var lease = await _service.GetByIdAsync(id);
        return lease is null ? NotFound() : Ok(lease);
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<LeaseReadDto>> Create(LeaseCreateDto dto)
    {
        var result = await _validator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<LeaseReadDto>> Update(int id, LeaseUpdateDto dto)
    {
        // reuse the same validator rules for base fields
        var baseDto = new LeaseCreateDto
        {
            UnitId = dto.UnitId,
            TenantId = dto.TenantId,
            StartDateUtc = dto.StartDateUtc,
            EndDateUtc = dto.EndDateUtc,
            MonthlyRent = dto.MonthlyRent,
            SecurityDeposit = dto.SecurityDeposit
        };
        var result = await _validator.ValidateAsync(baseDto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var updated = await _service.UpdateAsync(id, dto, actor);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Delete(int id)
    {
        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var ok = await _service.DeleteAsync(id, actor);
        return ok ? NoContent() : NotFound();
    }
}
