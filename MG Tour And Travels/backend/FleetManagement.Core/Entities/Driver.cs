using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class Driver : AuditableEntity
    {
        public int UserId { get; set; }
        public User User { get; set; }

        public string? LicenseNumber { get; set; }
        public DateTime? LicenseExpiryDate { get; set; }
        public string Address { get; set; }
        public decimal Salary { get; set; }
        public DriverVerificationStatus VerificationStatus { get; set; } = DriverVerificationStatus.Pending;

        public int? CurrentCabId { get; set; }
        public Cab? CurrentCab { get; set; }
    }
}
