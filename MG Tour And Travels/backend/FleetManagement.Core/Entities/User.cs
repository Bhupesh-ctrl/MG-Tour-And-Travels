using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class User : AuditableEntity
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public UserRole Role { get; set; }
    }
}
