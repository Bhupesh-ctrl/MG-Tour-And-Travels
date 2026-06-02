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
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CabsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public CabsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetCabs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string search = "",
            [FromQuery] string sortBy = "VehicleNumber",
            [FromQuery] string sortOrder = "asc")
        {
            var repo = _unitOfWork.Repository<Cab>();
            var cabsList = await repo.GetAllAsync();
            var query = cabsList.AsQueryable();

            // Search
            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(c => 
                    c.VehicleNumber.ToLower().Contains(lowerSearch) ||
                    c.Make.ToLower().Contains(lowerSearch) ||
                    c.Model.ToLower().Contains(lowerSearch));
            }

            // Sort
            query = sortBy.ToLower() switch
            {
                "model" => sortOrder.ToLower() == "desc" ? query.OrderByDescending(c => c.Model) : query.OrderBy(c => c.Model),
                "make" => sortOrder.ToLower() == "desc" ? query.OrderByDescending(c => c.Make) : query.OrderBy(c => c.Make),
                "year" => sortOrder.ToLower() == "desc" ? query.OrderByDescending(c => c.Year) : query.OrderBy(c => c.Year),
                "status" => sortOrder.ToLower() == "desc" ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
                _ => sortOrder.ToLower() == "desc" ? query.OrderByDescending(c => c.VehicleNumber) : query.OrderBy(c => c.VehicleNumber),
            };

            var totalCount = query.Count();

            // Paginate
            var pagedCabs = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CabDto
                {
                    Id = c.Id,
                    VehicleNumber = c.VehicleNumber,
                    Model = c.Model,
                    Make = c.Make,
                    Year = c.Year,
                    Color = c.Color,
                    FuelType = c.FuelType,
                    Status = c.Status,
                    IsActive = c.IsActive
                })
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Cabs retrieved successfully",
                data = new
                {
                    items = pagedCabs,
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCabById(int id)
        {
            var cab = await _unitOfWork.Repository<Cab>().GetByIdAsync(id);
            if (cab == null)
            {
                return NotFound(new { success = false, message = "Cab not found" });
            }

            return Ok(new
            {
                success = true,
                message = "Cab retrieved successfully",
                data = new CabDto
                {
                    Id = cab.Id,
                    VehicleNumber = cab.VehicleNumber,
                    Model = cab.Model,
                    Make = cab.Make,
                    Year = cab.Year,
                    Color = cab.Color,
                    FuelType = cab.FuelType,
                    Status = cab.Status,
                    IsActive = cab.IsActive
                }
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateCab([FromBody] CreateCabDto dto)
        {
            if (string.IsNullOrEmpty(dto.VehicleNumber))
            {
                return BadRequest(new { success = false, message = "Vehicle number is required." });
            }

            var repo = _unitOfWork.Repository<Cab>();
            var exists = (await repo.FindAsync(c => c.VehicleNumber == dto.VehicleNumber)).Any();
            if (exists)
            {
                return BadRequest(new { success = false, message = "Vehicle number already registered." });
            }

            var cab = new Cab
            {
                VehicleNumber = dto.VehicleNumber,
                Model = dto.Model,
                Make = dto.Make,
                Year = dto.Year,
                Color = dto.Color,
                FuelType = dto.FuelType,
                Status = dto.Status,
                IsActive = true
            };

            await repo.AddAsync(cab);
            await _unitOfWork.CompleteAsync();

            return CreatedAtAction(nameof(GetCabById), new { id = cab.Id }, new { success = true, data = cab });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCab(int id, [FromBody] CreateCabDto dto)
        {
            var repo = _unitOfWork.Repository<Cab>();
            var cab = await repo.GetByIdAsync(id);
            if (cab == null)
            {
                return NotFound(new { success = false, message = "Cab not found" });
            }

            var exists = (await repo.FindAsync(c => c.VehicleNumber == dto.VehicleNumber && c.Id != id)).Any();
            if (exists)
            {
                return BadRequest(new { success = false, message = "Vehicle number already registered on another cab." });
            }

            cab.VehicleNumber = dto.VehicleNumber;
            cab.Model = dto.Model;
            cab.Make = dto.Make;
            cab.Year = dto.Year;
            cab.Color = dto.Color;
            cab.FuelType = dto.FuelType;
            cab.Status = dto.Status;

            repo.Update(cab);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Cab updated successfully", data = cab });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCab(int id)
        {
            var repo = _unitOfWork.Repository<Cab>();
            var cab = await repo.GetByIdAsync(id);
            if (cab == null)
            {
                return NotFound(new { success = false, message = "Cab not found" });
            }

            repo.Delete(cab);
            await _unitOfWork.CompleteAsync();

            return Ok(new { success = true, message = "Cab deleted successfully" });
        }
    }
}
