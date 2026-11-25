using backend.Dtos.Payments;
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
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _service;
    private readonly IValidator<PaymentCreateDto> _createValidator;
    private readonly IValidator<PaymentUpdateDto> _updateValidator;

    public PaymentsController(
        IPaymentService service,
        IValidator<PaymentCreateDto> createValidator,
        IValidator<PaymentUpdateDto> updateValidator)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    [HttpGet("lease/{leaseId:int}")]
    public async Task<ActionResult<IEnumerable<PaymentReadDto>>> GetForLease(int leaseId)
        => Ok(await _service.GetForLeaseAsync(leaseId));

    [HttpGet("lease/{leaseId:int}/total")]
    public async Task<ActionResult<decimal>> GetTotalPaid(int leaseId)
        => Ok(await _service.GetTotalPaidAsync(leaseId));

    [HttpPost]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<PaymentReadDto>> Create(PaymentCreateDto dto)
    {
        var result = await _createValidator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetForLease), new { leaseId = created.LeaseId }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerAndUp)]
    public async Task<ActionResult<PaymentReadDto>> Update(int id, PaymentUpdateDto dto)
    {
        var result = await _updateValidator.ValidateAsync(dto);
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
