using System;
using System.Collections.Generic;
using FleetManagement.Core.Enums;

namespace FleetManagement.Core.DTOs
{
    // Auth DTOs
    public class AdminLoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class OtpRequestDto
    {
        public string Phone { get; set; }
    }

    public class OtpVerifyDto
    {
        public string Phone { get; set; }
        public string OtpCode { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; }
        public int? DriverId { get; set; }
    }

    // Cab DTOs
    public class CabDto
    {
        public int Id { get; set; }
        public string VehicleNumber { get; set; }
        public string Model { get; set; }
        public string Make { get; set; }
        public int Year { get; set; }
        public string Color { get; set; }
        public string FuelType { get; set; }
        public CabStatus Status { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCabDto
    {
        public string VehicleNumber { get; set; }
        public string Model { get; set; }
        public string Make { get; set; }
        public int Year { get; set; }
        public string Color { get; set; }
        public string FuelType { get; set; }
        public CabStatus Status { get; set; } = CabStatus.Active;
    }

    // Driver DTOs
    public class DriverDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } // Username
        public string Email { get; set; }
        public string Phone { get; set; }
        public string? Password { get; set; }
        public string? LicenseNumber { get; set; }
        public DateTime? LicenseExpiryDate { get; set; }
        public string Address { get; set; }
        public decimal Salary { get; set; }
        public DriverVerificationStatus VerificationStatus { get; set; }
        public int? CurrentCabId { get; set; }
        public string CurrentCabVehicleNumber { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateDriverDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string? LicenseNumber { get; set; }
        public DateTime? LicenseExpiryDate { get; set; }
        public string Address { get; set; }
        public decimal Salary { get; set; }
    }

    public class UpdateDriverDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string? LicenseNumber { get; set; }
        public DateTime? LicenseExpiryDate { get; set; }
        public string Address { get; set; }
        public decimal? Salary { get; set; }
        public DriverVerificationStatus VerificationStatus { get; set; }
        public string? Password { get; set; }
    }

    // Trip DTOs
    public class TripDto
    {
        public int Id { get; set; }
        public int CabId { get; set; }
        public string VehicleNumber { get; set; }
        public int DriverId { get; set; }
        public string DriverName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int StartOdometer { get; set; }
        public int? EndOdometer { get; set; }
        public string StartLocation { get; set; }
        public string EndLocation { get; set; }
        public string PickupOrDrop { get; set; }
        public TripStatus Status { get; set; }
        public decimal? FuelConsumed { get; set; }
        public decimal? FareAmount { get; set; }
        public decimal? TollAmount { get; set; }
        public string Notes { get; set; }
    }

    public class StartTripDto
    {
        public int TripId { get; set; }
        public int CabId { get; set; }
        public int StartOdometer { get; set; }
        public string StartLocation { get; set; }
        public string PickupOrDrop { get; set; }
        public string Notes { get; set; }
    }

    public class EndTripDto
    {
        public int EndOdometer { get; set; }
        public string EndLocation { get; set; }
        public decimal FuelConsumed { get; set; }
        public decimal FareAmount { get; set; }
        public decimal TollAmount { get; set; }
        public string Notes { get; set; }
    }

    public class CancelTripDto
    {
        public int EndOdometer { get; set; }
        public string EndLocation { get; set; }
        public string Notes { get; set; }
    }

    public class LogPastTripDto
    {
        public int TripId { get; set; }
        public int CabId { get; set; }
        public string StartLocation { get; set; }
        public string EndLocation { get; set; }
        public int StartOdometer { get; set; }
        public int EndOdometer { get; set; }
        public string PickupOrDrop { get; set; }
        public string Status { get; set; } // "Completed" or "Cancelled"
        public string Notes { get; set; }
    }

    // Expense DTOs
    public class ExpenseDto
    {
        public int Id { get; set; }
        public int? DriverId { get; set; }
        public string DriverName { get; set; }
        public int? CabId { get; set; }
        public string VehicleNumber { get; set; }
        public DateTime ExpenseDate { get; set; }
        public ExpenseCategory Category { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReceiptUrl { get; set; }
        public ExpenseStatus Status { get; set; }
    }

    public class CreateExpenseDto
    {
        public int? CabId { get; set; }
        public ExpenseCategory Category { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReceiptBase64 { get; set; } // Base64 encoded document upload
        public string ReceiptFileName { get; set; }
    }

    // Earning DTOs
    public class EarningDto
    {
        public int Id { get; set; }
        public int? TripId { get; set; }
        public int DriverId { get; set; }
        public string DriverName { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public EarningSource Source { get; set; }
        public string Description { get; set; }
    }

    // Target DTOs
    public class TargetDto
    {
        public int Id { get; set; }
        public int DriverId { get; set; }
        public string DriverName { get; set; }
        public TargetType TargetType { get; set; }
        public TargetMetricType MetricType { get; set; }
        public decimal TargetValue { get; set; }
        public decimal CurrentValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public TargetStatus Status { get; set; }
    }

    public class CreateTargetDto
    {
        public int DriverId { get; set; }
        public TargetType TargetType { get; set; }
        public TargetMetricType MetricType { get; set; }
        public decimal TargetValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    // Document DTOs
    public class DocumentDto
    {
        public int Id { get; set; }
        public DocumentEntityType EntityType { get; set; }
        public int EntityId { get; set; }
        public string? EntityIdentifier { get; set; } // e.g. Cab number or Driver name
        public DocumentType DocumentType { get; set; }
        public string? Title { get; set; }
        public string? DocumentUrl { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DocumentStatus Status { get; set; }
    }

    public class UploadDocumentDto
    {
        public DocumentEntityType EntityType { get; set; }
        public int EntityId { get; set; }
        public DocumentType DocumentType { get; set; }
        public string? Title { get; set; }
        public string? FileBase64 { get; set; }
        public string? FileName { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    public class UpdateDocumentDto
    {
        public DocumentType DocumentType { get; set; }
        public string? Title { get; set; }
        public string? FileBase64 { get; set; }
        public string? FileName { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DocumentStatus Status { get; set; }
    }

    // Analytics DTOs
    public class DashboardAnalyticsDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit => TotalRevenue - TotalExpenses;
        public int TotalTrips { get; set; }
        public int ActiveCabsCount { get; set; }
        public int TotalCabsCount { get; set; }
        public int ActiveDriversCount { get; set; }
        public int PendingExpensesCount { get; set; }

        public List<MonthlyStatDto> MonthlyStats { get; set; } = new();
        public List<CabUtilizationDto> CabUtilizations { get; set; } = new();
        public List<CabPerformanceDto> LeastPerformingCabs { get; set; } = new();
        public List<RecentActivityDto> RecentActivities { get; set; } = new();
    }

    public class CabPerformanceDto
    {
        public string VehicleNumber { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public int TripCount { get; set; }
        public decimal Earnings { get; set; }
    }

    public class RevenueDetailDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string Source { get; set; }
        public string Description { get; set; }
        public string DriverName { get; set; }
        public string? VehicleNumber { get; set; }
    }

    public class ExpenseDetailDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public string? DriverName { get; set; }
        public string CabVehicleNumber { get; set; }
    }

    public class CabDetailDto
    {
        public int Id { get; set; }
        public string VehicleNumber { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public string FuelType { get; set; }
        public int Status { get; set; } // enum CabStatus int value
        public int TripCount { get; set; }
        public decimal TotalExpenses { get; set; }
        public string? AssignedDriverName { get; set; }
        public decimal DriverSalary { get; set; }
    }

    public class MonthlyStatDto
    {
        public string Month { get; set; }
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
    }

    public class CabUtilizationDto
    {
        public string VehicleNumber { get; set; }
        public int TripCount { get; set; }
        public decimal Earnings { get; set; }
    }

    public class RecentActivityDto
    {
        public string Description { get; set; }
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } // Info, Warning, Success
    }

    public class UpdateExpenseDto
    {
        public int? CabId { get; set; }
        public int? DriverId { get; set; }
        public ExpenseCategory Category { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string ReceiptBase64 { get; set; }
        public string ReceiptFileName { get; set; }
        public ExpenseStatus Status { get; set; }
    }

    public class UpdateTripDto
    {
        public int CabId { get; set; }
        public int DriverId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int StartOdometer { get; set; }
        public int? EndOdometer { get; set; }
        public string StartLocation { get; set; }
        public string EndLocation { get; set; }
        public string PickupOrDrop { get; set; }
        public TripStatus Status { get; set; }
        public decimal? FuelConsumed { get; set; }
        public decimal? FareAmount { get; set; }
        public decimal? TollAmount { get; set; }
        public string Notes { get; set; }
    }

    public class UpdateTargetDto
    {
        public int DriverId { get; set; }
        public TargetType TargetType { get; set; }
        public TargetMetricType MetricType { get; set; }
        public decimal TargetValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public TargetStatus Status { get; set; }
    }
}
