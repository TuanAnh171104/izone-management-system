using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ViHocVienController : ControllerBase
    {
        private readonly IViHocVienRepository _viHocVienRepository;

        public ViHocVienController(IViHocVienRepository viHocVienRepository)
        {
            _viHocVienRepository = viHocVienRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ViHocVien>>> GetAll()
        {
            var viHocViens = await _viHocVienRepository.GetAllAsync();
            return Ok(viHocViens);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ViHocVien>> GetById(int id)
        {
            var viHocVien = await _viHocVienRepository.GetByIdAsync(id);
            if (viHocVien == null)
            {
                return NotFound();
            }
            return Ok(viHocVien);
        }

        [HttpGet("hoc-vien/{hocVienId}")]
        public async Task<ActionResult<IEnumerable<ViHocVien>>> GetByHocVienId(int hocVienId)
        {
            var viHocViens = await _viHocVienRepository.GetByHocVienIdAsync(hocVienId);
            return Ok(viHocViens);
        }

        [HttpGet("loai-tx/{loaiTx}")]
        public async Task<ActionResult<IEnumerable<ViHocVien>>> GetByLoaiTx(string loaiTx)
        {
            var viHocViens = await _viHocVienRepository.GetByLoaiTxAsync(loaiTx);
            return Ok(viHocViens);
        }

        [HttpGet("dang-ky/{dangKyId}")]
        public async Task<ActionResult<IEnumerable<ViHocVien>>> GetByDangKyId(int dangKyId)
        {
            var viHocViens = await _viHocVienRepository.GetByDangKyIdAsync(dangKyId);
            return Ok(viHocViens);
        }

        [HttpGet("thanh-toan/{thanhToanId}")]
        public async Task<ActionResult<IEnumerable<ViHocVien>>> GetByThanhToanId(int thanhToanId)
        {
            var viHocViens = await _viHocVienRepository.GetByThanhToanIdAsync(thanhToanId);
            return Ok(viHocViens);
        }

        [HttpGet("balance/{hocVienId}")]
        public async Task<ActionResult<decimal>> GetBalanceByHocVienId(int hocVienId)
        {
            var balance = await _viHocVienRepository.GetBalanceByHocVienIdAsync(hocVienId);
            return Ok(balance);
        }

        [HttpGet("transaction-history/{hocVienId}")]
        public async Task<ActionResult<IEnumerable<ViHocVien>>> GetTransactionHistory(int hocVienId, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var viHocViens = await _viHocVienRepository.GetTransactionHistoryAsync(hocVienId, startDate, endDate);
            return Ok(viHocViens);
        }

        [HttpPost]
        public async Task<ActionResult<ViHocVien>> Create([FromBody] ViHocVien viHocVien)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            viHocVien.NgayGiaoDich = DateTime.Now;
            var createdViHocVien = await _viHocVienRepository.AddAsync(viHocVien);
            return CreatedAtAction(nameof(GetById), new { id = createdViHocVien.ViID }, createdViHocVien);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ViHocVien viHocVien)
        {
            if (id != viHocVien.ViID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingViHocVien = await _viHocVienRepository.GetByIdAsync(id);
            if (existingViHocVien == null)
            {
                return NotFound();
            }

            await _viHocVienRepository.UpdateAsync(viHocVien);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var viHocVien = await _viHocVienRepository.GetByIdAsync(id);
            if (viHocVien == null)
            {
                return NotFound();
            }

            await _viHocVienRepository.DeleteAsync(viHocVien);
            return NoContent();
        }
    }
}