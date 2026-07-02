// Services/WidgetService.cs
using Microsoft.EntityFrameworkCore;
using demo.Data;
using demo.Models;

namespace demo.Services;

public class WidgetService
{
    private readonly AppDbContext _db;

    public WidgetService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<WidgetConfig>> GetAllAsync()
        => await _db.Widgets.ToListAsync();

    public async Task<WidgetConfig?> GetByIdAsync(string widgetId)
        => await _db.Widgets.FirstOrDefaultAsync(w => w.WidgetId == widgetId);

    public async Task SaveWidgetAsync(WidgetConfig widget)
    {
        var existing = await _db.Widgets.FirstOrDefaultAsync(w => w.WidgetId == widget.WidgetId);

        if (existing == null)
            _db.Widgets.Add(widget);
        else
        {
            existing.X              = widget.X;
            existing.Y              = widget.Y;
            existing.W              = widget.W;
            existing.H              = widget.H;
            existing.Type           = widget.Type;
            existing.Title          = widget.Title;
            existing.ChartType      = widget.ChartType;
            existing.ChartDataSource = widget.ChartDataSource;
            existing.Background     = widget.Background;
            existing.Text           = widget.Text;
        }

        await _db.SaveChangesAsync();
    }

    public async Task RemoveWidgetAsync(string widgetId)
    {
        var widget = await _db.Widgets.FirstOrDefaultAsync(w => w.WidgetId == widgetId);
        if (widget != null)
        {
            _db.Widgets.Remove(widget);
            await _db.SaveChangesAsync();
        }
    }

    public async Task ClearAllWidgetsAsync()
    {
        _db.Widgets.RemoveRange(_db.Widgets);
        await _db.SaveChangesAsync();
    }
}
