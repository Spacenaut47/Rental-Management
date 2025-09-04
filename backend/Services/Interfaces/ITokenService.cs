using backend.Domain.Entities;

namespace backend.Services.Interfaces;

public interface ITokenService
{
    (string token, DateTime expiresAtUtc) CreateAccessToken(User user);
}
