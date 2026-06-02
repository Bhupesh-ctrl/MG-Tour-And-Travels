using System;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.Entities
{
    public class Expense : AuditableEntity
    {
        public int? DriverId { get; set; }
        public Driver Driver { get; set; }

        public int? CabId { get; set; }
        public Cab Cab { get; set; }

        public DateTime ExpenseDate { get; set; }
        public ExpenseCategory Category { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReceiptUrl { get; set; }
        public ExpenseStatus Status { get; set; } = ExpenseStatus.Pending;
    }
}
