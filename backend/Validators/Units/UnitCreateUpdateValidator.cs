using backend.Dtos.Units;
using FluentValidation;

namespace backend.Validators.Units;

public class UnitCreateUpdateValidator : AbstractValidator<UnitCreateDto>
{
    public UnitCreateUpdateValidator()
    {
        RuleFor(x => x.PropertyId).GreaterThan(0);
        RuleFor(x => x.UnitNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Bedrooms).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Bathrooms).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Rent).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SizeSqFt).GreaterThanOrEqualTo(0);
    }
}
