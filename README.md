# Hospital Dashboard - Real-time Patient Monitoring System

A **full-stack hospital patient monitoring system** demonstrating production-style architecture with real-time SignalR updates, comprehensive testing, and medical domain modeling.

[![.NET](https://img.shields.io/badge/.NET-8.0-purple)](https://dotnet.microsoft.com/)
[![Entity Framework](https://img.shields.io/badge/Entity%20Framework-9.0-blue)](https://docs.microsoft.com/en-us/ef/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## Project Overview

This project models a real-world hospital monitoring system, focusing on **patient safety** and **real-time data flow**. Built to demonstrate expertise in modern web technologies, database design, and healthcare software engineering principles.

### Key Features

- **Critical Alert Detection** - Automated monitoring of life-threatening vital sign patterns
- **Real-time Updates** - SignalR-powered live dashboard for patient status
- **Medical Domain Logic** - Implements clinically-inspired alert thresholds
- **Comprehensive Testing** - Medical safety scenarios with integration testing
- **Time-series Optimization** - Database design for high-frequency vital signs data

## Architecture

```
Hospital Dashboard
├── Hospital.Api/              # ASP.NET Core + SignalR + EF Core 9
├── Hospital.Contracts/        # Domain Models + Business Logic
├── Hospital.Clients/
│   └── hospital-web/         # React + TypeScript + Redux Toolkit
├── Hospital.Api.Tests/       # Medical Safety + Integration Tests
├── .notebook/                # Technical Documentation
└── docker-compose.yml       # PostgreSQL Development Environment
```

## Medical Safety Implementation

**Critical requirement**: Healthcare software must reliably detect emergencies. Our implementation ensures no life-threatening conditions are missed.

**Validated Scenarios**:
- Heart Rate Emergencies (>180 BPM) → Critical Alert
- Hypoxemia Detection (<88% SpO2) → Critical Alert
- Hypertensive Crisis (>180/110 BP) → Critical Alert
- Multi-vital Pattern Recognition → Escalated monitoring
- Data Validation → Rejects medically impossible values

```bash
# Verify medical safety logic
dotnet test Hospital.Api.Tests --filter "MedicalSafetyTests"
# Result: 6/6 critical scenarios passing
```

## Technology Stack

### Backend
- **ASP.NET Core 8** - RESTful API with health monitoring
- **Entity Framework Core 9** - PostgreSQL with query optimization
- **SignalR** - WebSocket-based real-time communication
- **xUnit + Testcontainers** - Isolated integration testing

### Frontend (In Development)
- **React + Vite + TypeScript** - Component-based UI architecture
- **Redux Toolkit (RTK Query)** - Centralized state management
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Medical data visualization components

### Infrastructure
- **PostgreSQL 17** - Optimized for time-series vital signs data
- **Docker** - Containerized development environment
- **Git Flow** - Feature branch workflow with conventional commits

## Alert Threshold Implementation

| Vital Sign | Critical | High | Medium |
|------------|----------|------|--------|
| Heart Rate | ≤45 or ≥130 BPM | ≤55 or ≥110 BPM | ≤60 or ≥100 BPM |
| SpO2 | <88% | <92% | <94% |
| Blood Pressure | ≥180/110 | ≥160/100 | ≥140/90 |

*Thresholds based on published clinical literature for demonstration purposes*

## Quick Start

### Prerequisites
- .NET 8 SDK
- Docker & Docker Compose
- Node.js 18+ (for frontend development)

### Development Setup

```bash
# Start database
docker-compose up -d postgres

# Run API server
cd Hospital.Api
dotnet restore
dotnet run

# API endpoints: https://localhost:5001
# Health check: https://localhost:5001/health
# Swagger docs: https://localhost:5001/swagger
```

### Testing

```bash
# Run all tests
dotnet test

# Medical safety tests only
dotnet test --filter "MedicalSafetyTests"

# Integration tests with database
dotnet test --filter "Integration"
```

## API Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wards` | Hospital ward listing |
| `GET` | `/api/patients?wardId={id}` | Ward patient roster |
| `GET` | `/api/patients/{id}/trend` | Historical vital signs |
| `GET` | `/health` | System health status |

**SignalR Hub**: `/hubs/vitals` - Real-time vital signs broadcasting

## Database Schema

Designed for healthcare time-series workloads:

- **Patients** - Core demographics with unique medical record numbers
- **VitalSigns** - Time-stamped measurements with compound indexes
- **Alerts** - Medical alert history with severity tracking
- **Wards/Beds** - Hospital organizational hierarchy

[Complete database documentation](.notebook/erd.md)

## Testing Approach

### Medical Safety Focus
Our testing prioritizes **patient safety scenarios** that could impact clinical decisions:

- **Unit Tests** - Business logic validation for alert calculations
- **Integration Tests** - Database persistence with isolated test containers
- **Medical Scenarios** - Edge cases for critical vital sign combinations

### Coverage Areas
- Vital sign threshold detection accuracy
- Database transaction integrity
- Real-time alert delivery mechanisms
- Data validation for impossible readings

[Testing strategy details](.notebook/testing-strategy.md)

## Development Workflow

Follows Git Flow methodology with conventional commit standards:

```bash
# Feature development cycle
git checkout dev
git checkout -b feature/patient-monitoring
# ... implement feature
git commit -m "feat: add real-time patient status updates"
# ... create pull request to dev branch
```

[Development workflow documentation](.notebook/README.md)

## Technical Skills Demonstrated

This project showcases:

- **Healthcare Domain Modeling** - Medical entity relationships and business rules
- **Real-time Systems** - WebSocket communication patterns
- **Database Optimization** - Time-series query performance and indexing
- **Integration Testing** - Medical scenario validation with test containers
- **Modern .NET Patterns** - EF Core 9, minimal APIs, dependency injection
- **API Design** - RESTful endpoints with proper HTTP semantics

## Documentation

Technical details available in [`.notebook/`](.notebook/):

- [Technical Architecture](.notebook/README.md)
- [Database Design](.notebook/erd.md)
- [Testing Strategy](.notebook/testing-strategy.md)
- [Security Considerations](.notebook/security-secrets.md)
- [Deployment Planning](.notebook/production-deployment.md)
- [Development Log](.notebook/progress-log.md)

## Implementation Status

- [x] Domain model with medical business logic
- [x] EF Core 9 database layer with PostgreSQL
- [x] Comprehensive medical safety testing
- [x] Git workflow and documentation
- [ ] REST API endpoint implementation
- [ ] SignalR real-time hub
- [ ] React dashboard interface
- [ ] Authentication and authorization

## License

MIT License - Educational project using simulated medical data.

---

*This project demonstrates full-stack development capabilities with focus on healthcare software engineering and real-time monitoring systems.*