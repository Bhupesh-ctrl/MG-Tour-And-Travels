using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Core.Entities;
using FleetManagement.Core.Enums;
using FleetManagement.Core.Interfaces;

namespace FleetManagement.API.Controllers
{
    [Authorize(Roles = "SuperAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _hasher;

        public AdminsController(IUnitOfWork unitOfWork, IPasswordHasher hasher)
        {
            _unitOfWork = unitOfWork;
            _hasher = hasher;
        }

        [HttpGet]
        public async Task<IActionResult> GetAdmins()
        {
            Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
            Response.Headers.Append("Pragma", "no-cache");
            Response.Headers.Append("Expires", "0");

            var repo = _unitOfWork.Repository<User>();
            var allUsers = await repo.GetAllAsync();
            
            // Return only active/non-deleted Admins and SuperAdmins (exclude Drivers)
            var adminsList = allUsers
                .Where(u => (u.Role == UserRole.Admin || u.Role == UserRole.SuperAdmin) && !u.IsDeleted)
                .Select(u => new AdminDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Phone = u.Phone,
                    Password = u.PasswordPlain,
                    IsActive = u.IsActive,
                    CreatedDate = u.CreatedDate,
                    Role = u.Role.ToString()
                })
                .OrderBy(u => u.Username)
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Admins retrieved successfully.",
                data = adminsList
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAdminById(int id)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(id);
            if (user == null || (user.Role != UserRole.Admin && user.Role != UserRole.SuperAdmin) || user.IsDeleted)
            {
                return NotFound(new { success = false, message = "Admin user not found." });
            }

            return Ok(new
            {
                success = true,
                message = "Admin user retrieved successfully.",
                data = new AdminDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Phone = user.Phone,
                    Password = user.PasswordPlain,
                    IsActive = user.IsActive,
                    CreatedDate = user.CreatedDate,
                    Role = user.Role.ToString()
                }
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password))
                {
                    return BadRequest(new { success = false, message = "Username and Password are required." });
                }

                var repo = _unitOfWork.Repository<User>();
                var allUsers = await repo.GetAllAsync();

                // Duplicate checks
                if (allUsers.Any(u => u.Username.Equals(dto.Username, StringComparison.OrdinalIgnoreCase) && !u.IsDeleted))
                {
                    return BadRequest(new { success = false, message = "Username is already taken." });
                }

                if (!string.IsNullOrEmpty(dto.Email) && allUsers.Any(u => u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase) && !u.IsDeleted))
                {
                    return BadRequest(new { success = false, message = "Email is already registered." });
                }

                if (!string.IsNullOrEmpty(dto.Phone) && allUsers.Any(u => u.Phone == dto.Phone && !u.IsDeleted))
                {
                    return BadRequest(new { success = false, message = "Phone number is already registered." });
                }

                var newAdmin = new User
                {
                    Username = dto.Username,
                    Email = dto.Email ?? string.Empty,
                    Phone = dto.Phone ?? string.Empty,
                    PasswordHash = _hasher.HashPassword(dto.Password),
                    PasswordPlain = dto.Password,
                    Role = UserRole.Admin,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "SuperAdmin"
                };

                await repo.AddAsync(newAdmin);
                await _unitOfWork.CompleteAsync();

                return CreatedAtAction(nameof(GetAdminById), new { id = newAdmin.Id }, new { success = true, message = "Admin created successfully.", data = newAdmin });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] CreateAdmin exception: {ex}");
                return StatusCode(500, new { success = false, message = $"Database or server error during admin creation: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAdmin(int id, [FromBody] UpdateAdminDto dto)
        {
            try
            {
                var repo = _unitOfWork.Repository<User>();
                var user = await repo.GetByIdAsync(id);

                if (user == null || (user.Role != UserRole.Admin && user.Role != UserRole.SuperAdmin) || user.IsDeleted)
                {
                    return NotFound(new { success = false, message = "Admin user not found." });
                }

                if (string.IsNullOrEmpty(dto.Username))
                {
                    return BadRequest(new { success = false, message = "Username is required." });
                }

                var allUsers = await repo.GetAllAsync();

                // Duplicate checks against other users
                if (allUsers.Any(u => u.Id != id && u.Username.Equals(dto.Username, StringComparison.OrdinalIgnoreCase) && !u.IsDeleted))
                {
                    return BadRequest(new { success = false, message = "Username is already taken." });
                }

                if (!string.IsNullOrEmpty(dto.Email) && allUsers.Any(u => u.Id != id && u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase) && !u.IsDeleted))
                {
                    return BadRequest(new { success = false, message = "Email is already registered." });
                }

                if (!string.IsNullOrEmpty(dto.Phone) && allUsers.Any(u => u.Id != id && u.Phone == dto.Phone && !u.IsDeleted))
                {
                    return BadRequest(new { success = false, message = "Phone number is already registered." });
                }

                user.Username = dto.Username;
                user.Email = dto.Email ?? string.Empty;
                user.Phone = dto.Phone ?? string.Empty;
                user.IsActive = dto.IsActive;
                user.UpdatedDate = DateTime.UtcNow;
                user.UpdatedBy = "SuperAdmin";

                // Update password if provided
                if (!string.IsNullOrEmpty(dto.Password))
                {
                    user.PasswordHash = _hasher.HashPassword(dto.Password);
                    user.PasswordPlain = dto.Password;
                }

                repo.Update(user);
                await _unitOfWork.CompleteAsync();

                return Ok(new { success = true, message = "Admin updated successfully.", data = user });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] UpdateAdmin exception: {ex}");
                return StatusCode(500, new { success = false, message = $"Database or server error during admin update: {ex.Message}" });
            }
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdmin(int id)
        {
            var repo = _unitOfWork.Repository<User>();
            var user = await repo.GetByIdAsync(id);

            if (user == null || user.Role != UserRole.Admin || user.IsDeleted)
            {
                if (user != null && user.Role == UserRole.SuperAdmin)
                {
                    return BadRequest(new { success = false, message = "Cannot delete the Super Admin account." });
                }
                return NotFound(new { success = false, message = "Admin user not found." });
            }

            // Soft delete by setting flags
            user.IsDeleted = true;
            user.IsActive = false;
            user.UpdatedDate = DateTime.UtcNow;
            user.UpdatedBy = "SuperAdmin";

            repo.Update(user);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Admin deleted successfully." });
        }
    }

    public class AdminDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    public class CreateAdminDto
    {
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateAdminDto
    {
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; } // Optional
        public bool IsActive { get; set; }
    }
}
