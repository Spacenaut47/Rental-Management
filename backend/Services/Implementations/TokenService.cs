using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Domain.Entities;
using backend.Services.Auth;
using backend.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services.Implementations;

public class TokenService(JwtOptions jwtOptions) : ITokenService
{
    private readonly JwtOptions _jwt = jwtOptions;

    public (string token, DateTime expiresAtUtc) CreateAccessToken(User user)
    {
        var handler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return (handler.WriteToken(token), expires);
    }
}
