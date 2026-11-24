using backend.Domain.Entities;
using backend.Domain.Enums;
using backend.Services.Auth;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.Seed;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db, IPasswordHasher hasher, string adminPassword)
    {
        if (!await db.Users.AnyAsync(u => u.Username == "admin"))
        {
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
