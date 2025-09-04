using backend.Domain.Enums;

namespace backend.Dtos.Auth;

public class AuthResponse
{
    public required string AccessToken { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public int UserId { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public RoleType Role { get; set; }
}
