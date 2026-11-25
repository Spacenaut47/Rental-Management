using System.Text.Json;
using FluentValidation;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var (status, reason, message) = ex switch
            {
                ValidationException validationEx => (400, "Bad request", string.Join(" ", validationEx.Errors.Select(e => e.ErrorMessage))),
                ArgumentException argEx => (400, "Bad request", argEx.Message),
                InvalidOperationException opEx => (409, "Conflict", opEx.Message),
                UnauthorizedAccessException => (403, "Forbidden", "You are not authorized for this operation."),
                KeyNotFoundException => (404, "Not found", "The requested resource was not found."),
                DbUpdateConcurrencyException => (409, "Conflict", "The resource was modified by another request."),
                DbUpdateException dbEx when IsConstraintConflict(dbEx) => (409, "Conflict", "The operation conflicts with existing data."),
                DbUpdateException => (500, "Internal server error", "A database error occurred."),
                _ => (500, "Internal server error", "An unexpected error occurred.")
            };

            var logLevel = status is >= 500 ? LogLevel.Error : LogLevel.Warning;
            _logger.Log(logLevel, ex, "Unhandled exception");

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";

            var payload = new { title = reason, detail = message, status };
            var json = JsonSerializer.Serialize(payload);

            await context.Response.WriteAsync(json);
        }
    }

    private static bool IsConstraintConflict(DbUpdateException exception)
        => exception.InnerException is SqliteException { SqliteErrorCode: 19 };
}
