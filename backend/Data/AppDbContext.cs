using backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Property>()
            .Property(p => p.Name)
            .HasMaxLength(200);

        modelBuilder.Entity<Unit>()
            .HasIndex(u => new { u.PropertyId, u.UnitNumber })
            .IsUnique();

        modelBuilder.Entity<Unit>()
            .HasOne(u => u.Property)
            .WithMany(p => p.Units)
            .HasForeignKey(u => u.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.Email)
            .IsUnique();
    }
}
