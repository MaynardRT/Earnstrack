namespace eTracker.API.Models;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TransactionType { get; set; } = string.Empty; // "EWallet", "Printing", "ELoading", "BillsPayment", "Products"
    public decimal Amount { get; set; }
    public decimal? ServiceCharge { get; set; }
    public decimal? TotalAmount { get; set; }
    public string Status { get; set; } = "Pending"; // "Pending", "Completed", "Failed"
    public string? FailureReason { get; set; }
    public string? ProductName { get; set; } // Populated for Products transactions
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
    public EWalletTransaction? EWalletTransaction { get; set; }
    public PrintingTransaction? PrintingTransaction { get; set; }
    public ELoadingTransaction? ELoadingTransaction { get; set; }
    public BillsPaymentTransaction? BillsPaymentTransaction { get; set; }
}
