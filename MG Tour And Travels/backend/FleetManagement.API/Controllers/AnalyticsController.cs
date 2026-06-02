using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Core.DTOs;
using FleetManagement.Core.Enums;
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly FleetDbContext _context;

        public AnalyticsController(FleetDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentDriverId()
        {
            var claim = User.FindFirst("DriverId");
            if (claim != null && int.TryParse(claim.Value, out var id))
                return id;
            return null;
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardAnalytics()
        {
            if (IsAdmin())
            {
                var totalRevenue = await _context.Earnings.SumAsync(e => e.Amount);
                var totalExpenses = await _context.Expenses.Where(e => e.Status == ExpenseStatus.Approved).SumAsync(e => e.Amount);
                
                var totalTrips = await _context.Trips.CountAsync();
                
                var activeCabsCount = await _context.Cabs.CountAsync(c => c.Status == CabStatus.Active);
                var totalCabsCount = await _context.Cabs.CountAsync();
                
                var activeDriversCount = await _context.Drivers.CountAsync(d => d.VerificationStatus == DriverVerificationStatus.Approved);
                var pendingExpensesCount = await _context.Expenses.CountAsync(e => e.Status == ExpenseStatus.Pending);

                // Last 6 months stats
                var monthlyStats = new List<MonthlyStatDto>();
                for (int i = 5; i >= 0; i--)
                {
                    var date = DateTime.UtcNow.AddMonths(-i);
                    var monthStr = date.ToString("MMM yyyy");
                    var startOfMonth = new DateTime(date.Year, date.Month, 1);
                    var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

                    var rev = await _context.Earnings
                        .Where(e => e.Date >= startOfMonth && e.Date <= endOfMonth)
                        .SumAsync(e => e.Amount);

                    var exp = await _context.Expenses
                        .Where(e => e.Status == ExpenseStatus.Approved && e.ExpenseDate >= startOfMonth && e.ExpenseDate <= endOfMonth)
                        .SumAsync(e => e.Amount);

                    monthlyStats.Add(new MonthlyStatDto
                    {
                        Month = monthStr,
                        Revenue = rev,
                        Expenses = exp
                    });
                }

                // Cab Utilization (top 5) - only completed trips
                var cabUtilizations = await _context.Trips
                    .Where(t => t.Status == TripStatus.Completed)
                    .Include(t => t.Cab)
                    .GroupBy(t => t.Cab.VehicleNumber)
                    .Select(g => new CabUtilizationDto
                    {
                        VehicleNumber = g.Key,
                        TripCount = g.Count(),
                        Earnings = g.Sum(t => t.FareAmount ?? 0)
                    })
                    .OrderByDescending(cu => cu.TripCount)
                    .Take(5)
                    .ToListAsync();

                // Least Performing Cabs (bottom 5)
                var leastPerformingCabs = await _context.Cabs
                    .Select(c => new CabPerformanceDto
                    {
                        VehicleNumber = c.VehicleNumber,
                        Make = c.Make,
                        Model = c.Model,
                        TripCount = _context.Trips.Count(t => t.CabId == c.Id && t.Status == TripStatus.Completed),
                        Earnings = _context.Trips.Where(t => t.CabId == c.Id && t.Status == TripStatus.Completed).Sum(t => t.FareAmount ?? 0)
                    })
                    .OrderBy(c => c.TripCount)
                    .ThenBy(c => c.Earnings)
                    .Take(5)
                    .ToListAsync();

                // Recent Activities
                var recentActivities = new List<RecentActivityDto>();
                
                var recentTrips = await _context.Trips
                    .Include(t => t.Driver)
                    .ThenInclude(d => d.User)
                    .OrderByDescending(t => t.StartTime)
                    .Take(3)
                    .ToListAsync();

                foreach (var trip in recentTrips)
                {
                    recentActivities.Add(new RecentActivityDto
                    {
                        Description = $"Driver {trip.Driver.User.Username} started Trip #{trip.Id} from {trip.StartLocation}.",
                        Timestamp = trip.StartTime,
                        Type = trip.Status == TripStatus.Active ? "Warning" : "Success"
                    });
                }

                var recentExpenses = await _context.Expenses
                    .Include(e => e.Driver)
                    .ThenInclude(d => d.User)
                    .OrderByDescending(e => e.ExpenseDate)
                    .Take(2)
                    .ToListAsync();

                foreach (var exp in recentExpenses)
                {
                    recentActivities.Add(new RecentActivityDto
                    {
                        Description = $"Expense of ₹{exp.Amount:N2} logged for {exp.Category} by {(exp.Driver != null ? exp.Driver.User.Username : "Admin")}.",
                        Timestamp = exp.ExpenseDate,
                        Type = exp.Status == ExpenseStatus.Pending ? "Info" : "Success"
                    });
                }

                recentActivities = recentActivities.OrderByDescending(ra => ra.Timestamp).Take(5).ToList();

                var analytics = new DashboardAnalyticsDto
                {
                    TotalRevenue = totalRevenue,
                    TotalExpenses = totalExpenses,
                    TotalTrips = totalTrips,
                    ActiveCabsCount = activeCabsCount,
                    TotalCabsCount = totalCabsCount,
                    ActiveDriversCount = activeDriversCount,
                    PendingExpensesCount = pendingExpensesCount,
                    MonthlyStats = monthlyStats,
                    CabUtilizations = cabUtilizations,
                    LeastPerformingCabs = leastPerformingCabs,
                    RecentActivities = recentActivities
                };

                return Ok(new { success = true, data = analytics });
            }
            else
            {
                var driverId = GetCurrentDriverId();
                if (!driverId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Driver profile not found." });
                }

                var today = DateTime.UtcNow.Date;

                var todayEarnings = await _context.Earnings
                    .Where(e => e.DriverId == driverId.Value && e.Date >= today)
                    .SumAsync(e => e.Amount);

                var todayTripsCount = await _context.Trips
                    .CountAsync(t => t.DriverId == driverId.Value && t.StartTime >= today);

                var todayExpenses = await _context.Expenses
                    .Where(e => e.DriverId == driverId.Value && e.ExpenseDate >= today && e.Status == ExpenseStatus.Approved)
                    .SumAsync(e => e.Amount);

                var driver = await _context.Drivers
                    .Include(d => d.CurrentCab)
                    .FirstOrDefaultAsync(d => d.Id == driverId.Value);

                var currentCab = driver?.CurrentCab != null ? new CabDto
                {
                    Id = driver.CurrentCab.Id,
                    VehicleNumber = driver.CurrentCab.VehicleNumber,
                    Model = driver.CurrentCab.Model,
                    Make = driver.CurrentCab.Make,
                    Year = driver.CurrentCab.Year,
                    Status = driver.CurrentCab.Status
                } : null;

                var activeTrip = await _context.Trips
                    .Include(t => t.Cab)
                    .FirstOrDefaultAsync(t => t.DriverId == driverId.Value && t.Status == TripStatus.Active);

                var activeTripDto = activeTrip != null ? new TripDto
                {
                    Id = activeTrip.Id,
                    CabId = activeTrip.CabId,
                    VehicleNumber = activeTrip.Cab.VehicleNumber,
                    StartTime = activeTrip.StartTime,
                    StartOdometer = activeTrip.StartOdometer,
                    StartLocation = activeTrip.StartLocation,
                    Status = activeTrip.Status
                } : null;

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        todayEarnings,
                        todayTripsCount,
                        todayExpenses,
                        currentCab,
                        activeTrip = activeTripDto
                    }
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("revenue-details")]
        public async Task<IActionResult> GetRevenueDetails()
        {
            var details = await _context.Earnings
                .Include(e => e.Driver)
                    .ThenInclude(d => d.User)
                .Include(e => e.Trip)
                    .ThenInclude(t => t.Cab)
                .OrderByDescending(e => e.Date)
                .Select(e => new RevenueDetailDto
                {
                    Id = e.Id,
                    Date = e.Date,
                    Amount = e.Amount,
                    Source = e.Source.ToString(),
                    Description = e.Description,
                    DriverName = e.Driver.User.Username,
                    VehicleNumber = e.Trip != null ? e.Trip.Cab.VehicleNumber : null
                })
                .ToListAsync();

            return Ok(new { success = true, data = details });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("expense-details")]
        public async Task<IActionResult> GetExpenseDetails()
        {
            var details = await _context.Expenses
                .Where(e => e.Status == ExpenseStatus.Approved)
                .Include(e => e.Driver)
                    .ThenInclude(d => d.User)
                .Include(e => e.Cab)
                .OrderByDescending(e => e.ExpenseDate)
                .Select(e => new ExpenseDetailDto
                {
                    Id = e.Id,
                    Date = e.ExpenseDate,
                    Amount = e.Amount,
                    Category = e.Category.ToString(),
                    Description = e.Description,
                    DriverName = e.Driver != null ? e.Driver.User.Username : "Admin",
                    CabVehicleNumber = e.Cab.VehicleNumber
                })
                .ToListAsync();

            return Ok(new { success = true, data = details });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("cabs-details")]
        public async Task<IActionResult> GetCabsDetails()
        {
            var cabs = await _context.Cabs.ToListAsync();
            var details = new List<CabDetailDto>();
            foreach (var cab in cabs)
            {
                var tripCount = await _context.Trips.CountAsync(t => t.CabId == cab.Id && t.Status == TripStatus.Completed);
                var totalExpenses = await _context.Expenses
                    .Where(e => e.CabId == cab.Id && e.Status == ExpenseStatus.Approved)
                    .SumAsync(e => e.Amount);
                var driver = await _context.Drivers
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.CurrentCabId == cab.Id);

                details.Add(new CabDetailDto
                {
                    Id = cab.Id,
                    VehicleNumber = cab.VehicleNumber,
                    Make = cab.Make,
                    Model = cab.Model,
                    FuelType = cab.FuelType,
                    Status = (int)cab.Status,
                    TripCount = tripCount,
                    TotalExpenses = totalExpenses,
                    AssignedDriverName = driver?.User.Username,
                    DriverSalary = driver?.Salary ?? 0
                });
            }

            return Ok(new { success = true, data = details });
        }
    }
}
