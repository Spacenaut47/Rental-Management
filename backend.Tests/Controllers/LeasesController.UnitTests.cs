using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using backend.Controllers;
using backend.Dtos.Leases;
using backend.Services.Interfaces;
using Xunit;

namespace backend.Tests.Controllers
{
    public class LeasesControllerUnitTests
    {
        private readonly Mock<ILeaseService> _serviceMock = new();
        private readonly Mock<IValidator<LeaseCreateDto>> _validatorMock = new();

        private LeasesController CreateController(string actor = "testuser")
        {
            var controller = new LeasesController(_serviceMock.Object, _validatorMock.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.Name, actor)
                    }, "mock"))
                }
            };
            return controller;
        }

        [Fact]
        public async Task GetAll_ReturnsOk_WithLeases()
        {
            var leases = new List<LeaseReadDto> { new() { Id = 1, UnitId = 1, TenantId = 1 } };
            _serviceMock.Setup(s => s.GetAllAsync(null, null, null)).ReturnsAsync(leases);

            var controller = CreateController();

            var result = await controller.GetAll(null, null, null);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(leases);
        }

        [Fact]
        public async Task GetById_ReturnsOk_WhenFound()
        {
            var lease = new LeaseReadDto { Id = 1, UnitId = 1, TenantId = 1 };
            _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(lease);

            var controller = CreateController();

            var result = await controller.GetById(1);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(lease);
        }

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((LeaseReadDto?)null);

            var controller = CreateController();

            var result = await controller.GetById(99);

            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenInvalid()
        {
            var dto = new LeaseCreateDto { UnitId = 1, TenantId = 1, StartDateUtc = DateTime.UtcNow, EndDateUtc = DateTime.UtcNow.AddMonths(1) };
            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult(new[] { new ValidationFailure("UnitId", "Invalid") }));

            var controller = CreateController();

            var result = await controller.Create(dto);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Create_ReturnsCreatedAtAction_WhenValid()
        {
            var dto = new LeaseCreateDto { UnitId = 1, TenantId = 1, StartDateUtc = DateTime.UtcNow, EndDateUtc = DateTime.UtcNow.AddMonths(1) };
            var created = new LeaseReadDto { Id = 1, UnitId = 1, TenantId = 1 };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.CreateAsync(dto, "testuser")).ReturnsAsync(created);

            var controller = CreateController();

            var result = await controller.Create(dto);

            var createdAt = result.Result as CreatedAtActionResult;
            createdAt.Should().NotBeNull();
            createdAt!.ActionName.Should().Be(nameof(LeasesController.GetById));
            createdAt.Value.Should().BeEquivalentTo(created);
        }

        [Fact]
        public async Task Update_ReturnsOk_WhenUpdated()
        {
            var dto = new LeaseUpdateDto { UnitId = 1, TenantId = 1, StartDateUtc = DateTime.UtcNow, EndDateUtc = DateTime.UtcNow.AddMonths(1) };
            var updated = new LeaseReadDto { Id = 1, UnitId = 1, TenantId = 1 };

            _validatorMock.Setup(v => v.ValidateAsync(It.IsAny<LeaseCreateDto>(), default)).ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.UpdateAsync(1, dto, "testuser")).ReturnsAsync(updated);

            var controller = CreateController();

            var result = await controller.Update(1, dto);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(updated);
        }

        [Fact]
        public async Task Update_ReturnsNotFound_WhenMissing()
        {
            var dto = new LeaseUpdateDto { UnitId = 1, TenantId = 1, StartDateUtc = DateTime.UtcNow, EndDateUtc = DateTime.UtcNow.AddMonths(1) };

            _validatorMock.Setup(v => v.ValidateAsync(It.IsAny<LeaseCreateDto>(), default)).ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.UpdateAsync(1, dto, "testuser")).ReturnsAsync((LeaseReadDto?)null);

            var controller = CreateController();

            var result = await controller.Update(1, dto);

            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task Delete_ReturnsNoContent_WhenDeleted()
        {
            _serviceMock.Setup(s => s.DeleteAsync(1, "testuser")).ReturnsAsync(true);

            var controller = CreateController();

            var result = await controller.Delete(1);

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.DeleteAsync(1, "testuser")).ReturnsAsync(false);

            var controller = CreateController();

            var result = await controller.Delete(1);

            result.Should().BeOfType<NotFoundResult>();
        }
    }
}
