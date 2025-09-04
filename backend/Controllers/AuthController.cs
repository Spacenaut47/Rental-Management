using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Auth;
using backend.Repositories.Interfaces;
using backend.Services.Auth;
using backend.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    IUnitOfWork uow,
    IPasswordHasher hasher,
    ITokenService tokenService,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly IUnitOfWork _uow = uow;
    private readonly IPasswordHasher _hasher = hasher;
    private readonly ITokenService _tokenService = tokenService;
    private readonly IValidator<RegisterRequest> _registerValidator = registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator = loginValidator;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var validation = await _registerValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors);

        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return Conflict(new { message = "Username already exists." });

        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { message = "Email already exists." });

        _hasher.CreatePasswordHash(request.Password, out var hash, out var salt);

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = hash,
            PasswordSalt = salt,
            Role = request.Role
        };

        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();

        var (token, expires) = _tokenService.CreateAccessToken(user);

        return Ok(new AuthResponse
        {
            AccessToken = token,
            ExpiresAtUtc = expires,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role
        });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var validation = await _loginValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors);

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Username == request.UsernameOrEmail || u.Email == request.UsernameOrEmail);

        if (user is null || !_hasher.VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized(new { message = "Invalid credentials." });

        var (token, expires) = _tokenService.CreateAccessToken(user);

        return Ok(new AuthResponse
        {
            AccessToken = token,
            ExpiresAtUtc = expires,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (id is null) return Unauthorized();

        var userId = int.Parse(id);
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.Role,
            user.CreatedAt
        });
    }
}
