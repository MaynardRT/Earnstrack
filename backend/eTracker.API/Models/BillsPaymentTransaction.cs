namespace eTracker.API.Models;

public class BillsPaymentTransaction
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string BillerType { get; set; } = string.Empty; // Meralco, Maynilad, Manila Water, PLDT, Converge, Globe
    public decimal BillAmount { get; set; }
    public string? ScreenshotUrl { get; set; }
    public byte[]? ScreenshotContent { get; set; }
    public string? ScreenshotContentType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Transaction? Transaction { get; set; }
}
