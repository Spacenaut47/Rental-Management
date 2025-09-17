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
using backend.Dtos.Tenants;
using backend.Services.Interfaces;
using Xunit;

namespace backend.Tests.Controllers
{
    public class TenantsControllerUnitTests
    {
        private readonly Mock<ITenantService> _serviceMock = new();
        private readonly Mock<IValidator<TenantCreateDto>> _validatorMock = new();

        private TenantsController CreateController(string actor = "testuser")
        {
            var controller = new TenantsController(_serviceMock.Object, _validatorMock.Object);

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
        public async Task GetAll_ReturnsOk_WithTenants()
        {
            // Arrange
            var tenants = new List<TenantReadDto>
            {
                new() { Id = 1, FirstName = "John", LastName = "Doe", Email = "j@doe.com" }
            };
            _serviceMock.Setup(s => s.GetAllAsync(null)).ReturnsAsync(tenants);

            var controller = CreateController();

            // Act
            var result = await controller.GetAll(null);

            // Assert
            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(tenants);
        }

        [Fact]
        public async Task GetById_ReturnsOk_WhenFound()
        {
            var tenant = new TenantReadDto { Id = 1, FirstName = "Jane", LastName = "Smith", Email = "jane@test.com" };
            _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(tenant);

            var controller = CreateController();

            var result = await controller.GetById(1);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(tenant);
        }

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            _serviceMock.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((TenantReadDto?)null);

            var controller = CreateController();

            var result = await controller.GetById(99);

            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenValidationFails()
        {
            var dto = new TenantCreateDto { FirstName = "X", LastName = "Y", Email = "bad" };
            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult(new[] { new ValidationFailure("Email", "Invalid") }));

            var controller = CreateController();

            var result = await controller.Create(dto);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Create_ReturnsCreatedAtAction_WhenValid()
        {
            var dto = new TenantCreateDto { FirstName = "John", LastName = "Doe", Email = "j@doe.com" };
            var created = new TenantReadDto { Id = 1, FirstName = "John", LastName = "Doe", Email = "j@doe.com" };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.CreateAsync(dto, "testuser")).ReturnsAsync(created);

            var controller = CreateController();

            var result = await controller.Create(dto);

            var createdAt = result.Result as CreatedAtActionResult;
            createdAt.Should().NotBeNull();
            createdAt!.ActionName.Should().Be(nameof(TenantsController.GetById));
            createdAt.Value.Should().BeEquivalentTo(created);
        }

        [Fact]
        public async Task Update_ReturnsBadRequest_WhenValidationFails()
        {
            var dto = new TenantUpdateDto { FirstName = "X", LastName = "Y", Email = "bad" };
            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult(new[] { new ValidationFailure("Email", "Invalid") }));

            var controller = CreateController();

            var result = await controller.Update(1, dto);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Update_ReturnsOk_WhenUpdated()
        {
            var dto = new TenantUpdateDto { FirstName = "Jane", LastName = "Smith", Email = "jane@test.com" };
            var updated = new TenantReadDto { Id = 1, FirstName = "Jane", LastName = "Smith", Email = "jane@test.com" };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult());
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
            var dto = new TenantUpdateDto { FirstName = "Jane", LastName = "Smith", Email = "jane@test.com" };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.UpdateAsync(1, dto, "testuser")).ReturnsAsync((TenantReadDto?)null);

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
