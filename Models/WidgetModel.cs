// Models/WidgetModel.cs
namespace demo.Models;

public class WidgetConfig
{
public int Id { get; set; }
    public string WidgetId { get; set; } = "";
    public string Type { get; set; } = "";      
    public int X { get; set; }
    public int Y { get; set; }
    public int W { get; set; }
    public int H { get; set; }
    public string Title { get; set; } = "";
    public string ChartType { get; set; } = "bar";
    public string ChartDataSource { get; set; } = "";
    public string Background { get; set; } = "lightblue";
    public string Text { get; set; } = "";
}