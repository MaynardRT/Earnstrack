using Microsoft.EntityFrameworkCore;
using eTracker.API.Data;
using eTracker.API.Models;

namespace eTracker.API.Services;

public interface ITransactionRetentionService
{
    Task<int> ArchiveExpiredTransactionsAsync(DateTime? utcNow = null, CancellationToken cancellationToken = default);
}

public class TransactionRetentionService : ITransactionRetentionService
{
    private const int ArchiveBatchSize = 200;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TransactionRetentionService> _logger;

    public TransactionRetentionService(ApplicationDbContext context, ILogger<TransactionRetentionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> ArchiveExpiredTransactionsAsync(DateTime? utcNow = null, CancellationToken cancellationToken = default)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var cutoffDate = now.AddMonths(-6);
        var archivedCount = 0;

        while (true)
        {
            // Archive in bounded batches to avoid long-running deletes and oversized EF change trackers.
            var expiredTransactions = await _context.Transactions
                .Include(t => t.EWalletTransaction)
                .Include(t => t.PrintingTransaction)
                .Where(t => t.CreatedAt < cutoffDate)
                .OrderBy(t => t.CreatedAt)
                .Take(ArchiveBatchSize)
                .ToListAsync(cancellationToken);

            if (expiredTransactions.Count == 0)
            {
                break;
            }

            var deletedTransactions = expiredTransactions
                .Select(transaction => MapDeletedTransaction(transaction, now))
                .ToList();

            var eWalletTransactions = expiredTransactions
                .Where(t => t.EWalletTransaction != null)
                .Select(t => t.EWalletTransaction!)
                .ToList();

            var printingTransactions = expiredTransactions
                .Where(t => t.PrintingTransaction != null)
                .Select(t => t.PrintingTransaction!)
                .ToList();

            _context.DeletedTransactions.AddRange(deletedTransactions);

            if (eWalletTransactions.Count > 0)
            {
                _context.EWalletTransactions.RemoveRange(eWalletTransactions);
            }

            if (printingTransactions.Count > 0)
            {
                _context.PrintingTransactions.RemoveRange(printingTransactions);
            }

            _context.Transactions.RemoveRange(expiredTransactions);

            await _context.SaveChangesAsync(cancellationToken);

            archivedCount += expiredTransactions.Count;
        }

        if (archivedCount > 0)
        {
            _logger.LogInformation("Archived {ArchivedCount} transactions older than six months.", archivedCount);
        }

        return archivedCount;
    }

    private static DeletedTransaction MapDeletedTransaction(Transaction transaction, DateTime deletedAt)
    {
        return new DeletedTransaction
        {
            Id = Guid.NewGuid(),
            OriginalTransactionId = transaction.Id,
            UserId = transaction.UserId,
            TransactionType = transaction.TransactionType,
            Amount = transaction.Amount,
            ServiceCharge = transaction.ServiceCharge,
            TotalAmount = transaction.TotalAmount,
            Status = transaction.Status,
            FailureReason = transaction.FailureReason,
            OriginalCreatedAt = transaction.CreatedAt,
            OriginalUpdatedAt = transaction.UpdatedAt,
            DeletedAt = deletedAt,
            Provider = transaction.EWalletTransaction?.Provider,
            Method = transaction.EWalletTransaction?.Method,
            AmountBracket = transaction.EWalletTransaction?.AmountBracket,
            ReferenceNumber = transaction.EWalletTransaction?.ReferenceNumber,
            ScreenshotUrl = transaction.EWalletTransaction?.ScreenshotUrl,
            ScreenshotContent = transaction.EWalletTransaction?.ScreenshotContent,
            ScreenshotContentType = transaction.EWalletTransaction?.ScreenshotContentType,
            EWalletBaseAmount = transaction.EWalletTransaction?.BaseAmount,
            PrintingServiceType = transaction.PrintingTransaction?.ServiceType,
            PaperSize = transaction.PrintingTransaction?.PaperSize,
            Color = transaction.PrintingTransaction?.Color,
            PrintingBaseAmount = transaction.PrintingTransaction?.BaseAmount,
            Quantity = transaction.PrintingTransaction?.Quantity
        };
    }
}

public class TransactionRetentionHostedService : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromHours(24);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TransactionRetentionHostedService> _logger;

    public TransactionRetentionHostedService(IServiceScopeFactory scopeFactory, ILogger<TransactionRetentionHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Run one sweep on boot so retention is enforced even on low-traffic deployments.
        await RunSweepAsync(stoppingToken);

        using var timer = new PeriodicTimer(SweepInterval);

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunSweepAsync(stoppingToken);
        }
    }

    private async Task RunSweepAsync(CancellationToken cancellationToken)
    {
        try
        {
            // Resolve scoped services per sweep so DbContext lifetime stays aligned with a single archival job.
            using var scope = _scopeFactory.CreateScope();
            var retentionService = scope.ServiceProvider.GetRequiredService<ITransactionRetentionService>();
            await retentionService.ArchiveExpiredTransactionsAsync(cancellationToken: cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to archive expired transactions.");
        }
    }
}