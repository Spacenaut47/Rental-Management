using backend.Domain.Enums;

namespace backend.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required byte[] PasswordHash { get; set; }
    public required byte[] PasswordSalt { get; set; }
    public RoleType Role { get; set; } = RoleType.Manager;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
