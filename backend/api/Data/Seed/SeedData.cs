using backend.Domain.Entities;
using backend.Domain.Enums;
using backend.Services.Auth;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.Seed;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db, IPasswordHasher hasher, string? adminPassword)
    {
        var admin = await db.Users.FirstOrDefaultAsync(u => u.NormalizedUsername == "ADMIN");
        if (admin is null)
        {
            if (string.IsNullOrWhiteSpace(adminPassword))
                throw new InvalidOperationException("Seed:AdminPassword must be configured before creating the admin account.");

            hasher.CreatePasswordHash(adminPassword, out var hash, out var salt);
            db.Users.Add(new User
            {
                Username = "admin",
                Email = "admin@local.test",
                NormalizedUsername = "ADMIN",
                NormalizedEmail = "ADMIN@LOCAL.TEST",
                PasswordHash = hash,
                PasswordSalt = salt,
                Role = RoleType.Admin
            });
        }
        else if (admin.Role != RoleType.Admin)
        {
            throw new InvalidOperationException("The reserved 'admin' username exists but is not an administrator.");
        }

        if (!await db.Properties.AnyAsync())
        {
            var prop = new Property
            {
                Name = "Sunset Apartments",
                Description = "Sample seeded property",
                AddressLine1 = "123 Main Street",
                City = "Springfield",
                State = "IL",
                Zip = "62701",
                Country = "USA"
            };

            db.Properties.Add(prop);
            await db.SaveChangesAsync();

            db.Units.Add(new Unit { PropertyId = prop.Id, UnitNumber = "1A", Bedrooms = 2, Bathrooms = 1, Rent = 1200, SizeSqFt = 900, IsOccupied = false });
            db.Units.Add(new Unit { PropertyId = prop.Id, UnitNumber = "1B", Bedrooms = 1, Bathrooms = 1, Rent = 900, SizeSqFt = 650, IsOccupied = false });
        }

        await db.SaveChangesAsync();
    }
}
