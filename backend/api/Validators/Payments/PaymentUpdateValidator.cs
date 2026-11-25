using backend.Dtos.Payments;
using FluentValidation;

namespace backend.Validators.Payments;

public class PaymentUpdateValidator : AbstractValidator<PaymentUpdateDto>
{
    public PaymentUpdateValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Method).IsInEnum();
        RuleFor(x => x.Reference).MaximumLength(200);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
