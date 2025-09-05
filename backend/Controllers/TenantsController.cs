using backend.Dtos.Tenants;
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
public class TenantsController : ControllerBase
{
    private readonly ITenantService _service;
    private readonly IValidator<TenantCreateDto> _validator;

    public TenantsController(ITenantService service, IValidator<TenantCreateDto> validator)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TenantReadDto>>> GetAll([FromQuery] string? search)
        => Ok(await _service.GetAllAsync(search));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TenantReadDto>> GetById(int id)
    {
        var t = await _service.GetByIdAsync(id);
        return t is null ? NotFound() : Ok(t);
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<TenantReadDto>> Create(TenantCreateDto dto)
    {
        var result = await _validator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<TenantReadDto>> Update(int id, TenantUpdateDto dto)
    {
        var result = await _validator.ValidateAsync(dto);
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
