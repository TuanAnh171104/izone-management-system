using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThueMatBangController : ControllerBase
    {
        private readonly IThueMatBangRepository _thueMatBangRepository;

        public ThueMatBangController(IThueMatBangRepository thueMatBangRepository)
        {
            _thueMatBangRepository = thueMatBangRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThueMatBang>>> GetAll()
        {
            var thueMatBangs = await _thueMatBangRepository.GetAllAsync();
            return Ok(thueMatBangs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ThueMatBang>> GetById(int id)
        {
            var thueMatBang = await _thueMatBangRepository.GetByIdAsync(id);
            if (thueMatBang == null)
            {
                return NotFound();
            }
            return Ok(thueMatBang);
        }

        [HttpGet("dia-diem/{diaDiemId}")]
        public async Task<ActionResult<IEnumerable<ThueMatBang>>> GetByDiaDiemId(int diaDiemId)
        {
            var thueMatBangs = await _thueMatBangRepository.GetByDiaDiemIdAsync(diaDiemId);
            return Ok(thueMatBangs);
        }

        // Removed GetByLoaiHopDong and GetByTrangThai as these methods no longer exist in the interface

        [HttpGet("active-contracts")]
        public async Task<ActionResult<IEnumerable<ThueMatBang>>> GetActiveContracts()
        {
            var thueMatBangs = await _thueMatBangRepository.GetActiveContractsAsync();
            return Ok(thueMatBangs);
        }

        [HttpGet("expiring-contracts")]
        public async Task<ActionResult<IEnumerable<ThueMatBang>>> GetExpiringContracts([FromQuery] DateTime beforeDate)
        {
            var thueMatBangs = await _thueMatBangRepository.GetExpiringContractsAsync(beforeDate);
            return Ok(thueMatBangs);
        }

        [HttpGet("total-rent/dia-diem/{diaDiemId}")]
        public async Task<ActionResult<decimal>> GetTotalRentByDiaDiem(int diaDiemId)
        {
            var total = await _thueMatBangRepository.GetTotalRentByDiaDiemAsync(diaDiemId);
            return Ok(total);
        }

        [HttpGet("date-range")]
        public async Task<ActionResult<IEnumerable<ThueMatBang>>> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var thueMatBangs = await _thueMatBangRepository.GetByDateRangeAsync(startDate, endDate);
            return Ok(thueMatBangs);
        }

        [HttpPost]
        public async Task<ActionResult<ThueMatBang>> Create([FromBody] ThueMatBang thueMatBang)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdThueMatBang = await _thueMatBangRepository.AddAsync(thueMatBang);
            return CreatedAtAction(nameof(GetById), new { id = createdThueMatBang.ThueID }, createdThueMatBang);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ThueMatBang thueMatBang)
        {
            if (id != thueMatBang.ThueID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingThueMatBang = await _thueMatBangRepository.GetByIdAsync(id);
            if (existingThueMatBang == null)
            {
                return NotFound();
            }

            await _thueMatBangRepository.UpdateAsync(thueMatBang);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var thueMatBang = await _thueMatBangRepository.GetByIdAsync(id);
            if (thueMatBang == null)
            {
                return NotFound();
            }

            await _thueMatBangRepository.DeleteAsync(thueMatBang);
            return NoContent();
        }
    }
}