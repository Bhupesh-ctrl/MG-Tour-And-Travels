using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class Earning : AuditableEntity
    {
        public int? TripId { get; set; }
        public Trip Trip { get; set; }

        public int DriverId { get; set; }
        public Driver Driver { get; set; }

        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public EarningSource Source { get; set; } = EarningSource.Trip;
        public string Description { get; set; }
    }
}
