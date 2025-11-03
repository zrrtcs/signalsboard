using Microsoft.EntityFrameworkCore;
using Signalsboard.Hospital.Api.Domain;

namespace Signalsboard.Hospital.Api.Data;

public class HospitalDbContext : DbContext
{
    public HospitalDbContext(DbContextOptions<HospitalDbContext> options)
        : base(options)
    {
    }

    // DbSets for EF operations
    public DbSet<Ward> Wards { get; set; } = null!;
    public DbSet<Bed> Beds { get; set; } = null!;
    public DbSet<Patient> Patients { get; set; } = null!;
    public DbSet<VitalSigns> VitalSigns { get; set; } = null!;
    public DbSet<Alert> Alerts { get; set; } = null!;
    public DbSet<Staff> Staff { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure relationships and constraints
        modelBuilder.Entity<Bed>(entity =>
        {
            entity.HasOne(b => b.Ward)
                  .WithMany(w => w.Beds)
                  .HasForeignKey(b => b.WardId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Index for performance
            entity.HasIndex(b => b.WardId);
        });

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasOne(p => p.Bed)
                  .WithOne(b => b.Patient)
                  .HasForeignKey<Patient>(p => p.BedId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Unique constraint on MRN
            entity.HasIndex(p => p.Mrn).IsUnique();
        });

        modelBuilder.Entity<VitalSigns>(entity =>
        {
            entity.HasOne(v => v.Patient)
                  .WithMany(p => p.VitalSigns)
                  .HasForeignKey(v => v.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Index for time-series queries (critical for performance)
            entity.HasIndex(v => new { v.PatientId, v.RecordedAt });
            entity.HasIndex(v => v.RecordedAt);
        });

        modelBuilder.Entity<Alert>(entity =>
        {
            entity.HasOne(a => a.Patient)
                  .WithMany(p => p.Alerts)
                  .HasForeignKey(a => a.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Index for active alerts (critical for dashboard queries)
            entity.HasIndex(a => new { a.PatientId, a.IsActive });
            entity.HasIndex(a => a.TriggeredAt);
        });

        modelBuilder.Entity<Staff>(entity =>
        {
            entity.HasOne(s => s.Ward)
                  .WithMany(w => w.Staff)
                  .HasForeignKey(s => s.WardId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(s => s.WardId);
        });
    }

    public void SeedDatabase()
    {
        if (!Wards.Any())
        {
            var wards = new List<Ward>
            {
                new Ward { Name = "Cardiology" },
                new Ward { Name = "Neurology" },
                new Ward { Name = "Pediatrics" }
            };

            Wards.AddRange(wards);
            SaveChanges();

            var beds = new List<Bed>();
            foreach (var ward in wards)
            {
                for (int i = 1; i <= 10; i++)
                {
                    beds.Add(new Bed { WardId = ward.Id, Number = i.ToString() });
                }
            }

            Beds.AddRange(beds);
            SaveChanges();

            var patients = new List<Patient>
            {
                new Patient { Name = "John Doe", Mrn = "MRN001", BedId = beds[0].Id },
                new Patient { Name = "Jane Smith", Mrn = "MRN002", BedId = beds[1].Id },
                new Patient { Name = "Alice Johnson", Mrn = "MRN003", BedId = beds[2].Id },
                new Patient { Name = "Bob Brown", Mrn = "MRN004", BedId = beds[3].Id },
                new Patient { Name = "Charlie Davis", Mrn = "MRN005", BedId = beds[4].Id },
                new Patient { Name = "Diana Evans", Mrn = "MRN006", BedId = beds[5].Id },
                new Patient { Name = "Ethan Foster", Mrn = "MRN007", BedId = beds[6].Id },
                new Patient { Name = "Fiona Green", Mrn = "MRN008", BedId = beds[7].Id },
                new Patient { Name = "George Harris", Mrn = "MRN009", BedId = beds[8].Id },
                new Patient { Name = "Hannah Irving", Mrn = "MRN010", BedId = beds[9].Id }
            };

            Patients.AddRange(patients);
            SaveChanges();

            var staff = new List<Staff>
            {
                new Staff { Name = "Dr. Alice", WardId = wards[0].Id },
                new Staff { Name = "Nurse Bob", WardId = wards[1].Id }
            };

            Staff.AddRange(staff);
            SaveChanges();
        }
    }
}