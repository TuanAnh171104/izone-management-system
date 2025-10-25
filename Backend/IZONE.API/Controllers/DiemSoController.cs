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

        [HttpGet("diem-trung-binh/hoc-vien/{hocVienId}/lop/{lopId}")]
        public async Task<ActionResult<decimal>> GetDiemTrungBinhByHocVienAndLop(int hocVienId, int lopId)
        {
            var diemTrungBinh = await _diemSoRepository.GetDiemTrungBinhByHocVienAndLopAsync(hocVienId, lopId);
            return Ok(diemTrungBinh);
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

        [HttpPost("bulk")]
        public async Task<IActionResult> CreateBulk([FromBody] List<DiemSo> diemSos)
        {
            if (diemSos == null || !diemSos.Any())
            {
                return BadRequest("Danh sách điểm số không được trống");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var createdDiemSos = new List<DiemSo>();

                foreach (var diemSo in diemSos)
                {
                    // Kiểm tra xem đã tồn tại điểm cho học viên này chưa
                    var existingDiemSo = await _diemSoRepository.GetByHocVienAndLopAndLoaiDiemAsync(
                        diemSo.HocVienID, diemSo.LopID, diemSo.LoaiDiem);

                    if (existingDiemSo != null)
                    {
                        // Cập nhật điểm hiện có
                        existingDiemSo.Diem = diemSo.Diem;
                        existingDiemSo.KetQua = diemSo.Diem >= 5 ? "Dat" : "KhongDat";
                        await _diemSoRepository.UpdateAsync(existingDiemSo);
                        createdDiemSos.Add(existingDiemSo);
                    }
                    else
                    {
                        // Tạo điểm mới
                        diemSo.KetQua = diemSo.Diem >= 5 ? "Dat" : "KhongDat";
                        var newDiemSo = await _diemSoRepository.AddAsync(diemSo);
                        createdDiemSos.Add(newDiemSo);
                    }
                }

                return CreatedAtAction(nameof(GetAll), createdDiemSos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lưu điểm số: {ex.Message}");
            }
        }
    }
}