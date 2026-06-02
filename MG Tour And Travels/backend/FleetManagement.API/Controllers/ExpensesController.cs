using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
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
    public class ExpensesController : ControllerBase
    {
        private readonly FleetDbContext _context;

        public ExpensesController(FleetDbContext context)
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

        [HttpGet]
        public async Task<IActionResult> GetExpenses(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string status = "",
            [FromQuery] int? driverId = null)
        {
            var query = _context.Expenses
                .Include(e => e.Driver)
                .ThenInclude(d => d.User)
                .Include(e => e.Cab)
                .AsQueryable();

            if (!IsAdmin())
            {
                var currentDriverId = GetCurrentDriverId();
                if (!currentDriverId.HasValue)
                {
                    return Forbid();
                }
                query = query.Where(e => e.DriverId == currentDriverId.Value);
            }
            else if (driverId.HasValue)
            {
                query = query.Where(e => e.DriverId == driverId.Value);
            }

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<ExpenseStatus>(status, true, out var expStatus))
            {
                query = query.Where(e => e.Status == expStatus);
            }

            query = query.OrderByDescending(e => e.ExpenseDate);

            var totalCount = await query.CountAsync();

            var pagedExpenses = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    DriverId = e.DriverId,
                    DriverName = e.Driver != null ? e.Driver.User.Username : "Admin/System",
                    CabId = e.CabId,
                    VehicleNumber = e.Cab != null ? e.Cab.VehicleNumber : null,
                    ExpenseDate = e.ExpenseDate,
                    Category = e.Category,
                    Amount = e.Amount,
                    Description = e.Description,
                    ReceiptUrl = e.ReceiptUrl,
                    Status = e.Status
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Expenses retrieved successfully",
                data = new
                {
                    items = pagedExpenses,
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
        {
            var driverId = GetCurrentDriverId();
            var cabId = dto.CabId;

            if (!IsAdmin())
            {
                if (!driverId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Only registered drivers or admins can log expenses." });
                }

                // If driver is logging, auto-assign their current cab
                var driver = await _context.Drivers.FindAsync(driverId.Value);
                if (driver != null)
                {
                    cabId = driver.CurrentCabId;
                }
            }

            string receiptUrl = null;

            // Handle Base64 file upload
            if (!string.IsNullOrEmpty(dto.ReceiptBase64) && !string.IsNullOrEmpty(dto.ReceiptFileName))
            {
                try
                {
                    var base64Data = dto.ReceiptBase64;
                    if (base64Data.Contains(","))
                    {
                        base64Data = base64Data.Split(',')[1];
                    }
                    var fileBytes = Convert.FromBase64String(base64Data);
                    var fileExtension = Path.GetExtension(dto.ReceiptFileName);
                    var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

                    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadDir))
                    {
                        Directory.CreateDirectory(uploadDir);
                    }

                    var filePath = Path.Combine(uploadDir, uniqueFileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);

                    receiptUrl = $"/uploads/{uniqueFileName}";
                }
                catch (Exception ex)
                {
                    return BadRequest(new { success = false, message = "Failed to upload receipt file.", errors = ex.Message });
                }
            }

            var expense = new Expense
            {
                DriverId = IsAdmin() ? dto.CabId == null ? null : driverId : driverId, // Allow admin to log general cab expenses
                CabId = cabId,
                ExpenseDate = DateTime.UtcNow,
                Category = dto.Category,
                Amount = dto.Amount,
                Description = dto.Description,
                ReceiptUrl = receiptUrl ?? "",
                Status = IsAdmin() ? ExpenseStatus.Approved : ExpenseStatus.Pending, // Admin logging is auto-approved
                IsActive = true
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            // Link upload in Document management table as well
            if (receiptUrl != null)
            {
                var doc = new Document
                {
                    EntityType = DocumentEntityType.Expense,
                    EntityId = expense.Id,
                    DocumentType = DocumentType.Receipt,
                    DocumentUrl = receiptUrl,
                    Status = IsAdmin() ? DocumentStatus.Verified : DocumentStatus.Pending,
                    IsActive = true
                };
                _context.Documents.Add(doc);
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, message = "Expense logged successfully.", data = expense });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateExpenseStatus(int id, [FromQuery] string status)
        {
            if (!Enum.TryParse<ExpenseStatus>(status, true, out var newStatus))
            {
                return BadRequest(new { success = false, message = "Invalid expense status value." });
            }

            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return NotFound(new { success = false, message = "Expense not found." });
            }

            expense.Status = newStatus;
            _context.Expenses.Update(expense);

            // Also update status of linked document if any
            var doc = await _context.Documents
                .FirstOrDefaultAsync(d => d.EntityType == DocumentEntityType.Expense && d.EntityId == id);

            if (doc != null)
            {
                doc.Status = newStatus switch
                {
                    ExpenseStatus.Approved => DocumentStatus.Verified,
                    ExpenseStatus.Rejected => DocumentStatus.Rejected,
                    _ => DocumentStatus.Pending
                };
                _context.Documents.Update(doc);
            }

            // If expense approved and has a driver, subtract/reconcile earnings if it was a fuel/toll expense? 
            // We'll keep earnings tracking independent, showing total gross earnings vs net.
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Expense status updated to {newStatus}." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExpense(int id, [FromBody] UpdateExpenseDto dto)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return NotFound(new { success = false, message = "Expense not found." });
            }

            string receiptUrl = expense.ReceiptUrl;

            // Handle Base64 file upload if a new one is provided
            if (!string.IsNullOrEmpty(dto.ReceiptBase64) && !string.IsNullOrEmpty(dto.ReceiptFileName))
            {
                try
                {
                    var base64Data = dto.ReceiptBase64;
                    if (base64Data.Contains(","))
                    {
                        base64Data = base64Data.Split(',')[1];
                    }
                    var fileBytes = Convert.FromBase64String(base64Data);
                    var fileExtension = Path.GetExtension(dto.ReceiptFileName);
                    var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

                    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadDir))
                    {
                        Directory.CreateDirectory(uploadDir);
                    }

                    var filePath = Path.Combine(uploadDir, uniqueFileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);

                    receiptUrl = $"/uploads/{uniqueFileName}";

                    // Update or create linked document
                    var existingDoc = await _context.Documents
                        .FirstOrDefaultAsync(d => d.EntityType == DocumentEntityType.Expense && d.EntityId == id);

                    if (existingDoc != null)
                    {
                        existingDoc.DocumentUrl = receiptUrl;
                        existingDoc.Status = IsAdmin() ? DocumentStatus.Verified : DocumentStatus.Pending;
                        _context.Documents.Update(existingDoc);
                    }
                    else
                    {
                        var doc = new Document
                        {
                            EntityType = DocumentEntityType.Expense,
                            EntityId = id,
                            DocumentType = DocumentType.Receipt,
                            DocumentUrl = receiptUrl,
                            Status = IsAdmin() ? DocumentStatus.Verified : DocumentStatus.Pending,
                            IsActive = true
                        };
                        _context.Documents.Add(doc);
                    }
                }
                catch (Exception ex)
                {
                    return BadRequest(new { success = false, message = "Failed to upload receipt file.", errors = ex.Message });
                }
            }

            expense.CabId = dto.CabId;
            expense.DriverId = dto.DriverId;
            expense.Category = dto.Category;
            expense.Amount = dto.Amount;
            expense.Description = dto.Description;
            expense.ReceiptUrl = receiptUrl ?? "";
            expense.Status = dto.Status;

            _context.Expenses.Update(expense);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Expense updated successfully.", data = expense });
        }
    }
}
