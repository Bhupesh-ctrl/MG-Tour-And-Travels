using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Core.DTOs;
using FleetManagement.Core.Entities;
using FleetManagement.Core.Enums;
using FleetManagement.Core.Interfaces;
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FleetDbContext _context;
        private readonly IPasswordHasher _hasher;
        private readonly IJwtTokenService _jwtService;
        private readonly IOtpService _otpService;

        public AuthController(
            FleetDbContext context,
            IPasswordHasher hasher,
            IJwtTokenService jwtService,
            IOtpService otpService)
        {
            _context = context;
            _hasher = hasher;
            _jwtService = jwtService;
            _otpService = otpService;
        }

        // Unified login endpoint for both Admin and Driver via ID (Username/Email/Phone) and Password
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] GeneralLoginDto dto)
        {
            if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { success = false, message = "Username/Email and Password are required." });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => (u.Username == dto.Username || u.Email == dto.Username || u.Phone == dto.Username) && u.IsActive);

            if (user == null || !_hasher.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return BadRequest(new { success = false, message = "Invalid credentials." });
            }

            int? driverId = null;
            if (user.Role == UserRole.Driver)
            {
                var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.UserId == user.Id);
                driverId = driver?.Id;
            }

            var token = _jwtService.GenerateToken(user, driverId);

            return Ok(new
            {
                success = true,
                message = "Login successful.",
                data = new AuthResponseDto
                {
                    Token = token,
                    UserId = user.Id,
                    Username = user.Username,
                    Phone = user.Phone,
                    Role = user.Role == UserRole.Admin ? "Admin" : "Driver",
                    DriverId = driverId
                }
            });
        }

        // Existing admin-only password login (maintained for compatibility)
        [HttpPost("admin/login")]
        public async Task<IActionResult> AdminLogin([FromBody] AdminLoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == dto.Username && u.Role == UserRole.Admin && u.IsActive);

            if (user == null || !_hasher.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return BadRequest(new { success = false, message = "Invalid admin credentials." });
            }

            var token = _jwtService.GenerateToken(user);

            return Ok(new
            {
                success = true,
                message = "Login successful",
                data = new AuthResponseDto
                {
                    Token = token,
                    UserId = user.Id,
                    Username = user.Username,
                    Phone = user.Phone,
                    Role = "Admin"
                }
            });
        }

        // General OTP Request endpoint for BOTH Drivers and Admins
        [HttpPost("otp/request")]
        public async Task<IActionResult> RequestOtp([FromBody] OtpRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.Phone))
            {
                return BadRequest(new { success = false, message = "Phone number is required." });
            }

            // Verify if the phone number belongs to ANY active user (Admin or Driver)
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Phone == dto.Phone && u.IsActive);

            if (user == null)
            {
                return BadRequest(new { success = false, message = "Phone number is not registered." });
            }

            var code = await _otpService.GenerateOtpAsync(dto.Phone);

            // Return in payload for easy development/testing
            return Ok(new
            {
                success = true,
                message = "OTP generated successfully.",
                data = new { otpCode = code }
            });
        }

        // General OTP Verification endpoint for BOTH Drivers and Admins
        [HttpPost("otp/verify")]
        public async Task<IActionResult> VerifyOtp([FromBody] OtpVerifyDto dto)
        {
            if (string.IsNullOrEmpty(dto.Phone) || string.IsNullOrEmpty(dto.OtpCode))
            {
                return BadRequest(new { success = false, message = "Phone number and OTP code are required." });
            }

            var verified = await _otpService.VerifyOtpAsync(dto.Phone, dto.OtpCode);
            if (!verified)
            {
                return BadRequest(new { success = false, message = "Invalid or expired OTP." });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Phone == dto.Phone && u.IsActive);

            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found." });
            }

            int? driverId = null;
            if (user.Role == UserRole.Driver)
            {
                var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.UserId == user.Id);
                driverId = driver?.Id;
            }

            var token = _jwtService.GenerateToken(user, driverId);

            return Ok(new
            {
                success = true,
                message = "OTP verified successfully.",
                data = new AuthResponseDto
                {
                    Token = token,
                    UserId = user.Id,
                    Username = user.Username ?? $"User_{user.Id}",
                    Phone = user.Phone,
                    Role = user.Role == UserRole.Admin ? "Admin" : "Driver",
                    DriverId = driverId
                }
            });
        }

        // Driver signup/reset (setting password directly)
        [HttpPost("driver/signup")]
        public async Task<IActionResult> DriverSignup([FromBody] DriverSignupDto dto)
        {
            if (string.IsNullOrEmpty(dto.Phone) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { success = false, message = "Phone and Password are required." });
            }

            // Verify if the user exists as a Driver and is active
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Phone == dto.Phone && u.Role == UserRole.Driver && u.IsActive);

            if (user == null)
            {
                return BadRequest(new { success = false, message = "This phone number is not pre-registered by the administrator." });
            }

            // Hash password and save
            user.PasswordHash = _hasher.HashPassword(dto.Password);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.UserId == user.Id);
            var token = _jwtService.GenerateToken(user, driver?.Id);

            return Ok(new
            {
                success = true,
                message = "Password registered successfully. You are now logged in.",
                data = new AuthResponseDto
                {
                    Token = token,
                    UserId = user.Id,
                    Username = user.Username,
                    Phone = user.Phone,
                    Role = "Driver",
                    DriverId = driver?.Id
                }
            });
        }
    }

    public class GeneralLoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class DriverSignupDto
    {
        public string Phone { get; set; }
        public string OtpCode { get; set; }
        public string Password { get; set; }
    }
}
