# Earnstrack - Architecture Overview

## 📁 Project Structure

```
eTracker/
│
├── 📂 backend/
│   └── eTracker.API/
│       ├── Controllers/
│       │   ├── AuthController.cs          (JWT authentication, user management)
│       │   ├── TransactionsController.cs  (Transaction CRUD, reporting, period filters)
│       │   └── SettingsController.cs      (Service fees, products, user mgmt, CSV export)
│       ├── Models/
│       │   ├── User.cs
│       │   ├── Transaction.cs             (Parent record for all transaction types)
│       │   ├── EWalletTransaction.cs      (Provider, method, bracket, reference, screenshot)
│       │   ├── PrintingTransaction.cs     (Service type, paper size, color, quantity)
│       │   ├── ELoadingTransaction.cs     (Network, phone number, screenshot)
│       │   ├── BillsPaymentTransaction.cs (Biller, bill amount, screenshot)
│       │   ├── ServiceFee.cs
│       │   ├── Product.cs                 (Catalog item with stock count)
│       │   ├── DeletedTransaction.cs      (Archive table for 6-month retention)
│       │   └── AuditLog.cs
│       ├── Services/
│       │   ├── AuthService.cs             (JWT generation, BCrypt password hashing)
│       │   ├── TransactionService.cs      (All transaction types, PST time boundaries)
│       │   ├── ServiceFeeService.cs       (Fee lookup by type/network/method/bracket)
│       │   ├── ProductService.cs          (Inventory management, sell transactions)
│       │   ├── ReceiptStorageService.cs   (base64 screenshot → disk storage)
│       │   └── TransactionRetentionService.cs (6-month auto-archive background service)
│       ├── Data/
│       │   ├── ApplicationDbContext.cs    (EF Core context with all DbSets)
│       │   └── DatabaseInitializer.cs     (Runs MigrateAsync at startup)
│       ├── DTOs/
│       │   └── DTOs.cs                    (All request/response data shapes)
│       ├── Migrations/                    (EF Core migration files)
│       ├── Program.cs                     (DI registration, middleware pipeline)
│       ├── appsettings.json               (Base configuration)
│       └── eTracker.API.csproj            (Project file)
│
├── 📂 frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── BasicLoginPage.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.tsx          (Earnings summary + transaction table + detail modal)
│   │   │   ├── services/
│   │   │   │   ├── EWalletForm.tsx
│   │   │   │   ├── PrintingForm.tsx
│   │   │   │   ├── ELoadingForm.tsx
│   │   │   │   ├── BillsPaymentForm.tsx
│   │   │   │   └── ProductsPage.tsx       (Product catalog + sell button)
│   │   │   ├── settings/
│   │   │   │   └── SettingsPage.tsx
│   │   │   └── common/
│   │   │       ├── Layout.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Button.tsx
│   │   │       └── Alert.tsx
│   │   ├── context/
│   │   │   ├── authStore.ts               (Zustand: JWT + 1-hour idle timeout)
│   │   │   └── themeStore.ts              (Zustand: dark/light mode, persisted)
│   │   ├── services/
│   │   │   ├── api.ts                     (Axios instance, JWT interceptor, 401 redirect)
│   │   │   ├── authService.ts
│   │   │   ├── transactionService.ts
│   │   │   └── settingsService.ts
│   │   ├── types/
│   │   │   └── index.ts                   (All shared TypeScript interfaces)
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx                        (Router, protected routes, idle-timeout listener)
│   │   └── main.tsx                       (Entry point)
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── 📂 database/
│   └── schema.sql                         (Baseline PostgreSQL schema)
│
└── 📂 documentation/
    ├── README.md                          (Documentation index)
    ├── CONFIGURATION.md                   (Environment variable reference)
    ├── DEVELOPMENT.md                     (Local dev setup)
    └── DEPLOYMENT.md                      (Render + Supabase + GitHub Pages)
```

## 🔧 Technology Stack

### Backend

- **Framework**: ASP.NET Core 10.0
- **ORM**: Entity Framework Core
- **Database**: PostgreSQL / Supabase
- **Authentication**: JWT with password hashing (BCrypt)
- **API Docs**: Swagger/OpenAPI

### Frontend

- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React

## ✨ Core Features

### 1. Authentication

- ✅ Email/Password login with JWT
- ✅ BCrypt password hashing
- ✅ Role-based access (Admin / Seller)
- ✅ 1-hour idle session timeout (frontend enforced)

### 2. Dashboard

- ✅ Earnings summary — Daily / Weekly / Monthly (Philippine Standard Time)
- ✅ Transaction table with period filter
- ✅ Status breakdown: Pending / Completed / Failed
- ✅ Per-transaction detail modal (full details + inline receipt screenshot)

### 3. Transaction Types

- ✅ E-Wallet (GCash, Maya — CashIn/CashOut, with receipt screenshot)
- ✅ Printing / Scanning / Photocopy (paper size, color, quantity)
- ✅ E-Loading (mobile network, phone number, receipt screenshot)
- ✅ Bills Payment (biller name, bill amount, receipt screenshot)
- ✅ Products (item name from catalog, automatic stock decrement)

### 4. Settings

- ✅ Service fee configuration per transaction type, provider, method, bracket
- ✅ Product catalog management with stock tracking
- ✅ User management (Admin only — create, activate/deactivate)
- ✅ Transaction CSV export
- ✅ Dark/light mode (persisted across sessions)

### 5. Design

- ✅ Mobile-first responsive layout
- ✅ Dark mode support
- ✅ Smooth animations
- ✅ Accessible components
- ✅ Modern minimalist design

## 🚀 Quick Start

### Backend

```bash
cd backend/eTracker.API
dotnet restore
dotnet run   # DatabaseInitializer runs MigrateAsync automatically at startup
```

API at: `http://localhost:5000` — Swagger UI at `/swagger`

### Frontend

```bash
cd frontend
npm install
npm run dev        # Linux/Mac
npm.cmd run dev    # Windows PowerShell
```

Frontend at: `http://localhost:5173`

## 📝 API Endpoints

### Authentication

- `POST /api/auth/login` — Login, returns JWT + user info
- `POST /api/auth/admin/create-user` — Create user (Admin only)
- `GET /api/auth/me` — Current user profile
- `PUT /api/auth/me` — Update profile / password / avatar

### Transactions

- `GET /api/transactions/summary` — Earnings totals (daily/weekly/monthly)
- `GET /api/transactions/recent` — Recent transaction list
- `GET /api/transactions/by-period` — Filter by date range
- `POST /api/transactions/ewallet` — Create E-Wallet transaction
- `POST /api/transactions/printing` — Create Printing transaction
- `POST /api/transactions/eloading` — Create E-Loading transaction
- `POST /api/transactions/billspayment` — Create Bills Payment transaction
- `GET /api/transactions/{id}/receipt` — Serve receipt image (EWallet/ELoading/BillsPayment)

### Settings

- `GET/POST /api/settings/service-fees` — Service fee list + create
- `PUT/DELETE /api/settings/service-fees/{id}` — Update / delete fee
- `GET/POST /api/settings/products` — Product catalog + create
- `PUT/DELETE /api/settings/products/{id}` — Update / delete product
- `POST /api/settings/products/{id}/sell` — Sell one unit (decrements stock)
- `GET /api/settings/users` — User list (Admin)
- `PUT /api/settings/users/{id}` — Update user (Admin)
- `GET /api/settings/export/transactions` — Export CSV

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ BCrypt password hashing
- ✅ CORS configuration
- ✅ SQL injection prevention (EF Core)
- ✅ XSS protection (React)
- ✅ Role-based access control
- ✅ Admin-only user management endpoints

## 📊 Database Schema

### Tables

| Table                      | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `Users`                    | User accounts, roles, profile picture                                   |
| `Transactions`             | Parent record for every transaction (type, amount, status, ProductName) |
| `EWalletTransactions`      | Provider, method, bracket, reference number, screenshot                 |
| `PrintingTransactions`     | Service type, paper size, color, quantity                               |
| `ELoadingTransactions`     | Mobile network, phone number, screenshot                                |
| `BillsPaymentTransactions` | Biller name, bill amount, screenshot                                    |
| `ServiceFees`              | Fee rules per type/provider/method/bracket                              |
| `Products`                 | Catalog items with stock count                                          |
| `DeletedTransactions`      | Archive of transactions removed after 6-month retention                 |
| `AuditLogs`                | Admin action trail                                                      |

## 🔐 Security

- ✅ JWT token-based authentication (24-hour expiry)
- ✅ BCrypt password hashing
- ✅ CORS locked to configured origin
- ✅ SQL injection prevention via EF Core parameterized queries
- ✅ XSS protection — React escapes output by default
- ✅ Role-based access control (Admin / Seller)
- ✅ 401 → automatic session clear and redirect

## 🎓 Key Architecture Decisions

1. **Zustand** — Lightweight state management; no boilerplate compared to Redux
2. **EF Core + Npgsql** — Type-safe DB access; migrations keep schema in source control
3. **JWT + BCrypt** — Stateless auth; no session table needed
4. **Tailwind CSS** — Utility-first styling with built-in dark mode via `dark:` class prefix
5. **Philippine Standard Time** — All daily/weekly/monthly boundaries use `Asia/Manila` (UTC+8) so summaries align with business hours
6. **Receipt stored as bytes + relative URL** — Screenshots are saved to `wwwroot/receipts/` and also embedded as bytes so the API can serve them without filesystem lookups in the modal

## 📚 Documentation

| File                             | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `README.md`                      | Project overview, feature list, architecture summary     |
| `ARCHITECTURE.md`                | Detailed structure, endpoints, schema, design decisions  |
| `QUICK_START.md`                 | Minimal steps to get running locally                     |
| `documentation/DEVELOPMENT.md`   | Full local dev setup                                     |
| `documentation/DEPLOYMENT.md`    | Production deployment (Render + Supabase + GitHub Pages) |
| `documentation/CONFIGURATION.md` | Environment variable and appsettings reference           |
| `AUTHENTICATION_SETUP.md`        | First-time user/admin seeding guide                      |
