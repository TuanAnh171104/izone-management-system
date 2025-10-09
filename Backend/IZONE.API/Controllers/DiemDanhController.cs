using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiemDanhController : ControllerBase
    {
        private readonly IDiemDanhRepository _diemDanhRepository;

        public DiemDanhController(IDiemDanhRepository diemDanhRepository)
        {
            _diemDanhRepository = diemDanhRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DiemDanh>>> GetAll()
        {
            var diemDanhs = await _diemDanhRepository.GetAllAsync();
            return Ok(diemDanhs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DiemDanh>> GetById(int id)
        {
            var diemDanh = await _diemDanhRepository.GetByIdAsync(id);
            if (diemDanh == null)
            {
                return NotFound();
            }
            return Ok(diemDanh);
        }

        [HttpGet("buoi-hoc/{buoiHocId}")]
        public async Task<ActionResult<IEnumerable<DiemDanh>>> GetByBuoiHocId(int buoiHocId)
        {
            var diemDanhs = await _diemDanhRepository.GetByBuoiHocIdAsync(buoiHocId);
            return Ok(diemDanhs);
        }

        [HttpGet("hoc-vien/{hocVienId}")]
        public async Task<ActionResult<IEnumerable<DiemDanh>>> GetByHocVienId(int hocVienId)
        {
            var diemDanhs = await _diemDanhRepository.GetByHocVienIdAsync(hocVienId);
            return Ok(diemDanhs);
        }

        [HttpGet("buoi-hoc/{buoiHocId}/hoc-vien/{hocVienId}")]
        public async Task<ActionResult<DiemDanh>> GetByBuoiHocAndHocVien(int buoiHocId, int hocVienId)
        {
            var diemDanh = await _diemDanhRepository.GetByBuoiHocAndHocVienAsync(buoiHocId, hocVienId);
            if (diemDanh == null)
            {
                return NotFound();
            }
            return Ok(diemDanh);
        }

        [HttpGet("attendance/lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<DiemDanh>>> GetAttendanceByLopId(int lopId)
        {
            var diemDanhs = await _diemDanhRepository.GetAttendanceByLopIdAsync(lopId);
            return Ok(diemDanhs);
        }

        [HttpGet("attendance-rate/hoc-vien/{hocVienId}/lop/{lopId}")]
        public async Task<ActionResult<double>> GetAttendanceRateByHocVien(int hocVienId, int lopId)
        {
            var rate = await _diemDanhRepository.GetAttendanceRateByHocVienAsync(hocVienId, lopId);
            return Ok(rate);
        }

        [HttpPost]
        public async Task<ActionResult<DiemDanh>> Create([FromBody] DiemDanh diemDanh)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdDiemDanh = await _diemDanhRepository.AddAsync(diemDanh);
            return CreatedAtAction(nameof(GetById), new { id = createdDiemDanh.DiemDanhID }, createdDiemDanh);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DiemDanh diemDanh)
        {
            if (id != diemDanh.DiemDanhID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingDiemDanh = await _diemDanhRepository.GetByIdAsync(id);
            if (existingDiemDanh == null)
            {
                return NotFound();
            }

            await _diemDanhRepository.UpdateAsync(diemDanh);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var diemDanh = await _diemDanhRepository.GetByIdAsync(id);
            if (diemDanh == null)
            {
                return NotFound();
            }

            await _diemDanhRepository.DeleteAsync(diemDanh);
            return NoContent();
        }
    }
}