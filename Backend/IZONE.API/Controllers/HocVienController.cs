using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HocVienController : ControllerBase
    {
        private readonly IHocVienRepository _hocVienRepository;
        private readonly ITaiKhoanRepository _taiKhoanRepository;
        private readonly IZONEDbContext _context;
        private readonly ILogger<HocVienController> _logger;

        public HocVienController(IHocVienRepository hocVienRepository, ITaiKhoanRepository taiKhoanRepository, IZONEDbContext context, ILogger<HocVienController> logger)
        {
            _hocVienRepository = hocVienRepository;
            _taiKhoanRepository = taiKhoanRepository;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HocVien>>> GetAllHocVien()
        {
            try
            {
                var hocViens = await _hocVienRepository.GetAllAsync();
                return Ok(hocViens);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách học viên");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<HocVien>> GetHocVienById(int id)
        {
            try
            {
                var hocVien = await _hocVienRepository.GetByIdAsync(id);
                if (hocVien == null)
                {
                    return NotFound($"Không tìm thấy học viên với ID: {id}");
                }
                return Ok(hocVien);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy học viên với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("email/{email}")]
        public async Task<ActionResult<HocVien>> GetHocVienByEmail(string email)
        {
            try
            {
                var hocVien = await _hocVienRepository.GetByEmailAsync(email);
                if (hocVien == null)
                {
                    return NotFound($"Không tìm thấy học viên với email: {email}");
                }
                return Ok(hocVien);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy học viên với email: {email}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("lop/{lopId}")]
        public async Task<ActionResult<IEnumerable<HocVien>>> GetHocViensByLopHoc(int lopId)
        {
            try
            {
                var hocViens = await _hocVienRepository.GetHocViensByLopHocAsync(lopId);
                return Ok(hocViens);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy danh sách học viên của lớp có ID: {lopId}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("{hocVienId}/vi")]
        public async Task<ActionResult<ViHocVien>> GetViHocVien(int hocVienId)
        {
            try
            {
                var viHocVien = await _hocVienRepository.GetViHocVienAsync(hocVienId);
                if (viHocVien == null)
                {
                    return NotFound($"Không tìm thấy ví của học viên với ID: {hocVienId}");
                }
                return Ok(viHocVien);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin ví của học viên với ID: {hocVienId}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPost]
        public async Task<ActionResult<HocVien>> CreateHocVien([FromBody] HocVien hocVien)
        {
            try
            {
                var existingHocVien = await _hocVienRepository.GetByEmailAsync(hocVien.Email);
                if (existingHocVien != null)
                {
                    return BadRequest("Email đã được sử dụng");
                }

                // Không cần set NgayDangKy vì không có trong model mới
                var createdHocVien = await _hocVienRepository.AddAsync(hocVien);
                return CreatedAtAction(nameof(GetHocVienById), new { id = createdHocVien.HocVienID }, createdHocVien);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo học viên mới");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateHocVien(int id, [FromBody] HocVien hocVien)
        {
            try
            {
                if (id != hocVien.HocVienID)
                {
                    return BadRequest("ID không khớp");
                }

                var existingHocVien = await _hocVienRepository.GetByIdAsync(id);
                if (existingHocVien == null)
                {
                    return NotFound($"Không tìm thấy học viên với ID: {id}");
                }

                await _hocVienRepository.UpdateAsync(hocVien);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi cập nhật học viên với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteHocVien(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var hocVien = await _hocVienRepository.GetByIdAsync(id);
                if (hocVien == null)
                {
                    return NotFound($"Không tìm thấy học viên với ID: {id}");
                }

                // Nếu học viên có tài khoản liên quan, xóa tài khoản trước
                if (hocVien.TaiKhoanID.HasValue)
                {
                    var taiKhoan = await _taiKhoanRepository.GetByIdAsync(hocVien.TaiKhoanID.Value);
                    if (taiKhoan != null)
                    {
                        await _taiKhoanRepository.DeleteAsync(taiKhoan);
                    }
                }

                // Xóa học viên
                await _hocVienRepository.DeleteAsync(hocVien);

                await transaction.CommitAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Lỗi khi xóa học viên với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }
    }
}
