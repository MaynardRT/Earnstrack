namespace eTracker.API.Models;

public class ELoadingTransaction
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string MobileNetwork { get; set; } = string.Empty; // Globe, Smart, Dito, TnT, TM, Sun, SurftoSawa
    public string PhoneNumber { get; set; } = string.Empty;
    public decimal BaseAmount { get; set; }
    public string? ScreenshotUrl { get; set; }
    public byte[]? ScreenshotContent { get; set; }
    public string? ScreenshotContentType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Transaction? Transaction { get; set; }
}
