using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class Document : AuditableEntity
    {
        public DocumentEntityType EntityType { get; set; }
        public int EntityId { get; set; } // Reference ID (e.g. DriverId, CabId, etc.)

        public DocumentType DocumentType { get; set; }
        public string Title { get; set; } = string.Empty;
        public string DocumentUrl { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DocumentStatus Status { get; set; } = DocumentStatus.Pending;
    }
}
