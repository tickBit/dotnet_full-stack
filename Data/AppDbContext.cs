using AuthApiMinimal.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthApiMinimal.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Info> Infos => Set<Info>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Info>()
            .HasOne(i => i.User)
            .WithMany(u => u.Infos)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(token => token.TokenHash)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .Property(token => token.TokenHash)
            .HasMaxLength(64)
            .IsRequired();

        modelBuilder.Entity<RefreshToken>()
            .HasOne(token => token.User)
            .WithMany()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
