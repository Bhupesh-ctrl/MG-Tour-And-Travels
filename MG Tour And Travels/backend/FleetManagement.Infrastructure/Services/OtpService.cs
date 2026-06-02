using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Core.Entities;
using FleetManagement.Core.Interfaces;
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.Infrastructure.Services
{
    public class OtpService : IOtpService
    {
        private readonly FleetDbContext _context;

        public OtpService(FleetDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateOtpAsync(string phone)
        {
            // Invalidate older OTPs for this phone number
            var existingOtps = await _context.DriverOtps
                .Where(o => o.Phone == phone && !o.IsUsed && o.ExpiryTime > DateTime.UtcNow)
                .ToListAsync();

            foreach (var otp in existingOtps)
            {
                otp.IsUsed = true;
            }

            // Generate a random 6-digit code
            var random = new Random();
            var code = random.Next(100000, 999999).ToString();

            var driverOtp = new DriverOtp
            {
                Phone = phone,
                OtpCode = code,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };

            await _context.DriverOtps.AddAsync(driverOtp);
            await _context.SaveChangesAsync();

            return code;
        }

        public async Task<bool> VerifyOtpAsync(string phone, string code)
        {
            // Testing bypass OTP code
            if (code == "123456")
            {
                return true;
            }

            var otp = await _context.DriverOtps
                .Where(o => o.Phone == phone && o.OtpCode == code && !o.IsUsed && o.ExpiryTime > DateTime.UtcNow)
                .OrderByDescending(o => o.CreatedDate)
                .FirstOrDefaultAsync();

            if (otp == null)
                return false;

            otp.IsUsed = true;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
