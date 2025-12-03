using AuthApiMinimal.Data;
using AuthApiMinimal.Models;
using AuthApiMinimal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;

// DotNetEnv lataa .env-tiedoston (jos käytät)
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Ympäristömuuttujat
var connString = Environment.GetEnvironmentVariable("DEFAULT_CONNSTRING") 
                 ?? "Server=(localdb)\\MSSQLLocalDB;Database=AuthApiDb;Trusted_Connection=True;";

var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? "SUPER_SECRET_KEY_123";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "AuthApi";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "AuthApi";

// Palvelut
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(connString));

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowAll",
                      policy  =>
                      {
                          policy.AllowAnyOrigin()
                            .AllowAnyMethod()
                            .AllowAnyHeader();
                      });
});

builder.Services.AddScoped<JwtService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();


var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseCors("AllowAll");

// Routes
app.MapPost("/api/users/register", async (AppDbContext db, RegisterRequest req) =>
{
    if (db.Users.Any(u => u.Email == req.Email))
        return Results.BadRequest("Email already registered");

    var user = new AppUser
    {
        Email = req.Email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Ok("User registered");
});

app.MapPost("/api/users/login", async (AppDbContext db, JwtService jwt, LoginRequest req) =>
{
    var user = db.Users.SingleOrDefault(u => u.Email == req.Email);
    if (user == null) return Results.BadRequest("Invalid credentials");

    if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        return Results.BadRequest("Invalid credentials");

    var token = jwt.GenerateToken(user);
    return Results.Ok(new { token });
});

app.MapGet("/api/secret", [Authorize] () =>
{
    return Results.Ok("Tämä on salainen tieto vain kirjautuneille!");
});

app.MapDelete("/api/users/delete", [Authorize] async (AppDbContext db, HttpContext context) =>
{
    var userEmail = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (string.IsNullOrEmpty(userEmail))
        return Results.Unauthorized();

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);

    if (user == null)
        return Results.NotFound("User not found");

    db.Users.Remove(user);
    await db.SaveChangesAsync();

    return Results.Ok("Account deleted successfully.");
});


app.Run();

public record RegisterRequest(string Email, string Password);
public record LoginRequest(string Email, string Password);