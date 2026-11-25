using backend.Dtos.Maintenance;
using FluentValidation;

namespace backend.Validators.Maintenance;

public class MaintenanceCreateUpdateValidator : AbstractValidator<MaintenanceCreateDto>
{
    public MaintenanceCreateUpdateValidator()
    {
        RuleFor(x => x.PropertyId).GreaterThan(0);
        RuleFor(x => x.UnitId).GreaterThan(0).When(x => x.UnitId.HasValue);
        RuleFor(x => x.TenantId).GreaterThan(0).When(x => x.TenantId.HasValue);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Priority).IsInEnum();
    }
}
