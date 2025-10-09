using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiemSoController : ControllerBase
    {
        private readonly IDiemSoRepository _diemSoRepository;

        public DiemSoController(IDiemSoRepository diemSoRepository)
        {
            _diemSoRepository = diemSoRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DiemSo>>> GetAll()
        {
            var diemSos = await _diemSoRepository.GetAllAsync();
            return Ok(diemSos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DiemSo>> GetById(int id)
        {
            var diemSo = await _diemSoRepository.GetByIdAsync(id);
            if (diemSo == null)
            {
                return NotFound();
            }
            return Ok(diemSo);
        }

        [HttpGet("hoc-vien/{hocVienId}")]
        public async Task<ActionResult<IEnumerable<DiemSo>>> GetByHocVienId(int hocVienId)
        {
            var diemSos = await _diemSoRepository.GetByHocVienIdAsync(hocVienId);
            return Ok(diemSos);
        }

        [HttpGet("lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<DiemSo>>> GetByLopId(int lopId)
        {
            var diemSos = await _diemSoRepository.GetByLopIdAsync(lopId);
            return Ok(diemSos);
        }

        [HttpGet("loai-diem/{loaiDiem}")]
        public async Task<ActionResult<IEnumerable<DiemSo>>> GetByLoaiDiem(string loaiDiem)
        {
            var diemSos = await _diemSoRepository.GetByLoaiDiemAsync(loaiDiem);
            return Ok(diemSos);
        }

        [HttpGet("ket-qua/{ketQua}")]
        public async Task<ActionResult<IEnumerable<DiemSo>>> GetByKetQua(string ketQua)
        {
            var diemSos = await _diemSoRepository.GetByKetQuaAsync(ketQua);
            return Ok(diemSos);
        }

        [HttpGet("hoc-vien/{hocVienId}/lop/{lopId}/loai-diem/{loaiDiem}")]
        public async Task<ActionResult<DiemSo>> GetByHocVienAndLopAndLoaiDiem(int hocVienId, int lopId, string loaiDiem)
        {
            var diemSo = await _diemSoRepository.GetByHocVienAndLopAndLoaiDiemAsync(hocVienId, lopId, loaiDiem);
            if (diemSo == null)
            {
                return NotFound();
            }
            return Ok(diemSo);
        }

        [HttpGet("grades/hoc-vien/{hocVienId}/lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<DiemSo>>> GetGradesByHocVienAndLop(int hocVienId, int lopId)
        {
            var diemSos = await _diemSoRepository.GetGradesByHocVienAndLopAsync(hocVienId, lopId);
            return Ok(diemSos);
        }

        [HttpPost]
        public async Task<ActionResult<DiemSo>> Create([FromBody] DiemSo diemSo)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdDiemSo = await _diemSoRepository.AddAsync(diemSo);
            return CreatedAtAction(nameof(GetById), new { id = createdDiemSo.DiemID }, createdDiemSo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DiemSo diemSo)
        {
            if (id != diemSo.DiemID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingDiemSo = await _diemSoRepository.GetByIdAsync(id);
            if (existingDiemSo == null)
            {
                return NotFound();
            }

            await _diemSoRepository.UpdateAsync(diemSo);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var diemSo = await _diemSoRepository.GetByIdAsync(id);
            if (diemSo == null)
            {
                return NotFound();
            }

            await _diemSoRepository.DeleteAsync(diemSo);
            return NoContent();
        }
    }
}