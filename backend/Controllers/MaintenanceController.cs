using backend.Dtos.Maintenance;
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
public class MaintenanceController : ControllerBase
{
    private readonly IMaintenanceService _service;
    private readonly IValidator<MaintenanceCreateDto> _createValidator;
    private readonly IValidator<MaintenanceUpdateDto> _updateValidator;

    public MaintenanceController(
        IMaintenanceService service,
        IValidator<MaintenanceCreateDto> createValidator,
        IValidator<MaintenanceUpdateDto> updateValidator)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaintenanceReadDto>>> Get([FromQuery] int? propertyId, [FromQuery] int? unitId, [FromQuery] int? tenantId)
        => Ok(await _service.GetAsync(propertyId, unitId, tenantId));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MaintenanceReadDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = Policies.StaffAndUp)]
    public async Task<ActionResult<MaintenanceReadDto>> Create(MaintenanceCreateDto dto)
    {
        var result = await _createValidator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<MaintenanceReadDto>> Update(int id, MaintenanceUpdateDto dto)
    {
        var validation = await _updateValidator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(validation.Errors);

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
