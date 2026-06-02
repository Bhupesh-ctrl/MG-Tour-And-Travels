using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogsController : ControllerBase
    {
        private readonly FleetDbContext _context;

        public AuditLogsController(FleetDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.AuditLogs.AsQueryable();

            query = query.OrderByDescending(a => a.ChangedDate);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Audit logs retrieved successfully",
                data = new
                {
                    items,
                    page,
                    pageSize,
                    totalCount
                }
            });
        }
    }
}
