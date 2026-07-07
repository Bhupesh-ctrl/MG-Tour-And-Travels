using System;

namespace FleetManagement.Core.Entities
{
    public class OutstationInquiry : AuditableEntity
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public string TripType { get; set; }
        public string PickupLocation { get; set; }
        public string DropLocation { get; set; }
        public DateTime? CheckinDateTime { get; set; }
        public DateTime? CheckoutDateTime { get; set; }
        public int PassengerCount { get; set; }
        public string CarPreference { get; set; }
        public string Remarks { get; set; }
        public string Status { get; set; } = "New";
    }
}
