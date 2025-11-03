using Microsoft.EntityFrameworkCore;
using Signalsboard.Hospital.Api.Domain;

namespace Signalsboard.Hospital.Api.Data;

/// <summary>
/// Database seed data initialization for development environment.
/// Creates sample wards, beds, and patients with initial vital signs.
/// </summary>
public static class SeedData
{
    public static void Initialize(HospitalDbContext context)
    {
        // Apply pending migrations
        context.Database.Migrate();

        // Skip if data already exists
        if (context.Wards.Any())
            return;

        // Create ward
        var ward = new Ward
        {
            Id = "w1",
            Name = "Intensive Care Unit",
            Capacity = 10,
            Location = "Floor 3"
        };
        context.Wards.Add(ward);
        context.SaveChanges();

        // Create beds
        var beds = new[]
        {
            new Bed { Id = "b1", Number = "ICU-101", WardId = "w1", Status = "occupied", BedType = "standard" },
            new Bed { Id = "b2", Number = "ICU-102", WardId = "w1", Status = "occupied", BedType = "standard" },
            new Bed { Id = "b3", Number = "ICU-103", WardId = "w1", Status = "occupied", BedType = "isolation" },
            new Bed { Id = "b4", Number = "ICU-104", WardId = "w1", Status = "available", BedType = "standard" },
            new Bed { Id = "b5", Number = "ICU-105", WardId = "w1", Status = "available", BedType = "standard" }
        };
        context.Beds.AddRange(beds);
        context.SaveChanges();

        // Create patients
        var patients = new[]
        {
            new Patient
            {
                Id = "p1",
                Mrn = "MRN-001",
                Name = "John Doe",
                BedId = "b1",
                Status = "stable",
                AdmittedAt = DateTime.UtcNow.AddDays(-5),
                AttendingPhysician = "Dr. Smith",
                PrimaryDiagnosis = "Post-operative recovery"
            },
            new Patient
            {
                Id = "p2",
                Mrn = "MRN-002",
                Name = "Jane Smith",
                BedId = "b2",
                Status = "watch",
                AdmittedAt = DateTime.UtcNow.AddDays(-3),
                AttendingPhysician = "Dr. Johnson",
                PrimaryDiagnosis = "Acute respiratory distress"
            },
            new Patient
            {
                Id = "p3",
                Mrn = "MRN-003",
                Name = "Bob Critical",
                BedId = "b3",
                Status = "stable",
                AdmittedAt = DateTime.UtcNow.AddDays(-1),
                AttendingPhysician = "Dr. Williams",
                PrimaryDiagnosis = "Post-surgical monitoring"
            }
        };
        context.Patients.AddRange(patients);
        context.SaveChanges();

        // Create initial vital signs for each patient
        var vitals = new[]
        {
            new VitalSigns
            {
                Id = "v1",
                PatientId = "p1",
                HeartRate = 75,
                SpO2 = 98,
                BpSystolic = 120,
                BpDiastolic = 80,
                Temperature = 37.0m,
                RecordedAt = DateTime.UtcNow
            },
            new VitalSigns
            {
                Id = "v2",
                PatientId = "p2",
                HeartRate = 115,
                SpO2 = 93,
                BpSystolic = 145,
                BpDiastolic = 92,
                Temperature = 37.2m,
                RecordedAt = DateTime.UtcNow
            },
            new VitalSigns
            {
                Id = "v3",
                PatientId = "p3",
                HeartRate = 78,
                SpO2 = 97,
                BpSystolic = 122,
                BpDiastolic = 80,
                Temperature = 37.1m,
                RecordedAt = DateTime.UtcNow
            }
        };
        context.VitalSigns.AddRange(vitals);
        context.SaveChanges();
    }
}
