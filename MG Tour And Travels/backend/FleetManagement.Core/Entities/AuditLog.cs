using System;

namespace FleetManagement.Core.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string TableName { get; set; }
        public string Action { get; set; } // Create, Update, Delete
        public string KeyValues { get; set; } // JSON
        public string OldValues { get; set; } // JSON
        public string NewValues { get; set; } // JSON
        public string ChangedBy { get; set; }
        public DateTime ChangedDate { get; set; } = DateTime.UtcNow;
    }
}
