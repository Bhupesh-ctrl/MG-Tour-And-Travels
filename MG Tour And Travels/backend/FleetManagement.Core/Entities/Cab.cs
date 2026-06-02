using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class Cab : AuditableEntity
    {
        public string VehicleNumber { get; set; }
        public string Model { get; set; }
        public string Make { get; set; }
        public int Year { get; set; }
        public string Color { get; set; }
        public string FuelType { get; set; }
        public CabStatus Status { get; set; } = CabStatus.Active;
    }
}
