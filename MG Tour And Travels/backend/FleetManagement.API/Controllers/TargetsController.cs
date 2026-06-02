using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Core.DTOs;
using FleetManagement.Core.Entities;
using FleetManagement.Core.Enums;
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TargetsController : ControllerBase
    {
        private readonly FleetDbContext _context;

        public TargetsController(FleetDbContext context)
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

        private async Task RecalculateTargetProgressAsync(Target target)
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
        }

        [HttpGet]
        public async Task<IActionResult> GetTargets([FromQuery] int? driverId = null)
        {
            var query = _context.Targets
                .Include(t => t.Driver)
                .ThenInclude(d => d.User)
                .AsQueryable();

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

            var targets = await query.OrderByDescending(t => t.StartDate).ToListAsync();

            foreach (var target in targets)
            {
                await RecalculateTargetProgressAsync(target);
            }
            await _context.SaveChangesAsync();

            var targetsDtoList = targets.Select(t => new TargetDto
            {
                Id = t.Id,
                DriverId = t.DriverId,
                DriverName = t.Driver != null && t.Driver.User != null ? t.Driver.User.Username : "Unknown",
                TargetType = t.TargetType,
                MetricType = t.MetricType,
                TargetValue = t.TargetValue,
                CurrentValue = t.CurrentValue,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                Status = t.Status
            }).ToList();

            return Ok(new { success = true, message = "Targets retrieved successfully", data = targetsDtoList });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateTarget([FromBody] CreateTargetDto dto)
        {
            var driver = await _context.Drivers.FindAsync(dto.DriverId);
            if (driver == null)
            {
                return NotFound(new { success = false, message = "Driver not found." });
            }

            var target = new Target
            {
                DriverId = dto.DriverId,
                TargetType = dto.TargetType,
                MetricType = dto.MetricType,
                TargetValue = dto.TargetValue,
                CurrentValue = 0,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = TargetStatus.Active,
                IsActive = true
            };

            await RecalculateTargetProgressAsync(target);

            _context.Targets.Add(target);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Target assigned successfully.", data = target });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTarget(int id)
        {
            var target = await _context.Targets.FindAsync(id);
            if (target == null)
            {
                return NotFound(new { success = false, message = "Target not found." });
            }

            target.IsDeleted = true;
            _context.Targets.Update(target);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Target deleted successfully." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTarget(int id, [FromBody] UpdateTargetDto dto)
        {
            var target = await _context.Targets.FindAsync(id);
            if (target == null)
            {
                return NotFound(new { success = false, message = "Target not found." });
            }

            target.DriverId = dto.DriverId;
            target.TargetType = dto.TargetType;
            target.MetricType = dto.MetricType;
            target.TargetValue = dto.TargetValue;
            target.StartDate = dto.StartDate;
            target.EndDate = dto.EndDate;
            target.Status = dto.Status;

            await RecalculateTargetProgressAsync(target);

            _context.Targets.Update(target);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Target updated successfully.", data = target });
        }
    }
}
