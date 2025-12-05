using AuthApiMinimal.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthApiMinimal.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Info> Infos => Set<Info>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Info>()
            .HasOne(i => i.User)
            .WithMany(u => u.Infos)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
