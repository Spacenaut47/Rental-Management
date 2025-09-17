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
using backend.Dtos.Units;
using backend.Services.Interfaces;
using Xunit;

namespace backend.Tests.Controllers
{
    public class UnitsControllerUnitTests
    {
        private readonly Mock<IUnitService> _serviceMock = new();
        private readonly Mock<IValidator<UnitCreateDto>> _validatorMock = new();

        private UnitsController CreateController(string actor = "testuser")
        {
            var controller = new UnitsController(_serviceMock.Object, _validatorMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, actor)
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        [Fact]
        public async Task GetAll_ReturnsOk_WithUnits()
        {
            var units = new List<UnitReadDto> { new() { Id = 1, UnitNumber = "101" } };
            _serviceMock.Setup(s => s.GetAllAsync(null)).ReturnsAsync(units);

            var controller = CreateController();

            var result = await controller.GetAll(null);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(units);
        }

        [Fact]
        public async Task GetById_ReturnsOk_WhenFound()
        {
            var unit = new UnitReadDto { Id = 1, UnitNumber = "101" };
            _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(unit);

            var controller = CreateController();

            var result = await controller.GetById(1);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(unit);
        }

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(42)).ReturnsAsync((UnitReadDto?)null);

            var controller = CreateController();

            var result = await controller.GetById(42);

            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenValidationFails()
        {
            var dto = new UnitCreateDto { PropertyId = 1, UnitNumber = "X" };
            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult(new[] { new ValidationFailure("UnitNumber", "Invalid") }));

            var controller = CreateController();

            var result = await controller.Create(dto);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Create_ReturnsCreatedAtAction_WhenValid()
        {
            var dto = new UnitCreateDto { PropertyId = 1, UnitNumber = "101" };
            var created = new UnitReadDto { Id = 1, UnitNumber = "101" };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.CreateAsync(dto, "testuser")).ReturnsAsync(created);

            var controller = CreateController();

            var result = await controller.Create(dto);

            var createdAt = result.Result as CreatedAtActionResult;
            createdAt.Should().NotBeNull();
            createdAt!.ActionName.Should().Be(nameof(UnitsController.GetById));
            createdAt.Value.Should().BeEquivalentTo(created);
        }

        [Fact]
        public async Task Update_ReturnsBadRequest_WhenValidationFails()
        {
            var dto = new UnitUpdateDto { PropertyId = 1, UnitNumber = "X" };
            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult(new[] { new ValidationFailure("UnitNumber", "Invalid") }));

            var controller = CreateController();

            var result = await controller.Update(1, dto);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Update_ReturnsOk_WhenUpdated()
        {
            var dto = new UnitUpdateDto { PropertyId = 1, UnitNumber = "202" };
            var updated = new UnitReadDto { Id = 1, UnitNumber = "202" };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new ValidationResult());
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
            var dto = new UnitUpdateDto { PropertyId = 1, UnitNumber = "X" };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.UpdateAsync(1, dto, "testuser")).ReturnsAsync((UnitReadDto?)null);

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
