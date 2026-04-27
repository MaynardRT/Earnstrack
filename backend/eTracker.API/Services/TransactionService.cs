using Microsoft.EntityFrameworkCore;
using eTracker.API.Data;
using eTracker.API.DTOs;
using eTracker.API.Models;

namespace eTracker.API.Services;

public interface ITransactionService
{
    Task<TransactionSummaryDto> GetTransactionSummary(Guid? userId = null, bool includeStatusBreakdown = false);
    Task<List<TransactionListDto>> GetRecentTransactions(Guid? userId = null, int days = 30);
    Task<List<TransactionListDto>> GetTransactionsByPeriod(Guid? userId, string period);
    Task<TransactionListDto?> CreateEWalletTransaction(Guid userId, CreateEWalletTransactionDto dto);
    Task<TransactionListDto?> CreatePrintingTransaction(Guid userId, CreatePrintingTransactionDto dto);
    Task<TransactionListDto?> CreateELoadingTransaction(Guid userId, CreateELoadingTransactionDto dto);
    Task<TransactionListDto?> CreateBillsPaymentTransaction(Guid userId, CreateBillsPaymentTransactionDto dto);
}

public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _context;
    private readonly IServiceFeeService _serviceFeeService;
    private readonly IReceiptStorageService _receiptStorageService;

    public TransactionService(
        ApplicationDbContext context,
        IServiceFeeService serviceFeeService,
        IReceiptStorageService receiptStorageService)
    {
        _context = context;
        _serviceFeeService = serviceFeeService;
        _receiptStorageService = receiptStorageService;
    }

    public async Task<TransactionSummaryDto> GetTransactionSummary(Guid? userId = null, bool includeStatusBreakdown = false)
    {
        // Summary windows are calendar-based by design so dashboard totals match how operators read daily, weekly, and monthly performance.
        var today = GetStartOfUtcDay(DateTime.UtcNow);
        var tomorrow = today.AddDays(1);
        var weekStart = GetStartOfWeek(today);
        var nextWeekStart = weekStart.AddDays(7);
        var monthStart = GetStartOfMonth(today);
        var nextMonthStart = monthStart.AddMonths(1);

        var transactionsQuery = _context.Transactions.AsQueryable();

        if (userId.HasValue)
        {
            transactionsQuery = transactionsQuery.Where(t => t.UserId == userId.Value);
        }

        var dailyTotal = await transactionsQuery
            .Where(t => t.CreatedAt >= today && t.CreatedAt < tomorrow && t.Status == "Completed")
            .SumAsync(t => (t.TransactionType == "EWallet" || t.TransactionType == "ELoading" || t.TransactionType == "BillsPayment")
                ? (t.ServiceCharge ?? 0)
                : (t.TotalAmount ?? 0));

        var weeklyTotal = await transactionsQuery
            .Where(t => t.CreatedAt >= weekStart && t.CreatedAt < nextWeekStart && t.Status == "Completed")
            .SumAsync(t => (t.TransactionType == "EWallet" || t.TransactionType == "ELoading" || t.TransactionType == "BillsPayment")
                ? (t.ServiceCharge ?? 0)
                : (t.TotalAmount ?? 0));

        var monthlyTotal = await transactionsQuery
            .Where(t => t.CreatedAt >= monthStart && t.CreatedAt < nextMonthStart && t.Status == "Completed")
            .SumAsync(t => (t.TransactionType == "EWallet" || t.TransactionType == "ELoading" || t.TransactionType == "BillsPayment")
                ? (t.ServiceCharge ?? 0)
                : (t.TotalAmount ?? 0));

        var totalTransactions = await transactionsQuery.CountAsync();

        TransactionStatusBreakdownDto? statusBreakdown = null;

        if (includeStatusBreakdown)
        {
            var groupedStatuses = await transactionsQuery
                .GroupBy(t => t.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Total = g.Sum(t => (t.TransactionType == "EWallet" || t.TransactionType == "ELoading" || t.TransactionType == "BillsPayment")
                        ? (t.ServiceCharge ?? 0)
                        : (t.TotalAmount ?? 0))
                })
                .ToListAsync();

            statusBreakdown = new TransactionStatusBreakdownDto
            {
                PendingTransactions = groupedStatuses.FirstOrDefault(g => g.Status == "Pending")?.Count ?? 0,
                CompletedTransactions = groupedStatuses.FirstOrDefault(g => g.Status == "Completed")?.Count ?? 0,
                FailedTransactions = groupedStatuses.FirstOrDefault(g => g.Status == "Failed")?.Count ?? 0,
                PendingTotal = groupedStatuses.FirstOrDefault(g => g.Status == "Pending")?.Total ?? 0,
                CompletedTotal = groupedStatuses.FirstOrDefault(g => g.Status == "Completed")?.Total ?? 0,
                FailedTotal = groupedStatuses.FirstOrDefault(g => g.Status == "Failed")?.Total ?? 0
            };
        }

        return new TransactionSummaryDto
        {
            DailyTotal = dailyTotal,
            WeeklyTotal = weeklyTotal,
            MonthlyTotal = monthlyTotal,
            TotalTransactions = totalTransactions,
            StatusBreakdown = statusBreakdown
        };
    }

    public async Task<List<TransactionListDto>> GetRecentTransactions(Guid? userId = null, int days = 30)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);

        var transactionsQuery = _context.Transactions
            .Where(t => t.CreatedAt >= startDate);

        if (userId.HasValue)
        {
            transactionsQuery = transactionsQuery.Where(t => t.UserId == userId.Value);
        }

        var transactions = await transactionsQuery
            .OrderByDescending(t => t.CreatedAt)
            // The dashboard table is served from one projection so each row already contains its e-wallet or printing detail payload.
            .Select(t => new
            {
                Id = t.Id,
                TransactionType = t.TransactionType,
                Amount = t.Amount,
                ServiceCharge = t.ServiceCharge ?? 0,
                TotalAmount = t.TotalAmount ?? 0,
                Status = t.Status,
                FailureReason = t.FailureReason,
                // Pull the display name inline so shared dashboard views stay readable without exposing the full user entity.
                UserFullName = _context.Users
                    .Where(user => user.Id == t.UserId)
                    .Select(user => user.FullName)
                    .FirstOrDefault(),
                Provider = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.Provider)
                    .FirstOrDefault(),
                Method = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.Method)
                    .FirstOrDefault(),
                AmountBracket = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.AmountBracket)
                    .FirstOrDefault(),
                ReferenceNumber = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ReferenceNumber)
                    .FirstOrDefault(),
                ScreenshotUrl = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ScreenshotUrl)
                    .FirstOrDefault(),
                ScreenshotContent = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ScreenshotContent)
                    .FirstOrDefault(),
                ScreenshotContentType = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ScreenshotContentType)
                    .FirstOrDefault(),
                PrintingServiceType = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ServiceType)
                    .FirstOrDefault(),
                PaperSize = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.PaperSize)
                    .FirstOrDefault(),
                Color = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.Color)
                    .FirstOrDefault(),
                Quantity = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => (int?)detail.Quantity)
                    .FirstOrDefault(),
                ELoadingNetwork = _context.ELoadingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.MobileNetwork)
                    .FirstOrDefault(),
                ELoadingPhoneNumber = _context.ELoadingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.PhoneNumber)
                    .FirstOrDefault(),
                BillerType = _context.BillsPaymentTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.BillerType)
                    .FirstOrDefault(),
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return transactions
            .Select(transaction => new TransactionListDto
            {
                Id = transaction.Id,
                TransactionType = transaction.TransactionType,
                Amount = transaction.Amount,
                ServiceCharge = transaction.ServiceCharge,
                TotalAmount = transaction.TotalAmount,
                Status = transaction.Status,
                FailureReason = transaction.FailureReason,
                UserFullName = transaction.UserFullName,
                Provider = transaction.Provider,
                Method = transaction.Method,
                AmountBracket = transaction.AmountBracket,
                ReferenceNumber = transaction.ReferenceNumber,
                ScreenshotUrl = transaction.ScreenshotUrl,
                ScreenshotDataUrl = ReceiptContentHelper.ToDataUrl(transaction.ScreenshotContent, transaction.ScreenshotContentType),
                PrintingServiceType = transaction.PrintingServiceType,
                PaperSize = transaction.PaperSize,
                Color = transaction.Color,
                Quantity = transaction.Quantity,
                ELoadingNetwork = transaction.ELoadingNetwork,
                ELoadingPhoneNumber = transaction.ELoadingPhoneNumber,
                BillerType = transaction.BillerType,
                CreatedAt = transaction.CreatedAt
            })
            .ToList();
    }

    public async Task<List<TransactionListDto>> GetTransactionsByPeriod(Guid? userId, string period)
    {
        var today = GetStartOfUtcDay(DateTime.UtcNow);
        var (startDate, endDate) = period.ToLower() switch
        {
            "daily" => (today, today.AddDays(1)),
            "weekly" => (GetStartOfWeek(today), GetStartOfWeek(today).AddDays(7)),
            "monthly" => (GetStartOfMonth(today), GetStartOfMonth(today).AddMonths(1)),
            _ => (GetStartOfMonth(today), GetStartOfMonth(today).AddMonths(1))
        };

        var transactionsQuery = _context.Transactions
            .Where(t => t.CreatedAt >= startDate && t.CreatedAt < endDate);

        if (userId.HasValue)
        {
            transactionsQuery = transactionsQuery.Where(t => t.UserId == userId.Value);
        }

        var transactions = await transactionsQuery
            .OrderByDescending(t => t.CreatedAt)
            // Period views reuse the same enriched DTO shape as recent transactions to keep the frontend modal logic simple.
            .Select(t => new
            {
                Id = t.Id,
                TransactionType = t.TransactionType,
                Amount = t.Amount,
                ServiceCharge = t.ServiceCharge ?? 0,
                TotalAmount = t.TotalAmount ?? 0,
                Status = t.Status,
                FailureReason = t.FailureReason,
                UserFullName = _context.Users
                    .Where(user => user.Id == t.UserId)
                    .Select(user => user.FullName)
                    .FirstOrDefault(),
                Provider = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.Provider)
                    .FirstOrDefault(),
                Method = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.Method)
                    .FirstOrDefault(),
                AmountBracket = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.AmountBracket)
                    .FirstOrDefault(),
                ReferenceNumber = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ReferenceNumber)
                    .FirstOrDefault(),
                ScreenshotUrl = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ScreenshotUrl)
                    .FirstOrDefault(),
                ScreenshotContent = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ScreenshotContent)
                    .FirstOrDefault(),
                ScreenshotContentType = _context.EWalletTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ScreenshotContentType)
                    .FirstOrDefault(),
                PrintingServiceType = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.ServiceType)
                    .FirstOrDefault(),
                PaperSize = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.PaperSize)
                    .FirstOrDefault(),
                Color = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.Color)
                    .FirstOrDefault(),
                Quantity = _context.PrintingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => (int?)detail.Quantity)
                    .FirstOrDefault(),
                ELoadingNetwork = _context.ELoadingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.MobileNetwork)
                    .FirstOrDefault(),
                ELoadingPhoneNumber = _context.ELoadingTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.PhoneNumber)
                    .FirstOrDefault(),
                BillerType = _context.BillsPaymentTransactions
                    .Where(detail => detail.TransactionId == t.Id)
                    .Select(detail => detail.BillerType)
                    .FirstOrDefault(),
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return transactions
            .Select(transaction => new TransactionListDto
            {
                Id = transaction.Id,
                TransactionType = transaction.TransactionType,
                Amount = transaction.Amount,
                ServiceCharge = transaction.ServiceCharge,
                TotalAmount = transaction.TotalAmount,
                Status = transaction.Status,
                FailureReason = transaction.FailureReason,
                UserFullName = transaction.UserFullName,
                Provider = transaction.Provider,
                Method = transaction.Method,
                AmountBracket = transaction.AmountBracket,
                ReferenceNumber = transaction.ReferenceNumber,
                ScreenshotUrl = transaction.ScreenshotUrl,
                ScreenshotDataUrl = ReceiptContentHelper.ToDataUrl(transaction.ScreenshotContent, transaction.ScreenshotContentType),
                PrintingServiceType = transaction.PrintingServiceType,
                PaperSize = transaction.PaperSize,
                Color = transaction.Color,
                Quantity = transaction.Quantity,
                ELoadingNetwork = transaction.ELoadingNetwork,
                ELoadingPhoneNumber = transaction.ELoadingPhoneNumber,
                BillerType = transaction.BillerType,
                CreatedAt = transaction.CreatedAt
            })
            .ToList();
    }

    public async Task<TransactionListDto?> CreateEWalletTransaction(Guid userId, CreateEWalletTransactionDto dto)
    {
        // Persist the parent row first so every transaction has an auditable record even if downstream details fail to save.
        var serviceFee = await _serviceFeeService.GetServiceFeeForEWallet(dto.Provider, dto.Method, dto.BaseAmount);
        var serviceCharge = CalculateEWalletServiceCharge(dto.BaseAmount, serviceFee);
        var totalAmount = dto.BaseAmount + serviceCharge;

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "EWallet",
            Amount = dto.BaseAmount,
            ServiceCharge = serviceCharge,
            TotalAmount = totalAmount,
            Status = "Pending"
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        EWalletTransaction? eWalletTransaction = null;

        try
        {
            // Receipt storage is resolved before marking the transaction completed so the row only points at durable screenshot locations.
            var receipt = await _receiptStorageService.SaveReceiptAsync(dto.ScreenshotBase64);

            eWalletTransaction = new EWalletTransaction
            {
                Id = Guid.NewGuid(),
                TransactionId = transaction.Id,
                Provider = dto.Provider,
                Method = dto.Method,
                AmountBracket = dto.AmountBracket,
                ReferenceNumber = dto.ReferenceNumber,
                ScreenshotUrl = receipt?.RelativeUrl,
                ScreenshotContent = receipt?.Content,
                ScreenshotContentType = receipt?.ContentType,
                BaseAmount = dto.BaseAmount
            };

            _context.EWalletTransactions.Add(eWalletTransaction);
            transaction.EWalletTransaction = eWalletTransaction;
            transaction.Status = "Completed";
            transaction.FailureReason = null;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            if (eWalletTransaction != null)
            {
                _context.Entry(eWalletTransaction).State = EntityState.Detached;
            }

            await MarkTransactionAsFailedAsync(transaction, ex);
        }

        return MapTransaction(transaction);
    }

    public async Task<TransactionListDto?> CreatePrintingTransaction(Guid userId, CreatePrintingTransactionDto dto)
    {
        var quantity = Math.Max(1, dto.Quantity);
        var subtotal = dto.BaseAmount * quantity;
        var serviceCharge = 0m;
        var totalAmount = subtotal;

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "Printing",
            Amount = subtotal,
            ServiceCharge = serviceCharge,
            TotalAmount = totalAmount,
            Status = "Pending"
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        PrintingTransaction? printingTransaction = null;

        try
        {
            // Printing transactions follow the same pending-to-completed ledger flow without a service-charge branch.
            printingTransaction = new PrintingTransaction
            {
                Id = Guid.NewGuid(),
                TransactionId = transaction.Id,
                ServiceType = dto.ServiceType,
                PaperSize = dto.PaperSize,
                Color = dto.Color,
                BaseAmount = dto.BaseAmount,
                Quantity = quantity
            };

            _context.PrintingTransactions.Add(printingTransaction);
            transaction.PrintingTransaction = printingTransaction;
            transaction.Status = "Completed";
            transaction.FailureReason = null;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            if (printingTransaction != null)
            {
                _context.Entry(printingTransaction).State = EntityState.Detached;
            }

            await MarkTransactionAsFailedAsync(transaction, ex);
        }

        return MapTransaction(transaction);
    }

    public async Task<TransactionListDto?> CreateELoadingTransaction(Guid userId, CreateELoadingTransactionDto dto)
    {
        var serviceFee = await _serviceFeeService.GetServiceFeeForELoading(dto.MobileNetwork);
        var serviceCharge = serviceFee?.FlatFee ?? 5m;
        var totalAmount = dto.BaseAmount + serviceCharge;

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "ELoading",
            Amount = dto.BaseAmount,
            ServiceCharge = serviceCharge,
            TotalAmount = totalAmount,
            Status = "Pending"
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        ELoadingTransaction? eLoadingTransaction = null;

        try
        {
            eLoadingTransaction = new ELoadingTransaction
            {
                Id = Guid.NewGuid(),
                TransactionId = transaction.Id,
                MobileNetwork = dto.MobileNetwork,
                PhoneNumber = dto.PhoneNumber,
                BaseAmount = dto.BaseAmount
            };

            _context.ELoadingTransactions.Add(eLoadingTransaction);
            transaction.ELoadingTransaction = eLoadingTransaction;
            transaction.Status = "Completed";
            transaction.FailureReason = null;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            if (eLoadingTransaction != null)
            {
                _context.Entry(eLoadingTransaction).State = EntityState.Detached;
            }

            await MarkTransactionAsFailedAsync(transaction, ex);
        }

        return MapTransaction(transaction);
    }

    public async Task<TransactionListDto?> CreateBillsPaymentTransaction(Guid userId, CreateBillsPaymentTransactionDto dto)
    {
        var serviceFee = await _serviceFeeService.GetServiceFeeForBillsPayment();
        var serviceCharge = serviceFee?.FlatFee ?? 25m;
        var totalAmount = dto.BillAmount + serviceCharge;

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "BillsPayment",
            Amount = dto.BillAmount,
            ServiceCharge = serviceCharge,
            TotalAmount = totalAmount,
            Status = "Pending"
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        BillsPaymentTransaction? billsPaymentTransaction = null;

        try
        {
            billsPaymentTransaction = new BillsPaymentTransaction
            {
                Id = Guid.NewGuid(),
                TransactionId = transaction.Id,
                BillerType = dto.BillerType,
                BillAmount = dto.BillAmount
            };

            _context.BillsPaymentTransactions.Add(billsPaymentTransaction);
            transaction.BillsPaymentTransaction = billsPaymentTransaction;
            transaction.Status = "Completed";
            transaction.FailureReason = null;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            if (billsPaymentTransaction != null)
            {
                _context.Entry(billsPaymentTransaction).State = EntityState.Detached;
            }

            await MarkTransactionAsFailedAsync(transaction, ex);
        }

        return MapTransaction(transaction);
    }

    private async Task MarkTransactionAsFailedAsync(Transaction transaction, Exception exception)
    {
        // Failure details are trimmed and stored back on the transaction so the dashboard can explain partial write failures.
        transaction.Status = "Failed";
        transaction.FailureReason = TruncateFailureReason(exception.InnerException?.Message ?? exception.Message);
        transaction.UpdatedAt = DateTime.UtcNow;
        _context.Entry(transaction).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Best effort to persist the failed state when a follow-up save is still possible.
        }
    }

    private static string TruncateFailureReason(string? message)
    {
        const string defaultMessage = "Transaction processing failed.";

        if (string.IsNullOrWhiteSpace(message))
        {
            return defaultMessage;
        }

        return message.Length <= 500 ? message : message[..500];
    }

    private static TransactionListDto MapTransaction(Transaction transaction)
    {
        // Creation endpoints reuse the same DTO shape as read endpoints so the frontend can append fresh results without re-fetching.
        return new TransactionListDto
        {
            Id = transaction.Id,
            TransactionType = transaction.TransactionType,
            Amount = transaction.Amount,
            ServiceCharge = transaction.ServiceCharge ?? 0,
            TotalAmount = transaction.TotalAmount ?? 0,
            Status = transaction.Status,
            FailureReason = transaction.FailureReason,
            UserFullName = transaction.User?.FullName,
            Provider = transaction.EWalletTransaction?.Provider,
            Method = transaction.EWalletTransaction?.Method,
            AmountBracket = transaction.EWalletTransaction?.AmountBracket,
            ReferenceNumber = transaction.EWalletTransaction?.ReferenceNumber,
            ScreenshotUrl = transaction.EWalletTransaction?.ScreenshotUrl,
            ScreenshotDataUrl = ReceiptContentHelper.ToDataUrl(
                transaction.EWalletTransaction?.ScreenshotContent,
                transaction.EWalletTransaction?.ScreenshotContentType),
            PrintingServiceType = transaction.PrintingTransaction?.ServiceType,
            PaperSize = transaction.PrintingTransaction?.PaperSize,
            Color = transaction.PrintingTransaction?.Color,
            Quantity = transaction.PrintingTransaction?.Quantity,
            ELoadingNetwork = transaction.ELoadingTransaction?.MobileNetwork,
            ELoadingPhoneNumber = transaction.ELoadingTransaction?.PhoneNumber,
            BillerType = transaction.BillsPaymentTransaction?.BillerType,
            CreatedAt = transaction.CreatedAt
        };
    }

    private static DateTime GetStartOfUtcDay(DateTime date)
    {
        return new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    private static DateTime GetStartOfWeek(DateTime date)
    {
        // Monday is treated as the operational week boundary across summaries and reports.
        var offset = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return GetStartOfUtcDay(date.AddDays(-offset));
    }

    private static DateTime GetStartOfMonth(DateTime date)
    {
        return new DateTime(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private decimal CalculateServiceCharge(decimal baseAmount, ServiceFee? fee)
    {
        if (fee == null) return 0;

        if (fee.FeePercentage.HasValue)
            return baseAmount * (fee.FeePercentage.Value / 100);

        if (fee.FlatFee.HasValue)
            return fee.FlatFee.Value;

        return 0;
    }

    private decimal CalculateEWalletServiceCharge(decimal baseAmount, ServiceFee? fee)
    {
        if (fee != null)
        {
            return CalculateServiceCharge(baseAmount, fee);
        }

        if (baseAmount <= 0)
        {
            return 0m;
        }

        var normalizedAmount = Math.Min(baseAmount, 10000m);
        var fiveHundredBands = (int)Math.Ceiling(normalizedAmount / 500m);
        return fiveHundredBands * 5m;
    }
}
