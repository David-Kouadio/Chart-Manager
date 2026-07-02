// Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using demo.Models;

namespace demo.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<WidgetConfig> Widgets { get; set; }
    public DbSet<ChartSource> ChartSources { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Order> Orders { get; set; }
}
