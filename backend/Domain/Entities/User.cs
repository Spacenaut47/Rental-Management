using backend.Domain.Enums;

namespace backend.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string NormalizedUsername { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public required byte[] PasswordHash { get; set; }
    public required byte[] PasswordSalt { get; set; }
    public RoleType Role { get; set; } = RoleType.Tenant;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
