# Deployment Guide

## Preparing for Production

### 1. Update Configuration

Set environment to Production in your deployment platform:

```bash
ASPNETCORE_ENVIRONMENT=Production
```

### 2. Backend Build & Publish

#### Build Release

```bash
cd backend/eTracker.API
dotnet build -c Release
```

#### Publish

```bash
dotnet publish -c Release -o ./publish
```

### 3. Frontend Build

```bash
cd frontend
npm install --production
npm run build
```

Output will be in `dist/` directory.

## Deployment Options

### Azure App Service

#### Prerequisites

- Azure subscription
- Azure CLI installed
- Resource group created

#### Deploy Backend

```bash
# Login to Azure
az login

# Create App Service Plan
az appservice plan create \
  --name myAppServicePlan \
  --resource-group myResourceGroup \
  --sku B1 \
  --is-linux

# Create App Service
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name myeTrackerAPI \
  --runtime "DOTNET|10.0"

# Deploy from local publish folder
az webapp up \
  --resource-group myResourceGroup \
  --name myeTrackerAPI \
  --plan myAppServicePlan \
  --runtime dotnet:10
```

## Backend Configuration

Update `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_PROD_SERVER;Database=eTracker;User Id=sa;Password=STRONG_PASSWORD;"
  },
  "JwtSettings": {
    "SecretKey": "VERY_LONG_RANDOM_SECRET_KEY_MIN_32_CHARS",
    "Issuer": "eTracker",
    "Audience": "eTracker-User",
    "ExpirationHours": 24
  }
}
```

### 2. Build for Production

```bash
cd backend/eTracker.API
dotnet publish -c Release -o ./publish
```

### 3. Deploy to Server

#### Option A: Using IIS (Windows Server)

1. Install .NET Hosting Bundle
2. Create IIS website pointing to published folder
3. Configure application pool for .NET
4. Setup SSL binding

#### Option B: Using Docker

Create `Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet build "eTracker.API/eTracker.API.csproj" -c Release

FROM build AS publish
RUN dotnet publish "eTracker.API/eTracker.API.csproj" -c Release

FROM base AS final
WORKDIR /app
COPY --from=publish /src/eTracker.API/publish .
ENTRYPOINT ["dotnet", "eTracker.API.dll"]
```

Build and push:

```bash
docker build -t etracker-api:latest .
docker tag etracker-api:latest yourregistry.azurecr.io/etracker-api:latest
docker push yourregistry.azurecr.io/etracker-api:latest
```

### 4. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Frontend Deployment

### 1. Build for Production

```bash
cd frontend
npm run build
```

### 2. Deploy to Static Hosting

#### Option A: Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Option B: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option C: Azure Static Web Apps

1. Connect GitHub repository
2. Configure build settings
3. Deploy with Azure CLI

#### Option D: Self-hosted

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    root /var/www/etracker/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://api.yourdomain.com;
    }
}
```

Upload dist contents:

```bash
scp -r dist/* user@server:/var/www/etracker/
```

## Database Deployment

### 1. Backup Development Database

```sql
BACKUP DATABASE eTracker
TO DISK = 'C:\Backups\eTracker.bak'
```

### 2. Restore to Production

```sql
RESTORE DATABASE eTracker
FROM DISK = 'path/to/eTracker.bak'
```

Or:

```bash
sqlcmd -S production-server -U sa -P password -i schema.sql
```

### 3. Create Database User

```sql
CREATE LOGIN eTrackerUser WITH PASSWORD = 'STRONG_PASSWORD'
CREATE USER eTrackerUser FOR LOGIN eTrackerUser
ALTER ROLE db_owner ADD MEMBER eTrackerUser
```

## SSL/TLS Certificate

### Using Let's Encrypt with Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```

Renewal:

```bash
sudo certbot renew --dry-run
```

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 8.0.x
      - run: dotnet publish -c Release -o ./publish
      - run: |
          # Deploy to server
          scp -r publish/* user@server:/app/etracker/

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install && npm run build
      - run: |
          # Deploy to static hosting
          scp -r dist/* user@server:/var/www/etracker/
```

## Monitoring and Logging

### Application Insights (Azure)

1. Create Application Insights instance
2. Add instrumentation key to appsettings.json
3. Monitor performance and errors

### Logging

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    },
    "File": {
      "IncludeScopes": true,
      "Path": "/var/log/etracker/",
      "FileSizeLimit": 104857600,
      "RetainedFileCountLimit": 10
    }
  }
}
```

## Backup Strategy

### Daily Backups

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
sqlcmd -S server -U sa -P password -Q "BACKUP DATABASE eTracker TO DISK = '/backups/eTracker_$DATE.bak'"
```

Schedule with cron:

```bash
0 2 * * * /path/to/backup.sh
```

## Performance Optimization

1. **Enable Caching**

   - Browser caching headers
   - API response caching
   - CDN for static assets

2. **Database Optimization**

   - Add indexes on frequently queried columns
   - Archive old transactions
   - Regular maintenance

3. **API Optimization**
   - Enable gzip compression
   - Pagination for list endpoints
   - Query optimization

## Post-Deployment Checklist

- [ ] SSL certificate working
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Database backups running
- [ ] Monitoring and alerts configured
- [ ] Error logging working
- [ ] Email notifications tested
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Troubleshooting

### API not responding

```bash
curl -I https://api.yourdomain.com/health
```

### Database connection issues

```bash
sqlcmd -S server -U user -P password -Q "SELECT 1"
```

### Nginx configuration errors

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Security Updates

Monitor for security updates:

- .NET updates: https://dotnet.microsoft.com/en-us/download
- npm packages: `npm audit`
- SQL Server patches: Windows Update/SQL Server downloads
