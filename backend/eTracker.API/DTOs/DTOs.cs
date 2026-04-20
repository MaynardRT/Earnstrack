namespace eTracker.API.DTOs;

// Auth DTOs
public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto? User { get; set; }
}

public class CreateUserAdminDto
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "Admin" or "Seller"
}

// User DTOs
public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ProfilePicture { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UserManagementDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class UpdateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class UpdateProfileDto
{
    public string? ProfilePicture { get; set; }
}

// Transaction DTOs
public class TransactionSummaryDto
{
    public decimal DailyTotal { get; set; }
    public decimal WeeklyTotal { get; set; }
    public decimal MonthlyTotal { get; set; }
    public int TotalTransactions { get; set; }
    public TransactionStatusBreakdownDto? StatusBreakdown { get; set; }
}

public class TransactionStatusBreakdownDto
{
    public int PendingTransactions { get; set; }
    public int CompletedTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public decimal PendingTotal { get; set; }
    public decimal CompletedTotal { get; set; }
    public decimal FailedTotal { get; set; }
}

public class TransactionListDto
{
    public Guid Id { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal ServiceCharge { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public string? UserFullName { get; set; }
    public string? Provider { get; set; }
    public string? Method { get; set; }
    public string? AmountBracket { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? ScreenshotUrl { get; set; }
    public string? ScreenshotDataUrl { get; set; }
    public string? PrintingServiceType { get; set; }
    public string? PaperSize { get; set; }
    public string? Color { get; set; }
    public int? Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTransactionDto
{
    public string TransactionType { get; set; } = string.Empty; // "EWallet" or "Printing"
}

// EWallet DTOs
public class CreateEWalletTransactionDto
{
    public string Provider { get; set; } = string.Empty; // "GCash" or "Maya"
    public string Method { get; set; } = string.Empty; // "CashIn" or "CashOut"
    public string AmountBracket { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public decimal BaseAmount { get; set; }
    public string? ScreenshotBase64 { get; set; }
}

public class EWalletTransactionDto
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string AmountBracket { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public decimal BaseAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Printing DTOs
public class CreatePrintingTransactionDto
{
    public string ServiceType { get; set; } = string.Empty; // "Printing", "Scanning", or "Photocopy"
    public string PaperSize { get; set; } = string.Empty; // "Long" or "Short"
    public string Color { get; set; } = string.Empty; // "Grayscale" or "Colored"
    public decimal BaseAmount { get; set; }
    public int Quantity { get; set; } = 1;
}

public class PrintingTransactionDto
{
    public Guid Id { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string PaperSize { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal BaseAmount { get; set; }
    public int Quantity { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Service Fee DTOs
public class ServiceFeeDto
{
    public Guid Id { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string? ProviderType { get; set; }
    public string? MethodType { get; set; }
    public decimal? FeePercentage { get; set; }
    public decimal? FlatFee { get; set; }
}

public class CreateServiceFeeDto
{
    public string ServiceType { get; set; } = string.Empty;
    public string? ProviderType { get; set; }
    public string? MethodType { get; set; }
    public decimal? FeePercentage { get; set; }
    public decimal? FlatFee { get; set; }
}

public class UpdateServiceFeeDto
{
    public decimal? FeePercentage { get; set; }
    public decimal? FlatFee { get; set; }
}
