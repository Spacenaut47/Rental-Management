using backend.Domain.Enums;

namespace backend.Dtos.Auth;

public class RegisterRequest
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public RoleType Role { get; set; } = RoleType.Manager;
}
