namespace eTracker.API.Models;

public class EWalletTransaction
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string Provider { get; set; } = string.Empty; // "GCash" or "Maya"
    public string Method { get; set; } = string.Empty; // "CashIn" or "CashOut"
    public string? AmountBracket { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string? ScreenshotUrl { get; set; }
    public byte[]? ScreenshotContent { get; set; }
    public string? ScreenshotContentType { get; set; }
    public decimal BaseAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Transaction? Transaction { get; set; }
}
