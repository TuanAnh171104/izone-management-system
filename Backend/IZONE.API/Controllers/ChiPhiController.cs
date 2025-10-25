using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Services;
using IChiPhiImportService = IZONE.Core.Interfaces.IChiPhiImportService;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChiPhiController : ControllerBase
    {
        private readonly IChiPhiRepository _chiPhiRepository;
        private readonly IChiPhiImportService _chiPhiImportService;

        public ChiPhiController(
            IChiPhiRepository chiPhiRepository,
            IChiPhiImportService chiPhiImportService)
        {
            _chiPhiRepository = chiPhiRepository;
            _chiPhiImportService = chiPhiImportService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetAll()
        {
            var chiPhis = await _chiPhiRepository.GetAllAsync();
            return Ok(chiPhis);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ChiPhi>> GetById(int id)
        {
            var chiPhi = await _chiPhiRepository.GetByIdAsync(id);
            if (chiPhi == null)
            {
                return NotFound();
            }
            return Ok(chiPhi);
        }

        [HttpGet("lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetByLopId(int lopId)
        {
            var chiPhis = await _chiPhiRepository.GetByLopIdAsync(lopId);
            return Ok(chiPhis);
        }

        [HttpGet("khoa-hoc/{khoaHocId}")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetByKhoaHocId(int khoaHocId)
        {
            var chiPhis = await _chiPhiRepository.GetByKhoaHocIdAsync(khoaHocId);
            return Ok(chiPhis);
        }

        [HttpGet("dia-diem/{diaDiemId}")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetByDiaDiemId(int diaDiemId)
        {
            var chiPhis = await _chiPhiRepository.GetByDiaDiemIdAsync(diaDiemId);
            return Ok(chiPhis);
        }

        [HttpGet("loai/{loai}")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetByLoai(string loai)
        {
            var chiPhis = await _chiPhiRepository.GetByLoaiAsync(loai);
            return Ok(chiPhis);
        }

        [HttpGet("sub-loai/{subLoai}")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetBySubLoai(string subLoai)
        {
            var chiPhis = await _chiPhiRepository.GetBySubLoaiAsync(subLoai);
            return Ok(chiPhis);
        }

        [HttpGet("nguon-chi-phi/{nguonChiPhi}")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetByNguonChiPhi(string nguonChiPhi)
        {
            var chiPhis = await _chiPhiRepository.GetByNguonChiPhiAsync(nguonChiPhi);
            return Ok(chiPhis);
        }

        [HttpGet("allocation-method/{allocationMethod}")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetByAllocationMethod(string allocationMethod)
        {
            var chiPhis = await _chiPhiRepository.GetByAllocationMethodAsync(allocationMethod);
            return Ok(chiPhis);
        }

        [HttpGet("date-range")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var chiPhis = await _chiPhiRepository.GetByDateRangeAsync(startDate, endDate);
            return Ok(chiPhis);
        }

        [HttpGet("total-cost/lop/{lopId}")]
        public async Task<ActionResult<decimal>> GetTotalCostByLopId(int lopId)
        {
            var total = await _chiPhiRepository.GetTotalCostByLopIdAsync(lopId);
            return Ok(total);
        }

        [HttpGet("total-cost/khoa-hoc/{khoaHocId}")]
        public async Task<ActionResult<decimal>> GetTotalCostByKhoaHocId(int khoaHocId)
        {
            var total = await _chiPhiRepository.GetTotalCostByKhoaHocIdAsync(khoaHocId);
            return Ok(total);
        }

        [HttpGet("recurring")]
        public async Task<ActionResult<IEnumerable<ChiPhi>>> GetRecurringCosts()
        {
            var chiPhis = await _chiPhiRepository.GetRecurringCostsAsync();
            return Ok(chiPhis);
        }

        [HttpPost]
        public async Task<ActionResult<ChiPhi>> Create([FromBody] ChiPhi chiPhi)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            chiPhi.NgayPhatSinh = DateTime.Now;
            var createdChiPhi = await _chiPhiRepository.AddAsync(chiPhi);
            return CreatedAtAction(nameof(GetById), new { id = createdChiPhi.ChiPhiID }, createdChiPhi);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ChiPhi chiPhi)
        {
            if (id != chiPhi.ChiPhiID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingChiPhi = await _chiPhiRepository.GetByIdAsync(id);
            if (existingChiPhi == null)
            {
                return NotFound();
            }

            await _chiPhiRepository.UpdateAsync(chiPhi);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var chiPhi = await _chiPhiRepository.GetByIdAsync(id);
            if (chiPhi == null)
            {
                return NotFound();
            }

            await _chiPhiRepository.DeleteAsync(chiPhi);
            return NoContent();
        }

        [HttpPost("import")]
        public async Task<ActionResult<ChiPhiImportResult>> Import(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Vui lòng chọn file để import");
            }

            // Validate file extension
            var allowedExtensions = new[] { ".xlsx", ".xls", ".csv" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest($"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", allowedExtensions)}");
            }

            try
            {
                ChiPhiImportResult result;

                using (var stream = file.OpenReadStream())
                {
                    if (fileExtension == ".csv")
                    {
                        result = await _chiPhiImportService.ImportFromCsvAsync(stream);
                    }
                    else
                    {
                        result = await _chiPhiImportService.ImportFromExcelAsync(stream);
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi import file: {ex.Message}");
            }
        }

        [HttpPost("import/preview")]
        public async Task<ActionResult<IEnumerable<object>>> PreviewImport(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Vui lòng chọn file để preview");
            }

            // Validate file extension
            var allowedExtensions = new[] { ".xlsx", ".xls", ".csv" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest($"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", allowedExtensions)}");
            }

            // Validate file size (max 10MB for preview)
            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest("Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
            }

            try
            {
                List<object> previewData;

                using (var stream = file.OpenReadStream())
                {
                    if (fileExtension == ".csv")
                    {
                        previewData = await _chiPhiImportService.PreviewFromCsvAsync(stream);
                    }
                    else
                    {
                        previewData = await _chiPhiImportService.PreviewFromExcelAsync(stream);
                    }
                }

                return Ok(new
                {
                    data = previewData,
                    totalRecords = previewData.Count,
                    fileName = file.FileName,
                    fileSize = file.Length
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi đọc file để preview: {ex.Message}");
            }
        }
    }
}