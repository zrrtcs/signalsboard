 See how the magic works?

  The Process:

  1. EF scans your DbContext: It finds these lines:
  public DbSet<Ward> Wards { get; set; }
  public DbSet<Patient> Patients { get; set; }
  // etc...
  2. EF reads entity annotations: Your entities have attributes like:
  [Table("wards")]           // → Creates "wards" table
  [Column("id")]             // → Creates "id" column  
  [MaxLength(50)]            // → VARCHAR(50) in PostgreSQL
  3. EF reads fluent configuration: In OnModelCreating(), you defined relationships:
  entity.HasOne(b => b.Ward)
        .WithMany(w => w.Beds)   // → Creates foreign key constraint
  4. EF generates SQL: Based on all this metadata, it creates the migration file with CREATE TABLE statements.

  That's why when you ran dotnet ef migrations add InitialHospitalSchema, it automatically knew to create tables for wards, beds, patients,
  vital_signs, alerts, and staff with all the correct columns, constraints, and relationships!

  ★ Insight ─────────────────────────────────────
  This is declarative programming - you describe what you want (entities and relationships) rather than how to create it (SQL statements). EF
  handles the translation to database-specific SQL.
  ─────────────────────────────────────────────────