# Development Guide

## Local Development Setup

### Prerequisites

- **.NET 10.0 SDK** - [Download](https://dotnet.microsoft.com/en-us/download)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Visual Studio Code** or **Visual Studio 2022+**

### Backend Setup

#### 1. Install Dependencies

```bash
cd backend/eTracker.API
dotnet restore
```

#### 2. Configure Database

Update the connection string in `appsettings.Development.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=etracker_dev;Username=postgres;Password=postgres"
}
```

#### 3. Apply Migrations and Run

```bash
# Install EF CLI tool (once per machine)
dotnet tool install --global dotnet-ef

# Apply all pending EF migrations
# (DatabaseInitializer also runs MigrateAsync at startup, so this step is optional for dev)
dotnet ef database update

# Start the API
dotnet run
# or for auto-reload on file changes:
dotnet watch run
```

Backend starts at `http://localhost:5000` (HTTPS: `https://localhost:5001`).  
Swagger UI is available at `/swagger`.

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install          # Linux/Mac
npm.cmd install      # Windows PowerShell (execution policy blocks npm.ps1)

# Create .env.local with your local API URL
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev          # Linux/Mac
npm.cmd run dev      # Windows PowerShell
```

Frontend starts at `http://localhost:5173`.

## Development Workflow

### Running Both Servers

1. **Terminal 1 - Backend**:

   ```bash
   cd backend/eTracker.API
   dotnet run
   ```

2. **Terminal 2 - Frontend**:

   ```bash
   cd frontend
   npm run dev          # Linux/Mac
   npm.cmd run dev      # Windows PowerShell
   ```

3. Open browser to `http://localhost:5173`

### Hot Reload

- **Frontend**: Changes to React components automatically reload
- **Backend**: Use `dotnet watch run` for automatic reload on C# changes

## Database Troubleshooting

### Reset Database

```bash
cd backend/eTracker.API

# Remove current migrations
dotnet ef database drop -f

# Create fresh migration
dotnet ef migrations add InitialPostgres

# Apply migration
dotnet ef database update
```

### Check Connection String

- Default: `Host=localhost;Port=5432;Database=etracker_dev;Username=postgres;Password=postgres`
- Update `appsettings.Development.json` if needed

## Debugging

### Backend Debugging in VS Code

1. Install C# Dev Kit extension
2. Press F5 to start debugging
3. Set breakpoints in C# code
4. View local variables in Debug panel

### Frontend Debugging

1. Open DevTools (F12)
2. Use Sources tab to set breakpoints
3. Console for checking logs
4. Network tab to inspect API calls

## API Testing

### Using Swagger UI

- Navigate to `https://localhost:5001/swagger` after starting backend
- Test endpoints directly from browser

### Using curl

```bash
# Get transactions
curl -X GET "http://localhost:5000/api/transactions/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Code Style

### Backend

- Follow C# naming conventions (PascalCase for public members)
- Use async/await for I/O operations
- XML comments for public APIs

### Frontend

- Use React functional components with hooks
- Follow TypeScript strict mode
- Component should be in PascalCase
- Files should be camelCase except components

## Common Issues

### "Database connection failed"

- Check PostgreSQL is running
- Verify connection string in appsettings.json
- Confirm database name matches

### "CORS error"

- Check CORS policy in Program.cs
- Verify frontend URL is in allowed origins
- Clear browser cache

### "Module not found" (Frontend)

- Delete `node_modules` and reinstall dependencies
- Run `npm install` again

### "Port already in use"

- Kill process on port 5000-5001: `lsof -i :5000`
- Or use different port in configuration

## Performance Tips

1. **Database**: Add indexes on frequently queried columns
2. **Frontend**: Use `React.memo()` for expensive components
3. **Backend**: Implement caching for service fees
4. **Build**: Run `npm run build` to check bundle size

## Next Steps

1. Review dependency vulnerability warnings regularly
2. Add Vitest unit tests for frontend components
3. Set up a CI/CD pipeline (see `documentation/CI_CD.md`)

## Documentation

- [Setup Guide](../documentation/README.md)
- [Configuration Guide](../documentation/CONFIGURATION.md)
- [Database Schema](../database/schema.sql)

## Getting Help

- Check error logs in `logs/` folder
- Review API responses in browser DevTools
- Check VS Code debug console for backend errors
