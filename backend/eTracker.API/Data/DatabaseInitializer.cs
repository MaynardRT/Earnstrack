using System.Data;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using eTracker.API.Models;
using eTracker.API.Services;

namespace eTracker.API.Data;

public static class DatabaseInitializer
{
    private const string InitialPostgresMigrationId = "20260420115347_InitialPostgres";

    private static readonly string[] ExpectedBaselineTables =
    [
        "Users",
        "Transactions",
        "DeletedTransactions",
        "EWalletTransactions",
        "PrintingTransactions",
        "ServiceFees"
    ];

    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("DatabaseInitializer");
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        logger.LogInformation("Applying database migrations.");
        await EnsureMigrationHistoryForExistingSchemaAsync(dbContext, logger);
        await dbContext.Database.MigrateAsync();
        await EnsureReceiptStorageColumnsAsync(dbContext, logger);

        await SeedAdminUserAsync(scope.ServiceProvider, configuration, dbContext, logger);
    }

    private static async Task EnsureMigrationHistoryForExistingSchemaAsync(ApplicationDbContext dbContext, ILogger logger)
    {
        // Some environments were bootstrapped manually before EF migration history existed, so startup first reconciles that legacy state.
        var appliedMigrations = (await dbContext.Database.GetAppliedMigrationsAsync()).ToList();
        if (appliedMigrations.Count > 0)
        {
            return;
        }

        var pendingMigrations = (await dbContext.Database.GetPendingMigrationsAsync()).ToList();
        if (!pendingMigrations.Contains(InitialPostgresMigrationId))
        {
            return;
        }

        var shouldCloseConnection = dbContext.Database.GetDbConnection().State != ConnectionState.Open;
        if (shouldCloseConnection)
        {
            await dbContext.Database.OpenConnectionAsync();
        }

        try
        {
            var existingTables = new List<string>();
            foreach (var tableName in ExpectedBaselineTables)
            {
                if (await TableExistsAsync(dbContext, tableName))
                {
                    existingTables.Add(tableName);
                }
            }

            if (existingTables.Count == 0)
            {
                return;
            }

            var missingTables = ExpectedBaselineTables.Except(existingTables, StringComparer.Ordinal).ToList();
            if (missingTables.Count == 1 && missingTables[0] == "DeletedTransactions")
            {
                logger.LogInformation(
                    "Detected a legacy PostgreSQL schema without DeletedTransactions. Creating the archive table before baselining migrations.");

                // This is the known pre-migration drift case: core tables exist, but the archive table must be created before baselining.
                await EnsureDeletedTransactionsTableAsync(dbContext);
                await InsertMigrationHistoryRowAsync(dbContext, InitialPostgresMigrationId, GetEfProductVersion());
                return;
            }

            if (missingTables.Count > 0)
            {
                logger.LogWarning(
                    "Detected a PostgreSQL schema without EF migration history, but required tables are missing: {MissingTables}. Startup migration will continue without baselining.",
                    string.Join(", ", missingTables));
                return;
            }

            logger.LogInformation(
                "Detected an existing PostgreSQL schema without EF migration history. Marking {MigrationId} as applied.",
                InitialPostgresMigrationId);

            await InsertMigrationHistoryRowAsync(dbContext, InitialPostgresMigrationId, GetEfProductVersion());
        }
        finally
        {
            if (shouldCloseConnection)
            {
                await dbContext.Database.CloseConnectionAsync();
            }
        }
    }

    private static async Task<bool> TableExistsAsync(ApplicationDbContext dbContext, string tableName)
    {
        using var command = dbContext.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = @tableName
            )
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "@tableName";
        parameter.Value = tableName;
        command.Parameters.Add(parameter);

        var result = await command.ExecuteScalarAsync();
        return result is bool exists && exists;
    }

    private static async Task InsertMigrationHistoryRowAsync(
        ApplicationDbContext dbContext,
        string migrationId,
        string productVersion)
    {
        using (var createTableCommand = dbContext.Database.GetDbConnection().CreateCommand())
        {
            createTableCommand.CommandText = """
                CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                    "MigrationId" character varying(150) NOT NULL,
                    "ProductVersion" character varying(32) NOT NULL,
                    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
                )
                """;

            await createTableCommand.ExecuteNonQueryAsync();
        }

        using var command = dbContext.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES (@migrationId, @productVersion)
            """;

        var migrationIdParameter = command.CreateParameter();
        migrationIdParameter.ParameterName = "@migrationId";
        migrationIdParameter.Value = migrationId;
        command.Parameters.Add(migrationIdParameter);

        var productVersionParameter = command.CreateParameter();
        productVersionParameter.ParameterName = "@productVersion";
        productVersionParameter.Value = productVersion;
        command.Parameters.Add(productVersionParameter);

        await command.ExecuteNonQueryAsync();
    }

    private static async Task EnsureDeletedTransactionsTableAsync(ApplicationDbContext dbContext)
    {
        var commands = new[]
        {
            """
            CREATE TABLE IF NOT EXISTS "DeletedTransactions" (
                "Id" uuid NOT NULL,
                "OriginalTransactionId" uuid NOT NULL,
                "UserId" uuid NOT NULL,
                "TransactionType" text NOT NULL,
                "Amount" numeric(10,2) NOT NULL,
                "ServiceCharge" numeric(10,2),
                "TotalAmount" numeric(10,2),
                "Status" text NOT NULL,
                "FailureReason" character varying(500),
                "OriginalCreatedAt" timestamp with time zone NOT NULL,
                "OriginalUpdatedAt" timestamp with time zone NOT NULL,
                "DeletedAt" timestamp with time zone NOT NULL,
                "Provider" character varying(100),
                "Method" character varying(100),
                "AmountBracket" character varying(100),
                "ReferenceNumber" character varying(200),
                "ScreenshotUrl" character varying(500),
                "ScreenshotContent" bytea,
                "ScreenshotContentType" character varying(100),
                "EWalletBaseAmount" numeric(10,2),
                "PrintingServiceType" character varying(100),
                "PaperSize" character varying(50),
                "Color" character varying(50),
                "PrintingBaseAmount" numeric(10,2),
                "Quantity" integer,
                CONSTRAINT "PK_DeletedTransactions" PRIMARY KEY ("Id")
            )
            """,
            "CREATE UNIQUE INDEX IF NOT EXISTS \"IX_DeletedTransactions_OriginalTransactionId\" ON \"DeletedTransactions\" (\"OriginalTransactionId\")",
            "CREATE INDEX IF NOT EXISTS \"IX_DeletedTransactions_UserId\" ON \"DeletedTransactions\" (\"UserId\")",
            "CREATE INDEX IF NOT EXISTS \"IX_DeletedTransactions_OriginalCreatedAt\" ON \"DeletedTransactions\" (\"OriginalCreatedAt\")",
            "CREATE INDEX IF NOT EXISTS \"IX_DeletedTransactions_DeletedAt\" ON \"DeletedTransactions\" (\"DeletedAt\")"
        };

        foreach (var sql in commands)
        {
            using var command = dbContext.Database.GetDbConnection().CreateCommand();
            command.CommandText = sql;
            await command.ExecuteNonQueryAsync();
        }
    }

    private static async Task EnsureReceiptStorageColumnsAsync(ApplicationDbContext dbContext, ILogger logger)
    {
        var commands = new[]
        {
            "ALTER TABLE IF EXISTS \"EWalletTransactions\" ADD COLUMN IF NOT EXISTS \"ScreenshotContent\" bytea",
            "ALTER TABLE IF EXISTS \"EWalletTransactions\" ADD COLUMN IF NOT EXISTS \"ScreenshotContentType\" character varying(100)",
            "ALTER TABLE IF EXISTS \"DeletedTransactions\" ADD COLUMN IF NOT EXISTS \"ScreenshotContent\" bytea",
            "ALTER TABLE IF EXISTS \"DeletedTransactions\" ADD COLUMN IF NOT EXISTS \"ScreenshotContentType\" character varying(100)"
        };

        var shouldCloseConnection = dbContext.Database.GetDbConnection().State != ConnectionState.Open;
        if (shouldCloseConnection)
        {
            await dbContext.Database.OpenConnectionAsync();
        }

        try
        {
            foreach (var sql in commands)
            {
                using var command = dbContext.Database.GetDbConnection().CreateCommand();
                command.CommandText = sql;
                await command.ExecuteNonQueryAsync();
            }
        }
        finally
        {
            if (shouldCloseConnection)
            {
                await dbContext.Database.CloseConnectionAsync();
            }
        }

        logger.LogInformation("Ensured receipt storage columns exist for active and archived e-wallet transactions.");
    }

    private static string GetEfProductVersion()
    {
        return typeof(Migration).Assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
            .InformationalVersion
            ?.Split('+')[0]
            ?? "10.0.0";
    }

    private static async Task SeedAdminUserAsync(
        IServiceProvider services,
        IConfiguration configuration,
        ApplicationDbContext dbContext,
        ILogger logger)
    {
        var adminEmail = configuration["Seed:AdminEmail"]?.Trim();
        var adminPassword = configuration["Seed:AdminPassword"];

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            logger.LogInformation("Admin bootstrap skipped because seed credentials were not provided.");
            return;
        }

        var normalizedEmail = adminEmail.ToLowerInvariant();
        var existingAdmin = await dbContext.Users.AnyAsync(user => user.Email.ToLower() == normalizedEmail);
        if (existingAdmin)
        {
            logger.LogInformation("Admin bootstrap skipped because the configured admin account already exists.");
            return;
        }

        var authService = services.GetRequiredService<IAuthService>();
        var adminFullName = configuration["Seed:AdminFullName"]?.Trim();

        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = adminEmail,
            FullName = string.IsNullOrWhiteSpace(adminFullName) ? "Administrator" : adminFullName,
            Role = "Admin",
            PasswordHash = authService.HashPassword(adminPassword),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        });

        await dbContext.SaveChangesAsync();
        logger.LogInformation("Bootstrapped initial admin account for {AdminEmail}.", adminEmail);
    }
}