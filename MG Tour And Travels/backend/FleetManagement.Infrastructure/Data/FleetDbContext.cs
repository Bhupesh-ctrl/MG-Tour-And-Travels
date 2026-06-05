using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;
using FleetManagement.Core.Entities;

namespace FleetManagement.Infrastructure.Data
{
    public class FleetDbContext : DbContext
    {
        public FleetDbContext(DbContextOptions<FleetDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Cab> Cabs { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<DriverOtp> DriverOtps { get; set; }
        public DbSet<Trip> Trips { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Earning> Earnings { get; set; }
        public DbSet<Target> Targets { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure global soft delete filters
            modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
            modelBuilder.Entity<Cab>().HasQueryFilter(c => !c.IsDeleted);
            modelBuilder.Entity<Driver>().HasQueryFilter(d => !d.IsDeleted);
            modelBuilder.Entity<Trip>().HasQueryFilter(t => !t.IsDeleted);
            modelBuilder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Earning>().HasQueryFilter(er => !er.IsDeleted);
            modelBuilder.Entity<Target>().HasQueryFilter(tg => !tg.IsDeleted);
            modelBuilder.Entity<Document>().HasQueryFilter(doc => !doc.IsDeleted);

            // Unique constraints
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique().HasFilter("[Username] IS NOT NULL");
            modelBuilder.Entity<User>().HasIndex(u => u.Phone).IsUnique().HasFilter("[Phone] IS NOT NULL");
            modelBuilder.Entity<Cab>().HasIndex(c => c.VehicleNumber).IsUnique();

            // Self references or relations
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Driver>()
                .HasOne(d => d.CurrentCab)
                .WithMany()
                .HasForeignKey(d => d.CurrentCabId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Trip>()
                .Property(t => t.Id)
                .ValueGeneratedNever();

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.Cab)
                .WithMany()
                .HasForeignKey(t => t.CabId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.Driver)
                .WithMany()
                .HasForeignKey(t => t.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.Driver)
                .WithMany()
                .HasForeignKey(e => e.DriverId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.Cab)
                .WithMany()
                .HasForeignKey(e => e.CabId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Earning>()
                .HasOne(e => e.Driver)
                .WithMany()
                .HasForeignKey(e => e.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Earning>()
                .HasOne(e => e.Trip)
                .WithMany()
                .HasForeignKey(e => e.TripId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Target>()
                .HasOne(t => t.Driver)
                .WithMany()
                .HasForeignKey(t => t.DriverId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure all DateTime and DateTime? properties to use UTC converter
            var utcConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
                v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc));

            var utcNullableConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
                v => !v.HasValue ? v : (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)),
                v => !v.HasValue ? v : (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)));

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(utcConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(utcNullableConverter);
                    }
                }
            }
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var auditEntries = OnBeforeSaveChanges();
            var result = await base.SaveChangesAsync(cancellationToken);
            await OnAfterSaveChangesAsync(auditEntries);
            return result;
        }

        private List<AuditEntry> OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditEntry>();

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.Entity is DriverOtp || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                // Set auditable properties
                if (entry.Entity is AuditableEntity auditable)
                {
                    var currentUser = "System"; // In production, we inject current user
                    if (entry.State == EntityState.Added)
                    {
                        auditable.CreatedDate = DateTime.UtcNow;
                        auditable.CreatedBy = currentUser;
                        auditable.IsActive = true;
                        auditable.IsDeleted = false;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        auditable.UpdatedDate = DateTime.UtcNow;
                        auditable.UpdatedBy = currentUser;
                    }
                    else if (entry.State == EntityState.Deleted)
                    {
                        // Intercept Delete and change to Soft Delete (Update)
                        entry.State = EntityState.Modified;
                        auditable.IsDeleted = true;
                        auditable.UpdatedDate = DateTime.UtcNow;
                        auditable.UpdatedBy = currentUser;
                    }
                }

                var auditEntry = new AuditEntry(entry);
                auditEntry.TableName = entry.Entity.GetType().Name;
                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    if (property.IsTemporary)
                    {
                        auditEntry.TemporaryProperties.Add(property);
                        continue;
                    }

                    string propertyName = property.Metadata.Name;
                    if (property.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[propertyName] = property.CurrentValue;
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            auditEntry.Action = "Create";
                            break;

                        case EntityState.Deleted:
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.Action = "Delete";
                            break;

                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.OldValues[propertyName] = property.OriginalValue;
                                auditEntry.NewValues[propertyName] = property.CurrentValue;
                                auditEntry.Action = "Update";
                            }
                            break;
                    }
                }
            }

            foreach (var auditEntry in auditEntries.Where(_ => !_.HasTemporaryProperties))
            {
                AuditLogs.Add(auditEntry.ToAuditLog());
            }

            return auditEntries.Where(_ => _.HasTemporaryProperties).ToList();
        }

        private Task OnAfterSaveChangesAsync(List<AuditEntry> auditEntries)
        {
            if (auditEntries == null || auditEntries.Count == 0)
                return Task.CompletedTask;

            foreach (var auditEntry in auditEntries)
            {
                foreach (var prop in auditEntry.TemporaryProperties)
                {
                    if (prop.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[prop.Metadata.Name] = prop.CurrentValue;
                    }
                    else
                    {
                        auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
                    }
                }
                AuditLogs.Add(auditEntry.ToAuditLog());
            }

            return base.SaveChangesAsync();
        }
    }

    internal class AuditEntry
    {
        public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            Entry = entry;
        }

        public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
        public string TableName { get; set; }
        public string Action { get; set; }
        public Dictionary<string, object> KeyValues { get; } = new();
        public Dictionary<string, object> OldValues { get; } = new();
        public Dictionary<string, object> NewValues { get; } = new();
        public List<Microsoft.EntityFrameworkCore.ChangeTracking.PropertyEntry> TemporaryProperties { get; } = new();

        public bool HasTemporaryProperties => TemporaryProperties.Any();

        public AuditLog ToAuditLog()
        {
            var audit = new AuditLog();
            audit.TableName = TableName;
            audit.Action = Action;
            audit.ChangedDate = DateTime.UtcNow;
            audit.ChangedBy = "System"; // Default, can be overridden by Web context
            audit.KeyValues = JsonSerializer.Serialize(KeyValues);
            audit.OldValues = OldValues.Count == 0 ? string.Empty : JsonSerializer.Serialize(OldValues);
            audit.NewValues = NewValues.Count == 0 ? string.Empty : JsonSerializer.Serialize(NewValues);
            return audit;
        }
    }
}
