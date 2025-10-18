using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TaiKhoanController : ControllerBase
    {
        private readonly ITaiKhoanRepository _taiKhoanRepository;
        private readonly IHocVienRepository _hocVienRepository;
        private readonly IGiangVienRepository _giangVienRepository;
        private readonly IZONEDbContext _context;
        private readonly ILogger<TaiKhoanController> _logger;

        public TaiKhoanController(ITaiKhoanRepository taiKhoanRepository, IHocVienRepository hocVienRepository, IGiangVienRepository giangVienRepository, IZONEDbContext context, ILogger<TaiKhoanController> logger)
        {
            _taiKhoanRepository = taiKhoanRepository;
            _hocVienRepository = hocVienRepository;
            _giangVienRepository = giangVienRepository;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaiKhoan>>> GetAllTaiKhoan()
        {
            try
            {
                var taiKhoans = await _taiKhoanRepository.GetAllAsync();
                return Ok(taiKhoans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách tài khoản");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaiKhoan>> GetTaiKhoanById(int id)
        {
            try
            {
                var taiKhoan = await _taiKhoanRepository.GetByIdAsync(id);
                if (taiKhoan == null)
                {
                    return NotFound($"Không tìm thấy tài khoản với ID: {id}");
                }
                return Ok(taiKhoan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy tài khoản với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] JsonElement model)
        {
            try
            {
                // Parse payload an toàn từ JSON
                string email = null;
                string username = null;
                string password = null;

                if (model.ValueKind == JsonValueKind.Object)
                {
                    if (model.TryGetProperty("email", out var emailProp))
                        email = emailProp.GetString();
                    if (model.TryGetProperty("username", out var usernameProp))
                        username = usernameProp.GetString();
                    if (model.TryGetProperty("password", out var passwordProp))
                        password = passwordProp.GetString();
                }

                // Fallback đăng nhập cho admin trong môi trường phát triển
                if (((email?.Trim().Equals("admin@izone.local", StringComparison.OrdinalIgnoreCase) ?? false) && password == "admin123")
                    || ((username?.Trim().Equals("admin", StringComparison.OrdinalIgnoreCase) ?? false) && password == "admin123"))
                {
                    var taiKhoanDev = new TaiKhoan
                    {
                        TaiKhoanID = 1,
                        Email = "admin@izone.local",
                        VaiTro = "Admin"
                    };

                    return Ok(new {
                        TaiKhoanID = taiKhoanDev.TaiKhoanID,
                        Email = taiKhoanDev.Email,
                        VaiTro = taiKhoanDev.VaiTro
                    });
                }

                TaiKhoan taiKhoan = null;

                // Ưu tiên email nếu được cung cấp
                if (!string.IsNullOrWhiteSpace(email))
                {
                    var byEmail = await _taiKhoanRepository.FindAsync(x => x.Email == email);
                    taiKhoan = byEmail?.FirstOrDefault();
                }

                // Fallback sang username
                if (taiKhoan == null && !string.IsNullOrWhiteSpace(username))
                {
                    taiKhoan = await _taiKhoanRepository.GetByUsernameAsync(username);
                }

                if (taiKhoan == null)
                {
                    return Unauthorized("Email hoặc tên đăng nhập không tồn tại");
                }

                // Kiểm tra mật khẩu
                if (!string.Equals(taiKhoan.MatKhau, password))
                {
                    return Unauthorized("Mật khẩu không đúng");
                }

                // Nếu là giảng viên, lấy thông tin giảng viên đầy đủ
                if (taiKhoan.VaiTro == "GiangVien")
                {
                    _logger.LogInformation($"Đang tìm giảng viên cho email: {taiKhoan.Email}");
                    var giangVien = await _giangVienRepository.GetByEmailAsync(taiKhoan.Email);

                    if (giangVien != null)
                    {
                        _logger.LogInformation($"Tìm thấy giảng viên: ID={giangVien.GiangVienID}, HoTen={giangVien.HoTen}");
                        return Ok(new {
                            TaiKhoanID = taiKhoan.TaiKhoanID,
                            Email = taiKhoan.Email,
                            VaiTro = taiKhoan.VaiTro,
                            GiangVienID = giangVien.GiangVienID,
                            HoTen = giangVien.HoTen,
                            ChuyenMon = giangVien.ChuyenMon
                        });
                    }
                    else
                    {
                        _logger.LogWarning($"Không tìm thấy giảng viên cho email: {taiKhoan.Email}");
                    }
                }

                // Nếu là học viên, lấy thông tin học viên đầy đủ
                if (taiKhoan.VaiTro == "HocVien")
                {
                    var hocVien = await _hocVienRepository.GetByEmailAsync(taiKhoan.Email);
                    if (hocVien != null)
                    {
                        return Ok(new {
                            TaiKhoanID = taiKhoan.TaiKhoanID,
                            Email = taiKhoan.Email,
                            VaiTro = taiKhoan.VaiTro,
                            HocVienID = hocVien.HocVienID,
                            HoTen = hocVien.HoTen,
                            NgaySinh = hocVien.NgaySinh,
                            SDT = hocVien.SDT,
                            TaiKhoanVi = hocVien.TaiKhoanVi
                        });
                    }
                }

                // Trả về thông tin cơ bản cho các vai trò khác
                return Ok(new {
                    TaiKhoanID = taiKhoan.TaiKhoanID,
                    Email = taiKhoan.Email,
                    VaiTro = taiKhoan.VaiTro
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đăng nhập");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        // Chỉ đăng ký tài khoản học viên
        [HttpPost("register/hocvien")]
        public async Task<ActionResult> RegisterHocVien([FromBody] RegisterHocVienModel model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Kiểm tra cơ bản
                if (string.IsNullOrWhiteSpace(model.Password) || string.IsNullOrWhiteSpace(model.Email))
                {
                    return BadRequest("Thiếu thông tin bắt buộc: password, email");
                }

                // Nếu không có username, mặc định dùng email làm tên đăng nhập
                var normalizedUsername = string.IsNullOrWhiteSpace(model.Username) ? model.Email : model.Username;

                // Không cho phép đăng ký vai trò khác
                var requestedRole = model.VaiTro?.Trim();
                if (!string.IsNullOrEmpty(requestedRole) && !string.Equals(requestedRole, "HocVien", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest("Chỉ cho phép đăng ký tài khoản học viên");
                }

                // Kiểm tra trùng tên đăng nhập và email
                var existingByUsername = await _taiKhoanRepository.GetByUsernameAsync(normalizedUsername);
                if (existingByUsername != null)
                {
                    return BadRequest("Tên đăng nhập đã tồn tại");
                }

                var existingAccountEmail = await _taiKhoanRepository.FindAsync(x => x.Email == model.Email);
                if (existingAccountEmail != null && existingAccountEmail.Count > 0)
                {
                    return BadRequest("Email tài khoản đã tồn tại");
                }

                var existingStudentEmail = await _hocVienRepository.GetByEmailAsync(model.Email);
                if (existingStudentEmail != null)
                {
                    return BadRequest("Email học viên đã tồn tại");
                }

                // Tạo tài khoản học viên
                var taiKhoan = new TaiKhoan
                {
                    MatKhau = model.Password,
                    Email = model.Email,
                    VaiTro = "HocVien"
                };

                var createdTaiKhoan = await _taiKhoanRepository.AddAsync(taiKhoan);

                // Tạo hồ sơ học viên gắn với tài khoản
                var hocVien = new HocVien
                {
                    HoTen = model.HoTen,
                    NgaySinh = model.NgaySinh == default ? DateTime.Now.AddYears(-18) : model.NgaySinh,
                    Email = model.Email,
                    SDT = model.SoDienThoai,
                    TaiKhoanID = createdTaiKhoan.TaiKhoanID
                };

                var createdHocVien = await _hocVienRepository.AddAsync(hocVien);

                await transaction.CommitAsync();

                return Created($"api/TaiKhoan/{createdTaiKhoan.TaiKhoanID}", new
                {
                    taiKhoan = new
                    {
                        createdTaiKhoan.TaiKhoanID,
                        createdTaiKhoan.Email,
                        createdTaiKhoan.VaiTro
                    },
                    hocVien = new
                    {
                        createdHocVien.HocVienID,
                        createdHocVien.HoTen,
                        createdHocVien.Email
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi đăng ký tài khoản học viên");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TaiKhoan>> CreateTaiKhoan([FromBody] TaiKhoan taiKhoan)
        {
            try
            {
                var existingTaiKhoan = await _taiKhoanRepository.GetByUsernameAsync(taiKhoan.Email);
                if (existingTaiKhoan != null)
                {
                    return BadRequest("Email đã tồn tại");
                }

                var createdTaiKhoan = await _taiKhoanRepository.AddAsync(taiKhoan);
                return CreatedAtAction(nameof(GetTaiKhoanById), new { id = createdTaiKhoan.TaiKhoanID }, createdTaiKhoan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo tài khoản mới");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateTaiKhoan(int id, [FromBody] TaiKhoan taiKhoan)
        {
            try
            {
                if (id != taiKhoan.TaiKhoanID)
                {
                    return BadRequest("ID không khớp");
                }

                var existingTaiKhoan = await _taiKhoanRepository.GetByIdAsync(id);
                if (existingTaiKhoan == null)
                {
                    return NotFound($"Không tìm thấy tài khoản với ID: {id}");
                }

                await _taiKhoanRepository.UpdateAsync(taiKhoan);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi cập nhật tài khoản với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTaiKhoan(int id)
        {
            try
            {
                var taiKhoan = await _taiKhoanRepository.GetByIdAsync(id);
                if (taiKhoan == null)
                {
                    return NotFound($"Không tìm thấy tài khoản với ID: {id}");
                }

                await _taiKhoanRepository.DeleteAsync(taiKhoan);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi xóa tài khoản với ID: {id}");
                return StatusCode(500, "Đã xảy ra lỗi khi xử lý yêu cầu");
            }
        }

        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordWithUserRequest request)
        {
            try
            {
                // Validate input
                if (request == null)
                {
                    return BadRequest("Dữ liệu đầu vào không hợp lệ");
                }

                if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest("Mật khẩu hiện tại và mật khẩu mới không được để trống");
                }

                if (request.UserInfo == null)
                {
                    return BadRequest("Thông tin người dùng không được để trống");
                }

                if (string.IsNullOrEmpty(request.UserInfo.Email))
                {
                    return BadRequest("Email người dùng không được để trống");
                }

                _logger.LogInformation("Đang đổi mật khẩu cho user: {Email}, Role: {Role}", request.UserInfo.Email, request.UserInfo.VaiTro);

                // Tìm tài khoản theo email
                var taiKhoan = await _taiKhoanRepository.FindAsync(x => x.Email == request.UserInfo.Email);
                var account = taiKhoan?.FirstOrDefault();

                if (account == null)
                {
                    _logger.LogWarning("Không tìm thấy tài khoản với email: {Email}", request.UserInfo.Email);
                    return NotFound("Không tìm thấy tài khoản với email được cung cấp");
                }

                _logger.LogInformation("Tìm thấy tài khoản: ID={TaiKhoanID}, Email={Email}", account.TaiKhoanID, account.Email);

                // Kiểm tra mật khẩu hiện tại
                if (!string.Equals(account.MatKhau, request.CurrentPassword))
                {
                    _logger.LogWarning("Mật khẩu hiện tại không đúng cho tài khoản: {Email}", request.UserInfo.Email);
                    return BadRequest("Mật khẩu hiện tại không đúng");
                }

                // Cập nhật mật khẩu mới
                account.MatKhau = request.NewPassword;
                await _taiKhoanRepository.UpdateAsync(account);

                _logger.LogInformation("Đổi mật khẩu thành công cho tài khoản: {Email}", request.UserInfo.Email);

                return Ok(new { message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đổi mật khẩu");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xử lý yêu cầu", error = ex.Message });
            }
        }
    }

    public class LoginModel
    {
        public string Email { get; set; } // ưu tiên email
        public string Username { get; set; } // tương thích ngược
        public string Password { get; set; }
    }

    public class RegisterHocVienModel
    {
        public string Username { get; set; } // optional
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string VaiTro { get; set; } // optional, will be forced to HocVien
        public string HoTen { get; set; } = string.Empty;
        public string GioiTinh { get; set; } = string.Empty;
        public DateTime NgaySinh { get; set; }
        public string DiaChi { get; set; } = string.Empty;
        public string SoDienThoai { get; set; } = string.Empty;
        public string GhiChu { get; set; } = string.Empty; // Không bắt buộc
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordWithUserRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public UserInfo? UserInfo { get; set; }
    }

    public class UserInfo
    {
        public int TaiKhoanID { get; set; }
        public string Email { get; set; } = string.Empty;
        public string VaiTro { get; set; } = string.Empty;
        public int? GiangVienID { get; set; }
        public string? HoTen { get; set; }
        public string? ChuyenMon { get; set; }
    }
}
