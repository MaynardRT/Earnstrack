# Free Deployment Guide

This repository is now configured for the simplest low-cost public setup:

1. Frontend on GitHub Pages
2. Backend on Render
3. Database on an external SQL Server-compatible host that you provide

## What Is Already Configured In The Repo

### Frontend

- GitHub Pages deployment workflow in `.github/workflows/cd.yml`
- Vite base path support for repository subpaths
- React Router basename support for GitHub Pages
- SPA fallback generation via `404.html`

### Backend

- Render blueprint in `render.yaml`
- Production-friendly forwarded headers handling
- Configurable CORS origins from environment variables
- Health endpoint at `/health`

## Step 1: GitHub Pages Frontend

In GitHub for `MaynardRT/Earnstack`:

1. Open `Settings -> Pages`
2. Set `Source` to `GitHub Actions`
3. Open `Settings -> Secrets and variables -> Actions`
4. Add the secret `VITE_API_URL`

Set `VITE_API_URL` to your deployed backend URL including `/api`, for example:

```text
https://earnstack-api.onrender.com/api
```

Your frontend site URL will be:

```text
https://maynardrt.github.io/Earnstack/
```

## Step 2: Render Backend

Render can read the `render.yaml` file in the repository.

### In Render

1. Create a new account or sign in
2. Choose `New +` -> `Blueprint`
3. Connect the `MaynardRT/Earnstack` repository
4. Let Render detect `render.yaml`
5. Create the service

### Required Render Environment Variables

You must fill these values in Render before the API can work:

```text
ConnectionStrings__DefaultConnection=YOUR_PRODUCTION_SQL_SERVER_CONNECTION_STRING
JwtSettings__SecretKey=YOUR_LONG_RANDOM_SECRET
```

The blueprint already sets these values for you:

```text
ASPNETCORE_ENVIRONMENT=Production
JwtSettings__Issuer=Earnstrack
JwtSettings__Audience=Earnstrack-users
Cors__AllowedOrigins__0=https://maynardrt.github.io
```

### Important CORS Note

GitHub Pages runs under the origin:

```text
https://maynardrt.github.io
```

That is why the backend CORS origin must be that domain, not the full `/Earnstack/` URL.

## Step 3: Production Database

This backend still uses SQL Server.

That means you need a production SQL Server connection string for:

```text
ConnectionStrings__DefaultConnection
```

Examples include:

1. Azure SQL
2. A hosted SQL Server instance
3. Your own SQL Server reachable from the internet

LocalDB is not suitable for public deployment.

## Step 4: Verify Everything

### Frontend

Open:

```text
https://github.com/MaynardRT/Earnstack/actions
```

Look for a successful `CD` run with successful `package-frontend` and `deploy-frontend` jobs.

### Backend

After Render deploys the service, open:

```text
https://your-render-domain/health
```

It should return a JSON payload with `status` set to `ok`.

## Final URLs

Frontend:

```text
https://maynardrt.github.io/Earnstack/
```

Backend example:

```text
https://earnstack-api.onrender.com/api
```

## Remaining Manual Work

These cannot be completed from inside the repository alone:

1. Enabling GitHub Pages in repository settings
2. Adding GitHub repository secrets
3. Creating the Render service from the repository
4. Providing a production SQL Server connection string
