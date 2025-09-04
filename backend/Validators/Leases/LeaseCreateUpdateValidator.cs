using backend.Dtos.Leases;
using FluentValidation;

namespace backend.Validators.Leases;

public class LeaseCreateUpdateValidator : AbstractValidator<LeaseCreateDto>
{
    public LeaseCreateUpdateValidator()
    {
        RuleFor(x => x.UnitId).GreaterThan(0);
        RuleFor(x => x.TenantId).GreaterThan(0);
        RuleFor(x => x.StartDateUtc).LessThan(x => x.EndDateUtc).WithMessage("Start must be before End.");
        RuleFor(x => x.MonthlyRent).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SecurityDeposit).GreaterThanOrEqualTo(0);
    }
}
