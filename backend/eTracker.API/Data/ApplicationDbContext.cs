using Microsoft.EntityFrameworkCore;
using eTracker.API.Models;

namespace eTracker.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {

    }

    public DbSet<User> Users { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    // Soft-delete archive — transactions older than 6 months are moved here by TransactionRetentionService.
    public DbSet<DeletedTransaction> DeletedTransactions { get; set; }
    // Child detail tables — each row has a 1-to-1 FK back to Transactions.
    public DbSet<EWalletTransaction> EWalletTransactions { get; set; }
    public DbSet<PrintingTransaction> PrintingTransactions { get; set; }
    public DbSet<ELoadingTransaction> ELoadingTransactions { get; set; }
    public DbSet<BillsPaymentTransaction> BillsPaymentTransactions { get; set; }
    public DbSet<ServiceFee> ServiceFees { get; set; }
    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Precision and index rules are defined here to keep financial data deterministic across migrations and providers.
        // User Configuration
        modelBuilder.Entity<User>()
            .HasKey(u => u.Id);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasMany(u => u.Transactions)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Transaction>()
            .Property(t => t.ServiceCharge)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Transaction>()
            .Property(t => t.TotalAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Transaction>()
            .Property(t => t.FailureReason)
            .HasMaxLength(500);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.Amount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.ServiceCharge)
            .HasPrecision(10, 2);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.TotalAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.EWalletBaseAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.PrintingBaseAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.FailureReason)
            .HasMaxLength(500);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.Provider)
            .HasMaxLength(100);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.Method)
            .HasMaxLength(100);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.AmountBracket)
            .HasMaxLength(100);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.ReferenceNumber)
            .HasMaxLength(200);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.ScreenshotUrl)
            .HasMaxLength(500);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.ScreenshotContentType)
            .HasMaxLength(100);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.PrintingServiceType)
            .HasMaxLength(100);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.PaperSize)
            .HasMaxLength(50);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.Color)
            .HasMaxLength(50);

        modelBuilder.Entity<ServiceFee>()
            .Property(f => f.FeePercentage)
            .HasPrecision(5, 2);

        modelBuilder.Entity<ServiceFee>()
            .Property(f => f.FlatFee)
            .HasPrecision(10, 2);

        modelBuilder.Entity<ServiceFee>()
            .Property(f => f.BracketMinAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<ServiceFee>()
            .Property(f => f.BracketMaxAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<EWalletTransaction>()
            .Property(e => e.BaseAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<EWalletTransaction>()
            .Property(e => e.ScreenshotContentType)
            .HasMaxLength(100);

        modelBuilder.Entity<PrintingTransaction>()
            .Property(p => p.BaseAmount)
            .HasPrecision(10, 2);

        // Transaction Configuration
        modelBuilder.Entity<Transaction>()
            .HasKey(t => t.Id);

        modelBuilder.Entity<DeletedTransaction>()
            .HasKey(t => t.Id);

        modelBuilder.Entity<DeletedTransaction>()
            .HasIndex(t => t.OriginalTransactionId)
            .IsUnique();

        modelBuilder.Entity<DeletedTransaction>()
            .HasIndex(t => t.UserId);

        modelBuilder.Entity<DeletedTransaction>()
            .HasIndex(t => t.OriginalCreatedAt);

        modelBuilder.Entity<DeletedTransaction>()
            .HasIndex(t => t.DeletedAt);

        // One-to-one detail tables keep the shared transaction ledger normalized while preserving service-specific fields.
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.EWalletTransaction)
            .WithOne(e => e.Transaction)
            .HasForeignKey<EWalletTransaction>(e => e.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.PrintingTransaction)
            .WithOne(p => p.Transaction)
            .HasForeignKey<PrintingTransaction>(p => p.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.ELoadingTransaction)
            .WithOne(e => e.Transaction)
            .HasForeignKey<ELoadingTransaction>(e => e.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.BillsPaymentTransaction)
            .WithOne(b => b.Transaction)
            .HasForeignKey<BillsPaymentTransaction>(b => b.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ELoadingTransaction>()
            .Property(e => e.BaseAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<BillsPaymentTransaction>()
            .Property(b => b.BillAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Product>()
            .HasKey(p => p.Id);

        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.ELoadingBaseAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<DeletedTransaction>()
            .Property(t => t.BillAmount)
            .HasPrecision(10, 2);

        // Create indexes for performance
        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.UserId);

        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.CreatedAt);

    }
}
