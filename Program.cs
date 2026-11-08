using AuthApiMinimal.Data;
using AuthApiMinimal.Models;
using AuthApiMinimal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Data;

// DotNetEnv lataa .env-tiedoston (jos käytät)
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Ympäristömuuttujat
var connString = Environment.GetEnvironmentVariable("DEFAULT_CONNSTRING") 
                 ?? "Server=(localdb)\\MSSQLLocalDB;Database=AuthApiDb;Trusted_Connection=True;";

var jwtKey = builder.Configuration["JWT_KEY"]
    ?? throw new InvalidOperationException("The JWT_KEY environment variable is required.");
if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("The JWT_KEY environment variable must be at least 32 bytes long.");

var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? builder.Configuration["Jwt:Issuer"] ?? "AuthApi";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? builder.Configuration["Jwt:Audience"] ?? "AuthApi";

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
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
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
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors(myAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

const string RefreshCookieName = "refreshToken";
const int RefreshTokenLifetimeDays = 30;

void SetRefreshCookie(HttpContext context, string token, DateTimeOffset expiresAt)
{
    context.Response.Cookies.Append(RefreshCookieName, token, new CookieOptions
    {
        HttpOnly = true,
        Secure = !app.Environment.IsDevelopment(),
        SameSite = SameSiteMode.Lax,
        Path = "/api/users",
        Expires = expiresAt
    });
}

void ClearRefreshCookie(HttpContext context)
{
    context.Response.Cookies.Delete(RefreshCookieName, new CookieOptions
    {
        HttpOnly = true,
        Secure = !app.Environment.IsDevelopment(),
        SameSite = SameSiteMode.Lax,
        Path = "/api/users"
    });
}

static string HashRefreshToken(string token) =>
    Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

static string CreateRefreshToken() =>
    Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
        .TrimEnd('=')
        .Replace('+', '-')
        .Replace('/', '_');

async Task<(string Token, DateTimeOffset ExpiresAt)> SaveRefreshTokenAsync(
    AppDbContext db,
    int userId,
    CancellationToken cancellationToken)
{
    var token = CreateRefreshToken();
    var expiresAt = DateTimeOffset.UtcNow.AddDays(RefreshTokenLifetimeDays);

    db.RefreshTokens.Add(new RefreshToken
    {
        UserId = userId,
        TokenHash = HashRefreshToken(token),
        CreatedAtUtc = DateTimeOffset.UtcNow,
        ExpiresAtUtc = expiresAt
    });
    await db.SaveChangesAsync(cancellationToken);

    return (token, expiresAt);
}

// Routes
app.MapPost("/api/users/register", async (
    AppDbContext db,
    JwtService jwt,
    HttpContext context,
    RegisterRequest req,
    CancellationToken cancellationToken) =>
{
    if (await db.Users.AnyAsync(u => u.Email == req.Email, cancellationToken))
        return Results.BadRequest("Email already registered");

    var user = new AppUser
    {
        Email = req.Email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
    };

    db.Users.Add(user);
    await db.SaveChangesAsync(cancellationToken);

    var refreshToken = await SaveRefreshTokenAsync(db, user.Id, cancellationToken);
    SetRefreshCookie(context, refreshToken.Token, refreshToken.ExpiresAt);
    var token = jwt.GenerateToken(user);
    return Results.Ok(new { token });
});

app.MapPost("/api/users/login", async (
    AppDbContext db,
    JwtService jwt,
    HttpContext context,
    LoginRequest req,
    CancellationToken cancellationToken) =>
{
    var user = await db.Users.SingleOrDefaultAsync(u => u.Email == req.Email, cancellationToken);
    if (user == null) return Results.BadRequest("Invalid credentials");

    if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        return Results.BadRequest("Invalid credentials");

    var refreshToken = await SaveRefreshTokenAsync(db, user.Id, cancellationToken);
    SetRefreshCookie(context, refreshToken.Token, refreshToken.ExpiresAt);
    var token = jwt.GenerateToken(user);
    return Results.Ok(new { token });
});

app.MapPost("/api/users/refresh", async (
    AppDbContext db,
    JwtService jwt,
    HttpContext context,
    CancellationToken cancellationToken) =>
{
    var presentedToken = context.Request.Cookies[RefreshCookieName];
    if (string.IsNullOrEmpty(presentedToken))
    {
        ClearRefreshCookie(context);
        return Results.Unauthorized();
    }

    await using var transaction = await db.Database.BeginTransactionAsync(
        IsolationLevel.Serializable,
        cancellationToken);

    var now = DateTimeOffset.UtcNow;
    var presentedTokenHash = HashRefreshToken(presentedToken);
    var storedToken = await db.RefreshTokens
        .SingleOrDefaultAsync(
            token => token.TokenHash == presentedTokenHash,
            cancellationToken);

    if (storedToken is null || storedToken.RevokedAtUtc is not null || storedToken.ExpiresAtUtc <= now)
    {
        await transaction.RollbackAsync(cancellationToken);
        ClearRefreshCookie(context);
        return Results.Unauthorized();
    }

    var user = await db.Users.SingleOrDefaultAsync(
        candidate => candidate.Id == storedToken.UserId,
        cancellationToken);

    if (user is null)
    {
        storedToken.RevokedAtUtc = now;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        ClearRefreshCookie(context);
        return Results.Unauthorized();
    }

    storedToken.RevokedAtUtc = now;
    var replacementToken = CreateRefreshToken();
    var replacementExpiresAt = now.AddDays(RefreshTokenLifetimeDays);
    db.RefreshTokens.Add(new RefreshToken
    {
        UserId = user.Id,
        TokenHash = HashRefreshToken(replacementToken),
        CreatedAtUtc = now,
        ExpiresAtUtc = replacementExpiresAt
    });

    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);

    SetRefreshCookie(context, replacementToken, replacementExpiresAt);
    return Results.Ok(new { token = jwt.GenerateToken(user) });
});

app.MapPost("/api/users/logout", async (AppDbContext db, HttpContext context, CancellationToken cancellationToken) =>
{
    var presentedToken = context.Request.Cookies[RefreshCookieName];
    if (!string.IsNullOrEmpty(presentedToken))
    {
        var presentedTokenHash = HashRefreshToken(presentedToken);
        var storedToken = await db.RefreshTokens
            .SingleOrDefaultAsync(
                token => token.TokenHash == presentedTokenHash,
                cancellationToken);

        if (storedToken is not null && storedToken.RevokedAtUtc is null)
        {
            storedToken.RevokedAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    ClearRefreshCookie(context);
    return Results.NoContent();
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

app.MapGet("/api/search", [Authorize] async (AppDbContext db, HttpContext context, string keyword, int page, int pageSize) =>
{
    var userEmail = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
    if (user == null)
        return Results.NotFound("User not found");

    var totalCount = await db.Infos
        .Where(i => i.UserId == user.Id && i.Note.Contains(keyword))
        .CountAsync();
        
    var results = await db.Infos
        .Where(i => i.UserId == user.Id && i.Note.Contains(keyword))
        .OrderByDescending(i => i.Id)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new {
        TotalCount = totalCount,
        Items = results});
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
        .OrderByDescending(i => i.Id) // vaihtoehtoisesti voisi käyttää jonkinlaista createdAt-arvoa...
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
