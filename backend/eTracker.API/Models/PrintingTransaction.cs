namespace eTracker.API.Models;

public class PrintingTransaction
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string ServiceType { get; set; } = string.Empty; // "Printing", "Scanning", "Photocopy", or "Typing Job"
    public string PaperSize { get; set; } = string.Empty; // "Long" or "Short"
    public string Color { get; set; } = string.Empty; // "Grayscale" or "Colored"
    public decimal BaseAmount { get; set; }
    public int Quantity { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Transaction? Transaction { get; set; }
}
