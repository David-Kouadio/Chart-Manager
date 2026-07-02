using demo.Data;
using demo.Models;
using Microsoft.EntityFrameworkCore;

namespace demo.Services;

public class ChartDataService
{
    private readonly AppDbContext _db;

    public ChartDataService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ChartSource>> GetAllSourcesAsync()
        => await _db.ChartSources.ToListAsync();

    public async Task<object> GetChartDataAsync(string key)
    {
        var source = await _db.ChartSources.FirstOrDefaultAsync(c => c.Key == key);
        if (source == null)
            return new { labels = new string[] { }, data = new double[] { }, title = "" };

        // Nomes dos meses em português
        var monthNames = new[] { "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                                  "Jul", "Ago", "Set", "Out", "Nov", "Dez" };

        // Últimos 6 meses a partir do mês atual
        var today = DateTime.Today;
        var months = Enumerable.Range(0, 6)
            .Select(i => today.AddMonths(-5 + i))
            .Select(d => new { d.Year, d.Month, Label = monthNames[d.Month - 1] })
            .ToList();

        double[] data;
        string title;

        switch (key)
        {
            case "new_registrations":
                // Conta utilizadores registados por mês
                var regByMonth = await _db.Users
                    .GroupBy(u => new { u.Registration.Year, u.Registration.Month })
                    .Select(g => new { g.Key.Year, g.Key.Month, Count = (double)g.Count() })
                    .ToListAsync();

                data = months.Select(m =>
                    regByMonth.FirstOrDefault(r => r.Year == m.Year && r.Month == m.Month)?.Count ?? 0
                ).ToArray();
                title = "Novos Registos";
                break;

            case "avg_session_duration":
                // Duração média simulada: usa o dia do mês do registo como proxy
                // (substituir por uma tabela de sessões real quando existir)
                var sessionsByMonth = await _db.Users
                    .GroupBy(u => new { u.Registration.Year, u.Registration.Month })
                    .Select(g => new { g.Key.Year, g.Key.Month, Avg = g.Average(u => u.Registration.Day) })
                    .ToListAsync();

                data = months.Select(m =>
                    Math.Round(sessionsByMonth.FirstOrDefault(r => r.Year == m.Year && r.Month == m.Month)?.Avg ?? 0, 1)
                ).ToArray();
                title = "Duração Média da Sessão (min)";
                break;

            case "revenue_by_month":
                // Soma o preço das encomendas por mês
                var revenueByMonth = await _db.Orders
                    .GroupBy(o => new { o.Date.Year, o.Date.Month })
                    .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(o => o.Price) })
                    .ToListAsync();

                data = months.Select(m =>
                    revenueByMonth.FirstOrDefault(r => r.Year == m.Year && r.Month == m.Month)?.Total ?? 0
                ).ToArray();
                title = "Receita por Mês (€)";
                break;

            default:
                return new { labels = new string[] { }, data = new double[] { }, title = "" };
        }

        return new
        {
            labels = months.Select(m => m.Label).ToArray(),
            data,
            title
        };
    }
}
