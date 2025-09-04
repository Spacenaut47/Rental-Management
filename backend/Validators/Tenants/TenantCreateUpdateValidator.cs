using backend.Dtos.Tenants;
using FluentValidation;

namespace backend.Validators.Tenants;

public class TenantCreateUpdateValidator : AbstractValidator<TenantCreateDto>
{
    public TenantCreateUpdateValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(30);
    }
}
