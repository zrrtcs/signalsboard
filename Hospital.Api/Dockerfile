# =============================================================================
# STAGE 1: Build React Frontend
# =============================================================================
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY Hospital.Clients/hospital-web/package*.json ./
RUN npm ci --silent
COPY Hospital.Clients/hospital-web/ ./
RUN npm run build

# =============================================================================
# STAGE 2: Build .NET Backend
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build

# Build configuration arguments
# BUILD_CONFIGURATION: Debug or Release (default: Release for production)
# ASPNETCORE_ENVIRONMENT: Development or Production (default: Production)
ARG BUILD_CONFIGURATION=Release
ARG ASPNETCORE_ENVIRONMENT=Production

# Set working directory
WORKDIR /src

# Copy project files and restore dependencies
COPY ["Hospital.Api/Hospital.Api.csproj", "Hospital.Api/"]
COPY ["Hospital.Api.Contracts/Hospital.Api.Contracts.csproj", "Hospital.Api.Contracts/"]
RUN dotnet restore "Hospital.Api/Hospital.Api.csproj"

# Copy source code
COPY . .

# Build and publish the application
WORKDIR "/src/Hospital.Api"
RUN dotnet build "Hospital.Api.csproj" -c ${BUILD_CONFIGURATION} -o /app/build
RUN dotnet publish "Hospital.Api.csproj" -c ${BUILD_CONFIGURATION} -o /app/publish /p:UseAppHost=false

# Create final runtime image
FROM runtime AS final
WORKDIR /app

# Install curl for health checks and debugging tools
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Install Visual Studio Debugger (vsdbg) for remote debugging
RUN curl -sSL https://aka.ms/getvsdbgsh | bash /dev/stdin -v latest -l /vsdbg

# Copy published application
COPY --from=build /app/publish .

# Copy frontend assets to wwwroot
COPY --from=frontend-build /frontend/dist ./wwwroot

# Create non-root user for security
RUN adduser --disabled-password --gecos "" --uid 1000 appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables (use ARG value passed from build script)
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT}

# Entry point
ENTRYPOINT ["dotnet", "Hospital.Api.dll"]