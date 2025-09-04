using System.Security.Cryptography;

namespace backend.Services.Auth;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;

    public void CreatePasswordHash(string password, out byte[] hash, out byte[] salt)
    {
        salt = RandomNumberGenerator.GetBytes(SaltSize);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
        hash = pbkdf2.GetBytes(KeySize);
    }

    public bool VerifyPassword(string password, byte[] storedHash, byte[] storedSalt)
    {
        using var pbkdf2 = new Rfc2898DeriveBytes(password, storedSalt, Iterations, HashAlgorithmName.SHA256);
        var computed = pbkdf2.GetBytes(KeySize);
        return CryptographicOperations.FixedTimeEquals(computed, storedHash);
    }
}
