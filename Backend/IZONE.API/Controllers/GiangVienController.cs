using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using IZONE.Core.Models;
using IZONE.Core.Interfaces;
using IZONE.Infrastructure.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Globalization;


namespace IZONE.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GiangVienController : ControllerBase
    {
        private readonly IGiangVienRepository _giangVienRepository;
        private readonly ILopHocRepository _lopHocRepository;
        private readonly IHocVienRepository _hocVienRepository;
        private readonly IDiemDanhRepository _diemDanhRepository;
        private readonly IDiemSoRepository _diemSoRepository;
        private readonly IBuoiHocRepository _buoiHocRepository;
        private readonly IZONEDbContext _context;
        private readonly ILogger<GiangVienController> _logger;

        public GiangVienController(
            IGiangVienRepository giangVienRepository,
            ILopHocRepository lopHocRepository,
            IHocVienRepository hocVienRepository,
            IDiemDanhRepository diemDanhRepository,
            IDiemSoRepository diemSoRepository,
            IBuoiHocRepository buoiHocRepository,
            IZONEDbContext context,
            ILogger<GiangVienController> logger)
        {
            _giangVienRepository = giangVienRepository;
            _lopHocRepository = lopHocRepository;
            _hocVienRepository = hocVienRepository;
            _diemDanhRepository = diemDanhRepository;
            _diemSoRepository = diemSoRepository;
            _buoiHocRepository = buoiHocRepository;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả giảng viên (cho admin)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllGiangVien()
        {
            try
            {
                var giangViens = await _giangVienRepository.GetAllWithEmailAsync();

                return Ok(giangViens);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy giảng viên theo ID (cho admin)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetGiangVienById(int id)
        {
            try
            {
                var giangVien = await _giangVienRepository.GetByIdAsync(id);
                if (giangVien == null)
                {
                    return NotFound($"Không tìm thấy giảng viên với ID: {id}");
                }

                var result = new
                {
                    giangVienID = giangVien.GiangVienID,
                    hoTen = giangVien.HoTen,
                    chuyenMon = giangVien.ChuyenMon,
                    taiKhoanID = giangVien.TaiKhoanID,
                    email = giangVien.TaiKhoan?.Email
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        private int GetCurrentGiangVienId()
        {
            var userIdClaim = User.FindFirst("GiangVienID") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int giangVienId))
            {
                throw new UnauthorizedAccessException("Không thể xác định giảng viên hiện tại");
            }
            return giangVienId;
        }

        // ====== START: Thêm API Dashboard Giảng Viên ======

[HttpGet("dashboard/today")]
[Authorize]
public async Task<IActionResult> GetTodaySessions()
{
    try
    {
        var giangVienId = GetCurrentGiangVienId();
        var today = DateTime.Today;

        var buoiHocs = await _context.BuoiHocs
            .Include(b => b.LopHoc).ThenInclude(l => l.KhoaHoc)
            .Include(b => b.LopHoc).ThenInclude(l => l.DiaDiem)
            .Where(b => b.LopHoc.GiangVienID == giangVienId && b.NgayHoc.Date == today)
            .Select(b => new
            {
                b.BuoiHocID,
                b.NgayHoc,
                b.ThoiGianBatDau,
                b.ThoiGianKetThuc,
                b.TrangThai,
                LopID = b.LopHoc.LopID,
                TenKhoaHoc = b.LopHoc.KhoaHoc.TenKhoaHoc,
                DiaDiem = b.LopHoc.DiaDiem.TenCoSo
            })
            .ToListAsync();

        return Ok(new { date = today, sessions = buoiHocs });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
    }
}

[HttpGet("dashboard/attendance-weekly")]
[Authorize]
public async Task<IActionResult> GetWeeklyAttendance([FromQuery] int weeks = 12)
{
    try
    {
        var giangVienId = GetCurrentGiangVienId();
        var endDate = DateTime.Today;
        var startDate = endDate.AddDays(-7 * weeks + 1);

        var attendanceList = await _context.DiemDanhs
            .Include(dd => dd.BuoiHoc).ThenInclude(b => b.LopHoc)
            .Where(dd => dd.BuoiHoc.LopHoc.GiangVienID == giangVienId
                      && dd.BuoiHoc.NgayHoc >= startDate
                      && dd.BuoiHoc.NgayHoc <= endDate)
            .Select(dd => new { dd.CoMat, dd.BuoiHoc.NgayHoc })
            .ToListAsync();

        var cal = CultureInfo.InvariantCulture.Calendar;
        var grouped = attendanceList
            .GroupBy(a => cal.GetWeekOfYear(a.NgayHoc, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday))
            .Select(g => new
            {
                Week = g.Key,
                AttendanceRate = g.Count(x => x.CoMat) * 100m / g.Count()
            })
            .OrderBy(x => x.Week)
            .ToList();

        return Ok(grouped);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
    }
}

[HttpGet("dashboard/pending-tasks")]
[Authorize]
public async Task<IActionResult> GetPendingTasks()
{
    try
    {
        var giangVienId = GetCurrentGiangVienId();
        var today = DateTime.Today;

        // Tìm những buổi học đã qua mà chưa có điểm danh (tức là chưa được thực hiện)
        var overdueSessions = await _context.BuoiHocs
            .Include(b => b.LopHoc)
            .ThenInclude(l => l.KhoaHoc)
            .Where(b => b.LopHoc.GiangVienID == giangVienId
                     && b.NgayHoc < today
                     && !_context.DiemDanhs.Any(dd => dd.BuoiHocID == b.BuoiHocID)) // Chưa có điểm danh nào
            .Select(b => new
            {
                b.BuoiHocID,
                ngayHoc = b.NgayHoc.ToString("yyyy-MM-dd"), // Format ngày cho JS
                tenLop = $"Lớp {b.LopHoc.LopID}",
                lopID = b.LopHoc.LopID,
                tenKhoaHoc = b.LopHoc.KhoaHoc.TenKhoaHoc
            })
            .ToListAsync();

        // Get completed classes first
        var completedClassIds = await _context.LopHocs
            .Where(l => l.GiangVienID == giangVienId && l.TrangThai == "DangDienRa")
            .Select(l => l.LopID)
            .ToListAsync();

        // Calculate final grade stats for each class
        var classesMissingFinal = new List<dynamic>();
        foreach (var classId in completedClassIds)
        {
            var enrolledStudents = await _context.DangKyLops
                .Where(dk => dk.LopID == classId)
                .Select(dk => dk.HocVienID)
                .ToListAsync();

            var studentsWithFinalGrade = await _context.DiemSos
                .CountAsync(ds => ds.LopID == classId && enrolledStudents.Contains(ds.HocVienID) && ds.LoaiDiem == "CuoiKy");

            var totalEnrolled = enrolledStudents.Count;
            var missingCount = totalEnrolled - studentsWithFinalGrade;

            if (missingCount > 0)
            {
                var classInfo = await _context.LopHocs
                    .Where(l => l.LopID == classId)
                    .Select(l => new {
                        l.LopID,
                        TenLop = $"Lớp {l.LopID}",
                        TenKhoaHoc = l.KhoaHoc.TenKhoaHoc
                    })
                    .FirstAsync();

                classesMissingFinal.Add(new
                {
                    LopID = classInfo.LopID,
                    TenLop = classInfo.TenLop,
                    TenKhoaHoc = classInfo.TenKhoaHoc,
                    SoDangKy = totalEnrolled,
                    SoDiemDaNhap = studentsWithFinalGrade,
                    MissingCount = missingCount
                });
            }
        }

        return Ok(new { overdueSessions, classesMissingFinal });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
    }
}
// ====== END: Thêm API Dashboard Giảng Viên ======


        /// <summary>
        /// Lấy thông tin dashboard giáo viên
        /// </summary>
        [HttpGet("dashboard")]
        [Authorize]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var giangVienId = GetCurrentGiangVienId();

                // Lấy danh sách lớp học đang dạy
                var lopHocs = await _lopHocRepository.GetByGiangVienIdAsync(giangVienId);

                // Lấy các buổi học sắp tới (trong 7 ngày tới)
                var upcomingSessions = new List<BuoiHoc>();
                foreach (var lop in lopHocs)
                {
                    var sessions = await _buoiHocRepository.GetUpcomingSessionsByLopIdAsync(lop.LopID, 7);
                    upcomingSessions.AddRange(sessions);
                }

                // Thống kê tổng quan
                var dashboard = new
                {
                    TotalClasses = lopHocs.Count,
                    UpcomingSessionsCount = upcomingSessions.Count,
                    ActiveClasses = lopHocs.Count(l => l.TrangThai == "DangDienRa"),
                    LopHocs = lopHocs.Select(l => new
                    {
                        l.LopID,
                        l.KhoaHoc.TenKhoaHoc,
                        l.NgayBatDau,
                        l.NgayKetThuc,
                        l.TrangThai,
                        SoHocVien = l.DangKyLops?.Count ?? 0
                    }),
                    UpcomingSessions = upcomingSessions.Select(s => new
                    {
                        s.BuoiHocID,
                        s.NgayHoc,
                        s.ThoiGianBatDau,
                        s.ThoiGianKetThuc,
                        s.TrangThai,
                        LopHocInfo = new
                        {
                            s.LopHoc.LopID,
                            s.LopHoc.KhoaHoc.TenKhoaHoc
                        }
                    })
                };

                return Ok(dashboard);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách lớp học của giáo viên
        /// </summary>
        [HttpGet("lop-hoc")]
        [Authorize]
        public async Task<IActionResult> GetLopHocs()
        {
            try
            {
                var giangVienId = GetCurrentGiangVienId();
                var lopHocs = await _lopHocRepository.GetByGiangVienIdAsync(giangVienId);

                var result = lopHocs.Select(l => new
                {
                    l.LopID,
                    l.KhoaHoc.TenKhoaHoc,
                    l.NgayBatDau,
                    l.NgayKetThuc,
                    l.CaHoc,
                    l.NgayHocTrongTuan,
                    l.TrangThai,
                    l.DiaDiem.TenCoSo,
                    SoHocVien = l.DangKyLops?.Count ?? 0,
                    SoBuoiDaHoc = l.BuoiHocs?.Count(b => b.TrangThai == "DaDienRa") ?? 0,
                    SoBuoiConLai = l.BuoiHocs?.Count(b => b.TrangThai == "ChuaDienRa") ?? 0
                });

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy chi tiết lớp học và học viên
        /// </summary>
        [HttpGet("lop-hoc/{lopId}")]
        [Authorize]
        public async Task<IActionResult> GetLopHocDetail(int lopId)
        {
            try
            {
                var giangVienId = GetCurrentGiangVienId();

                // Kiểm tra giáo viên có dạy lớp này không
                var lopHoc = await _lopHocRepository.GetByIdAsync(lopId);
                if (lopHoc == null || lopHoc.GiangVienID != giangVienId)
                {
                    return NotFound(new { message = "Không tìm thấy lớp học hoặc bạn không có quyền truy cập" });
                }

                // Lấy danh sách học viên trong lớp
                var hocViens = await _hocVienRepository.GetByLopIdAsync(lopId);

                var result = new
                {
                    LopHoc = new
                    {
                        lopHoc.LopID,
                        lopHoc.KhoaHoc.TenKhoaHoc,
                        lopHoc.NgayBatDau,
                        lopHoc.NgayKetThuc,
                        lopHoc.CaHoc,
                        lopHoc.NgayHocTrongTuan,
                        lopHoc.TrangThai,
                        lopHoc.DiaDiem.TenCoSo,
                        lopHoc.DonGiaBuoiDay,
                        lopHoc.ThoiLuongGio
                    },
                    HocViens = hocViens.Select(hv => new
                    {
                        hv.HocVienID,
                        hv.HoTen,
                        hv.Email,
                        hv.SDT,
                        NgayDangKy = hv.DangKyLops?.FirstOrDefault(dk => dk.LopID == lopId)?.NgayDangKy,
                        TrangThaiDangKy = hv.DangKyLops?.FirstOrDefault(dk => dk.LopID == lopId)?.TrangThaiDangKy
                    })
                };

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách buổi học của lớp
        /// </summary>
        [HttpGet("lop-hoc/{lopId}/buoi-hoc")]
        [Authorize]
        public async Task<IActionResult> GetBuoiHocs(int lopId)
        {
            try
            {
                var giangVienId = GetCurrentGiangVienId();

                // Kiểm tra giáo viên có dạy lớp này không
                var lopHoc = await _lopHocRepository.GetByIdAsync(lopId);
                if (lopHoc == null || lopHoc.GiangVienID != giangVienId)
                {
                    return NotFound(new { message = "Không tìm thấy lớp học hoặc bạn không có quyền truy cập" });
                }

                var buoiHocs = await _buoiHocRepository.GetByLopIdAsync(lopId);

                var result = buoiHocs.Select(bh => new
                {
                    bh.BuoiHocID,
                    bh.NgayHoc,
                    bh.ThoiGianBatDau,
                    bh.ThoiGianKetThuc,
                    bh.TrangThai,
                    bh.DiaDiem?.TenCoSo,
                    SoHocVienCoMat = bh.DiemDanhs?.Count(dd => dd.CoMat) ?? 0,
                    TongSoHocVien = bh.DiemDanhs?.Count ?? 0
                });

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Điểm danh học viên cho buổi học
        /// </summary>
        [HttpPost("diem-danh")]
        public async Task<IActionResult> DiemDanh([FromBody] DiemDanhRequest request)
        {
            try
            {
                var giangVienId = GetCurrentGiangVienId();

                // Kiểm tra giáo viên có dạy lớp này không
                var lopHoc = await _lopHocRepository.GetByIdAsync(request.LopID);
                if (lopHoc == null || lopHoc.GiangVienID != giangVienId)
                {
                    return Forbid("Bạn không có quyền điểm danh cho lớp này");
                }

                // Kiểm tra buổi học có tồn tại không
                var buoiHoc = await _buoiHocRepository.GetByIdAsync(request.BuoiHocID);
                if (buoiHoc == null || buoiHoc.LopID != request.LopID)
                {
                    return NotFound("Không tìm thấy buổi học");
                }

                // Cập nhật điểm danh cho từng học viên
                foreach (var diemDanh in request.DanhSachDiemDanh)
                {
                    var existingDiemDanh = await _diemDanhRepository.GetByBuoiHocAndHocVienAsync(request.BuoiHocID, diemDanh.HocVienID);

                    if (existingDiemDanh != null)
                    {
                        // Cập nhật điểm danh hiện có
                        existingDiemDanh.CoMat = diemDanh.CoMat;
                        existingDiemDanh.GhiChu = diemDanh.GhiChu;
                        await _diemDanhRepository.UpdateAsync(existingDiemDanh);
                    }
                    else
                    {
                        // Tạo mới điểm danh
                        var newDiemDanh = new DiemDanh
                        {
                            BuoiHocID = request.BuoiHocID,
                            HocVienID = diemDanh.HocVienID,
                            CoMat = diemDanh.CoMat,
                            GhiChu = diemDanh.GhiChu
                        };
                        await _diemDanhRepository.AddAsync(newDiemDanh);
                    }
                }

                return Ok(new { message = "Điểm danh thành công" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Nhập điểm số cho học viên
        /// </summary>
        [HttpPost("diem-so")]
        public async Task<IActionResult> NhapDiem([FromBody] DiemSoRequest request)
        {
            try
            {
                var giangVienId = GetCurrentGiangVienId();

                // Kiểm tra giáo viên có dạy lớp này không
                var lopHoc = await _lopHocRepository.GetByIdAsync(request.LopID);
                if (lopHoc == null || lopHoc.GiangVienID != giangVienId)
                {
                    return Forbid("Bạn không có quyền nhập điểm cho lớp này");
                }

                // Kiểm tra học viên có trong lớp không
                var hocVien = await _hocVienRepository.GetByIdAsync(request.HocVienID);
                var dangKy = hocVien?.DangKyLops?.FirstOrDefault(dk => dk.LopID == request.LopID);
                if (dangKy == null)
                {
                    return NotFound("Học viên không có trong lớp học này");
                }

                // Kiểm tra điểm số đã tồn tại chưa
                var existingDiem = await _diemSoRepository.GetByHocVienAndLopAndLoaiDiemAsync(request.HocVienID, request.LopID, request.LoaiDiem);

                if (existingDiem != null)
                {
                    // Cập nhật điểm hiện có
                    existingDiem.Diem = request.Diem;
                    existingDiem.KetQua = request.Diem >= 5.0m ? "Dat" : "Truot";
                    await _diemSoRepository.UpdateAsync(existingDiem);
                }
                else
                {
                    // Tạo mới điểm số
                    var newDiem = new DiemSo
                    {
                        HocVienID = request.HocVienID,
                        LopID = request.LopID,
                        LoaiDiem = request.LoaiDiem,
                        Diem = request.Diem,
                        KetQua = request.Diem >= 5.0m ? "Dat" : "Truot"
                    };
                    await _diemSoRepository.AddAsync(newDiem);
                }

                return Ok(new { message = "Nhập điểm thành công" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Tạo giảng viên kèm tài khoản (cho admin)
        /// </summary>
        [HttpPost("with-account")]
        public async Task<IActionResult> CreateWithAccount([FromBody] CreateGiangVienWithAccountRequest request)
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
                        VaiTro = "GiangVien"
                    };

                    await _context.TaiKhoans.AddAsync(taiKhoan);
                    await _context.SaveChangesAsync();

                    // Tạo giảng viên với TaiKhoanID
                    var giangVien = new GiangVien
                    {
                        TaiKhoanID = taiKhoan.TaiKhoanID,
                        HoTen = request.HoTen,
                        ChuyenMon = request.ChuyenMon
                    };

                    await _giangVienRepository.AddAsync(giangVien);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    var result = new
                    {
                        giangVienID = giangVien.GiangVienID,
                        hoTen = giangVien.HoTen,
                        chuyenMon = giangVien.ChuyenMon,
                        taiKhoanID = giangVien.TaiKhoanID,
                        email = taiKhoan.Email,
                        message = "Giảng viên và tài khoản đã được tạo thành công"
                    };

                    return CreatedAtAction(nameof(GetGiangVienById), new { id = giangVien.GiangVienID }, result);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Lỗi khi tạo giảng viên kèm tài khoản");
                    return StatusCode(500, new { message = "Lỗi khi tạo giảng viên kèm tài khoản", error = ex.Message });
                }
            });
        }

        /// <summary>
        /// Đề xuất thay đổi lịch học
        /// </summary>
        [HttpPost("thay-doi-lich")]
        public async Task<IActionResult> ThayDoiLich([FromBody] ThayDoiLichRequest request)
        {
            try
            {
                var giangVienId = GetCurrentGiangVienId();

                // Kiểm tra giáo viên có dạy lớp này không
                var lopHoc = await _lopHocRepository.GetByIdAsync(request.LopID);
                if (lopHoc == null || lopHoc.GiangVienID != giangVienId)
                {
                    return Forbid("Bạn không có quyền đề xuất thay đổi lịch cho lớp này");
                }

                // Tạo thông báo cho admin về đề xuất thay đổi lịch
                var thongBao = new ThongBao
                {
                    NguoiGui = $"GiangVien_{giangVienId}",
                    LoaiNguoiNhan = "ToanHeThong", // Gửi cho admin
                    NoiDung = $"Giảng viên đề xuất thay đổi lịch học cho lớp {lopHoc.KhoaHoc.TenKhoaHoc}: {request.LyDo}",
                    NgayGui = DateTime.Now
                };

                // Trong thực tế, cần tạo bảng để lưu đề xuất thay đổi lịch
                // Ở đây tạm thời tạo thông báo

                return Ok(new { message = "Đề xuất thay đổi lịch đã được gửi đến admin" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Xóa giảng viên (cho admin)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGiangVien(int id)
        {
            return await _context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    _logger.LogInformation("=== BẮT ĐẦU XÓA GIẢNG VIÊN VỚI ID: {GiangVienID} ===", id);

                    // Kiểm tra giảng viên có tồn tại không
                    var giangVien = await _giangVienRepository.GetByIdAsync(id);
                    if (giangVien == null)
                    {
                        _logger.LogWarning("Không tìm thấy giảng viên với ID: {GiangVienID}", id);
                        return NotFound(new { message = $"Không tìm thấy giảng viên với ID {id}" });
                    }

                    _logger.LogInformation("Tìm thấy giảng viên: {HoTen} - {ChuyenMon}", giangVien.HoTen, giangVien.ChuyenMon);

                    // KIỂM TRA CÁC RÀNG BUỘC TRƯỚC KHI XÓA
                    _logger.LogInformation("=== KIỂM TRA CÁC RÀNG BUỘC ===");

                    // 1. Kiểm tra LopHoc (Restrict - không thể xóa nếu đang dạy lớp)
                    var lopHocCount = await _context.LopHocs.CountAsync(l => l.GiangVienID == id);
                    _logger.LogInformation("Số lớp học đang dạy: {Count}", lopHocCount);

                    if (lopHocCount > 0)
                    {
                        var lopHocs = await _lopHocRepository.GetByGiangVienIdAsync(id);
                        _logger.LogWarning("Không thể xóa giảng viên {GiangVienID} vì đang dạy {Count} lớp học", id, lopHocs.Count());
                        return BadRequest(new
                        {
                            message = $"Không thể xóa giảng viên vì đang dạy {lopHocs.Count()} lớp học. Vui lòng chuyển lớp hoặc kết thúc các lớp học trước khi xóa.",
                            activeClasses = lopHocs.Select(l => new { l.LopID, l.KhoaHoc.TenKhoaHoc, l.TrangThai })
                        });
                    }

                    // 2. Kiểm tra BuoiHoc thông qua LopHoc (Cascade - sẽ bị xóa tự động)
                    var lopHocIds = await _context.LopHocs.Where(l => l.GiangVienID == id).Select(l => l.LopID).ToListAsync();
                    var buoiHocCount = await _context.BuoiHocs.CountAsync(b => lopHocIds.Contains(b.LopID));
                    _logger.LogInformation("Số buổi học liên quan: {Count}", buoiHocCount);

                    // 3. Kiểm tra DiemDanh liên quan đến các buổi học của giảng viên
                    var diemDanhCount = await _context.DiemDanhs.CountAsync(d => lopHocIds.Contains(d.BuoiHoc.LopID));
                    _logger.LogInformation("Số điểm danh liên quan: {Count}", diemDanhCount);

                    // 4. Kiểm tra DiemSo liên quan đến các lớp học của giảng viên (DiemSo liên kết trực tiếp với LopHoc)
                    var diemSoCount = await _context.DiemSos.CountAsync(d => lopHocIds.Contains(d.LopID));
                    _logger.LogInformation("Số điểm số liên quan: {Count}", diemSoCount);

                    // BẮT ĐẦU XÓA THEO THỨ TỰ ĐÚNG
                    _logger.LogInformation("=== BẮT ĐẦU XÓA DỮ LIỆU ===");

                    // 1. Xóa DiemDanh liên quan đến các buổi học của giảng viên
                    if (diemDanhCount > 0)
                    {
                        var deletedDiemDanh = await _context.Database.ExecuteSqlRawAsync(
                            "DELETE dd FROM DiemDanh dd INNER JOIN BuoiHoc bh ON dd.BuoiHocID = bh.BuoiHocID INNER JOIN LopHoc lh ON bh.LopID = lh.LopID WHERE lh.GiangVienID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} điểm danh liên quan", deletedDiemDanh);
                    }

                    // 2. Xóa DiemSo liên quan đến các lớp học của giảng viên (DiemSo liên kết trực tiếp với LopHoc)
                    if (diemSoCount > 0)
                    {
                        var deletedDiemSo = await _context.Database.ExecuteSqlRawAsync(
                            "DELETE ds FROM DiemSo ds INNER JOIN LopHoc lh ON ds.LopID = lh.LopID WHERE lh.GiangVienID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} điểm số liên quan", deletedDiemSo);
                    }

                    // 3. Xóa BuoiHoc thông qua LopHoc (BuoiHoc không có GiangVienID trực tiếp)
                    if (buoiHocCount > 0)
                    {
                        var deletedBuoiHoc = await _context.Database.ExecuteSqlRawAsync(
                            "DELETE bh FROM BuoiHoc bh INNER JOIN LopHoc lh ON bh.LopID = lh.LopID WHERE lh.GiangVienID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} buổi học", deletedBuoiHoc);
                    }

                    // 4. Nếu giảng viên có tài khoản liên kết, xóa tài khoản
                    if (giangVien.TaiKhoanID.HasValue)
                    {
                        var taiKhoan = await _context.TaiKhoans.FindAsync(giangVien.TaiKhoanID.Value);
                        if (taiKhoan != null)
                        {
                            _logger.LogInformation("Đang xóa tài khoản liên kết với ID: {TaiKhoanID}", taiKhoan.TaiKhoanID);
                            _context.TaiKhoans.Remove(taiKhoan);
                            _logger.LogInformation("Đã xóa tài khoản liên kết");
                        }
                    }

                    // 5. Cuối cùng, xóa giảng viên
                    _logger.LogInformation("Đang xóa giảng viên với ID: {GiangVienID}", id);
                    await _giangVienRepository.DeleteAsync(giangVien);

                    // Commit transaction
                    await transaction.CommitAsync();

                    _logger.LogInformation("=== GIẢNG VIÊN ĐÃ ĐƯỢC XÓA THÀNH CÔNG ===");
                    _logger.LogInformation("GiangVienID: {GiangVienID}, HoTen: {HoTen}, ChuyenMon: {ChuyenMon}",
                        id, giangVien.HoTen, giangVien.ChuyenMon);

                    return Ok(new
                    {
                        message = "Giảng viên và tài khoản đã được xóa thành công",
                        giangVienID = id,
                        hoTen = giangVien.HoTen,
                        chuyenMon = giangVien.ChuyenMon,
                        taiKhoanID = giangVien.TaiKhoanID,
                        deletedRecords = new
                        {
                            lopHoc = lopHocCount,
                            buoiHoc = buoiHocCount,
                            diemDanh = diemDanhCount,
                            diemSo = diemSoCount
                        }
                    });
                }
                catch (DbUpdateException dbEx)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(dbEx, "Lỗi database khi xóa giảng viên với ID: {GiangVienID}", id);

                    // Kiểm tra lỗi constraint cụ thể
                    if (dbEx.InnerException?.Message.Contains("FOREIGN KEY") == true)
                    {
                        return BadRequest(new
                        {
                            message = "Không thể xóa giảng viên vì vẫn còn dữ liệu liên quan chưa được xử lý.",
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
                        message = "Lỗi khi xóa giảng viên khỏi database",
                        error = dbEx.InnerException?.Message
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Lỗi không xác định khi xóa giảng viên với ID: {GiangVienID}", id);
                    return StatusCode(500, new
                    {
                        message = "Lỗi server nội bộ khi xóa giảng viên",
                        error = ex.Message,
                        stackTrace = ex.StackTrace
                    });
                }
            });
        }

        /// <summary>
        /// Tạo giảng viên mới (cho admin)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateGiangVien([FromBody] GiangVien giangVien)
        {
            try
            {
                var createdGiangVien = await _giangVienRepository.AddAsync(giangVien);
                return CreatedAtAction(nameof(GetGiangVienById), new { id = createdGiangVien.GiangVienID }, createdGiangVien);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo giảng viên mới");
                return StatusCode(500, new { message = "Lỗi khi tạo giảng viên mới", error = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật giảng viên (cho admin)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGiangVien(int id, [FromBody] GiangVien giangVien)
        {
            try
            {
                if (id != giangVien.GiangVienID)
                {
                    return BadRequest("ID không khớp");
                }

                var existingGiangVien = await _giangVienRepository.GetByIdAsync(id);
                if (existingGiangVien == null)
                {
                    return NotFound($"Không tìm thấy giảng viên với ID: {id}");
                }

                // Kiểm tra TaiKhoanID có tồn tại không (nếu có)
                if (giangVien.TaiKhoanID.HasValue && giangVien.TaiKhoanID.Value > 0)
                {
                    var taiKhoan = await _context.TaiKhoans.FindAsync(giangVien.TaiKhoanID.Value);
                    if (taiKhoan == null)
                    {
                        return BadRequest($"Không tìm thấy tài khoản với ID: {giangVien.TaiKhoanID.Value}");
                    }
                }

                await _giangVienRepository.UpdateAsync(giangVien);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi cập nhật giảng viên với ID: {id}");
                return StatusCode(500, new { message = "Lỗi khi cập nhật giảng viên", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy giảng viên theo email (cho admin)
        /// </summary>
        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetGiangVienByEmail(string email)
        {
            try
            {
                var giangVien = await _giangVienRepository.GetByEmailAsync(email);
                if (giangVien == null)
                {
                    return NotFound($"Không tìm thấy giảng viên với email: {email}");
                }

                var result = new
                {
                    giangVienID = giangVien.GiangVienID,
                    hoTen = giangVien.HoTen,
                    chuyenMon = giangVien.ChuyenMon,
                    taiKhoanID = giangVien.TaiKhoanID,
                    email = giangVien.TaiKhoan?.Email
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy giảng viên theo chuyên môn (cho admin)
        /// </summary>
        [HttpGet("chuyenmon/{chuyenMon}")]
        public async Task<IActionResult> GetGiangViensByChuyenMon(string chuyenMon)
        {
            try
            {
                var giangViens = await _giangVienRepository.GetGiangViensByChuyenMonAsync(chuyenMon);

                var result = giangViens.Select(gv => new
                {
                    giangVienID = gv.GiangVienID,
                    hoTen = gv.HoTen,
                    chuyenMon = gv.ChuyenMon,
                    taiKhoanID = gv.TaiKhoanID,
                    email = gv.TaiKhoan?.Email
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách lớp học của giảng viên (cho admin)
        /// </summary>
        [HttpGet("{id}/lophoc")]
        public async Task<IActionResult> GetLopHocsByGiangVien(int id)
        {
            try
            {
                var giangVien = await _giangVienRepository.GetByIdAsync(id);
                if (giangVien == null)
                {
                    return NotFound($"Không tìm thấy giảng viên với ID: {id}");
                }

                var lopHocs = await _giangVienRepository.GetLopHocsByGiangVienAsync(id);

                var result = lopHocs.Select(l => new
                {
                    l.LopID,
                    l.KhoaHoc.TenKhoaHoc,
                    l.NgayBatDau,
                    l.NgayKetThuc,
                    l.TrangThai,
                    SoHocVien = l.DangKyLops?.Count ?? 0
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
            }
        }
    }

    // DTOs cho các request
    public class DiemDanhRequest
    {
        public int LopID { get; set; }
        public int BuoiHocID { get; set; }
        public List<DiemDanhItem> DanhSachDiemDanh { get; set; } = new();
    }

    public class DiemDanhItem
    {
        public int HocVienID { get; set; }
        public bool CoMat { get; set; }
        public string? GhiChu { get; set; }
    }

    public class DiemSoRequest
    {
        public int LopID { get; set; }
        public int HocVienID { get; set; }
        public string LoaiDiem { get; set; } = string.Empty;
        public decimal Diem { get; set; }
    }

    public class ThayDoiLichRequest
    {
        public int LopID { get; set; }
        public string LyDo { get; set; } = string.Empty;
        public string? ThayDoiMoi { get; set; }
    }

    public class CreateGiangVienWithAccountRequest
    {
        public string Email { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string ChuyenMon { get; set; } = string.Empty;
    }
}
