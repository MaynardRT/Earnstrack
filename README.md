# Earnstrack - Transaction Tracker

A full-stack application for tracking daily business transactions — E-Wallet (GCash/Maya), Printing/Scanning/Photocopy, E-Loading, Bills Payment, and product sales — with role-based access, earnings summaries, and receipt screenshot storage.

## 🔐 Test Credentials

Create your own local credentials during setup. Do not commit shared passwords to a public repository.

```
Email: your-admin-email@example.com
Password: <your local admin password>
Role: Admin
```

Or for a seller account:

```
Email: your-seller-email@example.com
Password: <your local seller password>
Role: Seller
```

Use the template in `database/seed-users.template.sql` to create local accounts with your own BCrypt password hashes.

---

## 🚀 Quick Start

### Prerequisites

- .NET 10.0 SDK
- Node.js 18+ and npm
- PostgreSQL 15+ or a Supabase Postgres instance

### Backend Setup

```bash
cd backend/eTracker.API

# Restore dependencies
dotnet restore

# Create and update database
dotnet ef database update

# Run the API server
dotnet run
```

The API will be available at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local from .env.example
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🏗️ Architecture

### Backend (.NET 10.0)

- **Controllers**: `AuthController` (login, user management), `TransactionsController` (all transaction types, summaries, period filters), `SettingsController` (service fees, products, export, profile)
- **Services**: `AuthService` (JWT generation, BCrypt), `TransactionService` (business logic, Philippine Standard Time boundaries), `ServiceFeeService` (fee lookup by type/network), `ProductService` (inventory + sell), `ReceiptStorageService` (base64 → disk), `TransactionRetentionService` (6-month auto-archive)
- **Models**: `User`, `Transaction`, `EWalletTransaction`, `PrintingTransaction`, `ELoadingTransaction`, `BillsPaymentTransaction`, `ServiceFee`, `Product`, `DeletedTransaction`, `AuditLog`
- **Data**: EF Core `ApplicationDbContext` + Npgsql; migrations in `Data/Migrations/`
- **DTOs**: All request/response shapes in `DTOs/DTOs.cs`

### Frontend (React 18 + TypeScript)

- **Components**: Organized by feature — `auth/`, `dashboard/`, `services/` (EWallet, Printing, ELoading, BillsPayment, Products), `settings/`, `common/`
- **Context**: Zustand stores — `authStore.ts` (JWT + 1-hour idle timeout), `themeStore.ts` (dark/light, persisted to localStorage)
- **Services**: Axios instance with auto-JWT injection and 401 redirect (`api.ts`), typed wrappers per domain (`transactionService.ts`, `authService.ts`, `settingsService.ts`)
- **Styles**: Tailwind CSS with class-based dark mode (`dark:` prefix)

## 📁 Project Structure

```
eTracker/
├── backend/
│   └── eTracker.API/
│       ├── Controllers/          # HTTP endpoints (Auth, Transactions, Settings)
│       ├── Models/               # EF Core domain models
│       ├── Services/             # Business logic (transactions, fees, products, receipts)
│       ├── Data/                 # ApplicationDbContext + EF migrations
│       ├── DTOs/                 # All request/response data shapes
│       ├── Middleware/           # Custom ASP.NET middleware (if any)
│       ├── Program.cs            # App startup, DI registration, middleware pipeline
│       ├── appsettings.json      # Base configuration
│       └── eTracker.API.csproj   # Project file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # Login page
│   │   │   ├── dashboard/        # Earnings summary + transaction table
│   │   │   ├── services/         # EWallet, Printing, ELoading, BillsPayment, Products forms
│   │   │   ├── settings/         # Service fees, user management, export
│   │   │   └── common/           # Layout, Sidebar, Card, Button, Alert
│   │   ├── context/              # Zustand stores (auth, theme)
│   │   ├── services/             # Axios API wrappers
│   │   ├── styles/               # Tailwind globals
│   │   ├── types/                # Shared TypeScript interfaces
│   │   ├── App.tsx               # Router + protected routes
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── database/
│   └── schema.sql                # Baseline PostgreSQL schema
│
└── documentation/
    ├── DEVELOPMENT.md            # Local dev setup guide
    ├── DEPLOYMENT.md             # Render + Supabase + GitHub Pages deployment
    ├── CONFIGURATION.md          # appsettings / env var reference
    └── README.md                 # Documentation index
```

## 🔐 Authentication

The application uses email/password authentication with JWT tokens for secure access:

1. Users login with email and password
2. Credentials are validated on the backend
3. JWT token is generated and stored in localStorage
4. All API requests include the JWT in the Authorization header

## 📊 Features

### Transaction Types

| Type              | Details stored                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **E-Wallet**      | Provider (GCash/Maya), method (CashIn/CashOut), amount bracket, reference number, screenshot |
| **Printing**      | Service type (Printing/Scanning/Photocopy), paper size, color mode, quantity                 |
| **E-Loading**     | Mobile network, phone number, screenshot                                                     |
| **Bills Payment** | Biller name, bill amount, screenshot                                                         |
| **Products**      | Item name (from product catalog), price                                                      |

### Dashboard & Reporting

- Earnings summary broken down by Daily / Weekly / Monthly (Philippine Standard Time boundaries)
- Period-filtered transaction table with sortable columns
- Status breakdown — Pending / Completed / Failed counts and totals
- Per-transaction modal with full details and inline receipt screenshot

### Service Fee Management

- Configurable fees per transaction type, provider, method, and amount bracket
- Fees applied automatically at transaction creation time

### Products / Inventory

- Product catalog with stock tracking
- Sell button decrements stock and records a Products transaction

### User Management (Admin only)

- Role-based access control: `Admin` and `Seller`
- Admin can create, deactivate, and manage all user accounts

### Settings

- Light/dark mode (persisted to localStorage)
- Service fee CRUD
- Transaction data export to CSV
- Profile picture upload

## 🛠️ Development

### Running Tests

```bash
# Backend unit tests
cd backend/eTracker.API.Tests
dotnet test

# Frontend (Vite does not include a test runner by default; add Vitest if needed)
```

### Building for Production

```bash
# Backend
cd backend/eTracker.API
dotnet publish -c Release

# Frontend
cd frontend
npm run build        # Linux/Mac
npm.cmd run build    # Windows PowerShell (execution policy blocks npm.ps1)
```

## 🔧 Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running or Supabase credentials are correct
- Check connection string in `appsettings.json`
- Ensure database user has proper permissions

### CORS Errors

- Verify frontend URL is in the CORS policy in `Program.cs`
- Check that API is responding to `OPTIONS` requests

### Authentication Issues

- Verify the JWT secret key and login credentials are configured correctly
- Check JWT secret key is properly configured
- Ensure tokens have not expired

## 📝 Environment Variables

Create `.env.local` in the frontend directory from `.env.example` with your configuration.

For backend, use `appsettings.Development.json` for development configuration and environment variables for production.

## 📜 License

This project is proprietary and confidential.

## 🤝 Support

For issues and feature requests, please contact the development team.
