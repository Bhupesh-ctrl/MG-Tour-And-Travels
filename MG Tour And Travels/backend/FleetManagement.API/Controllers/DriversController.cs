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
using FleetManagement.Core.Interfaces;
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DriversController : ControllerBase
    {
        private readonly FleetDbContext _context;
        private readonly IUnitOfWork _unitOfWork;

        public DriversController(FleetDbContext context, IUnitOfWork unitOfWork)
        {
            _context = context;
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetDrivers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string search = "",
            [FromQuery] string verificationStatus = "",
            [FromQuery] string sortBy = "Name",
            [FromQuery] string sortOrder = "asc")
        {
            var query = _context.Drivers
                .Include(d => d.User)
                .Include(d => d.CurrentCab)
                .AsQueryable();

            // Search
            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(d => 
                    d.User.Username.ToLower().Contains(lowerSearch) ||
                    d.User.Phone.Contains(lowerSearch) ||
                    d.LicenseNumber.ToLower().Contains(lowerSearch));
            }

            // Filtering
            if (!string.IsNullOrEmpty(verificationStatus))
            {
                if (Enum.TryParse<DriverVerificationStatus>(verificationStatus, true, out var status))
                {
                    query = query.Where(d => d.VerificationStatus == status);
                }
            }

            // Sort
            query = sortBy.ToLower() switch
            {
                "license" => sortOrder.ToLower() == "desc" ? query.OrderByDescending(d => d.LicenseNumber) : query.OrderBy(d => d.LicenseNumber),
                "expiry" => sortOrder.ToLower() == "desc" ? query.OrderByDescending(d => d.LicenseExpiryDate) : query.OrderBy(d => d.LicenseExpiryDate),
                "status" => sortOrder.ToLower() == "desc" ? query.OrderByDescending(d => d.VerificationStatus) : query.OrderBy(d => d.VerificationStatus),
                _ => sortOrder.ToLower() == "desc" ? query.OrderByDescending(d => d.User.Username) : query.OrderBy(d => d.User.Username),
            };

            var totalCount = await query.CountAsync();

            var pagedDrivers = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => new DriverDto
                {
                    Id = d.Id,
                    UserId = d.UserId,
                    Name = d.User.Username,
                    Email = d.User.Email,
                    Phone = d.User.Phone,
                    LicenseNumber = d.LicenseNumber,
                    LicenseExpiryDate = d.LicenseExpiryDate,
                    Address = d.Address,
                    Salary = d.Salary,
                    VerificationStatus = d.VerificationStatus,
                    CurrentCabId = d.CurrentCabId,
                    CurrentCabVehicleNumber = d.CurrentCab != null ? d.CurrentCab.VehicleNumber : null,
                    IsActive = d.IsActive
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Drivers retrieved successfully",
                data = new
                {
                    items = pagedDrivers,
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDriverById(int id)
        {
            var driver = await _context.Drivers
                .Include(d => d.User)
                .Include(d => d.CurrentCab)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
            {
                return NotFound(new { success = false, message = "Driver not found" });
            }

            return Ok(new
            {
                success = true,
                message = "Driver retrieved successfully",
                data = new DriverDto
                {
                    Id = driver.Id,
                    UserId = driver.UserId,
                    Name = driver.User.Username,
                    Email = driver.User.Email,
                    Phone = driver.User.Phone,
                    LicenseNumber = driver.LicenseNumber,
                    LicenseExpiryDate = driver.LicenseExpiryDate,
                    Address = driver.Address,
                    Salary = driver.Salary,
                    VerificationStatus = driver.VerificationStatus,
                    CurrentCabId = driver.CurrentCabId,
                    CurrentCabVehicleNumber = driver.CurrentCab != null ? driver.CurrentCab.VehicleNumber : null,
                    IsActive = driver.IsActive
                }
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateDriver([FromBody] CreateDriverDto dto)
        {
            if (string.IsNullOrEmpty(dto.Phone) || string.IsNullOrEmpty(dto.Name))
            {
                return BadRequest(new { success = false, message = "Driver Name and Phone are required." });
            }

            var existingUser = await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Phone == dto.Phone);

            if (existingUser != null)
            {
                if (!existingUser.IsDeleted)
                {
                    return BadRequest(new { success = false, message = "Phone number already registered to another user." });
                }

                // If the user was soft-deleted, we restore them and their driver entity
                var existingDriver = await _context.Drivers.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(d => d.UserId == existingUser.Id);

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Restore and update User
                    existingUser.Username = dto.Name;
                    existingUser.Email = dto.Email ?? string.Empty;
                    existingUser.IsActive = true;
                    existingUser.IsDeleted = false;
                    _context.Users.Update(existingUser);

                    if (existingDriver != null)
                    {
                        // Restore and update Driver
                        existingDriver.LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? "N/A" : dto.LicenseNumber;
                        existingDriver.LicenseExpiryDate = !dto.LicenseExpiryDate.HasValue || dto.LicenseExpiryDate.Value == default ? DateTime.UtcNow.AddYears(10) : dto.LicenseExpiryDate.Value;
                        existingDriver.Address = dto.Address ?? string.Empty;
                        existingDriver.Salary = dto.Salary;
                        existingDriver.VerificationStatus = DriverVerificationStatus.Pending;
                        existingDriver.IsActive = true;
                        existingDriver.IsDeleted = false;
                        existingDriver.CurrentCabId = null; // Reset cab assignment on restore
                        _context.Drivers.Update(existingDriver);
                    }
                    else
                    {
                        // If no driver record exists, create one
                        existingDriver = new Driver
                        {
                            UserId = existingUser.Id,
                            LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? "N/A" : dto.LicenseNumber,
                            LicenseExpiryDate = !dto.LicenseExpiryDate.HasValue || dto.LicenseExpiryDate.Value == default ? DateTime.UtcNow.AddYears(10) : dto.LicenseExpiryDate.Value,
                            Address = dto.Address ?? string.Empty,
                            Salary = dto.Salary,
                            VerificationStatus = DriverVerificationStatus.Pending,
                            IsActive = true
                        };
                        _context.Drivers.Add(existingDriver);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { success = true, message = "Driver restored successfully.", data = existingDriver });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { success = false, message = "Error restoring driver.", errors = ex.Message });
                }
            }

            using var transactionNew = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = new User
                {
                    Username = dto.Name,
                    Email = dto.Email ?? string.Empty,
                    Phone = dto.Phone,
                    Role = UserRole.Driver,
                    IsActive = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var driver = new Driver
                {
                    UserId = user.Id,
                    LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? "N/A" : dto.LicenseNumber,
                    LicenseExpiryDate = !dto.LicenseExpiryDate.HasValue || dto.LicenseExpiryDate.Value == default ? DateTime.UtcNow.AddYears(10) : dto.LicenseExpiryDate.Value,
                    Address = dto.Address ?? string.Empty,
                    Salary = dto.Salary,
                    VerificationStatus = DriverVerificationStatus.Pending,
                    IsActive = true
                };

                _context.Drivers.Add(driver);
                await _context.SaveChangesAsync();

                await transactionNew.CommitAsync();

                return CreatedAtAction(nameof(GetDriverById), new { id = driver.Id }, new { success = true, data = driver });
            }
            catch (Exception ex)
            {
                await transactionNew.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error creating driver.", errors = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDriver(int id, [FromBody] UpdateDriverDto dto)
        {
            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
            {
                return NotFound(new { success = false, message = "Driver not found" });
            }

            // Check if phone is being changed and is already taken
            if (driver.User.Phone != dto.Phone)
            {
                var phoneExists = await _context.Users.AnyAsync(u => u.Phone == dto.Phone && u.Id != driver.UserId);
                if (phoneExists)
                {
                    return BadRequest(new { success = false, message = "Phone number already registered to another user." });
                }
                driver.User.Phone = dto.Phone;
            }

            // Check if email is being changed and is already taken
            if (!string.IsNullOrEmpty(dto.Email) && driver.User.Email != dto.Email)
            {
                var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != driver.UserId);
                if (emailExists)
                {
                    return BadRequest(new { success = false, message = "Email already registered to another user." });
                }
                driver.User.Email = dto.Email;
            }
            else if (string.IsNullOrEmpty(dto.Email))
            {
                driver.User.Email = string.Empty;
            }

            driver.User.Username = dto.Name;

            driver.LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? (driver.LicenseNumber ?? "N/A") : dto.LicenseNumber;
            driver.LicenseExpiryDate = !dto.LicenseExpiryDate.HasValue || dto.LicenseExpiryDate.Value == default ? (driver.LicenseExpiryDate ?? DateTime.UtcNow.AddYears(10)) : dto.LicenseExpiryDate.Value;
            driver.Address = dto.Address ?? string.Empty;
            if (dto.Salary.HasValue)
            {
                driver.Salary = dto.Salary.Value;
            }
            driver.VerificationStatus = dto.VerificationStatus;

            _context.Users.Update(driver.User);
            _context.Drivers.Update(driver);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Driver updated successfully", data = driver });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/assign-cab/{cabId?}")]
        public async Task<IActionResult> AssignCab(int id, int? cabId)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null)
            {
                return NotFound(new { success = false, message = "Driver not found" });
            }

            if (cabId.HasValue)
            {
                var cab = await _context.Cabs.FindAsync(cabId.Value);
                if (cab == null)
                {
                    return NotFound(new { success = false, message = "Cab not found" });
                }

                // Check if this cab is assigned to another driver
                var assignedDriver = await _context.Drivers
                    .FirstOrDefaultAsync(d => d.CurrentCabId == cabId.Value && d.Id != id);

                if (assignedDriver != null)
                {
                    assignedDriver.CurrentCabId = null;
                    _context.Drivers.Update(assignedDriver);
                }
            }

            driver.CurrentCabId = cabId;
            _context.Drivers.Update(driver);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = cabId.HasValue ? "Cab assigned successfully" : "Cab unassigned successfully" });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
            {
                return NotFound(new { success = false, message = "Driver not found" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                driver.IsDeleted = true;
                _context.Drivers.Update(driver);

                if (driver.User != null)
                {
                    driver.User.IsDeleted = true;
                    _context.Users.Update(driver.User);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Driver deleted successfully" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error deleting driver.", errors = ex.Message });
            }
        }
    }
}
