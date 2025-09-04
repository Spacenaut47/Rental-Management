using backend.Dtos.Properties;
using FluentValidation;

namespace backend.Validators.Properties;

public class PropertyCreateUpdateValidator : AbstractValidator<PropertyCreateDto>
{
    public PropertyCreateUpdateValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AddressLine1).NotEmpty().MaximumLength(200);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.State).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Zip).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(100);
    }
}
