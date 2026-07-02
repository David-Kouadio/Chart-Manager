using demo.Components;
using Microsoft.EntityFrameworkCore;
using demo.Data;
using demo.Services;
using demo.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddServerSideBlazor()
    .AddCircuitOptions(o => o.DetailedErrors = builder.Environment.IsDevelopment());

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=dashboard.db"));

builder.Services.AddScoped<WidgetService>();
builder.Services.AddScoped<ChartDataService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    db.Database.EnsureCreated();

    if (!db.Users.Any())
    {
        var rng = new Random(42);
        var today = DateTime.Today;
        var users = new List<User>();
        for (int m = -5; m <= 0; m++)
        {
            var baseDate = today.AddMonths(m);
            int count = rng.Next(3, 12);
            for (int i = 0; i < count; i++)
            {
                int day = rng.Next(1, DateTime.DaysInMonth(baseDate.Year, baseDate.Month) + 1);
                users.Add(new User
                {
                    Name = $"User {users.Count + 1}",
                    Registration = new DateTime(baseDate.Year, baseDate.Month, day)
                });
            }
        }
        db.Users.AddRange(users);
        db.SaveChanges();
    }

    if (!db.Orders.Any())
    {
        var rng = new Random(99);
        var today = DateTime.Today;
        var orders = new List<Order>();
        for (int m = -5; m <= 0; m++)
        {
            var baseDate = today.AddMonths(m);
            int count = rng.Next(5, 20);
            for (int i = 0; i < count; i++)
            {
                int day = rng.Next(1, DateTime.DaysInMonth(baseDate.Year, baseDate.Month) + 1);
                orders.Add(new Order
                {
                    Price = Math.Round(rng.NextDouble() * 490 + 10, 2),
                    Date  = new DateTime(baseDate.Year, baseDate.Month, day)
                });
            }
        }
        db.Orders.AddRange(orders);
        db.SaveChanges();
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();
app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
