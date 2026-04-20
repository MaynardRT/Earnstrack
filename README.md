# Earnstrack - Complete E-Commerce Transaction Tracker

A full-stack application for managing e-wallet and printing service transactions with comprehensive role-based access control and reporting.

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
- SQL Server (or configure SQLite/PostgreSQL)

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

- **Controllers**: API endpoints for Auth, Transactions, and Settings
- **Services**: Business logic for authentication, transactions, and service fees
- **Models**: Entity models for User, Transaction, EWalletTransaction, PrintingTransaction, ServiceFee, and AuditLog
- **Data**: Entity Framework Core DbContext with SQL Server support
- **DTOs**: Request/response data transfer objects

### Frontend (React + TypeScript)

- **Components**: Organized by feature (auth, dashboard, services, settings)
- **Context**: Zustand stores for auth and theme management
- **Services**: API client and service layer
- **Styles**: Tailwind CSS with dark mode support

## 📁 Project Structure

```
eTracker/
├── backend/
│   └── eTracker.API/
│       ├── Controllers/          # API endpoints
│       ├── Models/              # Domain models
│       ├── Services/            # Business logic
│       ├── Data/                # DbContext and migrations
│       ├── DTOs/                # Data transfer objects
│       ├── Program.cs           # Application startup
│       ├── appsettings.json     # Configuration
│       └── eTracker.API.csproj  # Project file
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── context/             # Zustand stores
│   │   ├── services/            # API clients
│   │   ├── styles/              # CSS files
│   │   ├── types/               # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── database/
│   └── schema.sql              # Database schema
│
└── documentation/
    ├── DEVELOPMENT.md
    ├── DEPLOYMENT.md
    ├── CONFIGURATION.md
    └── README.md
```

## 🔐 Authentication

The application uses email/password authentication with JWT tokens for secure access:

1. Users login with email and password
2. Credentials are validated on the backend
3. JWT token is generated and stored in localStorage
4. All API requests include the JWT in the Authorization header

## 📊 Features

### Transaction Management

- E-Wallet transactions tracking
- Printing service transactions
- Real-time transaction reporting
- Export transaction data

### Service Fee Management

- Configure service fees by transaction type
- Apply percentage-based fees
- Audit trail for fee changes

### User Management

- Role-based access control (Admin/Seller)
- User profile management
- Activity logging

### Settings

- User preferences
- Service configuration
- Data export functionality

## 🛠️ Development

### Running Tests

```bash
# Backend
cd backend/eTracker.API
dotnet test

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend/eTracker.API
dotnet publish -c Release

# Frontend
cd frontend
npm run build
```

## 🔧 Troubleshooting

### Database Connection Issues

- Verify SQL Server is running
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
