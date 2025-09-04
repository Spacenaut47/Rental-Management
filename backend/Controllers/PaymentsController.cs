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
public class PaymentsController(IPaymentService service, IValidator<PaymentCreateDto> validator) : ControllerBase
{
    private readonly IPaymentService _service = service;
    private readonly IValidator<PaymentCreateDto> _validator = validator;

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
        var result = await _validator.ValidateAsync(dto);
        if (!result.IsValid) return BadRequest(result.Errors);

        var actor = User.FindFirstValue(System.Security.Claims.ClaimTypes.Name) ?? "unknown";
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetForLease), new { leaseId = created.LeaseId }, created);
    }
}
