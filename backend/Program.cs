using System.Text;
using AutoMapper;
using backend.Data;
using backend.Data.Seed;
using backend.Mapping;
using backend.Middleware;
using backend.Repositories.Ef;
using backend.Repositories.Interfaces;
using backend.Services.Auth;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Security;

var builder = WebApplication.CreateBuilder(args);

// 1) Configuration
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
builder.Services.AddSingleton(jwtOptions);

// 2) DbContext (SQLite)
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// 3) AutoMapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<MappingProfile>();
});

// 4) FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<backend.Validators.Auth.RegisterRequestValidator>();

// 5) Auth / JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // dev only
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });


// ...
builder.Services.AddAuthorization(options =>
{
    Policies.AddRolePolicies(options);
});

// 6) CORS
const string FrontendCors = "FrontendCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 7) Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Rental Management API", Version = "v1" });
    var jwtSecurityScheme = new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Description = "Put **_ONLY_** your JWT Bearer token here",
        Reference = new Microsoft.OpenApi.Models.OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme
        }
    };
    c.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

// 8) Controllers
builder.Services.AddControllers();

// 9) DI for Repos & Services
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IUnitService, UnitService>();
builder.Services.AddScoped<ITenantService, TenantService>();

var app = builder.Build();

// Middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(FrontendCors);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// DB migrate + seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await SeedData.InitializeAsync(db, hasher);
}

await app.RunAsync();
