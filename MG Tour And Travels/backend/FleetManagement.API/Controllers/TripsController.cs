using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FleetManagement.Core.DTOs;
using FleetManagement.Core.Entities;
using FleetManagement.Core.Enums;
using FleetManagement.Core.Interfaces;
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TripsController : ControllerBase
    {
        private readonly FleetDbContext _context;
        private readonly IUnitOfWork _unitOfWork;

        public TripsController(FleetDbContext context, IUnitOfWork unitOfWork)
        {
            _context = context;
            _unitOfWork = unitOfWork;
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

        [HttpGet]
        public async Task<IActionResult> GetTrips(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string status = "",
            [FromQuery] int? driverId = null,
            [FromQuery] int? cabId = null)
        {
            var query = _context.Trips
                .Include(t => t.Cab)
                .Include(t => t.Driver)
                .ThenInclude(d => d.User)
                .AsQueryable();

            // Authorization filter
            if (!IsAdmin())
            {
                var currentDriverId = GetCurrentDriverId();
                if (!currentDriverId.HasValue)
                {
                    return Forbid();
                }
                query = query.Where(t => t.DriverId == currentDriverId.Value);
            }
            else if (driverId.HasValue)
            {
                query = query.Where(t => t.DriverId == driverId.Value);
            }

            if (cabId.HasValue)
            {
                query = query.Where(t => t.CabId == cabId.Value);
            }

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<TripStatus>(status, true, out var tripStatus))
            {
                query = query.Where(t => t.Status == tripStatus);
            }

            query = query.OrderByDescending(t => t.StartTime);

            var totalCount = await query.CountAsync();

            var pagedTrips = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TripDto
                {
                    Id = t.Id,
                    VendorTripId = t.VendorTripId,
                    CabId = t.CabId,
                    VehicleNumber = t.Cab.VehicleNumber,
                    DriverId = t.DriverId,
                    DriverName = t.Driver.User.Username,
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                    StartOdometer = t.StartOdometer,
                    EndOdometer = t.EndOdometer,
                    StartLocation = t.StartLocation,
                    EndLocation = t.EndLocation,
                    PickupOrDrop = t.PickupOrDrop,
                    Status = t.Status,
                    FuelConsumed = t.FuelConsumed,
                    FareAmount = t.FareAmount,
                    TollAmount = t.TollAmount,
                    Notes = t.Notes
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Trips retrieved successfully",
                data = new
                {
                    items = pagedTrips,
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTripById(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Cab)
                .Include(t => t.Driver)
                .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
            {
                return NotFound(new { success = false, message = "Trip not found" });
            }

            // Authorization check
            if (!IsAdmin() && trip.DriverId != GetCurrentDriverId())
            {
                return Forbid();
            }

            return Ok(new
            {
                success = true,
                message = "Trip retrieved successfully",
                data = new TripDto
                {
                    Id = trip.Id,
                    VendorTripId = trip.VendorTripId,
                    CabId = trip.CabId,
                    VehicleNumber = trip.Cab.VehicleNumber,
                    DriverId = trip.DriverId,
                    DriverName = trip.Driver.User.Username,
                    StartTime = trip.StartTime,
                    EndTime = trip.EndTime,
                    StartOdometer = trip.StartOdometer,
                    EndOdometer = trip.EndOdometer,
                    StartLocation = trip.StartLocation,
                    EndLocation = trip.EndLocation,
                    PickupOrDrop = trip.PickupOrDrop,
                    Status = trip.Status,
                    FuelConsumed = trip.FuelConsumed,
                    FareAmount = trip.FareAmount,
                    TollAmount = trip.TollAmount,
                    Notes = trip.Notes
                }
            });
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartTrip([FromBody] StartTripDto dto)
        {
            var driverId = GetCurrentDriverId();
            if (!driverId.HasValue)
            {
                return BadRequest(new { success = false, message = "Only registered drivers can start trips." });
            }

            if (dto.TripId <= 0)
            {
                return BadRequest(new { success = false, message = "Please specify a valid positive Trip ID." });
            }

            if (dto.StartOdometer <= 0)
            {
                return BadRequest(new { success = false, message = "Please enter a valid Start Odometer reading." });
            }

            if (string.IsNullOrWhiteSpace(dto.StartLocation))
            {
                return BadRequest(new { success = false, message = "Please specify a Start Location." });
            }

            if (string.IsNullOrWhiteSpace(dto.PickupOrDrop) || (dto.PickupOrDrop != "Pickup" && dto.PickupOrDrop != "Drop"))
            {
                return BadRequest(new { success = false, message = "Please select either Pickup or Drop." });
            }

            // Check if driver has an active trip already
            var activeTrip = await _context.Trips
                .FirstOrDefaultAsync(t => t.DriverId == driverId.Value && t.Status == TripStatus.Active);

            if (activeTrip != null)
            {
                return BadRequest(new { success = false, message = "You already have an active trip. Please end it first." });
            }

            // Verify cab assignment
            var driver = await _context.Drivers.FindAsync(driverId.Value);
            if (driver == null || driver.CurrentCabId != dto.CabId)
            {
                return BadRequest(new { success = false, message = "This cab is not currently assigned to you." });
            }

            var trip = new Trip
            {
                VendorTripId = dto.TripId,
                CabId = dto.CabId,
                DriverId = driverId.Value,
                StartTime = DateTime.UtcNow,
                StartOdometer = dto.StartOdometer,
                StartLocation = dto.StartLocation,
                PickupOrDrop = dto.PickupOrDrop,
                Status = TripStatus.Active,
                Notes = dto.Notes,
                IsActive = true
            };

            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Trip started successfully", data = trip });
        }

        [HttpPost("{id}/end")]
        public async Task<IActionResult> EndTrip(int id, [FromBody] EndTripDto dto)
        {
            var trip = await _context.Trips.FindAsync(id);
            if (trip == null)
            {
                return NotFound(new { success = false, message = "Trip not found" });
            }

            // Authorization check: allow admins and any authenticated drivers
            var currentDriverId = GetCurrentDriverId();
            if (!IsAdmin() && !currentDriverId.HasValue)
            {
                return Forbid();
            }

            if (trip.Status != TripStatus.Active)
            {
                return BadRequest(new { success = false, message = "Trip is not active." });
            }

            if (dto.EndOdometer <= 0)
            {
                return BadRequest(new { success = false, message = "Please enter a valid End Odometer reading." });
            }

            if (dto.EndOdometer < trip.StartOdometer)
            {
                return BadRequest(new { success = false, message = $"End odometer must be greater than or equal to start odometer ({trip.StartOdometer})." });
            }

            if (string.IsNullOrWhiteSpace(dto.EndLocation))
            {
                return BadRequest(new { success = false, message = "Please specify an End Location." });
            }

            decimal fuelConsumed = 0m;
            decimal fareAmount = 0m;
            decimal tollAmount = dto.TollAmount < 0 ? 0m : dto.TollAmount;
            string notes = string.IsNullOrEmpty(dto.Notes) ? "Completed by Driver" : dto.Notes;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                trip.EndTime = DateTime.UtcNow;
                trip.EndOdometer = dto.EndOdometer;
                trip.EndLocation = dto.EndLocation;
                trip.FuelConsumed = fuelConsumed;
                trip.FareAmount = fareAmount;
                trip.TollAmount = tollAmount;
                trip.Notes = notes;
                trip.Status = TripStatus.Completed;

                _context.Trips.Update(trip);

                // Add to driver earnings
                var earning = new Earning
                {
                    TripId = trip.Id,
                    DriverId = trip.DriverId,
                    Date = DateTime.UtcNow,
                    Amount = fareAmount,
                    Source = EarningSource.Trip,
                    Description = $"Earnings from Trip #{trip.Id} ({trip.StartLocation} to {dto.EndLocation})",
                    IsActive = true
                };
                _context.Earnings.Add(earning);

                // Update Driver Targets
                var targets = await _context.Targets
                    .Where(t => t.DriverId == trip.DriverId && t.Status == TargetStatus.Active && t.StartDate <= DateTime.UtcNow && t.EndDate >= DateTime.UtcNow)
                    .ToListAsync();

                foreach (var target in targets)
                {
                    if (target.MetricType == TargetMetricType.Trips)
                    {
                        target.CurrentValue += 1;
                    }
                    else if (target.MetricType == TargetMetricType.Earnings)
                    {
                        target.CurrentValue += fareAmount;
                    }
                    else if (target.MetricType == TargetMetricType.Hours)
                    {
                        var hours = (decimal)(trip.EndTime.Value - trip.StartTime).TotalHours;
                        target.CurrentValue += Math.Round(hours, 2);
                    }

                    if (target.CurrentValue >= target.TargetValue)
                    {
                        target.Status = TargetStatus.Completed;
                    }
                    _context.Targets.Update(target);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Trip ended successfully. Earnings and targets updated.", data = trip });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error ending trip.", errors = ex.Message });
            }
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelTrip(int id, [FromBody] CancelTripDto dto)
        {
            var trip = await _context.Trips.FindAsync(id);
            if (trip == null)
            {
                return NotFound(new { success = false, message = "Trip not found" });
            }

            // Authorization check: allow admins and any authenticated drivers
            var currentDriverId = GetCurrentDriverId();
            if (!IsAdmin() && !currentDriverId.HasValue)
            {
                return Forbid();
            }

            if (trip.Status != TripStatus.Active)
            {
                return BadRequest(new { success = false, message = "Only active trips can be cancelled." });
            }

            if (dto.EndOdometer <= 0)
            {
                return BadRequest(new { success = false, message = "Please enter a valid End Odometer reading." });
            }

            if (dto.EndOdometer < trip.StartOdometer)
            {
                return BadRequest(new { success = false, message = $"End odometer must be greater than or equal to start odometer ({trip.StartOdometer})." });
            }

            if (string.IsNullOrWhiteSpace(dto.EndLocation))
            {
                return BadRequest(new { success = false, message = "Please specify an End Location." });
            }

            trip.EndTime = DateTime.UtcNow;
            trip.EndOdometer = dto.EndOdometer;
            trip.EndLocation = dto.EndLocation;
            trip.Notes = string.IsNullOrEmpty(dto.Notes) ? "Cancelled by Driver" : dto.Notes;
            trip.Status = TripStatus.Cancelled;

            _context.Trips.Update(trip);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Trip cancelled successfully.", data = trip });
        }

        [HttpPost("log-past")]
        public async Task<IActionResult> LogPastTrip([FromBody] LogPastTripDto dto)
        {
            var driverId = GetCurrentDriverId();
            if (!driverId.HasValue)
            {
                return BadRequest(new { success = false, message = "Only registered drivers can log past trips." });
            }

            if (dto.TripId <= 0)
            {
                return BadRequest(new { success = false, message = "Please specify a valid positive Trip ID." });
            }

            if (dto.StartOdometer <= 0)
            {
                return BadRequest(new { success = false, message = "Please enter a valid Start Odometer reading." });
            }

            if (dto.EndOdometer <= 0)
            {
                return BadRequest(new { success = false, message = "Please enter a valid End Odometer reading." });
            }

            if (dto.EndOdometer < dto.StartOdometer)
            {
                return BadRequest(new { success = false, message = $"End odometer must be greater than or equal to start odometer ({dto.StartOdometer})." });
            }

            if (string.IsNullOrWhiteSpace(dto.StartLocation))
            {
                return BadRequest(new { success = false, message = "Please specify a Start Location." });
            }

            if (string.IsNullOrWhiteSpace(dto.EndLocation))
            {
                return BadRequest(new { success = false, message = "Please specify an End Location." });
            }

            if (string.IsNullOrWhiteSpace(dto.PickupOrDrop) || (dto.PickupOrDrop != "Pickup" && dto.PickupOrDrop != "Drop"))
            {
                return BadRequest(new { success = false, message = "Please select either Pickup or Drop." });
            }

            if (string.IsNullOrWhiteSpace(dto.Status) || (dto.Status != "Completed" && dto.Status != "Cancelled"))
            {
                return BadRequest(new { success = false, message = "Status must be Completed or Cancelled." });
            }

            // Verify cab assignment
            var driver = await _context.Drivers.FindAsync(driverId.Value);
            if (driver == null || driver.CurrentCabId != dto.CabId)
            {
                return BadRequest(new { success = false, message = "This cab is not currently assigned to you." });
            }

            var tripStatus = dto.Status == "Cancelled" ? TripStatus.Cancelled : TripStatus.Completed;

            var trip = new Trip
            {
                VendorTripId = dto.TripId,
                CabId = dto.CabId,
                DriverId = driverId.Value,
                StartTime = DateTime.UtcNow.AddHours(-1),
                EndTime = DateTime.UtcNow,
                StartOdometer = dto.StartOdometer,
                EndOdometer = dto.EndOdometer,
                StartLocation = dto.StartLocation,
                EndLocation = dto.EndLocation,
                PickupOrDrop = dto.PickupOrDrop,
                Status = tripStatus,
                Notes = dto.Notes,
                FuelConsumed = 0m,
                FareAmount = 0m,
                TollAmount = 0m,
                IsActive = true
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Trips.Add(trip);
                await _context.SaveChangesAsync();

                if (tripStatus == TripStatus.Completed)
                {
                    // Add to driver earnings
                    var earning = new Earning
                    {
                        TripId = trip.Id,
                        DriverId = trip.DriverId,
                        Date = DateTime.UtcNow,
                        Amount = 0m,
                        Source = EarningSource.Trip,
                        Description = $"Past Trip #{trip.Id} ({trip.StartLocation} to {trip.EndLocation}) - logged offline",
                        IsActive = true
                    };
                    _context.Earnings.Add(earning);

                    // Update Driver Targets
                    var targets = await _context.Targets
                        .Where(t => t.DriverId == trip.DriverId && t.Status == TargetStatus.Active && t.StartDate <= DateTime.UtcNow && t.EndDate >= DateTime.UtcNow)
                        .ToListAsync();

                    foreach (var target in targets)
                    {
                        if (target.MetricType == TargetMetricType.Trips)
                        {
                            target.CurrentValue += 1;
                        }
                        else if (target.MetricType == TargetMetricType.Earnings)
                        {
                            target.CurrentValue += 250.0m;
                        }
                        else if (target.MetricType == TargetMetricType.Hours)
                        {
                            target.CurrentValue += 1.0m;
                        }

                        if (target.CurrentValue >= target.TargetValue)
                        {
                            target.Status = TargetStatus.Completed;
                        }
                        _context.Targets.Update(target);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Past trip logged successfully.", data = trip });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error logging past trip.", errors = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrip(int id, [FromBody] UpdateTripDto dto)
        {
            var trip = await _context.Trips.FindAsync(id);
            if (trip == null)
            {
                return NotFound(new { success = false, message = "Trip not found." });
            }

            var cab = await _context.Cabs.FindAsync(dto.CabId);
            if (cab == null)
            {
                return BadRequest(new { success = false, message = "Selected cab does not exist." });
            }

            var driver = await _context.Drivers.FindAsync(dto.DriverId);
            if (driver == null)
            {
                return BadRequest(new { success = false, message = "Selected driver does not exist." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Update trip properties
                trip.VendorTripId = dto.VendorTripId;
                trip.CabId = dto.CabId;
                trip.DriverId = dto.DriverId;
                trip.StartTime = dto.StartTime;
                trip.EndTime = dto.EndTime;
                trip.StartOdometer = dto.StartOdometer;
                trip.EndOdometer = dto.EndOdometer;
                trip.StartLocation = dto.StartLocation;
                trip.EndLocation = dto.EndLocation;
                trip.PickupOrDrop = dto.PickupOrDrop;
                trip.Status = dto.Status;
                trip.FuelConsumed = dto.FuelConsumed;
                trip.FareAmount = dto.FareAmount;
                trip.TollAmount = dto.TollAmount;
                trip.Notes = dto.Notes;

                _context.Trips.Update(trip);
                await _context.SaveChangesAsync();

                // 2. Manage Earnings
                var existingEarnings = await _context.Earnings.Where(e => e.TripId == id).ToListAsync();
                if (existingEarnings.Any())
                {
                    _context.Earnings.RemoveRange(existingEarnings);
                    await _context.SaveChangesAsync();
                }

                if (dto.Status == TripStatus.Completed && dto.FareAmount.HasValue)
                {
                    var earning = new Earning
                    {
                        TripId = id,
                        DriverId = dto.DriverId,
                        Date = dto.EndTime ?? DateTime.UtcNow,
                        Amount = dto.FareAmount.Value,
                        Source = EarningSource.Trip,
                        Description = $"Earnings from Trip #{id} ({dto.StartLocation} to {dto.EndLocation})",
                        IsActive = true
                    };
                    _context.Earnings.Add(earning);
                    await _context.SaveChangesAsync();
                }

                // 3. Recalculate targets for the driver
                var driverTargets = await _context.Targets.Where(t => t.DriverId == dto.DriverId).ToListAsync();
                foreach (var target in driverTargets)
                {
                    if (target.MetricType == TargetMetricType.Trips)
                    {
                        target.CurrentValue = await _context.Trips
                            .CountAsync(t => t.DriverId == target.DriverId
                                && t.Status == TripStatus.Completed
                                && t.EndTime >= target.StartDate
                                && t.EndTime <= target.EndDate);
                    }
                    else if (target.MetricType == TargetMetricType.Earnings)
                    {
                        target.CurrentValue = await _context.Earnings
                            .Where(e => e.DriverId == target.DriverId
                                && e.Date >= target.StartDate
                                && e.Date <= target.EndDate)
                            .SumAsync(e => e.Amount);
                    }
                    else if (target.MetricType == TargetMetricType.Hours)
                    {
                        var trips = await _context.Trips
                            .Where(t => t.DriverId == target.DriverId
                                && t.Status == TripStatus.Completed
                                && t.EndTime >= target.StartDate
                                && t.EndTime <= target.EndDate)
                            .ToListAsync();
                        var totalHours = trips.Sum(t => (decimal)(t.EndTime.Value - t.StartTime).TotalHours);
                        target.CurrentValue = Math.Round(totalHours, 2);
                    }

                    if (target.CurrentValue >= target.TargetValue)
                    {
                        target.Status = TargetStatus.Completed;
                    }
                    else if (target.EndDate < DateTime.UtcNow)
                    {
                        target.Status = TargetStatus.Failed;
                    }
                    else
                    {
                        target.Status = TargetStatus.Active;
                    }
                    _context.Targets.Update(target);
                }
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new { success = true, message = "Trip updated successfully. Earnings and targets recalculated.", data = trip });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error updating trip.", errors = ex.Message });
            }
        }
    }
}
