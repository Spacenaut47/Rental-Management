using backend.Dtos.Maintenance;
using FluentValidation;

namespace backend.Validators.Maintenance;

public class MaintenanceUpdateValidator : AbstractValidator<MaintenanceUpdateDto>
{
    public MaintenanceUpdateValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.Status).IsInEnum();
    }
}
