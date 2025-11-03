# Use Debian-based runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime

# Use Debian-based SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build

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
RUN dotnet build "Hospital.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Hospital.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Create final runtime image
FROM runtime AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=build /app/publish .

# Create non-root user for security
RUN adduser --disabled-password --gecos "" --uid 1000 appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Entry point
ENTRYPOINT ["dotnet", "Hospital.Api.dll"]