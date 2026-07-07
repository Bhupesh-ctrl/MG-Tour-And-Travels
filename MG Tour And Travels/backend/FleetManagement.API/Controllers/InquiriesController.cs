using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Core.DTOs;
using FleetManagement.Core.Entities;
using FleetManagement.Core.Interfaces;

namespace FleetManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InquiriesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public InquiriesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [AllowAnonymous]
        [HttpPost("general")]
        public async Task<IActionResult> CreateGeneralInquiry([FromBody] CreateGeneralInquiryDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.Name) || string.IsNullOrEmpty(dto.Phone))
            {
                return BadRequest(new { success = false, message = "Name and phone number are required." });
            }

            var inquiry = new GeneralInquiry
            {
                Name = dto.Name,
                Phone = dto.Phone,
                CarPreference = dto.CarPreference,
                Notes = dto.Notes,
                Status = "New",
                IsActive = true
            };

            await _unitOfWork.Repository<GeneralInquiry>().AddAsync(inquiry);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "General inquiry submitted successfully.", data = inquiry });
        }

        [AllowAnonymous]
        [HttpPost("outstation")]
        public async Task<IActionResult> CreateOutstationInquiry([FromBody] CreateOutstationInquiryDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.Name) || string.IsNullOrEmpty(dto.Phone) || string.IsNullOrEmpty(dto.PickupLocation) || string.IsNullOrEmpty(dto.DropLocation))
            {
                return BadRequest(new { success = false, message = "Required fields are missing." });
            }

            var inquiry = new OutstationInquiry
            {
                Name = dto.Name,
                Phone = dto.Phone,
                TripType = dto.TripType,
                PickupLocation = dto.PickupLocation,
                DropLocation = dto.DropLocation,
                CheckinDateTime = dto.CheckinDateTime,
                CheckoutDateTime = dto.CheckoutDateTime,
                PassengerCount = dto.PassengerCount,
                CarPreference = dto.CarPreference,
                Remarks = dto.Remarks,
                Status = "New",
                IsActive = true
            };

            await _unitOfWork.Repository<OutstationInquiry>().AddAsync(inquiry);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Outstation trip request submitted successfully.", data = inquiry });
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpGet("general")]
        public async Task<IActionResult> GetGeneralInquiries()
        {
            var inquiries = await _unitOfWork.Repository<GeneralInquiry>().GetAllAsync();
            var dtos = inquiries
                .OrderByDescending(i => i.CreatedDate)
                .Select(i => new GeneralInquiryDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Phone = i.Phone,
                    CarPreference = i.CarPreference,
                    Notes = i.Notes,
                    Date = i.CreatedDate,
                    Status = i.Status
                })
                .ToList();

            return Ok(new { success = true, data = dtos });
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpGet("outstation")]
        public async Task<IActionResult> GetOutstationInquiries()
        {
            var inquiries = await _unitOfWork.Repository<OutstationInquiry>().GetAllAsync();
            var dtos = inquiries
                .OrderByDescending(i => i.CreatedDate)
                .Select(i => new OutstationInquiryDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Phone = i.Phone,
                    TripType = i.TripType,
                    PickupLocation = i.PickupLocation,
                    DropLocation = i.DropLocation,
                    CheckinDateTime = i.CheckinDateTime,
                    CheckoutDateTime = i.CheckoutDateTime,
                    PassengerCount = i.PassengerCount,
                    CarPreference = i.CarPreference,
                    Remarks = i.Remarks,
                    Date = i.CreatedDate,
                    Status = i.Status
                })
                .ToList();

            return Ok(new { success = true, data = dtos });
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPut("general/{id}/status")]
        public async Task<IActionResult> UpdateGeneralStatus(int id, [FromBody] UpdateInquiryStatusDto dto)
        {
            var repo = _unitOfWork.Repository<GeneralInquiry>();
            var inquiry = await repo.GetByIdAsync(id);
            if (inquiry == null)
            {
                return NotFound(new { success = false, message = "Inquiry not found." });
            }

            inquiry.Status = dto.Status;
            repo.Update(inquiry);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Inquiry status updated successfully.", data = inquiry });
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPut("outstation/{id}/status")]
        public async Task<IActionResult> UpdateOutstationStatus(int id, [FromBody] UpdateInquiryStatusDto dto)
        {
            var repo = _unitOfWork.Repository<OutstationInquiry>();
            var inquiry = await repo.GetByIdAsync(id);
            if (inquiry == null)
            {
                return NotFound(new { success = false, message = "Inquiry not found." });
            }

            inquiry.Status = dto.Status;
            repo.Update(inquiry);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Inquiry status updated successfully.", data = inquiry });
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpDelete("general/{id}")]
        public async Task<IActionResult> DeleteGeneralInquiry(int id)
        {
            var repo = _unitOfWork.Repository<GeneralInquiry>();
            var inquiry = await repo.GetByIdAsync(id);
            if (inquiry == null)
            {
                return NotFound(new { success = false, message = "Inquiry not found." });
            }

            repo.Delete(inquiry);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Inquiry deleted successfully." });
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpDelete("outstation/{id}")]
        public async Task<IActionResult> DeleteOutstationInquiry(int id)
        {
            var repo = _unitOfWork.Repository<OutstationInquiry>();
            var inquiry = await repo.GetByIdAsync(id);
            if (inquiry == null)
            {
                return NotFound(new { success = false, message = "Inquiry not found." });
            }

            repo.Delete(inquiry);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Inquiry deleted successfully." });
        }
    }
}
