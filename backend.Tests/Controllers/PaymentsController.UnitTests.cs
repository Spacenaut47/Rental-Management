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
using backend.Dtos.Payments;
using backend.Services.Interfaces;
using Xunit;

namespace backend.Tests.Controllers
{
    public class PaymentsControllerUnitTests
    {
        private readonly Mock<IPaymentService> _serviceMock = new();
        private readonly Mock<IValidator<PaymentCreateDto>> _validatorMock = new();

        private PaymentsController CreateController(string actor = "testuser")
        {
            var controller = new PaymentsController(_serviceMock.Object, _validatorMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, actor) }, "mock"));
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };

            return controller;
        }

        [Fact]
        public async Task GetForLease_ReturnsOk_WithPayments()
        {
            // Arrange
            var payments = new List<PaymentReadDto> { new() { Id = 1, LeaseId = 1, Amount = 100m } };
            _serviceMock.Setup(s => s.GetForLeaseAsync(1)).ReturnsAsync(payments);

            var controller = CreateController();

            // Act
            var result = await controller.GetForLease(1);

            // Assert
            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().BeEquivalentTo(payments);
        }

        [Fact]
        public async Task GetTotalPaid_ReturnsOk_WithTotal()
        {
            _serviceMock.Setup(s => s.GetTotalPaidAsync(1)).ReturnsAsync(123.45m);

            var controller = CreateController();

            var result = await controller.GetTotalPaid(1);

            var ok = result.Result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.Value.Should().Be(123.45m);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenValidationFails()
        {
            var dto = new PaymentCreateDto { LeaseId = 1, Amount = -1m };
            _validatorMock.Setup(v => v.ValidateAsync(dto, default))
                .ReturnsAsync(new ValidationResult(new[] { new ValidationFailure("Amount", "Invalid") }));

            var controller = CreateController();

            var result = await controller.Create(dto);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Create_ReturnsCreatedAtAction_WhenValid()
        {
            var dto = new PaymentCreateDto { LeaseId = 1, Amount = 100m };
            var created = new PaymentReadDto { Id = 7, LeaseId = 1, Amount = 100m };

            _validatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new ValidationResult());
            _serviceMock.Setup(s => s.CreateAsync(dto, "testuser")).ReturnsAsync(created);

            var controller = CreateController();

            var result = await controller.Create(dto);

            var createdAt = result.Result as CreatedAtActionResult;
            createdAt.Should().NotBeNull();
            createdAt!.ActionName.Should().Be(nameof(PaymentsController.GetForLease));
            createdAt.Value.Should().BeEquivalentTo(created);
        }
    }
}
