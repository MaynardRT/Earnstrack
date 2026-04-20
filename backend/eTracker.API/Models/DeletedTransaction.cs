namespace eTracker.API.Models;

public class DeletedTransaction
{
    public Guid Id { get; set; }
    public Guid OriginalTransactionId { get; set; }
    public Guid UserId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal? ServiceCharge { get; set; }
    public decimal? TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public DateTime OriginalCreatedAt { get; set; }
    public DateTime OriginalUpdatedAt { get; set; }
    public DateTime DeletedAt { get; set; } = DateTime.UtcNow;
    public string? Provider { get; set; }
    public string? Method { get; set; }
    public string? AmountBracket { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? ScreenshotUrl { get; set; }
    public byte[]? ScreenshotContent { get; set; }
    public string? ScreenshotContentType { get; set; }
    public decimal? EWalletBaseAmount { get; set; }
    public string? PrintingServiceType { get; set; }
    public string? PaperSize { get; set; }
    public string? Color { get; set; }
    public decimal? PrintingBaseAmount { get; set; }
    public int? Quantity { get; set; }
}