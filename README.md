# Earnstrack

Earnstrack is a full-stack transaction tracker for small businesses. It records common service transactions, product sales, inventory, fees, and earnings in one place.

## Features

- E-wallet transactions for GCash and Maya
- Printing, scanning, photocopying, and other service transactions
- E-loading and bills payment records
- Product catalog, inventory tracking, and quantity-based sales
- Daily, weekly, and monthly earnings summaries
- Configurable service fees
- Receipt image uploads
- Admin and seller roles
- CSV transaction export

## Technology

- Backend: ASP.NET Core and Entity Framework Core
- Frontend: React, TypeScript, Vite, and Tailwind CSS
- Database: PostgreSQL

## Local Development

### Requirements

- .NET SDK 10 or later
- Node.js 18 or later
- PostgreSQL 15 or later

### Backend

1. Configure the database connection and authentication settings using local configuration or environment variables.
2. From `backend/eTracker.API`, restore dependencies and apply the database migrations:

```bash
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend

From `frontend`:

```bash
npm install
npm run dev
```

Set the frontend API URL in a local environment file when it differs from the project default. Keep local environment files and all credentials out of version control.

## Configuration and Security

- Never commit passwords, password hashes, JWT keys, database connection strings, access tokens, or production environment files.
- Use unique secrets for every environment and provide production secrets through the hosting platform's secret manager.
- Create local users with local credentials. Do not use shared demo credentials.
- Restrict database access to trusted services and use encrypted connections in production.
- Review CORS, authentication, upload limits, and logging settings before deployment.

## Testing and Builds

Run the backend checks from the repository root:

```bash
dotnet build eTracker.sln
dotnet test eTracker.sln
```

Run the frontend checks from `frontend`:

```bash
npm test
npm run build
```

On Windows PowerShell, use `npm.cmd` if the `npm` command is blocked by execution policy.

## Documentation

Additional development, configuration, and deployment guidance is available in the `documentation` directory. Review those documents before deploying, and remove or replace any environment-specific examples before sharing them publicly.

## License

This project is proprietary and confidential.
