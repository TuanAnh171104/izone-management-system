using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DangKyLopController : ControllerBase
    {
        private readonly IDangKyLopRepository _dangKyLopRepository;

        public DangKyLopController(IDangKyLopRepository dangKyLopRepository)
        {
            _dangKyLopRepository = dangKyLopRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DangKyLop>>> GetAll()
        {
            var dangKyLops = await _dangKyLopRepository.GetAllAsync();
            return Ok(dangKyLops);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DangKyLop>> GetById(int id)
        {
            var dangKyLop = await _dangKyLopRepository.GetByIdAsync(id);
            if (dangKyLop == null)
            {
                return NotFound();
            }
            return Ok(dangKyLop);
        }

        [HttpGet("hoc-vien/{hocVienId}")]
        public async Task<ActionResult<IEnumerable<DangKyLop>>> GetByHocVienId(int hocVienId)
        {
            var dangKyLops = await _dangKyLopRepository.GetByHocVienIdAsync(hocVienId);
            return Ok(dangKyLops);
        }

        [HttpGet("lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<DangKyLop>>> GetByLopId(int lopId)
        {
            var dangKyLops = await _dangKyLopRepository.GetByLopIdAsync(lopId);
            return Ok(dangKyLops);
        }

        [HttpGet("trang-thai/{trangThai}")]
        public async Task<ActionResult<IEnumerable<DangKyLop>>> GetByTrangThai(string trangThai)
        {
            var dangKyLops = await _dangKyLopRepository.GetByTrangThaiAsync(trangThai);
            return Ok(dangKyLops);
        }

        [HttpGet("trang-thai-thanh-toan/{trangThaiThanhToan}")]
        public async Task<ActionResult<IEnumerable<DangKyLop>>> GetByTrangThaiThanhToan(string trangThaiThanhToan)
        {
            var dangKyLops = await _dangKyLopRepository.GetByTrangThaiThanhToanAsync(trangThaiThanhToan);
            return Ok(dangKyLops);
        }

        [HttpGet("hoc-vien/{hocVienId}/lop/{lopId}")]
        public async Task<ActionResult<DangKyLop>> GetByHocVienAndLop(int hocVienId, int lopId)
        {
            var dangKyLop = await _dangKyLopRepository.GetByHocVienAndLopAsync(hocVienId, lopId);
            if (dangKyLop == null)
            {
                return NotFound();
            }
            return Ok(dangKyLop);
        }

        [HttpPost]
        public async Task<ActionResult<DangKyLop>> Create([FromBody] DangKyLop dangKyLop)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            dangKyLop.NgayDangKy = DateTime.Now;
            var createdDangKyLop = await _dangKyLopRepository.AddAsync(dangKyLop);
            return CreatedAtAction(nameof(GetById), new { id = createdDangKyLop.DangKyID }, createdDangKyLop);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DangKyLop dangKyLop)
        {
            if (id != dangKyLop.DangKyID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingDangKyLop = await _dangKyLopRepository.GetByIdAsync(id);
            if (existingDangKyLop == null)
            {
                return NotFound();
            }

            await _dangKyLopRepository.UpdateAsync(dangKyLop);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var dangKyLop = await _dangKyLopRepository.GetByIdAsync(id);
            if (dangKyLop == null)
            {
                return NotFound();
            }

            await _dangKyLopRepository.DeleteAsync(dangKyLop);
            return NoContent();
        }
    }
}