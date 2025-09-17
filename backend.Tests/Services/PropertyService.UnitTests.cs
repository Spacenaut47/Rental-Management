// backend.Tests/Services/PropertyService.UnitTests.cs
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using backend.Domain.Entities;
using backend.Dtos.Properties;
using backend.Repositories.Interfaces;
using backend.Services.Implementations;
using Xunit;

namespace backend.Tests.Services.UnitTests
{
    public class PropertyServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IGenericRepository<Property>> _propRepoMock = new();
        private readonly Mock<IMapper> _mapperMock = new();

        public PropertyServiceUnitTests()
        {
            _uowMock.Setup(u => u.Properties).Returns(_propRepoMock.Object);
        }

        // Create a minimal (unused) AppDbContext instance. We only pass it because PropertyService
        // requires one; the unit-tested methods don't use the context when mocks are set correctly.
        private static backend.Data.AppDbContext CreateUnusedContext()
        {
            var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<backend.Data.AppDbContext>()
                .Options;
            return new backend.Data.AppDbContext(options);
        }

        [Fact]
        public async Task CreateAsync_Maps_AddsAndSaves_ReturnsReadDto()
        {
            // Arrange
            var dto = new PropertyCreateDto
            {
                Name = "UnitTestProp",
                AddressLine1 = "Addr",
                City = "C",
                State = "S",
                Zip = "Z",
                Country = "X"
            };

            _mapperMock.Setup(m => m.Map<Property>(It.IsAny<PropertyCreateDto>()))
                .Returns((PropertyCreateDto c) => new Property
                {
                    Name = c.Name,
                    AddressLine1 = c.AddressLine1,
                    City = c.City,
                    State = c.State,
                    Zip = c.Zip,
                    Country = c.Country
                });

            _mapperMock.Setup(m => m.Map<PropertyReadDto>(It.IsAny<Property>()))
                .Returns((Property p) => new PropertyReadDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    AddressLine1 = p.AddressLine1,
                    City = p.City,
                    State = p.State,
                    Zip = p.Zip,
                    Country = p.Country
                });

            _propRepoMock.Setup(r => r.AddAsync(It.IsAny<Property>())).Returns(Task.CompletedTask);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var ctx = CreateUnusedContext();
            var service = new PropertyService(ctx, _uowMock.Object, _mapperMock.Object);

            // Act
            var created = await service.CreateAsync(dto);

            // Assert
            created.Should().NotBeNull();
            created.Name.Should().Be(dto.Name);

            _propRepoMock.Verify(r => r.AddAsync(It.Is<Property>(p => p.Name == dto.Name)), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _mapperMock.Verify(m => m.Map<Property>(It.IsAny<PropertyCreateDto>()), Times.Once);
            _mapperMock.Verify(m => m.Map<PropertyReadDto>(It.IsAny<Property>()), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_ReturnsNull_WhenNotFound()
        {
            // Arrange
            const int missingId = 999;
            _propRepoMock.Setup(r => r.GetByIdAsync(missingId)).ReturnsAsync((Property?)null);

            var ctx = CreateUnusedContext();
            var service = new PropertyService(ctx, _uowMock.Object, _mapperMock.Object);

            var dto = new PropertyUpdateDto
            {
                Name = "Nope",
                AddressLine1 = "A",
                City = "C",
                State = "S",
                Zip = "Z",
                Country = "X"
            };

            // Act
            var res = await service.UpdateAsync(missingId, dto);

            // Assert
            res.Should().BeNull();
            _propRepoMock.Verify(r => r.GetByIdAsync(missingId), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdateAsync_Updates_WhenExists()
        {
            // Arrange
            var existing = new Property
            {
                Id = 10,
                Name = "OldName",
                AddressLine1 = "OldAddr",
                City = "OldCity",
                State = "OS",
                Zip = "OZ",
                Country = "OX"
            };

            _propRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);

            _mapperMock.Setup(m => m.Map(It.IsAny<PropertyUpdateDto>(), It.IsAny<Property>()))
                .Callback((PropertyUpdateDto src, Property dest) =>
                {
                    dest.Name = src.Name;
                    dest.AddressLine1 = src.AddressLine1;
                    dest.City = src.City;
                    dest.State = src.State;
                    dest.Zip = src.Zip;
                    dest.Country = src.Country;
                });

            _mapperMock.Setup(m => m.Map<PropertyReadDto>(It.IsAny<Property>()))
                .Returns((Property p) => new PropertyReadDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    AddressLine1 = p.AddressLine1,
                    City = p.City,
                    State = p.State,
                    Zip = p.Zip,
                    Country = p.Country
                });

            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var ctx = CreateUnusedContext();
            var service = new PropertyService(ctx, _uowMock.Object, _mapperMock.Object);

            var dto = new PropertyUpdateDto
            {
                Name = "NewName",
                AddressLine1 = existing.AddressLine1,
                City = existing.City,
                State = existing.State,
                Zip = existing.Zip,
                Country = existing.Country
            };

            // Act
            var updated = await service.UpdateAsync(existing.Id, dto);

            // Assert
            updated.Should().NotBeNull();
            updated!.Name.Should().Be("NewName");

            _propRepoMock.Verify(r => r.GetByIdAsync(existing.Id), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _mapperMock.Verify(m => m.Map(dto, existing), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_RemovesAndSaves_WhenExists()
        {
            // Arrange
            var existing = new Property
            {
                Id = 55,
                Name = "ToDelete",
                AddressLine1 = "Addr",
                City = "C",
                State = "S",
                Zip = "Z",
                Country = "X"
            };

            _propRepoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);
            _propRepoMock.Setup(r => r.Remove(It.IsAny<Property>()));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var ctx = CreateUnusedContext();
            var service = new PropertyService(ctx, _uowMock.Object, _mapperMock.Object);

            // Act
            var ok = await service.DeleteAsync(existing.Id);

            // Assert
            ok.Should().BeTrue();
            _propRepoMock.Verify(r => r.GetByIdAsync(existing.Id), Times.Once);
            _propRepoMock.Verify(r => r.Remove(It.Is<Property>(p => p.Id == existing.Id)), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_ReturnsFalse_WhenMissing()
        {
            // Arrange
            _propRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Property?)null);

            var ctx = CreateUnusedContext();
            var service = new PropertyService(ctx, _uowMock.Object, _mapperMock.Object);

            // Act
            var ok = await service.DeleteAsync(999);

            // Assert
            ok.Should().BeFalse();
            _propRepoMock.Verify(r => r.GetByIdAsync(999), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }
    }
}
