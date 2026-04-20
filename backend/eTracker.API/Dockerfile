FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the project file first so package restore stays cacheable between source edits.
COPY eTracker.API.csproj ./
RUN dotnet restore ./eTracker.API.csproj

COPY . ./
RUN dotnet publish ./eTracker.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Render injects PORT at runtime, so the container binds dynamically instead of assuming a fixed port.
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=build /app/publish ./

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "dotnet eTracker.API.dll --urls http://0.0.0.0:${PORT:-10000}"]