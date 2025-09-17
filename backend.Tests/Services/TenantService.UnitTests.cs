using System;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using backend.Domain.Entities;
using backend.Dtos.Tenants;
using backend.Repositories.Interfaces;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Services.UnitTests
{
    public class TenantServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IGenericRepository<Tenant>> _tenantRepoMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly Mock<IAuditLogService> _auditMock = new();

        private const string Actor = "unittest";

        public TenantServiceUnitTests()
        {
            _uowMock.Setup(u => u.GetRepository<Tenant>()).Returns(_tenantRepoMock.Object);

            _auditMock.Setup(a =>
                a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>())
            ).Returns(Task.CompletedTask);
        }

        private static backend.Data.AppDbContext CreateInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<backend.Data.AppDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;
            return new backend.Data.AppDbContext(options);
        }

        [Fact]
        public async Task CreateAsync_AddsTenant_WhenEmailNotExists()
        {
            // Arrange
            var dto = new TenantCreateDto { FirstName = "John", LastName = "Doe", Email = "j@doe.com" };
            var entity = new Tenant { Id = 1, FirstName = "John", LastName = "Doe", Email = "j@doe.com" };

            var db = CreateInMemoryContext(nameof(CreateAsync_AddsTenant_WhenEmailNotExists));

            _mapperMock.Setup(m => m.Map<Tenant>(dto)).Returns(entity);
            _mapperMock.Setup(m => m.Map<TenantReadDto>(entity))
                .Returns(new TenantReadDto { Id = 1, FirstName = "John", LastName = "Doe", Email = "j@doe.com" });

            _tenantRepoMock.Setup(r => r.AddAsync(It.IsAny<Tenant>())).Returns(Task.CompletedTask);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var service = new TenantService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var result = await service.CreateAsync(dto, Actor);

            // Assert
            result.Should().NotBeNull();
            result.Email.Should().Be("j@doe.com");
            _auditMock.Verify(a => a.WriteAsync(Actor, "Created", nameof(Tenant), 1, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_Throws_WhenEmailAlreadyExists()
        {
            // Arrange
            var dto = new TenantCreateDto { FirstName = "Jane", LastName = "Smith", Email = "jane@test.com" };

            var db = CreateInMemoryContext(nameof(CreateAsync_Throws_WhenEmailAlreadyExists));
            db.Tenants.Add(new Tenant { FirstName = "Existing", LastName = "User", Email = "jane@test.com" });
            db.SaveChanges();

            var service = new TenantService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var act = async () => await service.CreateAsync(dto, Actor);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage("A tenant with this email already exists.");
        }

        [Fact]
        public async Task UpdateAsync_ReturnsNull_WhenNotFound()
        {
            // Arrange
            _tenantRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Tenant?)null);

            var db = CreateInMemoryContext(nameof(UpdateAsync_ReturnsNull_WhenNotFound));
            var service = new TenantService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var result = await service.UpdateAsync(999, new TenantUpdateDto { FirstName = "X", LastName = "Y", Email = "x@y.com" }, Actor);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateAsync_Throws_WhenDuplicateEmail()
        {
            // Arrange
            var existing = new Tenant { Id = 1, FirstName = "Old", LastName = "User", Email = "old@test.com" };

            _tenantRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);

            var db = CreateInMemoryContext(nameof(UpdateAsync_Throws_WhenDuplicateEmail));
            db.Tenants.Add(new Tenant { Id = 2, FirstName = "Other", LastName = "User", Email = "dup@test.com" });
            db.SaveChanges();

            var dto = new TenantUpdateDto { FirstName = "New", LastName = "User", Email = "dup@test.com" };

            var service = new TenantService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var act = async () => await service.UpdateAsync(1, dto, Actor);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage("A tenant with this email already exists.");
        }

        [Fact]
        public async Task UpdateAsync_UpdatesTenant_WhenValid()
        {
            // Arrange
            var existing = new Tenant { Id = 3, FirstName = "Old", LastName = "Name", Email = "old@test.com" };
            _tenantRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);

            var dto = new TenantUpdateDto { FirstName = "New", LastName = "Name", Email = "old@test.com" };

            _mapperMock.Setup(m => m.Map(dto, existing)).Callback(() =>
            {
                existing.FirstName = dto.FirstName;
                existing.LastName = dto.LastName;
            });

            _mapperMock.Setup(m => m.Map<TenantReadDto>(existing))
                .Returns(new TenantReadDto { Id = 3, FirstName = "New", LastName = "Name", Email = "old@test.com" });

            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var db = CreateInMemoryContext(nameof(UpdateAsync_UpdatesTenant_WhenValid));
            var service = new TenantService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var result = await service.UpdateAsync(3, dto, Actor);

            // Assert
            result.Should().NotBeNull();
            result!.FirstName.Should().Be("New");
            _auditMock.Verify(a => a.WriteAsync(Actor, "Updated", nameof(Tenant), 3, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_ReturnsFalse_WhenNotFound()
        {
            // Arrange
            _tenantRepoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Tenant?)null);

            var db = CreateInMemoryContext(nameof(DeleteAsync_ReturnsFalse_WhenNotFound));
            var service = new TenantService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var result = await service.DeleteAsync(404, Actor);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteAsync_RemovesTenant_WhenFound()
        {
            // Arrange
            var existing = new Tenant { Id = 5, FirstName = "Del", LastName = "Me", Email = "del@test.com" };

            _tenantRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);
            _tenantRepoMock.Setup(r => r.Remove(existing));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var db = CreateInMemoryContext(nameof(DeleteAsync_RemovesTenant_WhenFound));
            var service = new TenantService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var result = await service.DeleteAsync(5, Actor);

            // Assert
            result.Should().BeTrue();
            _auditMock.Verify(a => a.WriteAsync(Actor, "Deleted", nameof(Tenant), 5, It.IsAny<string>()), Times.Once);
        }
    }
}
