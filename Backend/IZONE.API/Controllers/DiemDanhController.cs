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

        [HttpGet("hoc-vien/{hocVienId}/lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<DiemDanh>>> GetByHocVienAndLopId(int hocVienId, int lopId)
        {
            var diemDanhs = await _diemDanhRepository.GetByHocVienAndLopIdAsync(hocVienId, lopId);
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

        [HttpPost("bulk")]
        public async Task<ActionResult<IEnumerable<DiemDanh>>> CreateBulk([FromBody] IEnumerable<DiemDanh> diemDanhs)
        {
            try
            {
                Console.WriteLine($"📥 [BULK] Nhận request với {diemDanhs?.Count() ?? 0} records");

                if (diemDanhs == null)
                {
                    Console.WriteLine("❌ [BULK] Request body là null");
                    return BadRequest("Request body không được null");
                }

                if (!diemDanhs.Any())
                {
                    Console.WriteLine("❌ [BULK] Danh sách điểm danh trống");
                    return BadRequest("Danh sách điểm danh không được trống");
                }

                // Log chi tiết từng record
                var recordsArray = diemDanhs.ToArray();
                Console.WriteLine($"📊 [BULK] Chi tiết {recordsArray.Length} records:");
                for (int i = 0; i < Math.Min(recordsArray.Length, 5); i++) // Log 5 records đầu tiên
                {
                    var record = recordsArray[i];
                    Console.WriteLine($"  [{i+1}] BuoiHocID: {record.BuoiHocID}, HocVienID: {record.HocVienID}, CoMat: {record.CoMat}, GhiChu: {record.GhiChu}");
                }

                if (recordsArray.Length > 5)
                {
                    Console.WriteLine($"  ... và {recordsArray.Length - 5} records khác");
                }

                if (!ModelState.IsValid)
                {
                    Console.WriteLine("❌ [BULK] ModelState không hợp lệ");
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                    Console.WriteLine($"❌ [BULK] Validation errors: {string.Join(", ", errors)}");
                    return BadRequest(new { errors, modelState = ModelState });
                }

                Console.WriteLine("✅ [BULK] ModelState hợp lệ, bắt đầu xử lý...");

                var createdDiemDanhs = await _diemDanhRepository.CreateBulkAsync(diemDanhs);

                Console.WriteLine($"✅ [BULK] Tạo thành công {createdDiemDanhs.Count()} records");
                return Ok(createdDiemDanhs);
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"❌ [BULK] ArgumentException: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [BULK] Exception: {ex.Message}");
                Console.WriteLine($"❌ [BULK] Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Lỗi nội bộ: {ex.Message}");
            }
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
