using System;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using backend.Domain.Entities;
using backend.Dtos.Leases;
using backend.Repositories.Interfaces;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Services
{
    public class LeaseServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IGenericRepository<Lease>> _leaseRepoMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly Mock<IAuditLogService> _auditMock = new();

        private const string Actor = "unittest";

        public LeaseServiceUnitTests()
        {
            _uowMock.Setup(u => u.GetRepository<Lease>()).Returns(_leaseRepoMock.Object);

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
        public async Task CreateAsync_AddsLease_WhenValid()
        {
            var dto = new LeaseCreateDto
            {
                UnitId = 1,
                TenantId = 1,
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddMonths(6),
                MonthlyRent = 1000,
                SecurityDeposit = 500
            };

            var entity = new Lease { Id = 10, UnitId = 1, TenantId = 1 };

            var db = CreateInMemoryContext(nameof(CreateAsync_AddsLease_WhenValid));
            db.Units.Add(new Unit { Id = 1, PropertyId = 1, UnitNumber = "101", Bedrooms = 2, Bathrooms = 1, Rent = 1000, SizeSqFt = 500 });
            db.Tenants.Add(new Tenant { Id = 1, FirstName = "Test", LastName = "Tenant", Email = "t@test.com" });
            db.SaveChanges();

            _mapperMock.Setup(m => m.Map<Lease>(dto)).Returns(entity);
            _mapperMock.Setup(m => m.Map<LeaseReadDto>(entity))
                .Returns(new LeaseReadDto { Id = 10, UnitId = 1, TenantId = 1 });

            _leaseRepoMock.Setup(r => r.AddAsync(entity)).Returns(Task.CompletedTask);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var service = new LeaseService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            var result = await service.CreateAsync(dto, Actor);

            result.Id.Should().Be(10);
            _auditMock.Verify(a => a.WriteAsync(Actor, "Created", nameof(Lease), 10, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_Throws_WhenUnitMissing()
        {
            var dto = new LeaseCreateDto
            {
                UnitId = 99,
                TenantId = 1,
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddMonths(6)
            };

            var db = CreateInMemoryContext(nameof(CreateAsync_Throws_WhenUnitMissing));
            db.Tenants.Add(new Tenant { Id = 1, FirstName = "T", LastName = "T", Email = "t@test.com" });
            db.SaveChanges();

            var service = new LeaseService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            Func<Task> act = () => service.CreateAsync(dto, Actor);

            await act.Should().ThrowAsync<ArgumentException>().WithMessage("Unit does not exist.");
        }

        [Fact]
        public async Task CreateAsync_Throws_WhenOverlap()
        {
            var start = DateTime.UtcNow;
            var end = start.AddMonths(6);

            var dto = new LeaseCreateDto
            {
                UnitId = 1,
                TenantId = 1,
                StartDateUtc = start,
                EndDateUtc = end
            };

            var db = CreateInMemoryContext(nameof(CreateAsync_Throws_WhenOverlap));
            db.Units.Add(new Unit { Id = 1, PropertyId = 1, UnitNumber = "U1", Bedrooms = 1, Bathrooms = 1, Rent = 100, SizeSqFt = 100 });
            db.Tenants.Add(new Tenant { Id = 1, FirstName = "T", LastName = "L", Email = "x@test.com" });
            db.Leases.Add(new Lease { Id = 1, UnitId = 1, TenantId = 1, StartDateUtc = start, EndDateUtc = end, IsActive = true });
            db.SaveChanges();

            var service = new LeaseService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            Func<Task> act = () => service.CreateAsync(dto, Actor);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Unit already has an active overlapping lease.");
        }

        [Fact]
        public async Task UpdateAsync_ReturnsNull_WhenNotFound()
        {
            _leaseRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Lease?)null);

            var db = CreateInMemoryContext(nameof(UpdateAsync_ReturnsNull_WhenNotFound));
            var service = new LeaseService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            var result = await service.UpdateAsync(999, new LeaseUpdateDto
            {
                UnitId = 1,
                TenantId = 1,
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddMonths(6)
            }, Actor);

            result.Should().BeNull();
        }

        [Fact]
        public async Task DeleteAsync_Removes_WhenFound()
        {
            var existing = new Lease { Id = 50, UnitId = 1, TenantId = 1 };

            _leaseRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);
            _leaseRepoMock.Setup(r => r.Remove(existing));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var db = CreateInMemoryContext(nameof(DeleteAsync_Removes_WhenFound));
            var service = new LeaseService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            var ok = await service.DeleteAsync(50, Actor);

            ok.Should().BeTrue();
            _auditMock.Verify(a => a.WriteAsync(Actor, "Deleted", nameof(Lease), 50, It.IsAny<string>()), Times.Once);
        }
    }
}
