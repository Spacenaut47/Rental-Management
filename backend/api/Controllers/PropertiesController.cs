using backend.Dtos.Properties;
using backend.Security;
using backend.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = Policies.StaffAndUp)]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _service;
    private readonly IValidator<PropertyCreateDto> _createValidator;

    public PropertiesController(IPropertyService service, IValidator<PropertyCreateDto> createValidator)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PropertyReadDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PropertyReadDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<PropertyReadDto>> Create(PropertyCreateDto dto)
    {
        var result = await _createValidator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<PropertyReadDto>> Update(int id, PropertyUpdateDto dto)
    {
        var result = await _createValidator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var updated = await _service.UpdateAsync(id, dto);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
