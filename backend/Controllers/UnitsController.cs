using backend.Dtos.Units;
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
public class UnitsController(IUnitService service, IValidator<UnitCreateDto> validator) : ControllerBase
{
    private readonly IUnitService _service = service;
    private readonly IValidator<UnitCreateDto> _validator = validator;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UnitReadDto>>> GetAll([FromQuery] int? propertyId)
        => Ok(await _service.GetAllAsync(propertyId));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UnitReadDto>> GetById(int id)
    {
        var u = await _service.GetByIdAsync(id);
        return u is null ? NotFound() : Ok(u);
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<UnitReadDto>> Create(UnitCreateDto dto)
    {
        var result = await _validator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<UnitReadDto>> Update(int id, UnitUpdateDto dto)
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
