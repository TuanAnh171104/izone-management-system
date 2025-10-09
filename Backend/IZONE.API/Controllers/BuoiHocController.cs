using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BuoiHocController : ControllerBase
    {
        private readonly IBuoiHocRepository _buoiHocRepository;

        public BuoiHocController(IBuoiHocRepository buoiHocRepository)
        {
            _buoiHocRepository = buoiHocRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetAll()
        {
            var buoiHocs = await _buoiHocRepository.GetAllAsync();
            return Ok(buoiHocs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BuoiHoc>> GetById(int id)
        {
            var buoiHoc = await _buoiHocRepository.GetByIdAsync(id);
            if (buoiHoc == null)
            {
                return NotFound();
            }
            return Ok(buoiHoc);
        }

        [HttpGet("lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetByLopId(int lopId)
        {
            var buoiHocs = await _buoiHocRepository.GetByLopIdAsync(lopId);
            return Ok(buoiHocs);
        }

        [HttpGet("ngay-hoc/{ngayHoc}")]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetByNgayHoc(DateTime ngayHoc)
        {
            var buoiHocs = await _buoiHocRepository.GetByNgayHocAsync(ngayHoc);
            return Ok(buoiHocs);
        }

        [HttpGet("trang-thai/{trangThai}")]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetByTrangThai(string trangThai)
        {
            var buoiHocs = await _buoiHocRepository.GetByTrangThaiAsync(trangThai);
            return Ok(buoiHocs);
        }

        [HttpGet("giang-vien-thay-the/{giangVienId}")]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetByGiangVienThayTheId(int giangVienId)
        {
            var buoiHocs = await _buoiHocRepository.GetByGiangVienThayTheIdAsync(giangVienId);
            return Ok(buoiHocs);
        }

        [HttpGet("dia-diem/{diaDiemId}")]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetByDiaDiemId(int diaDiemId)
        {
            var buoiHocs = await _buoiHocRepository.GetByDiaDiemIdAsync(diaDiemId);
            return Ok(buoiHocs);
        }

        [HttpGet("schedule")]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetScheduleByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var buoiHocs = await _buoiHocRepository.GetScheduleByDateRangeAsync(startDate, endDate);
            return Ok(buoiHocs);
        }

        [HttpPost]
        public async Task<ActionResult<BuoiHoc>> Create([FromBody] BuoiHoc buoiHoc)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdBuoiHoc = await _buoiHocRepository.AddAsync(buoiHoc);
            return CreatedAtAction(nameof(GetById), new { id = createdBuoiHoc.BuoiHocID }, createdBuoiHoc);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BuoiHoc buoiHoc)
        {
            if (id != buoiHoc.BuoiHocID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingBuoiHoc = await _buoiHocRepository.GetByIdAsync(id);
            if (existingBuoiHoc == null)
            {
                return NotFound();
            }

            await _buoiHocRepository.UpdateAsync(buoiHoc);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var buoiHoc = await _buoiHocRepository.GetByIdAsync(id);
            if (buoiHoc == null)
            {
                return NotFound();
            }

            await _buoiHocRepository.DeleteAsync(buoiHoc);
            return NoContent();
        }
    }
}