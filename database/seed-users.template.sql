-- Template seeding script for local development only.
-- Copy this file to seed-users.local.sql and replace every placeholder before running it.
-- Never commit real emails, passwords, or BCrypt hashes to version control.

-- Insert Admin User
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'REPLACE_WITH_ADMIN_EMAIL')
BEGIN
    INSERT INTO Users (Id, Email, FullName, Role, PasswordHash, CreatedAt, UpdatedAt, IsActive)
    VALUES (
        NEWID(),
        'REPLACE_WITH_ADMIN_EMAIL',
        'REPLACE_WITH_ADMIN_NAME',
        'Admin',
        'REPLACE_WITH_ADMIN_BCRYPT_HASH',
        GETUTCDATE(),
        GETUTCDATE(),
        1
    );
END;

-- Insert Seller User
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'REPLACE_WITH_SELLER_EMAIL')
BEGIN
    INSERT INTO Users (Id, Email, FullName, Role, PasswordHash, CreatedAt, UpdatedAt, IsActive)
    VALUES (
        NEWID(),
        'REPLACE_WITH_SELLER_EMAIL',
        'REPLACE_WITH_SELLER_NAME',
        'Seller',
        'REPLACE_WITH_SELLER_BCRYPT_HASH',
        GETUTCDATE(),
        GETUTCDATE(),
        1
    );
END;