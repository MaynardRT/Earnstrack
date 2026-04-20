using eTracker.API.Data;
using eTracker.API.DTOs;
using eTracker.API.Models;
using eTracker.API.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace eTracker.API.Tests;

public class TransactionServiceTests
{
    [Fact]
    public async Task GetTransactionSummary_UsesCalendarWeekStartingMondayAndCalendarMonth()
    {
        using var context = CreateContext();
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var today = DateTime.UtcNow.Date;
        var startOfWeek = GetStartOfWeek(today);
        var startOfMonth = new DateTime(today.Year, today.Month, 1);
        var lastDayBeforeWeek = startOfWeek.AddDays(-1).AddHours(12);
        var mondayOfWeek = startOfWeek.AddHours(12);
        var todayAtNoon = today.AddHours(12);

        var monthlyOnlyDate = startOfMonth < startOfWeek
            ? startOfMonth.AddHours(12)
            : startOfWeek.AddDays(-2).AddHours(12);

        var monthlyOnlyStatus = monthlyOnlyDate >= startOfMonth ? "Completed" : "Failed";
        var expectedCompletedTransactions = monthlyOnlyStatus == "Completed" ? 4 : 3;
        var expectedFailedTransactions = monthlyOnlyStatus == "Completed" ? 1 : 2;
        var expectedCompletedTotal = monthlyOnlyStatus == "Completed" ? 575m : 485m;
        var expectedFailedTotal = monthlyOnlyStatus == "Completed" ? 999m : 1089m;
        var expectedMonthlyTotal = 425m;

        if (monthlyOnlyStatus == "Completed")
        {
            expectedMonthlyTotal += 90m;
        }

        if (lastDayBeforeWeek >= startOfMonth)
        {
            expectedMonthlyTotal += 60m;
        }

        var expectedDailyTotal = today == startOfWeek ? 425m : 150m;

        context.Transactions.AddRange(
            CreateTransaction(userA, 150m, "Completed", todayAtNoon),
            CreateTransaction(userB, 275m, "Completed", mondayOfWeek),
            CreateTransaction(userB, 90m, monthlyOnlyStatus, monthlyOnlyDate),
            CreateTransaction(userA, 60m, "Completed", lastDayBeforeWeek),
            CreateTransaction(userB, 25m, "Pending", todayAtNoon),
            CreateTransaction(userA, 999m, "Failed", todayAtNoon));
        await context.SaveChangesAsync();

        var service = CreateService(context);

        var summary = await service.GetTransactionSummary(null, includeStatusBreakdown: true);

        Assert.Equal(expectedDailyTotal, summary.DailyTotal);
        Assert.Equal(425m, summary.WeeklyTotal);
        Assert.Equal(expectedMonthlyTotal, summary.MonthlyTotal);
        Assert.Equal(6, summary.TotalTransactions);
        Assert.NotNull(summary.StatusBreakdown);
        Assert.Equal(expectedCompletedTransactions, summary.StatusBreakdown!.CompletedTransactions);
        Assert.Equal(1, summary.StatusBreakdown.PendingTransactions);
        Assert.Equal(expectedFailedTransactions, summary.StatusBreakdown.FailedTransactions);
        Assert.Equal(expectedCompletedTotal, summary.StatusBreakdown.CompletedTotal);
        Assert.Equal(25m, summary.StatusBreakdown.PendingTotal);
        Assert.Equal(expectedFailedTotal, summary.StatusBreakdown.FailedTotal);
    }

    [Fact]
    public async Task GetTransactionsByPeriod_Weekly_ReturnsOnlyCurrentMondayThroughSundayTransactions()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var today = DateTime.UtcNow.Date;
        var startOfWeek = GetStartOfWeek(today);

        context.Transactions.AddRange(
            CreateTransaction(userId, 100m, "Completed", startOfWeek.AddHours(9)),
            CreateTransaction(userId, 125m, "Completed", today.AddHours(12)),
            CreateTransaction(userId, 200m, "Completed", startOfWeek.AddDays(-1).AddHours(18)));
        await context.SaveChangesAsync();

        var service = CreateService(context);

        var transactions = await service.GetTransactionsByPeriod(userId, "weekly");

        Assert.Equal(2, transactions.Count);
        Assert.All(transactions, transaction => Assert.True(transaction.CreatedAt >= startOfWeek));
        Assert.All(transactions, transaction => Assert.True(transaction.CreatedAt < startOfWeek.AddDays(7)));
    }

    [Fact]
    public async Task CreatePrintingTransaction_UsesSubtotalWithoutServiceChargeAndMarksCompleted()
    {
        using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.CreatePrintingTransaction(Guid.NewGuid(), new CreatePrintingTransactionDto
        {
            ServiceType = "Printing",
            PaperSize = "Short",
            Color = "Grayscale",
            BaseAmount = 2.50m,
            Quantity = 4
        });

        Assert.NotNull(result);
        Assert.Equal(10m, result!.Amount);
        Assert.Equal(0m, result.ServiceCharge);
        Assert.Equal(10m, result.TotalAmount);
        Assert.Equal("Completed", result.Status);
        Assert.Null(result.FailureReason);
    }

    [Fact]
    public async Task CreateEWalletTransaction_UsesFivePercentChargeAtOrAbove5001()
    {
        using var context = CreateContext();
        var service = CreateService(context, new StubServiceFeeService(new ServiceFee
        {
            Id = Guid.NewGuid(),
            ServiceType = "EWallet",
            ProviderType = "GCash",
            MethodType = "CashIn",
            FeePercentage = 1m
        }));

        var result = await service.CreateEWalletTransaction(Guid.NewGuid(), new CreateEWalletTransactionDto
        {
            Provider = "GCash",
            Method = "CashIn",
            AmountBracket = "5000+",
            ReferenceNumber = "REF-001",
            BaseAmount = 6000m
        });

        Assert.NotNull(result);
        Assert.Equal(300m, result!.ServiceCharge);
        Assert.Equal(6300m, result.TotalAmount);
        Assert.Equal("Completed", result.Status);
    }

    [Fact]
    public async Task CreateEWalletTransaction_StoresShortReceiptUrl()
    {
        using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.CreateEWalletTransaction(Guid.NewGuid(), new CreateEWalletTransactionDto
        {
            Provider = "GCash",
            Method = "CashIn",
            AmountBracket = "100-500",
            ReferenceNumber = "REF-URL-001",
            BaseAmount = 500m,
            ScreenshotBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6pL3sAAAAASUVORK5CYII="
        });

        Assert.NotNull(result);
        Assert.Equal("/uploads/receipts/test-image.png", result!.ScreenshotUrl);
        Assert.Equal("data:image/png;base64,dGVzdA==", result.ScreenshotDataUrl);

        var storedReceipt = await context.EWalletTransactions.SingleAsync();
        Assert.Equal("image/png", storedReceipt.ScreenshotContentType);
        Assert.Equal(new byte[] { 116, 101, 115, 116 }, storedReceipt.ScreenshotContent);
    }

    [Fact]
    public async Task CreatePrintingTransaction_WhenFollowUpSaveFails_MarksTransactionFailedWithReason()
    {
        using var context = CreateContext();
        var service = CreateService(context, saveInterceptor: (_, saveCallCount) =>
        {
            if (saveCallCount == 2)
            {
                throw new InvalidOperationException("Simulated failure while finalizing transaction.");
            }
        });

        var result = await service.CreatePrintingTransaction(Guid.NewGuid(), new CreatePrintingTransactionDto
        {
            ServiceType = "Printing",
            PaperSize = "Short",
            Color = "Grayscale",
            BaseAmount = 2.50m,
            Quantity = 2
        });

        Assert.NotNull(result);
        Assert.Equal("Failed", result!.Status);
        Assert.Equal("Simulated failure while finalizing transaction.", result.FailureReason);

        var savedTransaction = await context.Transactions.SingleAsync(t => t.Id == result.Id);
        Assert.Equal("Failed", savedTransaction.Status);
        Assert.Equal("Simulated failure while finalizing transaction.", savedTransaction.FailureReason);
    }

    private static TransactionService CreateService(
        ApplicationDbContext context,
        IServiceFeeService? serviceFeeService = null,
        Action<ApplicationDbContext, int>? saveInterceptor = null)
    {
        if (saveInterceptor != null)
        {
            context.SavingChanges += (_, _) =>
            {
                var saveCallCount = ++_saveCallCount;
                saveInterceptor(context, saveCallCount);
            };
        }

        return new TransactionService(
            context,
            serviceFeeService ?? new StubServiceFeeService(),
            new StubReceiptStorageService());
    }

    private static int _saveCallCount;

    private static ApplicationDbContext CreateContext()
    {
        _saveCallCount = 0;

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static Transaction CreateTransaction(Guid userId, decimal totalAmount, string status, DateTime createdAt)
    {
        return new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TransactionType = "EWallet",
            Amount = totalAmount,
            ServiceCharge = 0m,
            TotalAmount = totalAmount,
            Status = status,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };
    }

    private static DateTime GetStartOfWeek(DateTime date)
    {
        var offset = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return date.AddDays(-offset);
    }

    private sealed class StubServiceFeeService : IServiceFeeService
    {
        private readonly ServiceFee? _eWalletFee;

        public StubServiceFeeService(ServiceFee? eWalletFee = null)
        {
            _eWalletFee = eWalletFee;
        }

        public Task<ServiceFee?> GetServiceFeeForEWallet(string provider, string method)
            => Task.FromResult(_eWalletFee);

        public Task<ServiceFee?> GetServiceFeeForPrinting(string serviceType)
            => Task.FromResult<ServiceFee?>(null);

        public Task<List<ServiceFeeDto>> GetAllServiceFees()
            => Task.FromResult(new List<ServiceFeeDto>());

        public Task<ServiceFeeDto?> CreateServiceFee(CreateServiceFeeDto dto)
            => Task.FromResult<ServiceFeeDto?>(null);

        public Task<ServiceFeeDto?> UpdateServiceFee(Guid id, UpdateServiceFeeDto dto)
            => Task.FromResult<ServiceFeeDto?>(null);

        public Task<bool> DeleteServiceFee(Guid id)
            => Task.FromResult(false);
    }

    private sealed class StubReceiptStorageService : IReceiptStorageService
    {
        public Task<ReceiptStorageResult?> SaveReceiptAsync(string? screenshotBase64, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(screenshotBase64))
            {
                return Task.FromResult<ReceiptStorageResult?>(null);
            }

            return Task.FromResult<ReceiptStorageResult?>(new ReceiptStorageResult
            {
                RelativeUrl = "/uploads/receipts/test-image.png",
                Content = new byte[] { 116, 101, 115, 116 },
                ContentType = "image/png"
            });
        }
    }
}