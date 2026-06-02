using System;

namespace FleetManagement.Core.Entities
{
    public class DriverOtp
    {
        public int Id { get; set; }
        public string Phone { get; set; }
        public string OtpCode { get; set; }
        public DateTime ExpiryTime { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
