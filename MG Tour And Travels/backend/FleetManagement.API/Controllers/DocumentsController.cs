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
using FleetManagement.Infrastructure.Data;

namespace FleetManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly FleetDbContext _context;

        public DocumentsController(FleetDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDocuments([FromQuery] string entityType, [FromQuery] int entityId)
        {
            if (!Enum.TryParse<DocumentEntityType>(entityType, true, out var type))
            {
                return BadRequest(new { success = false, message = "Invalid entity type." });
            }

            var query = _context.Documents
                .Where(d => d.EntityType == type && d.EntityId == entityId)
                .AsQueryable();

            var docs = await query
                .Select(d => new DocumentDto
                {
                    Id = d.Id,
                    EntityType = d.EntityType,
                    EntityId = d.EntityId,
                    DocumentType = d.DocumentType,
                    Title = d.Title,
                    DocumentUrl = d.DocumentUrl,
                    ExpiryDate = d.ExpiryDate,
                    Status = d.Status
                })
                .ToListAsync();

            // Populate entity identifier
            if (type == DocumentEntityType.Cab)
            {
                var cab = await _context.Cabs.FindAsync(entityId);
                if (cab != null)
                {
                    foreach (var doc in docs)
                    {
                        doc.EntityIdentifier = cab.VehicleNumber;
                    }
                }
            }
            else if (type == DocumentEntityType.Driver)
            {
                var driver = await _context.Drivers.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == entityId);
                if (driver != null)
                {
                    foreach (var doc in docs)
                    {
                        doc.EntityIdentifier = driver.User.Username;
                    }
                }
            }

            return Ok(new
            {
                success = true,
                message = "Documents retrieved successfully",
                data = docs
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> UploadDocument([FromBody] UploadDocumentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FileBase64) || string.IsNullOrWhiteSpace(dto.FileName) || string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new { success = false, message = "Title, File, and FileName are required." });
            }

            string documentUrl;
            try
            {
                var base64Data = dto.FileBase64;
                if (base64Data.Contains(","))
                {
                    base64Data = base64Data.Split(',')[1];
                }
                var fileBytes = Convert.FromBase64String(base64Data);
                var fileExtension = Path.GetExtension(dto.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

                var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadDir))
                {
                    Directory.CreateDirectory(uploadDir);
                }

                var filePath = Path.Combine(uploadDir, uniqueFileName);
                await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);

                documentUrl = $"/uploads/{uniqueFileName}";
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Failed to upload document file.", errors = ex.Message });
            }

            var doc = new Document
            {
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                DocumentType = dto.DocumentType,
                Title = dto.Title,
                DocumentUrl = documentUrl,
                ExpiryDate = dto.ExpiryDate,
                Status = DocumentStatus.Verified, // Admin uploads are auto-verified
                IsActive = true
            };

            _context.Documents.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Document uploaded successfully.", data = doc });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDocument(int id, [FromBody] UpdateDocumentDto dto)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null)
            {
                return NotFound(new { success = false, message = "Document not found." });
            }

            string documentUrl = doc.DocumentUrl;

            // Handle file replacement if provided
            if (!string.IsNullOrEmpty(dto.FileBase64) && !string.IsNullOrEmpty(dto.FileName))
            {
                try
                {
                    var base64Data = dto.FileBase64;
                    if (base64Data.Contains(","))
                    {
                        base64Data = base64Data.Split(',')[1];
                    }
                    var fileBytes = Convert.FromBase64String(base64Data);
                    var fileExtension = Path.GetExtension(dto.FileName);
                    var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

                    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadDir))
                    {
                        Directory.CreateDirectory(uploadDir);
                    }

                    var filePath = Path.Combine(uploadDir, uniqueFileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);

                    documentUrl = $"/uploads/{uniqueFileName}";
                }
                catch (Exception ex)
                {
                    return BadRequest(new { success = false, message = "Failed to replace document file.", errors = ex.Message });
                }
            }

            doc.DocumentType = dto.DocumentType;
            doc.Title = dto.Title ?? doc.Title;
            doc.DocumentUrl = documentUrl;
            doc.ExpiryDate = dto.ExpiryDate;
            doc.Status = dto.Status;

            _context.Documents.Update(doc);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Document updated successfully.", data = doc });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null)
            {
                return NotFound(new { success = false, message = "Document not found." });
            }

            doc.IsDeleted = true;
            _context.Documents.Update(doc);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Document deleted successfully." });
        }
    }
}
