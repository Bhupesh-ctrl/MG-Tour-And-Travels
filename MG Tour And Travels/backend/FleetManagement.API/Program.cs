using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using FleetManagement.Core.Entities;
using FleetManagement.Core.Enums;
using FleetManagement.Core.Interfaces;
using FleetManagement.Infrastructure.Data;
using FleetManagement.Infrastructure.Repositories;
using FleetManagement.Infrastructure.Services;
using FleetManagement.API.Claims;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add controllers
builder.Services.AddControllers();

// Add DbContext
builder.Services.AddDbContext<FleetDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("FleetConnection")));

// Add JWT Auth
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_fleet_management_key_123456789_secure_and_long_enough";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "FleetManagement",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "FleetManagementUsers",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Dependency Injection
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddTransient<IClaimsTransformation, SuperAdminClaimsTransformer>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',')
            ?? new[] { 
                "http://localhost:4200", 
                "https://kind-mushroom-0faabfb00.7.azurestaticapps.net",
                "https://mgtourandtravels.in",
                "https://www.mgtourandtravels.in"
            };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Swagger/OpenAPI setup with Bearer Auth
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Fleet Management API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Automatically apply migrations and seed admin user on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<FleetDbContext>();
        context.Database.Migrate();

        var hasher = services.GetRequiredService<IPasswordHasher>();
        if (!context.Users.Any(u => u.Role == UserRole.Admin))
        {
            var adminUser = new User
            {
                Username = "admin",
                Email = "admin@mgfleet.com",
                Phone = "9999999999",
                PasswordHash = hasher.HashPassword("Admin@123"),
                PasswordPlain = "Admin@123",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "System"
            };
            context.Users.Add(adminUser);
            context.SaveChanges();
            Log.Information("Default Admin user seeded successfully (username: admin, password: Admin@123).");
        }
        else
        {
            var existingAdmin = context.Users.FirstOrDefault(u => u.Username == "admin");
            if (existingAdmin != null && string.IsNullOrEmpty(existingAdmin.PasswordPlain))
            {
                existingAdmin.PasswordPlain = "Admin@123";
                context.Users.Update(existingAdmin);
                context.SaveChanges();
            }
        }

        var existingSuperAdmin = context.Users.FirstOrDefault(u => u.Username == "superadmin");
        if (existingSuperAdmin != null)
        {
            if (hasher.VerifyPassword("Super@123", existingSuperAdmin.PasswordHash))
            {
                existingSuperAdmin.PasswordHash = hasher.HashPassword("MgFleet#SuperAdmin!2026");
                existingSuperAdmin.PasswordPlain = "MgFleet#SuperAdmin!2026";
                context.Users.Update(existingSuperAdmin);
                context.SaveChanges();
                Log.Information("Default SuperAdmin password upgraded to secure 'MgFleet#SuperAdmin!2026' to prevent browser data breach warnings.");
            }
            else if (string.IsNullOrEmpty(existingSuperAdmin.PasswordPlain))
            {
                existingSuperAdmin.PasswordPlain = "MgFleet#SuperAdmin!2026";
                context.Users.Update(existingSuperAdmin);
                context.SaveChanges();
            }
        }
        else
        {
            var superAdminUser = new User
            {
                Username = "superadmin",
                Email = "superadmin@mgfleet.com",
                Phone = "8888888888",
                PasswordHash = hasher.HashPassword("MgFleet#SuperAdmin!2026"),
                PasswordPlain = "MgFleet#SuperAdmin!2026",
                Role = UserRole.SuperAdmin,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "System"
            };
            context.Users.Add(superAdminUser);
            context.SaveChanges();
            Log.Information("Default SuperAdmin user seeded successfully (username: superadmin, password: MgFleet#SuperAdmin!2026).");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred during database migration or seeding.");
    }
}

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Fleet Management API v1");
    });
}

app.UseCors("CorsPolicy");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Serve uploaded receipt files
var uploadPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
if (!Directory.Exists(uploadPath))
{
    Directory.CreateDirectory(uploadPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads"
});

app.MapControllers();

try
{
    Log.Information("Starting Fleet Management API host...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
