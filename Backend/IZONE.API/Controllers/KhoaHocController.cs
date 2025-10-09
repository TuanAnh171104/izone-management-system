using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhoaHocController : ControllerBase
    {
        private readonly IKhoaHocRepository _khoaHocRepository;
        private readonly ILogger<KhoaHocController> _logger;

        public KhoaHocController(IKhoaHocRepository khoaHocRepository, ILogger<KhoaHocController> logger)
        {
            _khoaHocRepository = khoaHocRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<KhoaHoc>>> GetAllKhoaHoc()
        {
            try
            {
                var khoaHocs = await _khoaHocRepository.GetAllAsync();
                return Ok(khoaHocs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách khóa học");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<KhoaHoc>>> GetActiveKhoaHoc()
        {
            try
            {
                var khoaHocs = await _khoaHocRepository.GetActiveKhoaHocAsync();
                return Ok(khoaHocs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách khóa học đang hoạt động");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<KhoaHoc>> GetKhoaHocById(int id)
        {
            try
            {
                var khoaHoc = await _khoaHocRepository.GetByIdAsync(id);
                if (khoaHoc == null)
                {
                    return NotFound($"Không tìm thấy khóa học với ID: {id}");
                }
                return Ok(khoaHoc);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy khóa học với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("{id}/lophoc")]
        public async Task<ActionResult<IEnumerable<LopHoc>>> GetLopHocsByKhoaHoc(int id)
        {
            try
            {
                var lopHocs = await _khoaHocRepository.GetLopHocsByKhoaHocAsync(id);
                return Ok(lopHocs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy danh sách lớp học của khóa học có ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPost]
        public async Task<ActionResult<KhoaHoc>> CreateKhoaHoc([FromBody] KhoaHoc khoaHoc)
        {
            try
            {
                var createdKhoaHoc = await _khoaHocRepository.AddAsync(khoaHoc);
                return CreatedAtAction(nameof(GetKhoaHocById), new { id = createdKhoaHoc.KhoaHocID }, createdKhoaHoc);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo khóa học mới");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateKhoaHoc(int id, [FromBody] KhoaHoc khoaHoc)
        {
            try
            {
                if (id != khoaHoc.KhoaHocID)
                {
                    return BadRequest("ID không khớp");
                }

                var existingKhoaHoc = await _khoaHocRepository.GetByIdAsync(id);
                if (existingKhoaHoc == null)
                {
                    return NotFound($"Không tìm thấy khóa học với ID: {id}");
                }

                await _khoaHocRepository.UpdateAsync(khoaHoc);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogError(ex, $"Không tìm thấy khóa học với ID: {id}");
                return NotFound(ex.Message);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, $"Lỗi đồng thời khi cập nhật khóa học với ID: {id}");
                return StatusCode(409, "Dữ liệu đã được thay đổi bởi người dùng khác. Vui lòng tải lại và thử lại.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi cập nhật khóa học với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteKhoaHoc(int id)
        {
            try
            {
                var khoaHoc = await _khoaHocRepository.GetByIdAsync(id);
                if (khoaHoc == null)
                {
                    return NotFound($"Không tìm thấy khóa học với ID: {id}");
                }

                await _khoaHocRepository.DeleteAsync(khoaHoc);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi xóa khóa học với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }
    }
}
