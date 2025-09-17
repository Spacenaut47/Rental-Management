using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using backend.Domain.Entities;
using backend.Dtos.Payments;
using backend.Repositories.Interfaces;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Services
{
    public class PaymentServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IGenericRepository<Payment>> _paymentRepoMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly Mock<IAuditLogService> _auditMock = new();

        private const string Actor = "unittest";

        public PaymentServiceUnitTests()
        {
            _uowMock.Setup(u => u.GetRepository<Payment>()).Returns(_paymentRepoMock.Object);

            // default audit behavior
            _auditMock.Setup(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>()))
                .Returns(Task.CompletedTask);
        }

        private static backend.Data.AppDbContext CreateInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<backend.Data.AppDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;
            return new backend.Data.AppDbContext(options);
        }

        [Fact]
        public async Task CreateAsync_Succeeds_WhenLeaseExistsAndActive_AndAmountPositive()
        {
            // Arrange
            var dto = new PaymentCreateDto { LeaseId = 1, Amount = 500m, Method = backend.Domain.Enums.PaymentMethod.Cash };
            var paymentEntity = new Payment { Id = 11, LeaseId = dto.LeaseId, Amount = dto.Amount };

            // In-memory DB: seed an active lease
            var db = CreateInMemoryContext(nameof(CreateAsync_Succeeds_WhenLeaseExistsAndActive_AndAmountPositive));
            db.Leases.Add(new Lease { Id = 1, UnitId = 1, TenantId = 1, StartDateUtc = DateTime.UtcNow.AddMonths(-1), EndDateUtc = DateTime.UtcNow.AddMonths(11), IsActive = true });
            db.SaveChanges();

            // mapper behaviour
            _mapperMock.Setup(m => m.Map<Payment>(It.IsAny<PaymentCreateDto>())).Returns(paymentEntity);
            _mapperMock.Setup(m => m.Map<PaymentReadDto>(It.IsAny<Payment>())).Returns(new PaymentReadDto { Id = 11, LeaseId = 1, Amount = 500m });

            // repo/save behaviors
            _paymentRepoMock.Setup(r => r.AddAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var service = new PaymentService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var created = await service.CreateAsync(dto, Actor);

            // Assert
            created.Should().NotBeNull();
            created.Id.Should().Be(11);
            _paymentRepoMock.Verify(r => r.AddAsync(It.Is<Payment>(p => p.Amount == dto.Amount && p.LeaseId == dto.LeaseId)), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _auditMock.Verify(a => a.WriteAsync(Actor, "Created", nameof(Payment), 11, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_Throws_WhenLeaseMissing()
        {
            // Arrange: empty DB (no lease)
            var dto = new PaymentCreateDto { LeaseId = 99, Amount = 100m };
            var db = CreateInMemoryContext(nameof(CreateAsync_Throws_WhenLeaseMissing));

            var service = new PaymentService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            Func<Task> act = () => service.CreateAsync(dto, Actor);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>().WithMessage("Lease does not exist.");
        }

        [Fact]
        public async Task CreateAsync_Throws_WhenLeaseInactive()
        {
            // Arrange: seed inactive lease
            var dto = new PaymentCreateDto { LeaseId = 2, Amount = 100m };
            var db = CreateInMemoryContext(nameof(CreateAsync_Throws_WhenLeaseInactive));
            db.Leases.Add(new Lease { Id = 2, UnitId = 1, TenantId = 1, IsActive = false, StartDateUtc = DateTime.UtcNow.AddMonths(-2), EndDateUtc = DateTime.UtcNow.AddMonths(1) });
            db.SaveChanges();

            var service = new PaymentService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            Func<Task> act = () => service.CreateAsync(dto, Actor);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("Cannot record payment on inactive lease.");
        }

        [Fact]
        public async Task CreateAsync_Throws_WhenAmountNotPositive()
        {
            // Arrange: active lease but zero amount
            var dto = new PaymentCreateDto { LeaseId = 3, Amount = 0m };
            var db = CreateInMemoryContext(nameof(CreateAsync_Throws_WhenAmountNotPositive));
            db.Leases.Add(new Lease { Id = 3, UnitId = 1, TenantId = 1, IsActive = true, StartDateUtc = DateTime.UtcNow.AddMonths(-1), EndDateUtc = DateTime.UtcNow.AddMonths(1) });
            db.SaveChanges();

            var service = new PaymentService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            Func<Task> act = () => service.CreateAsync(dto, Actor);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>().WithMessage("Amount must be positive.");
        }

        [Fact]
        public async Task GetTotalPaidAsync_ReturnsSum_OfPayments()
        {
            // Arrange: seed payments
            var db = CreateInMemoryContext(nameof(GetTotalPaidAsync_ReturnsSum_OfPayments));
            db.Payments.Add(new Payment { Id = 1, LeaseId = 5, Amount = 100m });
            db.Payments.Add(new Payment { Id = 2, LeaseId = 5, Amount = 250.75m });
            db.Payments.Add(new Payment { Id = 3, LeaseId = 9, Amount = 50m }); // different lease
            db.SaveChanges();

            var service = new PaymentService(db, _uowMock.Object, _mapperMock.Object, _auditMock.Object);

            // Act
            var total = await service.GetTotalPaidAsync(5);

            // Assert
            total.Should().Be(350.75m);
        }
    }
}
