namespace FleetManagement.Core.Enums
{
    public enum UserRole
    {
        Admin,
        Driver
    }

    public enum CabStatus
    {
        Active,
        Maintenance,
        OutOfService
    }

    public enum DriverVerificationStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public enum TripStatus
    {
        Scheduled,
        Active,
        Completed,
        Cancelled
    }

    public enum ExpenseCategory
    {
        Fuel,
        Maintenance,
        Toll,
        Insurance,
        Other
    }

    public enum ExpenseStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public enum EarningSource
    {
        Trip,
        Bonus,
        Other
    }

    public enum TargetType
    {
        Daily,
        Weekly,
        Monthly
    }

    public enum TargetMetricType
    {
        Trips,
        Earnings,
        Hours
    }

    public enum TargetStatus
    {
        Active,
        Completed,
        Failed
    }

    public enum DocumentEntityType
    {
        Driver,
        Cab,
        Trip,
        Expense
    }

    public enum DocumentType
    {
        License,
        Registration,
        Insurance,
        Permit,
        Receipt,
        Pollution,
        ServicePaper,
        Challan,
        Other
    }

    public enum DocumentStatus
    {
        Pending,
        Verified,
        Rejected
    }
}
