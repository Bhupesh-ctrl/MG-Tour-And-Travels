using System;

namespace FleetManagement.Core.Entities
{
    public class GeneralInquiry : AuditableEntity
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public string CarPreference { get; set; }
        public string Notes { get; set; }
        public string Status { get; set; } = "New";
    }
}
