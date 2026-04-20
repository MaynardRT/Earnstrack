# Configuration Guide

## JWT Configuration

### Secret Key Generation

For production, generate a strong secret key:

```powershell
# PowerShell
$key = [System.Random]::new() |
    ForEach-Object { [Convert]::ToString([byte]($_ % 256), 16).PadLeft(2, '0') } |
    Select-Object -First 64 |
    Join-String
```

Or use an online generator: https://www.random.org/bytes/

### JWT Settings

```json
"JwtSettings": {
  "SecretKey": "your-min-64-char-secret-key",
  "Issuer": "eTracker",
  "Audience": "eTracker-User",
  "ExpirationHours": 24
}
```

## Authentication Configuration

The application uses JWT plus database-backed email/password authentication.

### Local Development

Use your local `appsettings.Development.json` only on your machine:

```json
"JwtSettings": {
  "SecretKey": "replace-with-a-local-secret-of-at-least-32-characters"
}
```

Create local users with BCrypt password hashes using `database/seed-users.template.sql`.

## Backend Configuration (appsettings.json)

### Connection Strings

#### SQL Server (Windows Authentication)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=eTracker;Trusted_Connection=True;Connection Timeout=30;"
  }
}
```

For development environment (`appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=eTracker;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### JWT Settings

```json
{
  "JwtSettings": {
    "SecretKey": "your-very-long-secret-key-at-least-32-characters",
    "Issuer": "eTracker",
    "Audience": "eTracker-User",
    "ExpirationHours": 24
  }
}
```

## Frontend Configuration

### .env.local

```
VITE_API_URL=http://localhost:5000/api
```

### .env.production

```
VITE_API_URL=https://your-production-api.com/api
```

## Database Setup

1. Create the database using the schema in `database/schema.sql`
2. Update connection strings in both backend and Entity Framework configuration
3. Run Entity Framework migrations if needed

## Running the Application

### Development

```bash
# Terminal 1: Backend
cd backend/eTracker.API
dotnet run

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Production

Update configuration files with production values and deploy accordingly.

## Security Considerations

1. **JWT Secret Key**: Generate a strong, random secret key (min 32 characters)
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS appropriately for your domain
4. **OAuth Secrets**: Never commit secrets to repository
5. **Database**: Use strong, complex passwords
6. **Token Expiration**: Set appropriate token expiration times
