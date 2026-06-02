using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class Trip : AuditableEntity
    {
        public int CabId { get; set; }
        public Cab Cab { get; set; }

        public int DriverId { get; set; }
        public Driver Driver { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public int StartOdometer { get; set; }
        public int? EndOdometer { get; set; }

        public string StartLocation { get; set; }
        public string? EndLocation { get; set; }
        public string? PickupOrDrop { get; set; } // "Pickup" or "Drop"

        public TripStatus Status { get; set; } = TripStatus.Scheduled;

        public decimal? FuelConsumed { get; set; }
        public decimal? FareAmount { get; set; }
        public decimal? TollAmount { get; set; }
        public string? Notes { get; set; }
    }
}
