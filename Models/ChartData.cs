// Models/ChartData.cs
namespace demo.Models;

public class ChartData
{
    public string[] Labels { get; set; } = Array.Empty<string>();
    public double[] Data { get; set; } = Array.Empty<double>();
    public string Title { get; set; } = "";
}
