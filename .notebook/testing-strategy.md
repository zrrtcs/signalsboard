# Testing Strategy - Medical Safety Focus

## Overview

Healthcare software requires comprehensive testing because **bugs can cost lives**. Our testing strategy ensures critical medical conditions are never missed.

## Testing Levels

### 1. Unit Tests (`MedicalSafetyTests.cs`)
**Purpose**: Fast validation of business logic
**Framework**: xUnit with .NET 8

**Critical Test Cases**:
- Heart rate emergencies (>180 BPM) → Critical Alert
- Hypoxemia detection (<88% SpO2) → Critical Alert
- Hypertensive crisis (>180/110 BP) → Critical Alert
- Multi-vital abnormal patterns → High Alert
- Normal vitals → Low Alert
- Invalid medical data rejection

### 2. Integration Tests (`CriticalAlertsIntegrationTests.cs`)
**Purpose**: Database persistence and real-world scenarios
**Framework**: ASP.NET Core Testing + Testcontainers

**Infrastructure**:
- Isolated PostgreSQL containers per test run
- Real EF Core migrations testing
- Database transaction rollback for isolation

### 3. Medical Alert Thresholds

```csharp
// Critical (life-threatening)
Heart Rate: ≤45 or ≥130 BPM
SpO2: <88%
Blood Pressure: ≥180/110 (Hypertensive Crisis)

// High Alert
SpO2: <92%
Blood Pressure: ≥160/100

// Medium Alert
Heart Rate: ≤55 or ≥110 BPM
SpO2: <94%
Blood Pressure: ≥140/90
```

## Test Infrastructure

### Packages
- `Microsoft.AspNetCore.Mvc.Testing` v8.0.0 - API testing
- `Testcontainers.PostgreSql` v3.6.0 - Database isolation
- `xUnit` v2.6.6 - Test framework for .NET 8

### Database Testing
- Each test gets fresh PostgreSQL container
- Real migrations applied (`dotnet ef migrations add`)
- No shared state between tests
- Automatic cleanup after test completion

## Validation Logic

### Medical Data Validation
```csharp
public bool IsValid()
{
    // Reject impossible values
    if (HeartRate.HasValue && (HeartRate <= 0 || HeartRate > 300))
        return false;
    if (SpO2.HasValue && (SpO2 <= 0 || SpO2 > 100))
        return false;
    // ... additional validation
}
```

### Alert Severity Calculation
```csharp
public AlertSeverity CalculateAlertSeverity()
{
    var hrAlert = this.AssessHeartRateAlert();
    var spo2Alert = this.AssessSpO2Alert();
    var bpAlert = this.AssessBloodPressureAlert();

    // Patient safety: return highest severity
    return new[] { hrAlert, spo2Alert, bpAlert }.Max();
}
```

## Test Results

**Current Status**: ✅ All 6 medical safety tests passing

1. ✅ Critical heart rate detection (180 BPM → Critical)
2. ✅ Hypoxemia detection (85% SpO2 → Critical)
3. ✅ Hypertensive crisis detection (185/115 BP → Critical)
4. ✅ Multi-vital patterns (elevated + high + borderline → High)
5. ✅ Normal vitals classification (75 HR, 120/80 BP, 98% SpO2 → Low)
6. ✅ Invalid data rejection (HR 500, SpO2 150% → Invalid)

## Future Testing

### API Endpoint Tests (Planned)
- `GET /api/patients` with real database
- `GET /api/patients/{id}/trend` time-series data
- Health check endpoint validation
- Error handling for database failures

### SignalR Hub Tests (Planned)
- Real-time vital signs broadcasting
- Connection handling and reconnection
- Message delivery guarantees

### Performance Tests (Planned)
- Large patient loads (1000+ patients)
- Time-series query optimization
- Alert generation under load

## Medical Compliance

Our testing ensures:
- **No missed emergencies**: Critical conditions always detected
- **Data integrity**: Impossible readings rejected
- **Alert escalation**: Proper clinical workflow triggers
- **Audit trail**: All vital signs and alerts traceable

**Patient Safety**: These tests verify the system won't fail when lives depend on it.