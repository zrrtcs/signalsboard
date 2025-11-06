Feature: Critical Heart Rate Detection
    As a hospital monitoring system
    I want to detect critically abnormal heart rates
    So that medical staff can respond to cardiac emergencies

Scenario: Patient has dangerously high heart rate
    Given a patient with heart rate of 185 BPM
    When the vital signs alert system evaluates the patient
    Then a critical alert should be triggered
    And the alert severity should be "Critical"

Scenario: Patient has dangerously low heart rate
    Given a patient with heart rate of 40 BPM
    When the vital signs alert system evaluates the patient
    Then a critical alert should be triggered
    And the alert severity should be "Critical"

Scenario: Patient has elevated heart rate
    Given a patient with heart rate of 115 BPM
    When the vital signs alert system evaluates the patient
    Then a medium alert should be triggered
    And the alert severity should be "Medium"

Scenario: Patient has normal heart rate
    Given a patient with heart rate of 75 BPM
    When the vital signs alert system evaluates the patient
    Then no critical alert should be triggered
    And the alert severity should be "Low"

Scenario Outline: Heart rate threshold detection
    Given a patient has a heart rate of <heartRate> BPM
    When alert evaluation runs
    Then the alert severity should be "<severity>"

    Examples:
    | heartRate | severity |
    | 40        | Critical |
    | 45        | Critical |
    | 55        | Medium   |
    | 75        | Low      |
    | 95        | Low      |
    | 115       | Medium   |
    | 130       | Critical |
    | 185       | Critical |
