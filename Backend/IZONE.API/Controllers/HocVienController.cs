using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

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

        /// <summary>
        /// Tạo học viên kèm tài khoản (cho admin)
        /// </summary>
        [HttpPost("with-account")]
        public async Task<IActionResult> CreateWithAccount([FromBody] CreateHocVienWithAccountRequest request)
        {
            return await _context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Kiểm tra email đã tồn tại chưa
                    var existingTaiKhoan = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Email == request.Email);
                    if (existingTaiKhoan != null)
                    {
                        return BadRequest($"Email {request.Email} đã tồn tại trong hệ thống");
                    }

                    // Tạo tài khoản mới
                    var taiKhoan = new TaiKhoan
                    {
                        Email = request.Email,
                        MatKhau = request.MatKhau, // Nên hash mật khẩu trong thực tế
                        VaiTro = "HocVien"
                    };

                    await _context.TaiKhoans.AddAsync(taiKhoan);
                    await _context.SaveChangesAsync();

                    // Tạo học viên với TaiKhoanID
                    var hocVien = new HocVien
                    {
                        TaiKhoanID = taiKhoan.TaiKhoanID,
                        HoTen = request.HoTen,
                        NgaySinh = string.IsNullOrEmpty(request.NgaySinh) ? null : DateTime.Parse(request.NgaySinh),
                        Email = request.Email,
                        SDT = request.SDT,
                        TaiKhoanVi = 0 // Mặc định 0
                    };

                    await _hocVienRepository.AddAsync(hocVien);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    var result = new
                    {
                        hocVienID = hocVien.HocVienID,
                        hoTen = hocVien.HoTen,
                        email = hocVien.Email,
                        SDT = hocVien.SDT,
                        taiKhoanID = hocVien.TaiKhoanID,
                        taiKhoanVi = hocVien.TaiKhoanVi,
                        message = "Học viên và tài khoản đã được tạo thành công"
                    };

                    return CreatedAtAction(nameof(GetHocVienById), new { id = hocVien.HocVienID }, result);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Lỗi khi tạo học viên kèm tài khoản");
                    return StatusCode(500, new { message = "Lỗi khi tạo học viên kèm tài khoản", error = ex.Message });
                }
            });
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
            return await _context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    _logger.LogInformation("=== BẮT ĐẦU XÓA HỌC VIÊN VỚI ID: {HocVienID} ===", id);

                    // Kiểm tra học viên có tồn tại không
                    var hocVien = await _hocVienRepository.GetByIdAsync(id);
                    if (hocVien == null)
                    {
                        _logger.LogWarning("Không tìm thấy học viên với ID: {HocVienID}", id);
                        return NotFound(new { message = $"Không tìm thấy học viên với ID {id}" });
                    }

                    _logger.LogInformation("Tìm thấy học viên: {HoTen} - {Email}", hocVien.HoTen, hocVien.Email);

                    // KIỂM TRA CÁC RÀNG BUỘC TRƯỚC KHI XÓA
                    _logger.LogInformation("=== KIỂM TRA CÁC RÀNG BUỘC ===");

                    // 1. Kiểm tra DangKyLop (Restrict - không thể xóa nếu có đăng ký lớp)
                    var dangKyLopCount = await _context.DangKyLops.CountAsync(d => d.HocVienID == id);
                    _logger.LogInformation("Số đăng ký lớp liên quan: {Count}", dangKyLopCount);

                    if (dangKyLopCount > 0)
                    {
                        _logger.LogWarning("Không thể xóa học viên {HocVienID} vì có {Count} đăng ký lớp học", id, dangKyLopCount);
                        return BadRequest(new
                        {
                            message = $"Không thể xóa học viên vì có {dangKyLopCount} đăng ký lớp học. Vui lòng hủy đăng ký các lớp học trước khi xóa.",
                            activeRegistrations = dangKyLopCount
                        });
                    }

                    // 2. Kiểm tra DiemDanh (Restrict - điểm danh các buổi học)
                    var diemDanhCount = await _context.DiemDanhs.CountAsync(d => d.HocVienID == id);
                    _logger.LogInformation("Số điểm danh liên quan: {Count}", diemDanhCount);

                    // 3. Kiểm tra DiemSo (Restrict - điểm số)
                    var diemSoCount = await _context.DiemSos.CountAsync(d => d.HocVienID == id);
                    _logger.LogInformation("Số điểm số liên quan: {Count}", diemSoCount);

                    // 4. Kiểm tra ViHocVien (Restrict - ví học viên)
                    var viHocVienCount = await _context.ViHocViens.CountAsync(v => v.HocVienID == id);
                    _logger.LogInformation("Số giao dịch ví liên quan: {Count}", viHocVienCount);

                    // BẮT ĐẦU XÓA THEO THỨ TỰ ĐÚNG
                    _logger.LogInformation("=== BẮT ĐẦU XÓA DỮ LIỆU ===");

                    // 1. Xóa DiemDanh liên quan đến học viên
                    if (diemDanhCount > 0)
                    {
                        var deletedDiemDanh = await _context.Database.ExecuteSqlRawAsync("DELETE FROM DiemDanh WHERE HocVienID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} điểm danh liên quan", deletedDiemDanh);
                    }

                    // 2. Xóa DiemSo liên quan đến học viên
                    if (diemSoCount > 0)
                    {
                        var deletedDiemSo = await _context.Database.ExecuteSqlRawAsync("DELETE FROM DiemSo WHERE HocVienID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} điểm số liên quan", deletedDiemSo);
                    }

                    // 3. Xóa ViHocVien liên quan đến học viên
                    if (viHocVienCount > 0)
                    {
                        var deletedViHocVien = await _context.Database.ExecuteSqlRawAsync("DELETE FROM ViHocVien WHERE HocVienID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} giao dịch ví liên quan", deletedViHocVien);
                    }

                    // 4. Nếu học viên có tài khoản liên kết, xóa tài khoản
                    if (hocVien.TaiKhoanID.HasValue)
                    {
                        var taiKhoan = await _taiKhoanRepository.GetByIdAsync(hocVien.TaiKhoanID.Value);
                        if (taiKhoan != null)
                        {
                            _logger.LogInformation("Đang xóa tài khoản liên kết với ID: {TaiKhoanID}", taiKhoan.TaiKhoanID);
                            await _taiKhoanRepository.DeleteAsync(taiKhoan);
                            _logger.LogInformation("Đã xóa tài khoản liên kết");
                        }
                    }

                    // 5. Cuối cùng, xóa học viên
                    _logger.LogInformation("Đang xóa học viên với ID: {HocVienID}", id);
                    await _hocVienRepository.DeleteAsync(hocVien);

                    // Commit transaction
                    await transaction.CommitAsync();

                    _logger.LogInformation("=== HỌC VIÊN ĐÃ ĐƯỢC XÓA THÀNH CÔNG ===");
                    _logger.LogInformation("HocVienID: {HocVienID}, HoTen: {HoTen}, Email: {Email}",
                        id, hocVien.HoTen, hocVien.Email);

                    return Ok(new
                    {
                        message = "Học viên và tài khoản đã được xóa thành công",
                        hocVienID = id,
                        hoTen = hocVien.HoTen,
                        email = hocVien.Email,
                        taiKhoanID = hocVien.TaiKhoanID,
                        deletedRecords = new
                        {
                            dangKyLop = dangKyLopCount,
                            diemDanh = diemDanhCount,
                            diemSo = diemSoCount,
                            viHocVien = viHocVienCount
                        }
                    });
                }
                catch (DbUpdateException dbEx)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(dbEx, "Lỗi database khi xóa học viên với ID: {HocVienID}", id);

                    // Kiểm tra lỗi constraint cụ thể
                    if (dbEx.InnerException?.Message.Contains("FOREIGN KEY") == true)
                    {
                        return BadRequest(new
                        {
                            message = "Không thể xóa học viên vì vẫn còn dữ liệu liên quan chưa được xử lý.",
                            error = dbEx.InnerException?.Message,
                            solution = "Vui lòng liên hệ quản trị viên để được hỗ trợ xử lý dữ liệu ràng buộc."
                        });
                    }
                    else if (dbEx.InnerException?.Message.Contains("CHECK") == true)
                    {
                        return BadRequest(new
                        {
                            message = "Dữ liệu không thỏa mãn ràng buộc kiểm tra trong database",
                            error = dbEx.InnerException?.Message
                        });
                    }

                    return BadRequest(new
                    {
                        message = "Lỗi khi xóa học viên khỏi database",
                        error = dbEx.InnerException?.Message
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Lỗi không xác định khi xóa học viên với ID: {HocVienID}", id);
                    return StatusCode(500, new
                    {
                        message = "Lỗi server nội bộ khi xóa học viên",
                        error = ex.Message,
                        stackTrace = ex.StackTrace
                    });
                }
            });
        }
    }
}

// DTOs cho các request
public class CreateHocVienWithAccountRequest
{
    public string Email { get; set; } = string.Empty;
    public string MatKhau { get; set; } = string.Empty;
    public string HoTen { get; set; } = string.Empty;
    public string? NgaySinh { get; set; }
    public string? SDT { get; set; }
}
