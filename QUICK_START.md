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
2. Copy `database/seed-users.template.sql`, replace the placeholder emails and BCrypt hashes, then run your local script:

```bash
# Example: run your customized local seed script
sqlcmd -S localhost -d eTracker -i database/seed-users.local.sql
```

Suggested local accounts:

- **Admin**: your admin email and password
- **Seller**: your seller email and password

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
    "SecretKey": "replace-with-a-local-dev-secret-of-at-least-32-characters",
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

### Login Fails

- Verify the user exists in the database
- Check the BCrypt password hash in your local seed script
- Ensure `appsettings.Development.json` contains a local JWT secret

## 📦 Project Stack

- **Backend:** .NET 10.0, ASP.NET Core, Entity Framework Core
- **Frontend:** React 18, TypeScript, Vite, Zustand, Tailwind CSS
- **Database:** SQL Server
- **Auth:** Email/Password + JWT
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
- [ ] Local admin credentials seeded

## 🔒 Security Quick Notes

- Never commit `.env.local` or secrets
- JWT Secret: min 64 random characters
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
