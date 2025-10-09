using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaoLuuController : ControllerBase
    {
        private readonly IBaoLuuRepository _baoLuuRepository;

        public BaoLuuController(IBaoLuuRepository baoLuuRepository)
        {
            _baoLuuRepository = baoLuuRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetAll()
        {
            var baoLuus = await _baoLuuRepository.GetAllAsync();
            return Ok(baoLuus);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BaoLuu>> GetById(int id)
        {
            var baoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (baoLuu == null)
            {
                return NotFound();
            }
            return Ok(baoLuu);
        }

        [HttpGet("dang-ky/{dangKyId}")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetByDangKyId(int dangKyId)
        {
            var baoLuus = await _baoLuuRepository.GetByDangKyIdAsync(dangKyId);
            return Ok(baoLuus);
        }

        [HttpGet("trang-thai/{trangThai}")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetByTrangThai(string trangThai)
        {
            var baoLuus = await _baoLuuRepository.GetByTrangThaiAsync(trangThai);
            return Ok(baoLuus);
        }

        [HttpGet("expired")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetExpiredBaoLuu()
        {
            var baoLuus = await _baoLuuRepository.GetExpiredBaoLuuAsync();
            return Ok(baoLuus);
        }

        [HttpGet("pending-approval")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetPendingApproval()
        {
            var baoLuus = await _baoLuuRepository.GetPendingApprovalAsync();
            return Ok(baoLuus);
        }

        [HttpGet("active/dang-ky/{dangKyId}")]
        public async Task<ActionResult<BaoLuu>> GetActiveBaoLuuByDangKyId(int dangKyId)
        {
            var baoLuu = await _baoLuuRepository.GetActiveBaoLuuByDangKyIdAsync(dangKyId);
            if (baoLuu == null)
            {
                return NotFound();
            }
            return Ok(baoLuu);
        }

        [HttpPost]
        public async Task<ActionResult<BaoLuu>> Create([FromBody] BaoLuu baoLuu)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            baoLuu.NgayBaoLuu = DateTime.Now;
            var createdBaoLuu = await _baoLuuRepository.AddAsync(baoLuu);
            return CreatedAtAction(nameof(GetById), new { id = createdBaoLuu.BaoLuuID }, createdBaoLuu);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BaoLuu baoLuu)
        {
            if (id != baoLuu.BaoLuuID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingBaoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (existingBaoLuu == null)
            {
                return NotFound();
            }

            await _baoLuuRepository.UpdateAsync(baoLuu);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var baoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (baoLuu == null)
            {
                return NotFound();
            }

            await _baoLuuRepository.DeleteAsync(baoLuu);
            return NoContent();
        }
    }
}