# Deployment Guide

## Recommended Production Shape

This repository is now aligned to a low-cost hosted deployment:

1. Frontend on GitHub Pages
2. Backend on Render using Docker
3. Database on Supabase Postgres

## Backend Configuration

Set these values in your hosting platform:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=YOUR_SUPABASE_HOST;Port=5432;Database=postgres;Username=postgres;Password=YOUR_SUPABASE_PASSWORD;SSL Mode=Require;Trust Server Certificate=true;
JwtSettings__SecretKey=YOUR_LONG_RANDOM_SECRET
JwtSettings__Issuer=Earnstrack
JwtSettings__Audience=Earnstrack-users
Cors__AllowedOrigins__0=https://maynardrt.github.io
```

Optional first-run bootstrap values:

```text
Seed__AdminEmail=your-admin-email
Seed__AdminPassword=your-strong-admin-password
Seed__AdminFullName=Earnstrack Administrator
```

## Backend Deployment On Render

The repository now includes a Dockerfile at `backend/eTracker.API/Dockerfile`.

In Render:

1. Create a new `Web Service`
2. Choose the repository
3. Set `Language` to `Docker`
4. Set `Root Directory` to `backend/eTracker.API`
5. Set `Health Check Path` to `/health`
6. Add the environment variables listed above

Render will build the image directly from the repository and expose the API on the generated `.onrender.com` domain.

## Supabase Setup

1. Create a new Supabase project
2. Open `Project Settings -> Database`
3. Copy the direct Postgres connection string
4. Replace the password placeholder with your actual database password
5. Paste that string into Render as `ConnectionStrings__DefaultConnection`

Use the direct connection string for EF Core migrations. Transactional migration flows are more reliable on the direct Postgres endpoint than on pooled transaction mode.

## Schema and Migrations

The backend now uses PostgreSQL EF Core migrations. On startup the API runs `Database.MigrateAsync()`, so the schema is created automatically once the Supabase connection string is valid.

If you need to apply schema manually, use:

```bash
psql "$ConnectionStrings__DefaultConnection" -f database/schema.sql
```

## Frontend Deployment

Build the frontend with:

```bash
cd frontend
npm install
npm run build
```

Set `VITE_API_URL` to your backend URL including `/api`, for example:

```text
https://earnstrack-api.onrender.com/api
```

## Verification

After deployment:

1. Open `https://your-render-domain/health`
2. Confirm the API returns `{"status":"ok"}`
3. Open the frontend and verify login works against the hosted backend

## Troubleshooting

### API boots but migrations fail

1. Confirm the Supabase password is correct
2. Confirm the host, port, username, and database name match the direct connection string
3. Confirm SSL is enabled in the connection string

### Database connectivity test

```bash
psql "Host=YOUR_SUPABASE_HOST;Port=5432;Database=postgres;Username=postgres;Password=YOUR_SUPABASE_PASSWORD;SSL Mode=Require"
```

### CORS issues

1. Confirm `Cors__AllowedOrigins__0` matches the frontend origin only
2. Do not include `/api` or repository subpaths in the CORS origin value

## Ongoing Maintenance

1. Keep .NET and npm dependencies updated
2. Rotate JWT and database secrets when needed
