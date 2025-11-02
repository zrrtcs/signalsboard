# Testcontainers Setup Guide

## Overview

Integration tests use **Testcontainers** to spin up isolated PostgreSQL containers for testing. This ensures tests don't interfere with your development database and run with production-parity.

## Prerequisites

### Docker Group Membership (Linux/macOS)

Testcontainers requires access to the Docker socket at `/var/run/docker.sock`. On Linux systems, this requires your user to be in the `docker` group.

**Check if you're in the docker group:**
```bash
groups
# Should show 'docker' in the list
```

**If not, add yourself to the docker group:**
```bash
sudo usermod -aG docker $USER
```

**Then log out and log back in** (or restart your terminal session) for the group changes to take effect.

**Verify Docker access:**
```bash
docker ps
# Should run without "permission denied" errors
```

### Docker Desktop Users

If you're using Docker Desktop on Linux, you may have TWO Docker sockets:
- **Standard socket:** `/var/run/docker.sock` (requires docker group)
- **Desktop socket:** `~/.docker/desktop/docker.sock` (user-accessible)

Testcontainers is configured to use the **standard socket** for broader compatibility.

## Running Integration Tests

Once Docker access is configured:

```bash
# Run all tests (including integration tests)
dotnet test

# Run only integration tests
dotnet test --filter "FullyQualifiedName~Integration"

# Run specific integration test class
dotnet test --filter "FullyQualifiedName~CriticalAlertsIntegrationTests"
```

## How It Works

### 1. Test Initialization
```csharp
_postgresContainer = new PostgreSqlBuilder()
    .WithDockerEndpoint(new Uri("unix:///var/run/docker.sock"))
    .WithDatabase("hospital_test")
    .WithUsername("testuser")
    .WithPassword("testpass")
    .Build();
```

### 2. Container Lifecycle
1. **Before tests:** PostgreSQL container spins up (15-20 seconds)
2. **During tests:** Fresh database with migrations applied
3. **After tests:** Container automatically destroyed (cleanup)

### 3. Database Isolation
Each test run gets:
- ✅ Isolated PostgreSQL container (no shared state)
- ✅ Fresh database schema from EF migrations
- ✅ No interference with development database

## Troubleshooting

### Error: "Docker is either not running or misconfigured"
**Cause:** Docker daemon not running or Testcontainers can't detect it.

**Solution:**
1. Ensure Docker is running: `docker ps`
2. Check Docker context: `docker context ls`
3. Verify Testcontainers configuration in test file

### Error: "Connection failed - Permission denied"
**Cause:** User doesn't have permission to access Docker socket.

**Solution:**
Add yourself to the docker group (see Prerequisites above)

### Error: "Connection refused"
**Cause:** Docker socket path is incorrect or Docker Desktop using non-standard location.

**Solution:**
Check your Docker endpoint:
```bash
docker context inspect <context-name> --format '{{.Endpoints.docker.Host}}'
```

Update the socket path in `CriticalAlertsIntegrationTests.cs` if needed.

### Tests Running Slow
**Cause:** Container startup takes 15-20 seconds on first run.

**This is normal!** Testcontainers needs to:
1. Pull PostgreSQL image (first time only)
2. Start container
3. Wait for PostgreSQL to be ready
4. Apply EF migrations

**Optimization tips:**
- Testcontainers caches Docker images after first pull
- Consider using `testcontainers.reuse.enable=true` for development (containers persist between test runs)

## CI/CD Considerations

### GitHub Actions
Most CI environments already have Docker installed with proper permissions. No special setup needed!

**Example workflow:**
```yaml
- name: Run tests
  run: dotnet test
  # Testcontainers automatically detects Docker in CI
```

### Docker-in-Docker
If running tests inside a Docker container (Docker-in-Docker), mount the Docker socket:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

## Configuration Files

### Test Code
`Hospital.Api.Tests/Integration/CriticalAlertsIntegrationTests.cs`
- Configures PostgreSQL container
- Sets Docker endpoint explicitly
- Manages container lifecycle

### Optional: .testcontainers.properties
You can create `~/.testcontainers.properties` for user-level configuration:

```properties
# Docker socket location
docker.host=unix:///var/run/docker.sock

# Enable container reuse (faster tests, but containers persist)
testcontainers.reuse.enable=false

# Ryuk (cleanup container) settings
ryuk.container.privileged=true
```

## Benefits of This Approach

✅ **Production parity:** Tests run against real PostgreSQL, not mocks
✅ **Isolation:** Each test run gets fresh database
✅ **CI/CD ready:** Works in GitHub Actions, GitLab CI, etc.
✅ **No manual setup:** No need to manually create test databases
✅ **Cleanup:** Containers automatically destroyed after tests
✅ **Consistent:** Same database version as production (PostgreSQL 15)

## Alternative: In-Memory Database

If Testcontainers setup is too complex for your environment, you can fall back to EF Core's in-memory provider:

**Pros:**
- No Docker required
- Faster test execution
- Simpler setup

**Cons:**
- Not production-parity (missing PostgreSQL-specific features)
- Doesn't test migrations
- Doesn't catch database constraint issues

**Not recommended for medical software** where database integrity is critical!

---

*For more information, visit: https://dotnet.testcontainers.org/*