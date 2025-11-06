# BDD Testing with SpecFlow/Gherkin - Medical Scenarios

## Overview

Behavior-Driven Development (BDD) uses natural language (Gherkin syntax) to describe test scenarios in a way that both technical and non-technical stakeholders can understand. For healthcare applications, this is particularly valuable as medical professionals can validate test scenarios.

## Why BDD for Medical Software?

- **Clarity**: Doctors and nurses can read and validate test scenarios
- **Safety**: Medical requirements written in plain English reduce miscommunication
- **Documentation**: Tests serve as living documentation of medical logic
- **Compliance**: Clear audit trail of how medical decisions are made

## SpecFlow in C#

**SpecFlow** is the leading BDD framework for .NET, implementing Cucumber's Gherkin syntax.

### Example Medical Scenario

```gherkin
Feature: Critical Heart Rate Detection
  As a monitoring system
  I want to detect critically high heart rates
  So that medical staff can respond to cardiac emergencies

Scenario: Patient has dangerously high heart rate
  Given a patient with ID "P001"
  And the patient has a heart rate of 185 BPM
  When the vital signs alert system evaluates the patient
  Then a critical alert should be triggered
  And the alert severity should be "Critical"
  And the alert message should contain "Heart rate critically high"

Scenario: Patient has normal heart rate
  Given a patient with ID "P002"
  And the patient has a heart rate of 72 BPM
  When the vital signs alert system evaluates the patient
  Then no alert should be triggered
  And the patient status should be "stable"
```

### C# Step Definitions

```csharp
[Binding]
public class VitalSignsSteps
{
    private VitalSigns _vitals;
    private AlertSeverity _alertLevel;

    [Given(@"a patient with ID ""(.*)""")]
    public void GivenAPatientWithID(string patientId)
    {
        _vitals = new VitalSigns { PatientId = patientId };
    }

    [Given(@"the patient has a heart rate of (.*) BPM")]
    public void GivenThePatientHasHeartRate(int heartRate)
    {
        _vitals.HeartRate = heartRate;
    }

    [When(@"the vital signs alert system evaluates the patient")]
    public void WhenTheAlertSystemEvaluates()
    {
        _alertLevel = _vitals.CalculateAlertSeverity();
    }

    [Then(@"a critical alert should be triggered")]
    public void ThenCriticalAlertTriggered()
    {
        Assert.Equal(AlertSeverity.Critical, _alertLevel);
    }
}
```

## Medical Scenarios to Implement

### 1. Heart Rate Monitoring
```gherkin
Scenario Outline: Heart rate threshold detection
  Given a patient has a heart rate of <heartRate> BPM
  When alert evaluation runs
  Then the alert severity should be "<severity>"

Examples:
  | heartRate | severity  |
  | 40        | Critical  |
  | 55        | Medium    |
  | 75        | Low       |
  | 115       | Medium    |
  | 185       | Critical  |
```

### 2. Oxygen Saturation (SpO2)
```gherkin
Scenario: Hypoxemia detection
  Given a patient with SpO2 of 85%
  When vital signs are evaluated
  Then a critical hypoxemia alert should trigger
  And oxygen therapy should be recommended
```

### 3. Blood Pressure Crisis
```gherkin
Scenario: Hypertensive crisis
  Given a patient with blood pressure 190/120 mmHg
  When blood pressure thresholds are checked
  Then a critical hypertensive crisis alert should trigger
  And immediate medical intervention should be flagged
```

### 4. Multi-Vital Correlation
```gherkin
Scenario: Sepsis warning signs
  Given a patient has the following vitals:
    | Vital       | Value |
    | HeartRate   | 125   |
    | Temperature | 38.5  |
    | SpO2        | 90    |
  When sepsis screening algorithm runs
  Then a high-severity composite alert should trigger
  And the alert should indicate possible sepsis
```

### 5. Stale Data Detection
```gherkin
Scenario: Outdated vital signs warning
  Given a patient's last vital signs reading was 45 minutes ago
  When data freshness is checked
  Then a "stale data" warning should appear
  And the patient row should be highlighted
```

## BDD Framework Setup

### Required NuGet Packages
```xml
<PackageReference Include="SpecFlow" Version="3.9.74" />
<PackageReference Include="SpecFlow.xUnit" Version="3.9.74" />
<PackageReference Include="SpecFlow.Tools.MsBuild.Generation" Version="3.9.74" />
```

### Project Structure
```
Hospital.Api.Tests/
├─ Features/
│  ├─ HeartRateMonitoring.feature
│  ├─ OxygenSaturation.feature
│  ├─ BloodPressure.feature
│  └─ MultiVitalCorrelation.feature
├─ StepDefinitions/
│  ├─ VitalSignsSteps.cs
│  ├─ AlertSteps.cs
│  └─ PatientSteps.cs
└─ Support/
   └─ TestDataBuilder.cs
```

## Benefits for Healthcare Dashboard

1. **Non-technical stakeholders** (doctors, nurses) can review test scenarios
2. **Medical protocols** are documented in plain language
3. **Regulatory compliance** - clear audit trail of medical logic
4. **Living documentation** - tests describe system behavior
5. **Collaboration** - bridge between medical staff and developers

## Comparison with xUnit

| Aspect | xUnit (Current) | SpecFlow/Gherkin |
|--------|-----------------|------------------|
| **Readability** | Technical (C#) | Plain English |
| **Stakeholders** | Developers only | Doctors + Devs |
| **Documentation** | Code comments | Self-documenting |
| **Medical Validation** | Difficult | Easy |
| **Setup Complexity** | Simple | More setup |
| **Execution Speed** | Fast | Slightly slower |

## When to Use BDD

**Use BDD/SpecFlow for:**
- ✅ Critical medical logic (alert thresholds)
- ✅ Complex business rules (sepsis detection)
- ✅ Compliance-sensitive scenarios
- ✅ Features requiring medical staff validation

**Stick with xUnit for:**
- ✅ Unit tests (individual methods)
- ✅ Integration tests (database/API)
- ✅ Performance tests
- ✅ Technical edge cases

## Implementation Priority

1. **Phase 1**: Heart rate threshold detection (most critical)
2. **Phase 2**: SpO2 and blood pressure scenarios
3. **Phase 3**: Multi-vital correlation (sepsis, shock)
4. **Phase 4**: Time-series patterns (trending up/down)

## References

- **SpecFlow**: https://specflow.org/
- **Gherkin Syntax**: https://cucumber.io/docs/gherkin/
- **Medical Alert Standards**: Document clinical threshold sources

---

*BDD testing provides a bridge between medical domain knowledge and software implementation, ensuring our hospital dashboard correctly implements life-critical alert logic.*
