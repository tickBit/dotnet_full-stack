using AuthApiMinimal.Data;
using AuthApiMinimal.Models;
using AuthApiMinimal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

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

var myAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(myAllowSpecificOrigins, policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors(myAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

// Routes
app.MapPost("/api/users/register", async (AppDbContext db, JwtService jwt, RegisterRequest req) =>
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

    var token = jwt.GenerateToken(user);
    return Results.Ok(new { token });
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

app.MapPost("/api/info", [Authorize] async (AppDbContext db, HttpContext context, InfoDto dto) =>
{
    var userEmail = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (userEmail == null)
        return Results.Unauthorized();

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
    if (user == null)
        return Results.NotFound("User not found");

    var info = new Info
    {
        Note = dto.Note,
        UserId = user.Id
    };

    db.Infos.Add(info);
    await db.SaveChangesAsync();

    return Results.Ok(info);
});


app.MapGet("/api/info", [Authorize] async (AppDbContext db, HttpContext context, int page = 1, int pageSize = 4) =>
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 4;
    
    var userEmail = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
    if (user == null)
        return Results.NotFound("User not found");

    var totalCount = await db.Infos
        .Where(i => i.UserId == user.Id)
        .CountAsync();

    var items = await db.Infos
        .Where(i => i.UserId == user.Id)
        .OrderBy(i => i.Id)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new
    {
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        Items = items
    });
});


app.MapPut("/api/info/{id}", [Authorize] async (int id, AppDbContext db, HttpContext context, InfoDto dto) =>
{
    var userEmail = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
    if (user == null)
        return Results.NotFound("User not found");

    var info = await db.Infos.FirstOrDefaultAsync(i => i.Id == id && i.UserId == user.Id);
    if (info == null)
        return Results.NotFound("Note not found or does not belong to user");

    info.Note = dto.Note;
    await db.SaveChangesAsync();

    return Results.Ok(info);
});

// delete note
app.MapDelete("/api/info/{id}", [Authorize] async (int id, AppDbContext db, HttpContext context) =>
{
    var userEmail = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
    if (user == null)
        return Results.NotFound("User not found");

    var info = await db.Infos.FirstOrDefaultAsync(i => i.Id == id && i.UserId == user.Id);
    if (info == null)
        return Results.NotFound("Note not found or does not belong to user");

    db.Remove(info);
    await db.SaveChangesAsync();

    return Results.Ok();
});

app.Run();

public record RegisterRequest(string Email, string Password);
public record LoginRequest(string Email, string Password);
public record InfoDto(string Note);
