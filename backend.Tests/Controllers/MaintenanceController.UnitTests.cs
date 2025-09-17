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
using backend.Dtos.Maintenance;
using backend.Services.Interfaces;
using Xunit;

namespace backend.Tests.Controllers
{
    public class MaintenanceControllerUnitTests
    {
        private readonly Mock<IMaintenanceService> _serviceMock = new();
        private readonly Mock<IValidator<MaintenanceCreateDto>> _validatorMock = new();

        private MaintenanceController CreateController(string actor = "testuser")
        {
            var controller = new MaintenanceController(_serviceMock.Object, _validatorMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, actor) }, "mock"));
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };

            return controller;
        }

        [Fact]
        public async Task Get_ReturnsOk_WithItems()
        {
            var items = new List<MaintenanceReadDto> { new() { Id = 1, PropertyId = 1, Title = "T1" } };
            _serviceMock.Setup(s => s.GetAsync(null, null, null)).ReturnsAsync(items);

            var controller = CreateController();

            var result = await controller.Get(null, null, null);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(items);
        }

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((MaintenanceReadDto?)null);

            var controller = CreateController();

            var result = await controller.GetById(99);

            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenInvalid()
        {
            var dto = new MaintenanceCreateDto { PropertyId = 1, Title = "" };
            _validatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new ValidationResult(new[] { new ValidationFailure("Title", "Required") }));

            var controller = CreateController();

            var result = await controller.Create(dto);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Create_ReturnsCreatedAtAction_WhenValid()
        {
            var dto = new MaintenanceCreateDto { PropertyId = 1, Title = "Fix" };
            var created = new MaintenanceReadDto { Id = 1, PropertyId = 1, Title = "Fix" };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.CreateAsync(dto, "testuser")).ReturnsAsync(created);

            var controller = CreateController();

            var result = await controller.Create(dto);

            var createdAt = result.Result as CreatedAtActionResult;
            createdAt.Should().NotBeNull();
            createdAt!.ActionName.Should().Be(nameof(MaintenanceController.GetById));
            createdAt.Value.Should().BeEquivalentTo(created);
        }

        [Fact]
        public async Task Update_ReturnsNotFound_WhenMissing()
        {
            var dto = new MaintenanceUpdateDto { Title = "X" };
            _serviceMock.Setup(s => s.UpdateAsync(1, dto, "testuser")).ReturnsAsync((MaintenanceReadDto?)null);

            var controller = CreateController();

            var result = await controller.Update(1, dto);

            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task Update_ReturnsOk_WhenUpdated()
        {
            var dto = new MaintenanceUpdateDto { Title = "X" };
            var updated = new MaintenanceReadDto { Id = 2, PropertyId = 1, Title = "X" };

            _serviceMock.Setup(s => s.UpdateAsync(2, dto, "testuser")).ReturnsAsync(updated);

            var controller = CreateController();

            var result = await controller.Update(2, dto);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(updated);
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
