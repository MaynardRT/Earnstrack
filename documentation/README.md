# Earnstrack - Full Stack Application

> A comprehensive business earnings management application built with ASP.NET Core and React.

## Project Structure

```
eTracker/
├── backend/                      # C# ASP.NET Core Web API
│   ├── eTracker.API/
│   │   ├── Controllers/          # API endpoints
│   │   ├── Models/               # Entity models
│   │   ├── Services/             # Business logic
│   │   ├── Data/                 # Database context
│   │   ├── DTOs/                 # Data transfer objects
│   │   └── Program.cs            # Entry point
│   └── appsettings.json          # Configuration
├── frontend/                     # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   ├── context/              # State management (Zustand)
│   │   ├── types/                # TypeScript types
│   │   ├── styles/               # Global styles
│   │   └── App.tsx               # Root component
│   └── public/                   # Static assets
└── database/                     # SQL Server schema
    └── schema.sql                # Database initialization
```

## Technology Stack

### Backend

- **Framework**: ASP.NET Core 10.0
- **ORM**: Entity Framework Core
- **Database**: MS SQL Server
- **Authentication**: JWT + email/password
- **API Documentation**: Swagger/OpenAPI

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React

## Features

### Authentication

- Email/password login
- JWT-based session management
- Admin-managed user creation (Admin/Seller)
- Secure logout with token cleanup

### Dashboard

- Earnings summary (Daily, Weekly, Monthly)
- Recent transactions table with sortable columns
- Period-based transaction filtering
- Real-time transaction status display

### Services

- **E-Wallet Transactions**: GCash/Maya, Cash-In/Cash-Out, configurable amount brackets
- **Printing Services**: Printing/Scanning/Photocopy, paper size options, color selections
- **Products**: Placeholder for future development

### Settings

- **Appearance**: Light/Dark mode toggle
- **Service Fees**: Dynamic fee configuration (percentage/flat rate)
- **User Management**: Admin-only user access control
- **Data Export**: CSV export of transaction history

### Design

- Mobile-first responsive design
- Dark mode support throughout
- Smooth animations and transitions
- Accessible component structure

## Getting Started

### Prerequisites

- Node.js 18+ (Frontend)
- .NET 8 SDK (Backend)
- MS SQL Server 2019+

### Backend Setup

1. Navigate to backend folder:

   ```bash
   cd backend/eTracker.API
   ```

2. Install dependencies:

   ```bash
   dotnet restore
   ```

3. Update database connection string in `appsettings.json`:

   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;Database=eTracker;Trusted_Connection=True;"
     }
   }
   ```

4. Run database migrations:

   ```bash
   dotnet ef database update
   ```

5. Start the API server:
   ```bash
   dotnet run
   ```

The API will be available at `http://localhost:5000` (configured in appsettings.json)

### Frontend Setup

1. Navigate to frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` and update it with your API URL:

   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Configuration

### Environment Variables (Backend)

Update `appsettings.json` with:

- Database connection string
- JWT secret key (change from default)

### Environment Variables (Frontend)

Create `.env.local` file with:

- API base URL

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/admin/create-user` - Create user (Admin only)
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user info

### Transactions

- `GET /api/transactions/summary` - Get earnings summary
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/by-period` - Filter by period
- `POST /api/transactions/ewallet` - Create E-Wallet transaction
- `POST /api/transactions/printing` - Create Printing transaction

### Settings

- `GET /api/settings/service-fees` - Get all service fees
- `POST /api/settings/service-fees` - Create service fee (Admin)
- `PUT /api/settings/service-fees/{id}` - Update service fee (Admin)
- `GET /api/settings/users` - Get all users (Admin)
- `PUT /api/settings/users/{id}` - Update user (Admin)
- `GET /api/settings/export/transactions` - Export to CSV

## Database Schema

### Key Tables

- **Users**: User accounts and profiles
- **Transactions**: Main transaction records
- **EWalletTransactions**: E-Wallet specific details
- **PrintingTransactions**: Printing service details
- **ServiceFees**: Fee configuration
- **AuditLogs**: Activity tracking

See `database/schema.sql` for complete schema details.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the repository.
