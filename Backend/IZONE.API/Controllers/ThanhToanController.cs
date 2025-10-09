using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThanhToanController : ControllerBase
    {
        private readonly IThanhToanRepository _thanhToanRepository;

        public ThanhToanController(IThanhToanRepository thanhToanRepository)
        {
            _thanhToanRepository = thanhToanRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetAll()
        {
            var thanhToans = await _thanhToanRepository.GetAllAsync();
            return Ok(thanhToans);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ThanhToan>> GetById(int id)
        {
            var thanhToan = await _thanhToanRepository.GetByIdAsync(id);
            if (thanhToan == null)
            {
                return NotFound();
            }
            return Ok(thanhToan);
        }

        [HttpGet("hoc-vien/{hocVienId}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByHocVienId(int hocVienId)
        {
            var thanhToans = await _thanhToanRepository.GetByHocVienIdAsync(hocVienId);
            return Ok(thanhToans);
        }

        [HttpGet("dang-ky/{dangKyId}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByDangKyId(int dangKyId)
        {
            var thanhToans = await _thanhToanRepository.GetByDangKyIdAsync(dangKyId);
            return Ok(thanhToans);
        }

        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByStatus(string status)
        {
            var thanhToans = await _thanhToanRepository.GetByStatusAsync(status);
            return Ok(thanhToans);
        }

        [HttpGet("phuong-thuc/{phuongThuc}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByPhuongThuc(string phuongThuc)
        {
            var thanhToans = await _thanhToanRepository.GetByPhuongThucAsync(phuongThuc);
            return Ok(thanhToans);
        }

        [HttpGet("date-range")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var thanhToans = await _thanhToanRepository.GetByDateRangeAsync(startDate, endDate);
            return Ok(thanhToans);
        }

        [HttpGet("total/hoc-vien/{hocVienId}")]
        public async Task<ActionResult<decimal>> GetTotalByHocVienId(int hocVienId)
        {
            var total = await _thanhToanRepository.GetTotalByHocVienIdAsync(hocVienId);
            return Ok(total);
        }

        [HttpGet("total/dang-ky/{dangKyId}")]
        public async Task<ActionResult<decimal>> GetTotalByDangKyId(int dangKyId)
        {
            var total = await _thanhToanRepository.GetTotalByDangKyIdAsync(dangKyId);
            return Ok(total);
        }

        [HttpPost]
        public async Task<ActionResult<ThanhToan>> Create([FromBody] ThanhToan thanhToan)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            thanhToan.NgayThanhToan = DateTime.Now;
            var createdThanhToan = await _thanhToanRepository.AddAsync(thanhToan);
            return CreatedAtAction(nameof(GetById), new { id = createdThanhToan.ThanhToanID }, createdThanhToan);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ThanhToan thanhToan)
        {
            if (id != thanhToan.ThanhToanID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingThanhToan = await _thanhToanRepository.GetByIdAsync(id);
            if (existingThanhToan == null)
            {
                return NotFound();
            }

            await _thanhToanRepository.UpdateAsync(thanhToan);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var thanhToan = await _thanhToanRepository.GetByIdAsync(id);
            if (thanhToan == null)
            {
                return NotFound();
            }

            await _thanhToanRepository.DeleteAsync(thanhToan);
            return NoContent();
        }
    }
}