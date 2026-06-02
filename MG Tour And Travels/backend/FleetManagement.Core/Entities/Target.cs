using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class Target : AuditableEntity
    {
        public int DriverId { get; set; }
        public Driver Driver { get; set; }

        public TargetType TargetType { get; set; }
        public TargetMetricType MetricType { get; set; }
        public decimal TargetValue { get; set; }
        public decimal CurrentValue { get; set; } = 0;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public TargetStatus Status { get; set; } = TargetStatus.Active;
    }
}
