# Signalsboard Hospital Dashboard - Technical Documentation

## Project Overview

**Signalsboard** is a production-ready hospital patient-care dashboard featuring real-time vital signs monitoring, alert management, and TV-optimized display capabilities. Built with .NET 8, React, and PostgreSQL.

## 🏗️ Architecture Documentation

### [Entity Relationship Design](./erd.md)
Complete database schema design with medical-domain relationships:
- **Core entities**: Ward, Bed, Patient, VitalSigns, Alert, Staff
- **Medical threshold logic** for alert generation
- **Time-series optimization** for vital signs storage
- **Performance indexing** for real-time dashboard queries

### [Security & Secret Management](./security-secrets.md)
Enterprise-grade security practices for healthcare data:
- **Development**: Environment variable approach with .env files
- **Production**: Azure Key Vault, AWS Secrets Manager, Docker Secrets
- **Best practices**: Secret rotation, least privilege, audit trails
- **Compliance**: Healthcare data protection considerations

### [Production Deployment Strategies](./production-deployment.md)
Comprehensive deployment approaches for zero-downtime updates:
- **Migration strategies**: Runtime vs build-time approaches
- **Deployment patterns**: Blue-Green, Rolling Updates, Maintenance Windows
- **Schema evolution**: Staged changes for complex migrations
- **Emergency procedures**: Rollback and recovery protocols

## 🚀 Quick Start

### Development Setup
```bash
# 1. Clone and setup environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 2. Start with Docker
docker-compose up --build

# 3. Access services
# API: http://localhost:8080
# Health: http://localhost:8080/health
# Swagger: http://localhost:8080/swagger
```

### Project Structure
```
Signalsboard/
├── Hospital.Api/              # ASP.NET Core API + SignalR Hub
│   └── Domain/               # Domain Entities + Business Logic
├── Hospital.Api.Contracts/    # DTOs and API Contracts
│   └── DTOs/
├── Hospital.Clients/
│   └── hospital-web/         # React + TypeScript Frontend (planned)
├── Hospital.Api.Tests/       # xUnit Tests + Medical Safety Validation
├── .notebook/               # Technical Documentation (Fossil SCM)
└── docker-compose.yml      # Container Orchestration
```

## 🏥 Healthcare Domain Features

### Real-time Vital Signs Monitoring
- **SignalR WebSocket** communication for live updates
- **Medical alert thresholds**: HR, BP, SpO2, Temperature
- **Risk assessment algorithms** combining multiple vital signs
- **Stale data detection** for reliable monitoring

### Dashboard Capabilities
- **Ward-based organization** with bed management
- **Color-coded alerts** (red/yellow/green) based on medical thresholds
- **Trend visualization** with sparklines and modal charts
- **TV/Kiosk mode** for wall-mounted displays
- **Staff management** with shift-based assignments

### Data Architecture
- **PostgreSQL 17** for robust data storage
- **EF Core migrations** for schema management
- **Hybrid seeding**: Production lookup data + development samples
- **Performance indexing** for time-series queries

## 🧪 Testing Strategy

### Business Logic Testing
- **xUnit** with plain assertions (no FluentAssertions dependency)
- **Medical threshold validation** for all vital sign alerts
- **Risk calculation testing** with multiple severity combinations
- **Data validation** ensuring medically plausible values

### Integration Testing
- **In-memory database** testing for EF operations
- **Health check validation** for service dependencies
- **SignalR hub testing** for real-time communication
- **API endpoint testing** with realistic medical scenarios

## 🔧 Technology Stack

### Backend
- **.NET 8** with ASP.NET Core minimal APIs
- **Entity Framework Core** with PostgreSQL
- **SignalR** for real-time WebSocket communication
- **Npgsql** health checks for database monitoring

### Frontend (Planned)
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Redux Toolkit (RTK)** for state management
- **Tailwind CSS** for responsive styling
- **Recharts** for vital signs visualization

### Infrastructure
- **Docker** containerization with Debian base images
- **PostgreSQL 17** for data persistence
- **Environment-based configuration** for multiple deployment targets
- **Health check endpoints** for orchestration support

## 📋 Development Workflow

### Database Changes
1. **Modify EF entities** in Hospital.Api/Domain
2. **Add migration**: `dotnet ef migrations add DescriptiveName`
3. **Test locally**: Migrations apply automatically on startup
4. **Update tests** if business logic changes
5. **Document** significant schema changes

### Feature Development
1. **Write failing tests** for new business logic
2. **Implement domain methods** with explicit `this.` syntax
3. **Verify test coverage** for medical scenarios
4. **Add API endpoints** with proper error handling
5. **Update documentation** for new features

### Deployment Pipeline
1. **Development**: Runtime migrations with sample data
2. **Staging**: Production-like environment with sanitized data
3. **Production**: Build-time migrations with zero-downtime strategies
4. **Monitoring**: Health checks and alert thresholds

## 🎯 Project Goals

### Employability Demonstration
- **Full-stack expertise**: .NET backend + React frontend
- **Real-time systems**: SignalR WebSocket implementation
- **Database design**: Medical domain modeling with EF Core
- **DevOps practices**: Docker, CI/CD, deployment strategies
- **Testing discipline**: Comprehensive unit and integration testing

### Healthcare Domain Knowledge
- **Medical alert systems** with clinically relevant thresholds
- **Time-series data handling** for vital signs monitoring
- **Compliance considerations** for healthcare data security
- **Operational requirements** for 24/7 monitoring systems

## 📈 Future Enhancements

### Planned Features
- **React frontend implementation** with TypeScript contracts
- **SignalR client integration** for real-time dashboard updates
- **Advanced alerting** with escalation and acknowledgment
- **Reporting capabilities** with trend analysis
- **Mobile responsiveness** for tablet-based monitoring

### Scalability Considerations
- **Microservice decomposition** for larger hospital systems
- **Event sourcing** for audit trails and data replay
- **Caching strategies** for high-frequency vital signs data
- **Multi-tenant architecture** for hospital network deployments

---

*This documentation provides comprehensive coverage of the Signalsboard hospital dashboard system, from technical architecture to deployment strategies, demonstrating enterprise-grade development practices suitable for healthcare environments.*