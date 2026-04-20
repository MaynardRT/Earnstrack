-- eTracker manual schema bootstrap for PostgreSQL / Supabase.
-- Use this only when you are not letting EF Core migrations create the schema.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "Users" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Email" varchar(255) NOT NULL UNIQUE,
    "FullName" varchar(255) NOT NULL,
    "Role" varchar(50) NOT NULL,
    "ProfilePicture" text,
    "PasswordHash" varchar(255) NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
    "UpdatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
    "IsActive" boolean NOT NULL DEFAULT true,
    CONSTRAINT "CK_Users_Role" CHECK ("Role" IN ('Admin', 'Seller'))
);

CREATE TABLE IF NOT EXISTS "ServiceFees" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "ServiceType" varchar(50) NOT NULL,
    "ProviderType" varchar(50),
    "MethodType" varchar(50),
    "FeePercentage" numeric(5, 2),
    "FlatFee" numeric(10, 2),
    "BracketMinAmount" numeric(10, 2),
    "BracketMaxAmount" numeric(10, 2),
    "CreatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
    "UpdatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_ServiceFees_ServiceType" ON "ServiceFees" ("ServiceType");

CREATE TABLE IF NOT EXISTS "Transactions" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "TransactionType" varchar(50) NOT NULL,
    "Amount" numeric(10, 2) NOT NULL,
    "ServiceCharge" numeric(10, 2),
    "TotalAmount" numeric(10, 2),
    "Status" varchar(50) NOT NULL DEFAULT 'Pending',
    "FailureReason" varchar(500),
    "CreatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
    "UpdatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT "CK_Transactions_Type" CHECK ("TransactionType" IN ('EWallet', 'Printing')),
    CONSTRAINT "CK_Transactions_Status" CHECK ("Status" IN ('Pending', 'Completed', 'Failed'))
);

CREATE TABLE IF NOT EXISTS "EWalletTransactions" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TransactionId" uuid NOT NULL UNIQUE REFERENCES "Transactions"("Id") ON DELETE CASCADE,
    "Provider" varchar(100) NOT NULL,
    "Method" varchar(100) NOT NULL,
    "AmountBracket" varchar(100),
    "ReferenceNumber" varchar(200) NOT NULL,
    "ScreenshotUrl" varchar(500),
    "ScreenshotContent" bytea,
    "ScreenshotContentType" varchar(100),
    "BaseAmount" numeric(10, 2) NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS "PrintingTransactions" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TransactionId" uuid NOT NULL UNIQUE REFERENCES "Transactions"("Id") ON DELETE CASCADE,
    "ServiceType" varchar(100) NOT NULL,
    "PaperSize" varchar(50) NOT NULL,
    "Color" varchar(50) NOT NULL,
    "BaseAmount" numeric(10, 2) NOT NULL,
    "Quantity" integer NOT NULL DEFAULT 1,
    "CreatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS "DeletedTransactions" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "OriginalTransactionId" uuid NOT NULL UNIQUE,
    "UserId" uuid NOT NULL,
    "TransactionType" text NOT NULL,
    "Amount" numeric(10, 2) NOT NULL,
    "ServiceCharge" numeric(10, 2),
    "TotalAmount" numeric(10, 2),
    "Status" text NOT NULL,
    "FailureReason" varchar(500),
    "OriginalCreatedAt" timestamptz NOT NULL,
    "OriginalUpdatedAt" timestamptz NOT NULL,
    "DeletedAt" timestamptz NOT NULL,
    "Provider" varchar(100),
    "Method" varchar(100),
    "AmountBracket" varchar(100),
    "ReferenceNumber" varchar(200),
    "ScreenshotUrl" varchar(500),
    "ScreenshotContent" bytea,
    "ScreenshotContentType" varchar(100),
    "EWalletBaseAmount" numeric(10, 2),
    "PrintingServiceType" varchar(100),
    "PaperSize" varchar(50),
    "Color" varchar(50),
    "PrintingBaseAmount" numeric(10, 2),
    "Quantity" integer
);

CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" uuid REFERENCES "Users"("Id") ON DELETE SET NULL,
    "Action" text,
    "TableName" text,
    "RecordId" uuid,
    "OldValues" text,
    "NewValues" text,
    "CreatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS "IX_Transactions_UserId" ON "Transactions"("UserId");
CREATE INDEX IF NOT EXISTS "IX_Transactions_CreatedAt" ON "Transactions"("CreatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users"("Email");
CREATE INDEX IF NOT EXISTS "IX_DeletedTransactions_UserId" ON "DeletedTransactions"("UserId");
CREATE INDEX IF NOT EXISTS "IX_DeletedTransactions_OriginalCreatedAt" ON "DeletedTransactions"("OriginalCreatedAt");
CREATE INDEX IF NOT EXISTS "IX_DeletedTransactions_DeletedAt" ON "DeletedTransactions"("DeletedAt");
