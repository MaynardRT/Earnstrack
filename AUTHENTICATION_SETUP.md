# Database-Only Authentication Setup Guide

## Overview

Earnstrack has been simplified to use **database-only, password-based authentication**. Google OAuth has been completely removed to streamline the authentication process for your 2-user production deployment.

## Quick Start - Test Credentials

Create your own local credentials to test the application:

| Email                     | Password                       | Role   |
| ------------------------- | ------------------------------ | ------ |
| `your-admin@example.com`  | `<your local admin password>`  | Admin  |
| `your-seller@example.com` | `<your local seller password>` | Seller |

⚠️ **IMPORTANT**: Do not commit even test passwords to a public repository. Use locally generated BCrypt hashes only.

## Key Changes

### What Was Removed

- ✂️ Google OAuth authentication endpoint (`/api/auth/google-login`)
- ✂️ Google Sign-In frontend components (`GoogleLoginPage.tsx`)
- ✂️ Public registration page (`RegistrationPage.tsx`)
- ✂️ Google.Apis.Auth NuGet package
- ✂️ Google authentication configuration from appsettings.json
- ✂️ `GoogleId` field from User model

### What Was Added

- ✅ Database migration to add `PasswordHash` column to Users table
- ✅ Admin-only user creation endpoint (`POST /api/auth/admin/create-user`)
- ✅ Admin user management form in Settings page
- ✅ Simplified login page with Email + Password only

---

## Authentication Flow

### Login Process

1. User navigates to `/login`
2. User enters email and password
3. System validates credentials against database
4. On success: JWT token is generated and stored in localStorage
5. User is redirected to `/dashboard`
6. On failure: Error message displayed

### User Management

**Only Admins can create new users:**

1. Admin logs in to the application
2. Admin navigates to Settings → User Management tab
3. Admin fills in the "Create New User" form:
   - Email Address
   - Full Name
   - Password (temporary or initial password)
   - Role (Admin or Seller)
4. System validates the form and creates the user
5. New user receives credentials out-of-band (email, verbally, etc.)
6. New user can immediately log in with their credentials

---

## Database Setup

### Initial User Creation

Before the first login, you must create at least one Admin user. You have two options:

#### Option 1: SQL Script (Recommended for Production)

1. Generate BCrypt-hashed passwords:

   - Use https://bcrypt-generator.com/
   - Or use this PowerShell command:
     ```powershell
     # Install-Module -Name BCrypt.Net-Next -Force (if needed)
     [BCrypt.Net.BCrypt]::HashPassword("your_password")
     ```

2. Run the seeding script:

   ```bash
   sqlcmd -S localhost -d eTracker -i database/seed-users.local.sql
   ```

3. Create that local file from `database/seed-users.template.sql` and update it with:
   - Actual BCrypt-hashed passwords
   - Desired email addresses and names

#### Option 2: Direct Admin Creation (Development)

If the database is empty, manually insert an admin user using SQL:

```sql
INSERT INTO Users (Id, Email, FullName, Role, PasswordHash, CreatedAt, UpdatedAt, IsActive)
VALUES (
    NEWID(),
    'admin@example.com',
    'Admin User',
    'Admin',
    '$2a$12$YourBCryptHashHere', -- Replace with actual BCrypt hash
    GETUTCDATE(),
    GETUTCDATE(),
    1
);
```

### Database Schema

The `Users` table now has this structure:

```sql
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL, -- 'Admin' or 'Seller'
    ProfilePicture NVARCHAR(MAX),
    PasswordHash NVARCHAR(MAX), -- BCrypt hashed password
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
```

---

## Backend API

### Endpoints

#### POST `/api/auth/login`

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "<user password>"
}
```

**Response (Success - 200 OK):**

```json
{
  "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "User": {
    "Id": "550e8400-e29b-41d4-a716-446655440000",
    "Email": "user@example.com",
    "FullName": "John Doe",
    "Role": "Seller",
    "ProfilePicture": null,
    "CreatedAt": "2026-04-16T12:00:00Z"
  }
}
```

**Response (Failure - 401 Unauthorized):**

```json
{
  "message": "Invalid email or password"
}
```

#### POST `/api/auth/admin/create-user` [Protected - Admin Only]

Create a new user (admin-only endpoint).

**Request:**

```json
{
  "email": "newuser@example.com",
  "fullName": "New User",
  "password": "<temporary password>",
  "role": "Seller"
}
```

**Response (Success - 201 Created):**

```json
{
  "Id": "550e8400-e29b-41d4-a716-446655440001",
  "Email": "newuser@example.com",
  "FullName": "New User",
  "Role": "Seller",
  "ProfilePicture": null,
  "CreatedAt": "2026-04-16T12:30:00Z"
}
```

**Response (Failure - 403 Forbidden):**

```json
// Returned if user is not an Admin
```

#### GET `/api/auth/me` [Protected]

Get current authenticated user information.

**Response:**

```json
{
  "Id": "550e8400-e29b-41d4-a716-446655440000",
  "Email": "user@example.com",
  "FullName": "John Doe",
  "Role": "Seller",
  "ProfilePicture": null,
  "CreatedAt": "2026-04-16T12:00:00Z"
}
```

#### POST `/api/auth/logout` [Protected]

Logout (token removal is client-side only).

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

## Frontend

### Login Page

Located at: `/frontend/src/components/auth/BasicLoginPage.tsx`

- Displays Email and Password form only
- No Google OAuth button
- Clear error messages on invalid credentials
- Redirects to `/dashboard` on successful login

### User Management

Located at: Settings → User Management tab

**Features:**

- Create new users with email, password, and role assignment
- View list of all users with their roles and status
- Activate/Deactivate users
- Real-time validation and error handling

### Configuration

**Key environment variables:**

- `JwtSettings__SecretKey` - JWT signing key
- `JwtSettings__Issuer` - JWT issuer name
- `JwtSettings__Audience` - JWT audience name
- `JwtSettings__ExpirationHours` - Token expiration (default: 24 hours)

---

## Security Considerations

✅ **Best Practices Implemented:**

- Passwords are hashed using BCrypt (not stored in plaintext)
- JWT tokens are used for stateless authentication
- Token expiration is enforced (default: 24 hours)
- Admin-only endpoints are protected with role checking
- Email uniqueness is enforced at database level
- All passwords should meet minimum complexity requirements

⚠️ **For Production Deployment:**

1. Use HTTPS for all API communication
2. Implement HTTPS redirect in production environment
3. Use strong, randomly generated JWT secret keys
4. Rotate JWT secret keys periodically
5. Implement password complexity validation
6. Consider adding:
   - Password reset functionality
   - Login attempt throttling
   - Account lockout after failed attempts
   - Audit logging for user creation and login events

---

## Troubleshooting

### "Invalid email or password" on Login

- Verify email exists in the database
- Check that the account is active (`IsActive = 1`)
- Ensure the password was hashed correctly during user creation

### "Forbidden" when creating users

- Verify that the logged-in user has the "Admin" role
- Check that the Authorization header contains a valid JWT token

### BCrypt hash mismatch

- Regenerate the hash using a consistent BCrypt implementation
- Ensure the salt rounds are consistent (typically 12)

### Token expired

- Re-login to get a fresh token
- Tokens expire after `JwtSettings__ExpirationHours` (default: 24 hours)

---

## Migration from Google OAuth

If you had existing Google OAuth users, you'll need to:

1. Manually create accounts for those users in the system
2. Set temporary passwords and communicate them out-of-band
3. Let users login and optionally change their passwords

---

## Development Mode

To test the authentication system:

1. **Start the backend:**

   ```bash
   cd backend/eTracker.API
   dotnet run
   ```

2. **Start the frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Create a test user** via Settings → User Management or directly in the database

4. **Test the login** at `http://localhost:5173/login`

---

## Next Steps

1. ✅ Run database migrations: `dotnet ef database update`
2. ✅ Create initial admin user using seed script
3. ✅ Test login functionality
4. ✅ Create additional users via admin panel
5. ✅ Deploy to production
