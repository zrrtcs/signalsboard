using Microsoft.EntityFrameworkCore;
using Signalsboard.Hospital.Contracts.Models;

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
}