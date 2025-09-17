using AutoMapper;
using FluentAssertions;
using Moq;
using backend.Data;
using backend.Domain.Entities;
using backend.Dtos.Maintenance;
using backend.Repositories.Interfaces;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Services
{
    public class MaintenanceServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IAuditLogService> _auditMock = new();

        private const string Actor = "unittest";

        private static AppDbContext CreateInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AppDbContext(options);
        }

        /// <summary>
        /// Provides a real AutoMapper configuration so ProjectTo<> works
        /// </summary>
        private static IMapper CreateRealMapper()
        {
            var config = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<MaintenanceRequest, MaintenanceReadDto>();
                cfg.CreateMap<MaintenanceCreateDto, MaintenanceRequest>();
                cfg.CreateMap<MaintenanceUpdateDto, MaintenanceRequest>();
            });
            return config.CreateMapper();
        }

        [Fact]
        public async Task CreateAsync_AddsRequest_SavesAndLogs()
        {
            var db = CreateInMemoryContext(nameof(CreateAsync_AddsRequest_SavesAndLogs));
            db.Properties.Add(new backend.Domain.Entities.Property
            {
                Id = 1,
                Name = "Test Property",
                AddressLine1 = "123",
                City = "C",
                State = "S",
                Zip = "Z",
                Country = "X"
            });
            db.SaveChanges();

            var repoMock = new Mock<IGenericRepository<MaintenanceRequest>>();
            _uowMock.Setup(u => u.GetRepository<MaintenanceRequest>()).Returns(repoMock.Object);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _auditMock.Setup(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(),
                                               It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>()))
                      .Returns(Task.CompletedTask);

            var mapper = CreateRealMapper();
            var service = new MaintenanceService(db, _uowMock.Object, mapper, _auditMock.Object);

            var dto = new MaintenanceCreateDto
            {
                PropertyId = 1,
                Title = "Broken AC",
                Description = "AC not cooling"
            };

            var created = await service.CreateAsync(dto, Actor);

            created.Should().NotBeNull();
            created.Title.Should().Be("Broken AC");

            repoMock.Verify(r => r.AddAsync(It.IsAny<MaintenanceRequest>()), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _auditMock.Verify(a => a.WriteAsync(Actor, "Created", nameof(MaintenanceRequest),
                                                It.IsAny<int>(), "Broken AC"), Times.Once);
        }

        [Fact]
        public async Task GetAsync_ReturnsFilteredResults()
        {
            var db = CreateInMemoryContext(nameof(GetAsync_ReturnsFilteredResults));
            db.MaintenanceRequests.Add(new MaintenanceRequest { Id = 1, PropertyId = 1, Title = "Leak" });
            db.MaintenanceRequests.Add(new MaintenanceRequest { Id = 2, PropertyId = 2, Title = "AC Issue" });
            db.SaveChanges();

            var mapper = CreateRealMapper();
            var service = new MaintenanceService(db, _uowMock.Object, mapper, _auditMock.Object);

            var results = await service.GetAsync(propertyId: 1);

            results.Should().ContainSingle(r => r.Title == "Leak");
        }

        [Fact]
        public async Task GetById_ReturnsNull_WhenMissing()
        {
            var db = CreateInMemoryContext(nameof(GetById_ReturnsNull_WhenMissing));

            var mapper = CreateRealMapper();
            var service = new MaintenanceService(db, _uowMock.Object, mapper, _auditMock.Object);

            var result = await service.GetByIdAsync(999);

            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateAsync_Updates_WhenExists()
        {
            var db = CreateInMemoryContext(nameof(UpdateAsync_Updates_WhenExists));

            var existing = new MaintenanceRequest { Id = 10, PropertyId = 1, Title = "Old" };
            db.MaintenanceRequests.Add(existing);
            db.SaveChanges();

            var repoMock = new Mock<IGenericRepository<MaintenanceRequest>>();
            repoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);
            _uowMock.Setup(u => u.GetRepository<MaintenanceRequest>()).Returns(repoMock.Object);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var mapper = CreateRealMapper();
            var service = new MaintenanceService(db, _uowMock.Object, mapper, _auditMock.Object);

            var dto = new MaintenanceUpdateDto { Title = "Updated", Description = "Fixed", Priority = Domain.Enums.MaintenancePriority.Low, Status = Domain.Enums.MaintenanceStatus.InProgress };

            var updated = await service.UpdateAsync(existing.Id, dto, Actor);

            updated.Should().NotBeNull();
            updated!.Title.Should().Be("Updated");
        }

        [Fact]
        public async Task DeleteAsync_Removes_WhenExists()
        {
            var db = CreateInMemoryContext(nameof(DeleteAsync_Removes_WhenExists));

            var existing = new MaintenanceRequest { Id = 20, PropertyId = 1, Title = "DeleteMe" };
            db.MaintenanceRequests.Add(existing);
            db.SaveChanges();

            var repoMock = new Mock<IGenericRepository<MaintenanceRequest>>();
            repoMock.Setup(r => r.GetByIdAsync(existing.Id)).ReturnsAsync(existing);
            _uowMock.Setup(u => u.GetRepository<MaintenanceRequest>()).Returns(repoMock.Object);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var mapper = CreateRealMapper();
            var service = new MaintenanceService(db, _uowMock.Object, mapper, _auditMock.Object);

            var ok = await service.DeleteAsync(existing.Id, Actor);

            ok.Should().BeTrue();
            repoMock.Verify(r => r.Remove(It.IsAny<MaintenanceRequest>()), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_ReturnsFalse_WhenNotFound()
        {
            var db = CreateInMemoryContext(nameof(DeleteAsync_ReturnsFalse_WhenNotFound));

            var repoMock = new Mock<IGenericRepository<MaintenanceRequest>>();
            repoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((MaintenanceRequest?)null);
            _uowMock.Setup(u => u.GetRepository<MaintenanceRequest>()).Returns(repoMock.Object);

            var mapper = CreateRealMapper();
            var service = new MaintenanceService(db, _uowMock.Object, mapper, _auditMock.Object);

            var ok = await service.DeleteAsync(999, Actor);

            ok.Should().BeFalse();
        }
    }
}
