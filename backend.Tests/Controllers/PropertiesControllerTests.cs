using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using backend.Controllers;
using backend.Dtos.Properties;
using backend.Services.Interfaces;
using Xunit;

namespace backend.Tests.Controllers;

public class PropertiesControllerTests
{
    [Fact]
    public async Task GetAll_ReturnsOk_WithList()
    {
        // Arrange
        var mock = new Mock<IPropertyService>();
        mock.Setup(s => s.GetAllAsync()).ReturnsAsync(new List<PropertyReadDto>
        {
            new PropertyReadDto { Id = 1, Name = "P1", AddressLine1 = "A1", City = "C", State = "S", Zip = "Z", Country = "X" }
        });

        var controller = new PropertiesController(mock.Object);

        // Act
        var result = await controller.GetAll();

        // Assert
        var ok = result.Result as OkObjectResult;
        ok.Should().NotBeNull();
        ((IEnumerable<PropertyReadDto>)ok!.Value!).Should().HaveCount(1);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenNull()
    {
        // Arrange
        var mock = new Mock<IPropertyService>();
        mock.Setup(s => s.GetByIdAsync(5)).ReturnsAsync((PropertyReadDto?)null);

        var controller = new PropertiesController(mock.Object);

        // Act
        var result = await controller.GetById(5);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        // Arrange
        var input = new PropertyCreateDto
        {
            Name = "C1",
            AddressLine1 = "A",
            City = "C",
            State = "S",
            Zip = "Z",
            Country = "X"
        };

        var created = new PropertyReadDto { Id = 42, Name = input.Name, AddressLine1 = input.AddressLine1, City = input.City, State = input.State, Zip = input.Zip, Country = input.Country };

        var mock = new Mock<IPropertyService>();
        mock.Setup(s => s.CreateAsync(It.IsAny<PropertyCreateDto>())).ReturnsAsync(created);

        var controller = new PropertiesController(mock.Object);

        // Act
        var result = await controller.Create(input);

        // Assert
        var createdAt = result.Result as CreatedAtActionResult;
        createdAt.Should().NotBeNull();
        createdAt!.RouteValues!["id"].Should().Be(created.Id);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_OnSuccess()
    {
        // Arrange
        var mock = new Mock<IPropertyService>();
        mock.Setup(s => s.DeleteAsync(7)).ReturnsAsync(true);

        var controller = new PropertiesController(mock.Object);

        // Act
        var result = await controller.Delete(7);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_OnMissing()
    {
        // Arrange
        var mock = new Mock<IPropertyService>();
        mock.Setup(s => s.DeleteAsync(8)).ReturnsAsync(false);

        var controller = new PropertiesController(mock.Object);

        // Act
        var result = await controller.Delete(8);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }
}
