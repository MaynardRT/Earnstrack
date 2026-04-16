# Earnstrack Quick Reference Guide

## 🚀 Start Development in 3 Steps

### Step 1: Configure

```bash
# Windows
setup.bat

# Mac/Linux
bash setup.sh
```

### Step 2: Database

```bash
cd backend/eTracker.API
dotnet ef database update

# Create initial admin user (see AUTHENTICATION_SETUP.md)
```

### Step 3: Setup Authentication

Before running the application, create your first admin user:

1. Generate a BCrypt hash for your password: https://bcrypt-generator.com/
2. Insert the admin user into the database:

```bash
# Run the seed script to create test users
sqlcmd -S localhost -d eTracker -i database/seed-users.sql
```

Test Credentials:

- **Admin**: admin@localhost / Admin@123
- **Seller**: seller@localhost / Seller@123

See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) for detailed authentication setup instructions.

### Step 4: Run

Terminal 1:

```bash
cd backend/eTracker.API
dotnet run
```

Terminal 2:

```bash
cd frontend
npm run dev
```

## 🌐 Access Points

| Service           | URL                           |
| ----------------- | ----------------------------- |
| **Frontend**      | http://localhost:5173         |
| **Backend API**   | http://localhost:5000         |
| **Swagger UI**    | http://localhost:5000/swagger |
| **HTTPS Backend** | https://localhost:5001        |

## 📝 Key Files to Update

### Backend Configuration

**File:** `backend/eTracker.API/appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=eTracker;Trusted_Connection=True;"
  },
  "JwtSettings": {
    "SecretKey": "your-64-char-secret-key-here",
    "Issuer": "eTracker",
    "Audience": "eTracker-User",
    "ExpirationHours": 24
  }
}
```

**Note:** Google OAuth is no longer needed. Authentication uses database passwords only.

### Frontend Configuration

**File:** `frontend/.env.local`

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

**Note:** Google OAuth configuration removed. Use email/password login only.

## 🔨 Useful Commands

### Backend

```bash
# Restore packages
dotnet restore

# Build
dotnet build

# Run
dotnet run

# Create migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Run tests
dotnet test
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # Mac/Linux

# Check port (Windows)
netstat -ano | findstr :5000
```

### Database Connection Failed

1. Verify SQL Server is running
2. Check connection string
3. For SQL Server Express: `Server=.\SQLEXPRESS;`

### CORS Error

- Verify frontend URL in `Program.cs`
- Clear browser cache
- Check API is returning CORS headers

### Google OAuth Fails

- Verify ClientId in `.env.local` matches Google Cloud
- Check redirect URI is added in Google Console
- Ensure `appsettings.Development.json` has correct ClientSecret

## 📦 Project Stack

- **Backend:** .NET 10.0, ASP.NET Core, Entity Framework Core
- **Frontend:** React 18, TypeScript, Vite, Zustand, Tailwind CSS
- **Database:** SQL Server
- **Auth:** Google OAuth 2.0 + JWT
- **API:** RESTful with Swagger documentation

## 🗂️ Directory Quick Reference

```
backend/           → .NET API project
├── Controllers/   → API endpoints
├── Models/        → Data models
├── Services/      → Business logic
└── Data/          → Database context

frontend/          → React application
├── src/
│   ├── components/  → React components
│   ├── services/    → API client
│   ├── context/     → State management (Zustand)
│   └── styles/      → CSS files
└── public/        → Static assets

database/          → Database schemas
documentation/     → Guides and references
```

## 📚 Important Documentation

1. **README.md** - Start here
2. **DEVELOPMENT.md** - Setup and debugging
3. **CONFIGURATION.md** - All configuration options
4. **DEPLOYMENT.md** - Production deployment
5. **PROJECT_STATUS.md** - Current project health
6. **COMPLETION_SUMMARY.md** - What was done

## ✅ Pre-Startup Checklist

- [ ] SQL Server installed and running
- [ ] .NET 10.0 SDK installed
- [ ] Node.js 18+ installed
- [ ] appsettings.Development.json configured
- [ ] frontend/.env.local created and configured
- [ ] Database migrations run
- [ ] Google OAuth credentials configured

## 🔒 Security Quick Notes

- Never commit `.env.local` or secrets
- JWT Secret: min 64 random characters
- OAuth Secret: Keep private, never in version control
- Use environment variables in production
- Regular security updates required

## 🆘 Getting Help

1. **Check Logs** - Look at console output
2. **Read Documentation** - Relevant guide in `/documentation`
3. **Check Errors** - Full error details specify the issue
4. **Review Configuration** - Most issues are config-related

## 📊 Project Health

| Aspect        | Status               |
| ------------- | -------------------- |
| Code Quality  | ✅ Good              |
| Configuration | ✅ Ready             |
| Documentation | ✅ Comprehensive     |
| Architecture  | ✅ Sound             |
| Security      | ⚠️ Update AutoMapper |

---

**Last Updated:** April 13, 2026  
**Status:** Ready for Development
