using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using eTracker.API.Data;
using System.Security.Claims;

namespace eTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("daily-sales")]
    public async Task<ActionResult<IEnumerable<object>>> GetDailySales([FromQuery] int days = 30)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userIdGuid))
            {
                return Unauthorized();
            }

            var startDate = DateTime.UtcNow.AddDays(-days);

            // Fetch transactions into memory to avoid PostgreSQL LINQ translation issues
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userIdGuid && t.CreatedAt >= startDate && t.Status == "Completed")
                .Select(t => new { t.CreatedAt, t.TotalAmount, t.Amount })
                .ToListAsync();

            // Group in-memory by date
            var dailySales = transactions
                .GroupBy(t => t.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key.ToString("MMM dd"),
                    sales = g.Sum(t => t.TotalAmount ?? t.Amount),
                    count = g.Count()
                })
                .OrderBy(x => x.date)
                .ToList();

            return Ok(dailySales);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching daily sales: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Failed to fetch daily sales data", error = ex.Message });
        }
    }

    [HttpGet("service-sales")]
    public async Task<ActionResult<IEnumerable<object>>> GetServiceSales()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userIdGuid))
            {
                return Unauthorized();
            }

            // Fetch transactions into memory to avoid LINQ translation issues
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userIdGuid && t.Status == "Completed")
                .Select(t => new { t.TransactionType, t.TotalAmount, t.Amount })
                .ToListAsync();

            // Group in-memory by service type
            var serviceSales = transactions
                .GroupBy(t => t.TransactionType)
                .Select(g => new
                {
                    name = g.Key,
                    value = g.Sum(t => t.TotalAmount ?? t.Amount),
                    count = g.Count()
                })
                .OrderByDescending(x => x.value)
                .ToList();

            return Ok(serviceSales);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching service sales: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Failed to fetch service sales data", error = ex.Message });
        }
    }

    [HttpGet("summary")]
    public async Task<ActionResult<object>> GetSummary([FromQuery] int days = 30)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userIdGuid))
            {
                return Unauthorized();
            }

            var startDate = DateTime.UtcNow.AddDays(-days);

            // Fetch into memory to avoid database translation issues
            var completedTransactions = await _context.Transactions
                .Where(t => t.UserId == userIdGuid && t.CreatedAt >= startDate && t.Status == "Completed")
                .Select(t => new { t.TotalAmount, t.Amount })
                .ToListAsync();

            var totalSales = completedTransactions.Sum(t => t.TotalAmount ?? t.Amount);
            var totalTransactions = completedTransactions.Count;
            var averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

            return Ok(new
            {
                totalSales,
                totalTransactions,
                averageTransaction,
                period = days
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching summary: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Failed to fetch summary data", error = ex.Message });
        }
    }
}
