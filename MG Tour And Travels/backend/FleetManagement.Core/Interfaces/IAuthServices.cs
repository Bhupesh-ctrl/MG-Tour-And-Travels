using System.Threading.Tasks;
using FleetManagement.Core.Entities;

namespace FleetManagement.Core.Interfaces
{
    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hashedPassword);
    }

    public interface IJwtTokenService
    {
        string GenerateToken(User user, int? driverId = null);
    }

    public interface IOtpService
    {
        Task<string> GenerateOtpAsync(string phone);
        Task<bool> VerifyOtpAsync(string phone, string code);
    }
}
