# Production Deployment Strategies

## EF Migrations in Production

### Development Approach (Current)
**Runtime Migrations** - Applied on application startup:
```csharp
context.Database.Migrate(); // Runs on every container start
```
- ✅ **Automatic**: Zero manual intervention required
- ✅ **Simple**: Works perfectly for development and staging
- ❌ **Startup delay**: Application waits for migrations to complete
- ❌ **Risk**: Failed migration can prevent startup

### Production Approach (Future)
**Build-time Migrations** - Applied during deployment:
```dockerfile
# In production Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS migrate
WORKDIR /src
COPY . .
RUN dotnet ef database update --no-build --connection="${CONNECTION_STRING}"

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
COPY --from=migrate /app .
```

## Zero-Downtime Deployment Strategies

### Strategy 1: Blue-Green Deployment
**Best for**: Schema changes, major updates

```bash
# 1. Deploy new version to "green" environment
docker build -t hospital-api:v2.0 .
docker run --name hospital-green hospital-api:v2.0

# 2. Run migrations on shared database
docker exec hospital-green dotnet ef database update

# 3. Health check green environment
curl http://green-env:8080/health

# 4. Switch load balancer traffic: blue → green
# 5. Monitor for issues
# 6. Terminate blue environment after validation
```

**Advantages:**
- ✅ **Instant rollback** - switch back to blue if issues occur
- ✅ **Full validation** - test complete environment before switch
- ✅ **Zero downtime** for compatible schema changes

**Requirements:**
- Backward compatible database changes
- Load balancer with traffic switching capability
- Double infrastructure cost during deployment

### Strategy 2: Rolling Updates (Kubernetes)
**Best for**: Application updates, minor schema changes

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: hospital-migration-v2
spec:
  template:
    spec:
      initContainers:
      - name: migrate
        image: hospital-api:v2.0
        command: ["dotnet", "ef", "database", "update"]
        env:
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: connection-string
      containers:
      - name: app
        image: hospital-api:v2.0
        ports:
        - containerPort: 8080
      restartPolicy: OnFailure
```

**Advantages:**
- ✅ **Gradual rollout** - replace instances one by one
- ✅ **Automatic rollback** - failed deployments auto-revert
- ✅ **Resource efficient** - no double infrastructure

### Strategy 3: Maintenance Window (Traditional)
**Best for**: Major schema restructuring, breaking changes

```bash
# 1. Schedule maintenance window
# 2. Drain traffic from load balancer
# 3. Stop all application instances (downtime begins)
# 4. Run migrations with complex schema changes
# 5. Start new application version
# 6. Restore traffic (downtime ends)
```

**Use cases:**
- Dropping columns/tables
- Major data migrations
- Breaking API changes
- Database engine upgrades

## Migration Compatibility Matrix

| Change Type      | Zero Downtime | Strategy             | Notes                       |
|------------------|---------------|----------------------|-----------------------------|
| Add    table     | ✅    Yes     | Blue-Green/Rolling   | Safe operation              |
| Add    column    | ✅    Yes     | Blue-Green/Rolling   | Add with default value      |
| Add    index     | ✅    Yes     | Blue-Green/Rolling   | May have brief lock         |
| Rename column    | ⚠️   Careful  | Staged approach      | Requires app compatibility  |
| Drop   column    | ❌    No      | Maintenance window   | Breaking change             |
| Drop   table     | ❌    No      | Maintenance window   | Data loss risk              |
| Data   migration | ⚠️   Depends  | Blue-Green preferred | Size dependent              |

## Staged Schema Changes (Advanced)

For complex schema changes requiring zero downtime:

### Phase 1: Additive Changes
```sql
-- Add new column alongside old column
ALTER TABLE patients ADD COLUMN patient_name VARCHAR(200);
-- Deploy application that writes to both columns
```

### Phase 2: Data Migration
```sql
-- Background job: migrate data from old to new column
UPDATE patients SET patient_name = name WHERE patient_name IS NULL;
```

### Phase 3: Application Update
```csharp
// Deploy application that reads from new column only
public string PatientName { get; set; } // Now uses patient_name column
```

### Phase 4: Cleanup
```sql
-- Remove old column after validation
ALTER TABLE patients DROP COLUMN name;
```

## Monitoring & Alerting

**Pre-deployment checks:**
- Database connectivity validation
- Migration dry-run on staging
- Rollback plan verification
- Team notification and approval

**During deployment monitoring:**
- Application health checks (/health endpoint)
- Database connection pool status
- Error rates and response times
- User-facing functionality validation

**Post-deployment validation:**
- End-to-end functionality testing
- Performance metric comparison
- Log analysis for errors
- Database integrity checks

## Emergency Procedures

**Failed Migration Recovery:**
1. **Stop traffic** to affected environment
2. **Assess damage** - check database state
3. **Rollback options**:
   - Revert to previous Docker image
   - Database point-in-time recovery
   - Manual data correction
4. **Root cause analysis** and prevention

**Rollback Decision Matrix:**
- **<5 minutes**: Automatic rollback via health checks
- **5-15 minutes**: Manual rollback decision
- **>15 minutes**: Investigate + fix forward vs rollback

This comprehensive strategy ensures the Hospital Dashboard can handle production deployments safely and efficiently.