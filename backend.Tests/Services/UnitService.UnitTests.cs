using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using backend.Domain.Entities;
using backend.Dtos.Units;
using backend.Repositories.Interfaces;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Services.UnitTests
{
    public class UnitServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IGenericRepository<Unit>> _unitRepoMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly Mock<IAuditLogService> _auditMock = new();

        private const string Actor = "unittest";

        public UnitServiceUnitTests()
        {
            _uowMock.Setup(u => u.Units).Returns(_unitRepoMock.Object);

            // By default, audit log calls succeed
            _auditMock.Setup(a =>
                a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>())
            ).Returns(Task.CompletedTask);
        }

        private static backend.Data.AppDbContext CreateInMemoryContext(string dbName)
        {
            var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<backend.Data.AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName) // each test gets its own
                .Options;

            return new backend.Data.AppDbContext(options);
        }


        [Fact]
        public async Task CreateAsync_AddsUnit_SavesAndLogs()
        {
            // Arrange
            var dto = new UnitCreateDto
            {
                PropertyId = 1,
                UnitNumber = "101",
                Bedrooms = 2,
                Bathrooms = 1,
                Rent = 1000,
                SizeSqFt = 750,
                IsOccupied = false
            };

            var entity = new Unit
            {
                Id = 42,
                PropertyId = dto.PropertyId,
                UnitNumber = dto.UnitNumber,
                Bedrooms = dto.Bedrooms,
                Bathrooms = dto.Bathrooms,
                Rent = dto.Rent,
                SizeSqFt = dto.SizeSqFt,
                IsOccupied = dto.IsOccupied
            };

            _mapperMock.Setup(m => m.Map<Unit>(It.IsAny<UnitCreateDto>())).Returns(entity);
            _mapperMock.Setup(m => m.Map<UnitReadDto>(It.IsAny<Unit>())).Returns(new UnitReadDto { Id = 42, UnitNumber = "101" });

            _unitRepoMock.Setup(r => r.AddAsync(It.IsAny<Unit>())).Returns(Task.CompletedTask);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Mock property existence check
            var dbCtx = CreateInMemoryContext(nameof(CreateAsync_AddsUnit_SavesAndLogs));
            dbCtx.Properties.Add(new backend.Domain.Entities.Property
            {
                Id = 1,
                Name = "Test Property",
                AddressLine1 = "123",
                City = "C",
                State = "S",
                Zip = "Z",
                Country = "X"
            });
            dbCtx.SaveChanges();


            var service = new UnitService(dbCtx, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var created = await service.CreateAsync(dto, Actor);

            // Assert
            created.Should().NotBeNull();
            created.Id.Should().Be(42);

            _unitRepoMock.Verify(r => r.AddAsync(It.Is<Unit>(u => u.UnitNumber == "101")), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _auditMock.Verify(a => a.WriteAsync(Actor, "Created", nameof(Unit), 42, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_ReturnsNull_WhenNotFound()
        {
            // Arrange
            _unitRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Unit?)null);

            var ctx = CreateInMemoryContext(nameof(UpdateAsync_ReturnsNull_WhenNotFound));
            var service = new UnitService(ctx, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            var dto = new UnitUpdateDto { PropertyId = 1, UnitNumber = "X" };

            // Act
            var res = await service.UpdateAsync(999, dto, Actor);

            // Assert
            res.Should().BeNull();
            _auditMock.Verify(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task UpdateAsync_Updates_WhenExists()
        {
            // Arrange
            var existing = new Unit { Id = 10, PropertyId = 1, UnitNumber = "10A" };

            _unitRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);

            _mapperMock.Setup(m => m.Map(It.IsAny<UnitUpdateDto>(), It.IsAny<Unit>()))
                .Callback((UnitUpdateDto src, Unit dest) =>
                {
                    dest.UnitNumber = src.UnitNumber;
                });

            _mapperMock.Setup(m => m.Map<UnitReadDto>(It.IsAny<Unit>()))
                .Returns((Unit u) => new UnitReadDto { Id = u.Id, UnitNumber = u.UnitNumber });

            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var ctx = CreateInMemoryContext(nameof(UpdateAsync_Updates_WhenExists));
            var service = new UnitService(ctx, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            var dto = new UnitUpdateDto { PropertyId = 1, UnitNumber = "10B" };

            // Act
            var updated = await service.UpdateAsync(existing.Id, dto, Actor);

            // Assert
            updated.Should().NotBeNull();
            updated!.UnitNumber.Should().Be("10B");

            _auditMock.Verify(a => a.WriteAsync(Actor, "Updated", nameof(Unit), existing.Id, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_Removes_WhenExists()
        {
            // Arrange
            var existing = new Unit { Id = 55, PropertyId = 1, UnitNumber = "DEL" };

            _unitRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);
            _unitRepoMock.Setup(r => r.Remove(It.IsAny<Unit>()));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var ctx = CreateInMemoryContext(nameof(DeleteAsync_Removes_WhenExists));
            var service = new UnitService(ctx, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var ok = await service.DeleteAsync(existing.Id, Actor);

            // Assert
            ok.Should().BeTrue();
            _auditMock.Verify(a => a.WriteAsync(Actor, "Deleted", nameof(Unit), existing.Id, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_ReturnsFalse_WhenNotFound()
        {
            // Arrange
            _unitRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Unit?)null);

            var ctx = CreateInMemoryContext(nameof(DeleteAsync_ReturnsFalse_WhenNotFound));
            var service = new UnitService(ctx, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var ok = await service.DeleteAsync(999, Actor);

            // Assert
            ok.Should().BeFalse();
            _auditMock.Verify(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>()), Times.Never);
        }
    }
}
