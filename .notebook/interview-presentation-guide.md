# Interview Presentation Guide - Signalsboard Hospital Dashboard

## Project Overview (2 minutes)

**Opening Statement:**
"I built Signalsboard, a real-time hospital patient monitoring dashboard designed for wall-mounted displays in clinical settings. It demonstrates my full-stack capabilities with .NET, real-time systems, and professional development practices."

**Key Statistics:**
- **Tech Stack:** ASP.NET Core 8, Entity Framework Core 9, PostgreSQL 17, React + TypeScript (planned)
- **Real-time:** SignalR WebSocket for live vital signs updates
- **Testing:** xUnit, SpecFlow BDD, Testcontainers integration tests
- **Architecture:** Clean separation with Domain entities, API contracts, and DTOs

---

## Technical Deep Dive

### 1. Real-time Architecture (Why SignalR?)

**Interview Question:** "Why did you choose SignalR over polling or SSE?"

**Answer:**
"SignalR provides bidirectional WebSocket communication with automatic fallback to long-polling for older browsers. For a hospital dashboard, this means:
- **Sub-second latency** for critical vital signs updates
- **Automatic reconnection** handling for network interruptions
- **Efficient batching** - can broadcast to multiple wall displays simultaneously
- **Production-ready** - built into ASP.NET Core, no third-party dependencies"

**Code Example to Show:**
```csharp
// Program.cs - SignalR hub at /hubs/vitals
// Broadcasts vital signs to all connected clients
await Clients.All.SendAsync("vitals:update", vitalSignsDto);
```

---

### 2. Testing Strategy (Why Three Levels?)

**Interview Question:** "Tell me about your testing approach."

**Answer:**
"I implemented a three-tier testing strategy because healthcare software requires comprehensive validation:

**Tier 1: Unit Tests (xUnit)**
- Business logic validation
- Medical alert thresholds (HR >180, SpO2 <88%)
- Fast execution, no external dependencies
- Example: `VitalSigns.CalculateAlertSeverity()` tests

**Tier 2: BDD Tests (SpecFlow + Gherkin)**
- **Why BDD?** Medical scenarios need to be readable by non-technical stakeholders like doctors
- Written in plain English using Given/When/Then syntax
- Validates critical patient safety logic
- Example: 'Given a patient with heart rate 185 BPM, Then critical alert should trigger'

**Tier 3: Integration Tests (Testcontainers)**
- **Why Testcontainers?** Tests run against real PostgreSQL, not mocks
- Each test gets isolated database container
- Validates EF Core migrations, database constraints, and API endpoints
- Prevents 'works on my machine' issues"

**Code Example to Show:**
```csharp
// Testcontainers spins up real PostgreSQL
var container = new PostgreSqlBuilder().Build();
await container.StartAsync();
```

---

### 3. Database Design (Time-Series Optimization)

**Interview Question:** "How did you optimize for high-frequency vital signs data?"

**Answer:**
"Vital signs are inherently time-series data - we're storing readings every few seconds per patient. I optimized this with:

**1. Composite Index on (patient_id, recorded_at)**
// TODO CLAUDE CODE PLEASE EXPLAIN THIS
```sql
CREATE INDEX IX_vital_signs_patient_id_recorded_at
ON vital_signs (patient_id, recorded_at);
```
This enables fast queries like 'Get last 4 hours of vitals for patient X'

**2. EF Core Migrations**
- Code-first approach: entities define schema
- Migrations auto-apply on container startup via `context.Database.Migrate()`
- Production-ready: no manual SQL scripts needed

**3. Separation of Concerns**
- **Domain entities** (`Hospital.Api/Domain`) contain business logic
- **DTOs** (`Hospital.Api.Contracts`) for API responses
- Prevents exposing internal domain structure to clients"

---

### 4. Git Flow & Professional Workflow

**Interview Question:** "Walk me through your development workflow."

**Answer:**
"I follow **Git Flow** branching strategy:

**Branch Structure:**
```
master (production-ready)
  └─ dev (integration branch)
      ├─ feature/bdd-medical-scenarios
      ├─ feature/patient-dashboard
      └─ hotfix/critical-alert-fix
```

**Conventional Commits:**
- `feat:` new features
- `fix:` bug fixes
- `refactor:` code improvements
- `test:` adding tests
- `docs:` documentation

**Example Commit:**
```
feat: add SpecFlow BDD testing framework

- Installed SpecFlow 3.9.74 for Gherkin syntax
- Created heart rate monitoring scenarios
- Medical logic now readable by clinical staff
```

**Why This Matters:**
- Clean history for code reviews
- Easy to generate changelogs
- Professional team collaboration ready"

---

### 5. Docker & Containerization

**Interview Question:** "How would you deploy this to production?"

**Answer:**
"I containerized both the API and database using Docker:

**Development Environment:**
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    ports: ["5432:5432"]
    healthcheck: pg_isready

  hospital-api:
    build: ./Hospital.Api
    depends_on:
      postgres: { condition: service_healthy }
    ports: ["8080:8080"]
```

**Production Deployment Options:**

**Option 1: Azure App Service**
- Push to Azure Container Registry
- Deploy to App Service (Linux containers)
- Auto-scaling based on CPU/memory
- Azure PostgreSQL managed database

**Option 2: Kubernetes (for larger scale)**
- Helm charts for orchestration
- Multiple replicas for high availability
- Blue-green deployments for zero downtime

**Migrations Handled Automatically:**
- `context.Database.Migrate()` runs on startup
- No manual database scripts
- Safe for production deployments"

---

### 6. Medical Domain Knowledge

**Interview Question:** "What medical considerations did you account for?"

**Answer:**
"I researched clinical guidelines to ensure realistic alert thresholds:

**Critical Thresholds (Life-threatening):**
- Heart Rate: ≤45 or ≥130 BPM (cardiac arrest risk)
- SpO2: <88% (severe hypoxemia)
- Blood Pressure: ≥180/110 (hypertensive crisis)

**Medium Alerts (Requires attention):**
- Heart Rate: 55-60 or 110-125 BPM
- SpO2: 88-92%
- Blood Pressure: 140-160/90-100

**Data Validation:**
```csharp
public bool IsValid()
{
    // Reject impossible values
    if (HeartRate <= 0 || HeartRate > 300) return false;
    if (SpO2 <= 0 || SpO2 > 100) return false;
    // Prevents bad sensor data from triggering false alarms
}
```

**Why This Matters:**
- Shows I researched the domain
- Understand real-world constraints
- Built for actual use, not just demo"

---

### 7. Future Scalability

**Interview Question:** "How would you scale this for 1000+ beds?"

**Answer:**
"Current architecture supports 10-500 beds on a single server. For larger scale:

**1. SignalR Scale-Out**
- Redis backplane for multi-server SignalR
- Azure SignalR Service (managed, auto-scaling)

**2. Database Optimization**
- Read replicas for queries
- Write to primary for vital signs
- Time-series partitioning (monthly tables)

**3. Caching Layer**
- Redis for patient lookup data
- Reduce database load for ward listings

**4. Microservices Decomposition**
- Vital Signs Service (high-throughput)
- Alert Service (business logic)
- API Gateway (routing)

**Already Prepared:**
- Domain entities separate from DTOs
- Dependency injection ready
- Health check endpoints for orchestration"

---

## Demo Script (5 minutes)

### Part 1: Show the Code Structure
```bash
Signalsboard/
├─ Hospital.Api/              # "This is the backend API"
│  └─ Domain/                # "Business logic lives here"
├─ Hospital.Api.Contracts/    # "DTOs for API responses"
├─ Hospital.Api.Tests/        # "Comprehensive test suite"
│  ├─ Features/              # "BDD scenarios in plain English"
│  └─ StepDefinitions/       # "Step implementations"
└─ .notebook/                # "Technical documentation"
```

### Part 2: Run the Tests
```bash
# "Let me show you the BDD tests running"
dotnet test

# Point out:
# - Testcontainers spinning up PostgreSQL
# - Gherkin scenarios executing
# - All tests passing
```

### Part 3: Show a Feature File
Open `HeartRateMonitoring.feature`:
```gherkin
Scenario: Patient has dangerously high heart rate
  Given a patient with heart rate of 185 BPM
  When the vital signs alert system evaluates the patient
  Then a critical alert should be triggered
```

**Say:** "Notice how this is readable by doctors and nurses, not just developers. This is why BDD is valuable for healthcare software."

### Part 4: Show the Database
```bash
# Open DBeaver or psql
docker exec -it signalsboard-db psql -U postgres -d signalsboard

# Show tables
\dt

# Show the time-series index
\d vital_signs
```

**Point out:** "This composite index makes chronological queries fast for real-time dashboards."

---

## Common Follow-up Questions

### "Why not use Entity Framework In-Memory for tests?"
"In-memory databases don't support all PostgreSQL features like indexes, constraints, and specific SQL functions. Testcontainers gives us production-parity testing with real PostgreSQL."

### "What about security?"
"Current implementation focuses on architecture and testing. For production, I'd add:
- JWT authentication for API endpoints
- Role-based access control (doctors vs nurses)
- TLS/HTTPS enforcement
- HIPAA compliance logging
- Azure Key Vault for secrets"

### "How long did this take?"
"About [X weeks/months], including research on medical domain, learning SpecFlow BDD, and implementing Testcontainers. The goal was to demonstrate production-ready practices, not just a quick prototype."

### "What was the hardest part?"
"Setting up Testcontainers integration with EF Core migrations. The containers need to start, migrations need to apply, then tests run. Required understanding Docker networking and EF Core lifecycle deeply."

### "What would you do differently?"
"I'd add:
- OpenTelemetry tracing for performance monitoring
- Retry policies with Polly for network resilience
- Feature flags for gradual rollouts
- More comprehensive error handling with Result patterns"

---

## Key Talking Points

✅ **Real-world problem solving** - Not a tutorial project, designed for actual hospital use
✅ **Production-ready practices** - Docker, migrations, proper testing, Git Flow
✅ **Domain expertise** - Researched medical thresholds, realistic scenarios
✅ **Modern .NET stack** - Latest EF Core 9, minimal APIs, nullable reference types
✅ **Testing discipline** - Unit, BDD, and integration tests
✅ **Professional workflow** - Conventional commits, feature branches, documentation

---

## Questions to Ask Interviewers

1. "What testing strategies does your team use for mission-critical systems?"
2. "How do you handle database migrations in production deployments?"
3. "What's your approach to real-time communication - SignalR, gRPC, or something else?"
4. "Do you use BDD or similar approaches for business-critical logic?"

---

## Closing Statement

"This project demonstrates my ability to build production-ready, full-stack applications with professional development practices. I focused on real-world concerns like testing, deployment, and domain modeling rather than just making something that 'works'. I'm excited to bring this level of technical rigor to your team."

---

*Remember: Confidence comes from preparation. You built this - you know it inside out. Walk them through your decisions with pride!*