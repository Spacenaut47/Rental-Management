using backend.Dtos.Auth;
using FluentValidation;

namespace backend.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.UsernameOrEmail).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}
