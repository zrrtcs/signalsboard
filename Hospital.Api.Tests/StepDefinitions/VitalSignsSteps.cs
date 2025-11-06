using Signalsboard.Hospital.Api.Domain;
using TechTalk.SpecFlow;
using Xunit;

namespace Signalsboard.Hospital.Api.Tests.StepDefinitions;

[Binding]
public class VitalSignsSteps
{
    private VitalSigns _vitals = null!;
    private AlertSeverity _alertLevel;

    [Given(@"a patient with heart rate of (.*) BPM")]
    public void GivenAPatientWithHeartRate(int heartRate)
    {
        _vitals = new VitalSigns
        {
            Id = Guid.NewGuid().ToString(),
            PatientId = "P001",
            HeartRate = heartRate,
            RecordedAt = DateTime.UtcNow
        };
    }

    [Given(@"a patient has a heart rate of (.*) BPM")]
    public void GivenAPatientHasHeartRateOf(int heartRate)
    {
        GivenAPatientWithHeartRate(heartRate);
    }

    [When(@"the vital signs alert system evaluates the patient")]
    public void WhenTheAlertSystemEvaluates()
    {
        _alertLevel = _vitals.CalculateAlertSeverity();
    }

    [When(@"alert evaluation runs")]
    public void WhenAlertEvaluationRuns()
    {
        WhenTheAlertSystemEvaluates();
    }

    [Then(@"a critical alert should be triggered")]
    public void ThenCriticalAlertTriggered()
    {
        Assert.Equal(AlertSeverity.Critical, _alertLevel);
    }

    [Then(@"a medium alert should be triggered")]
    public void ThenMediumAlertTriggered()
    {
        Assert.Equal(AlertSeverity.Medium, _alertLevel);
    }

    [Then(@"no critical alert should be triggered")]
    public void ThenNoCriticalAlertTriggered()
    {
        Assert.NotEqual(AlertSeverity.Critical, _alertLevel);
    }

    [Then(@"the alert severity should be ""(.*)""")]
    public void ThenTheAlertSeverityShouldBe(string expectedSeverity)
    {
        var expected = Enum.Parse<AlertSeverity>(expectedSeverity);
        Assert.Equal(expected, _alertLevel);
    }
}
