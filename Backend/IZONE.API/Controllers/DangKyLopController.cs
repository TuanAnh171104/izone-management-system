using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DangKyLopController : ControllerBase
    {
        private readonly IDangKyLopRepository _dangKyLopRepository;
        private readonly IZONEDbContext _context;

        public DangKyLopController(IDangKyLopRepository dangKyLopRepository, IZONEDbContext context)
        {
            _dangKyLopRepository = dangKyLopRepository;
            _context = context;
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
            try
            {
                var dangKyLops = await _dangKyLopRepository.GetByLopIdAsync(lopId);
                return Ok(dangKyLops);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
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

        [HttpPost("continue-learning")]
        public async Task<IActionResult> ContinueLearning([FromBody] ContinueLearningRequest request)
        {
            // 1. Validate request (outside execution strategy)
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.OriginalDangKyID <= 0 || request.NewLopID <= 0 || request.HocVienID <= 0)
            {
                return BadRequest("All IDs must be positive numbers");
            }

            // 2. Check if student exists (outside execution strategy)
            var student = await _context.HocViens.FindAsync(request.HocVienID);
            if (student == null)
            {
                return NotFound($"Student with ID {request.HocVienID} not found");
            }

            // 3. Check if new class exists (outside execution strategy)
            var newClass = await _context.LopHocs.FindAsync(request.NewLopID);
            if (newClass == null)
            {
                return NotFound($"Class with ID {request.NewLopID} not found");
            }

            // 4. Find active reservation (outside execution strategy)
            var activeBaoLuu = await _context.BaoLuus
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.LopHoc)
                .ThenInclude(l => l.KhoaHoc)
                .FirstOrDefaultAsync(bl =>
                    bl.DangKyID == request.OriginalDangKyID &&
                    bl.TrangThai == "DaDuyet" && // Đã được duyệt
                    bl.TrangThai != "DaSuDung" && // Chưa được sử dụng
                    bl.HanBaoLuu > DateTime.Now); // Còn hạn

            if (activeBaoLuu == null)
            {
                return BadRequest("No valid reservation found, reservation has expired, or reservation has already been used");
            }

            // 5. Validate same course (outside execution strategy)
            var originalClass = activeBaoLuu.DangKyLop?.LopHoc;
            if (originalClass?.KhoaHoc == null || newClass.KhoaHoc == null)
            {
                return BadRequest("Course information not found");
            }

            if (originalClass.KhoaHocID != newClass.KhoaHocID)
            {
                return BadRequest("New class must be in the same course as the reserved class");
            }

            // 6. Check class capacity (outside execution strategy)
            var registeredCount = await _context.DangKyLops
                .CountAsync(dk => dk.LopID == request.NewLopID && dk.TrangThaiDangKy == "DangHoc");

            if (newClass.SoLuongToiDa.HasValue && registeredCount >= newClass.SoLuongToiDa.Value)
            {
                return BadRequest("Class is full, cannot register");
            }

            // 7. Check if student already registered for this class (outside execution strategy)
            var existingRegistration = await _context.DangKyLops
                .FirstOrDefaultAsync(dk => dk.HocVienID == request.HocVienID && dk.LopID == request.NewLopID);

            if (existingRegistration != null)
            {
                return BadRequest("Student is already registered for this class");
            }

            // Sử dụng execution strategy chỉ cho database operations cần transaction
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 8. Create new registration (inside execution strategy)
                    var newDangKyLop = new DangKyLop
                    {
                        HocVienID = request.HocVienID,
                        LopID = request.NewLopID,
                        NgayDangKy = DateTime.Now,
                        TrangThaiDangKy = "DangHoc",
                        TrangThaiThanhToan = "DaThanhToan" // Free registration
                    };

                    await _context.DangKyLops.AddAsync(newDangKyLop);

                    // 9. Update reservation status (inside execution strategy)
                    activeBaoLuu.TrangThai = "DaSuDung";
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetById), new { id = newDangKyLop.DangKyID }, new
                    {
                        dangKyID = newDangKyLop.DangKyID,
                        hocVienID = newDangKyLop.HocVienID,
                        lopID = newDangKyLop.LopID,
                        ngayDangKy = newDangKyLop.NgayDangKy,
                        trangThaiDangKy = newDangKyLop.TrangThaiDangKy,
                        trangThaiThanhToan = newDangKyLop.TrangThaiThanhToan,
                        message = "Successfully continued learning! Registration is free."
                    });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw; // Re-throw để execution strategy handle retry
                }
            });
        }

        // GET: api/DangKyLop/{dangKyId}/eligibility-to-retake
        [HttpGet("{dangKyId}/eligibility-to-retake")]
        public async Task<IActionResult> CheckEligibilityToRetake(int dangKyId)
        {
            try
            {
                // 1. Lấy thông tin đăng ký
                var dangKy = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .ThenInclude(l => l.KhoaHoc)
                    .Include(dk => dk.HocVien)
                    .FirstOrDefaultAsync(dk => dk.DangKyID == dangKyId);

                if (dangKy == null)
                {
                    return NotFound($"Registration with ID {dangKyId} not found");
                }

                // 2. Kiểm tra lớp đã kết thúc chưa
                if (dangKy.LopHoc?.TrangThai != "DaKetThuc")
                {
                    return BadRequest("Class has not ended yet. Cannot retake unfinished class.");
                }

                // **THÊM KIỂM TRA: Học viên đã học lại từ lớp gốc này chưa**
                // Tìm các đăng ký miễn phí khác cùng khóa học được tạo sau ngày kết thúc lớp gốc
                var existingRetakes = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .Where(dk => dk.HocVienID == dangKy.HocVienID
                             && dk.LopHoc.KhoaHocID == dangKy.LopHoc.KhoaHocID
                             && dk.DangKyID != dangKyId  // Không tính chính nó
                             && dk.NgayDangKy > dangKy.LopHoc.NgayKetThuc  // Tạo sau khi kết thúc
                             && !dk.ThanhToans.Any()) // Không có bản ghi thanh toán = miễn phí
                    .ToListAsync();

                // Nếu đã có đăng ký học lại miễn phí đang hoạt động, không cho học lại tiếp
                var hasActiveRetake = existingRetakes
                    .Any(dk => dk.TrangThaiDangKy == "DangHoc" || dk.TrangThaiDangKy == "DaBaoLuu");

                if (hasActiveRetake)
                {
                    return Ok(new
                    {
                        dangKyID = dangKy.DangKyID,
                        lopID = dangKy.LopID,
                        hocVienID = dangKy.HocVienID,
                        tenLop = dangKy.LopHoc?.KhoaHoc?.TenKhoaHoc ?? "Unknown",
                        ngayKetThuc = dangKy.LopHoc?.NgayKetThuc?.ToString("yyyy-MM-dd"),

                        // Kết quả học tập
                        canRetake = false,
                        reason = "Đã thực hiện học lại từ lớp này. Không thể học lại tiếp.",

                        // Thông tin bổ sung
                        hasActiveRetake = true,
                        totalRetakes = existingRetakes.Count
                    });
                }

                // 3. Tính điểm trung bình theo công thức (giữa kỳ + cuối kỳ*2)/3
                var diemSoList = await _context.DiemSos
                    .Where(ds => ds.HocVienID == dangKy.HocVienID && ds.LopID == dangKy.LopID)
                    .ToListAsync();

                double diemTrungBinh = 0;
                var diemGiuaKy = diemSoList.FirstOrDefault(ds => ds.LoaiDiem.ToLower() == "giuaky" || ds.LoaiDiem.ToLower() == "giua ky");
                var diemCuoiKy = diemSoList.FirstOrDefault(ds => ds.LoaiDiem.ToLower() == "cuoiky" || ds.LoaiDiem.ToLower() == "cuoi ky");

                if (diemGiuaKy != null && diemCuoiKy != null)
                {
                    diemTrungBinh = (double)(diemGiuaKy.Diem + diemCuoiKy.Diem * 2) / 3.0;
                }
                else if (diemSoList.Any())
                {
                    // Nếu không có giữa kỳ và cuối kỳ, tính trung bình tất cả điểm
                    diemTrungBinh = (double)diemSoList.Average(ds => ds.Diem);
                }

                bool isDat = diemTrungBinh > 5.5;

                // 4. Tính tỷ lệ chuyên cần
                var totalSessions = await _context.BuoiHocs.CountAsync(bh => bh.LopID == dangKy.LopID);
                var attendedSessions = await _context.DiemDanhs.CountAsync(dd =>
                    dd.HocVienID == dangKy.HocVienID &&
                    dd.BuoiHoc.LopID == dangKy.LopID &&
                    dd.CoMat);

                double attendanceRate = totalSessions > 0 ? (attendedSessions * 100.0 / totalSessions) : 0;
                bool isAttendanceGood = attendanceRate >= 80;

                // 5. Xác định điều kiện học lại
                bool canRetake = isDat || (!isDat && isAttendanceGood);

                var result = new
                {
                    dangKyID = dangKy.DangKyID,
                    lopID = dangKy.LopID,
                    hocVienID = dangKy.HocVienID,
                    tenLop = dangKy.LopHoc?.KhoaHoc?.TenKhoaHoc ?? "Unknown",
                    ngayKetThuc = dangKy.LopHoc?.NgayKetThuc?.ToString("yyyy-MM-dd"),

                    // Kết quả học tập
                    diemTrungBinh = Math.Round(diemTrungBinh, 2),
                    diemGiuaKy = diemGiuaKy?.Diem,
                    diemCuoiKy = diemCuoiKy?.Diem,
                    isDat = isDat,
                    ketQua = isDat ? "Đạt" : "Chưa đạt",

                    // Chuyên cần
                    tongSoBuoi = totalSessions,
                    soBuoiCoMat = attendedSessions,
                    tiLeChuyenCan = Math.Round(attendanceRate, 2),
                    isAttendanceGood = isAttendanceGood,

                    // Điều kiện học lại
                    canRetake = canRetake,
                    reason = canRetake
                        ? (isDat ? "Đã đạt lớp học" : "Chuyên cần ≥ 80%")
                        : "Chưa đạt và chuyên cần < 80%",

                    // Thông tin chi tiết
                    diemSoList = diemSoList.Select(ds => new
                    {
                        loaiDiem = ds.LoaiDiem,
                        diem = ds.Diem,
                        ketQua = ds.KetQua
                    })
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error checking eligibility to retake", error = ex.Message });
            }
        }

        // GET: api/DangKyLop/{dangKyId}/available-classes-for-retake
        [HttpGet("{dangKyId}/available-classes-for-retake")]
        public async Task<IActionResult> GetAvailableClassesForRetake(int dangKyId)
        {
            try
            {
                // 1. Lấy thông tin đăng ký gốc
                var originalDangKy = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .ThenInclude(l => l.KhoaHoc)
                    .Include(dk => dk.HocVien)
                    .FirstOrDefaultAsync(dk => dk.DangKyID == dangKyId);

                if (originalDangKy == null)
                {
                    return NotFound($"Registration with ID {dangKyId} not found");
                }

                // 2. Lấy các lớp học cùng khóa học đang mở
                var availableClasses = await _context.LopHocs
                    .Include(l => l.KhoaHoc)
                    .Include(l => l.GiangVien)
                    .Include(l => l.DiaDiem)
                    .Where(l =>
                        l.KhoaHocID == originalDangKy.LopHoc.KhoaHocID &&
                        (l.TrangThai == "ChuaBatDau" || l.TrangThai == "DangDienRa") &&
                        l.NgayBatDau >= DateTime.Today)
                    .OrderBy(l => l.NgayBatDau)
                    .ToListAsync();

                // 3. Loại trừ các lớp mà học viên đã đăng ký
                var registeredClassIds = await _context.DangKyLops
                    .Where(dk => dk.HocVienID == originalDangKy.HocVienID && dk.TrangThaiDangKy == "DangHoc")
                    .Select(dk => dk.LopID)
                    .ToListAsync();

                availableClasses = availableClasses
                    .Where(l => !registeredClassIds.Contains(l.LopID))
                    .ToList();

                // 4. Tính số chỗ trống cho mỗi lớp
                var result = new List<object>();
                foreach (var lop in availableClasses)
                {
                    var registeredCount = await _context.DangKyLops
                        .CountAsync(dk => dk.LopID == lop.LopID && dk.TrangThaiDangKy == "DangHoc");

                    var availableSpots = lop.SoLuongToiDa.HasValue
                        ? lop.SoLuongToiDa.Value - registeredCount
                        : -1; // Không giới hạn

                    result.Add(new
                    {
                        lopID = lop.LopID,
                        khoaHocID = lop.KhoaHocID,
                        giangVienID = lop.GiangVienID,
                        diaDiemID = lop.DiaDiemID,
                        ngayBatDau = lop.NgayBatDau.ToString("yyyy-MM-dd"),
                        ngayKetThuc = lop.NgayKetThuc?.ToString("yyyy-MM-dd"),
                        caHoc = lop.CaHoc,
                        ngayHocTrongTuan = lop.NgayHocTrongTuan,
                        donGiaBuoiDay = lop.DonGiaBuoiDay,
                        thoiLuongGio = lop.ThoiLuongGio,
                        soLuongToiDa = lop.SoLuongToiDa,
                        trangThai = lop.TrangThai,

                        // Navigation properties
                        khoaHoc = lop.KhoaHoc != null ? new
                        {
                            khoaHocID = lop.KhoaHoc.KhoaHocID,
                            tenKhoaHoc = lop.KhoaHoc.TenKhoaHoc,
                            soBuoi = lop.KhoaHoc.SoBuoi,
                            hocPhi = lop.KhoaHoc.HocPhi,
                            donGiaTaiLieu = lop.KhoaHoc.DonGiaTaiLieu
                        } : null,

                        giangVien = lop.GiangVien != null ? new
                        {
                            giangVienID = lop.GiangVien.GiangVienID,
                            hoTen = lop.GiangVien.HoTen,
                            chuyenMon = lop.GiangVien.ChuyenMon
                        } : null,

                        diaDiem = lop.DiaDiem != null ? new
                        {
                            diaDiemID = lop.DiaDiem.DiaDiemID,
                            tenCoSo = lop.DiaDiem.TenCoSo,
                            diaChi = lop.DiaDiem.DiaChi,
                            sucChua = lop.DiaDiem.SucChua
                        } : null,

                        // Thông tin đăng ký
                        registeredCount = registeredCount,
                        availableSpots = availableSpots,
                        isFull = lop.SoLuongToiDa.HasValue && registeredCount >= lop.SoLuongToiDa.Value
                    });
                }

                return Ok(new
                {
                    originalClass = new
                    {
                        dangKyID = originalDangKy.DangKyID,
                        lopID = originalDangKy.LopID,
                        tenKhoaHoc = originalDangKy.LopHoc?.KhoaHoc?.TenKhoaHoc,
                        ngayKetThuc = originalDangKy.LopHoc?.NgayKetThuc?.ToString("yyyy-MM-dd")
                    },
                    availableClasses = result,
                    totalAvailable = result.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting available classes for retake", error = ex.Message });
            }
        }

        // POST: api/DangKyLop/retake-class
        [HttpPost("retake-class")]
        public async Task<IActionResult> RetakeClass([FromBody] ContinueLearningRequest request)
        {
            try
            {
                // 1. Validate request
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (request.OriginalDangKyID <= 0 || request.NewLopID <= 0 || request.HocVienID <= 0)
                {
                    return BadRequest("All IDs must be positive numbers");
                }

                // 2. Kiểm tra học viên tồn tại
                var student = await _context.HocViens.FindAsync(request.HocVienID);
                if (student == null)
                {
                    return NotFound($"Student with ID {request.HocVienID} not found");
                }

                // 3. Kiểm tra lớp mới tồn tại
                var newClass = await _context.LopHocs
                    .Include(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(l => l.LopID == request.NewLopID);

                if (newClass == null)
                {
                    return NotFound($"Class with ID {request.NewLopID} not found");
                }

                // 4. Lấy thông tin đăng ký gốc
                var originalDangKy = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .ThenInclude(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(dk => dk.DangKyID == request.OriginalDangKyID);

                if (originalDangKy == null)
                {
                    return NotFound($"Original registration with ID {request.OriginalDangKyID} not found");
                }

                // 5. Kiểm tra lớp đã kết thúc
                if (originalDangKy.LopHoc?.TrangThai != "DaKetThuc")
                {
                    return BadRequest("Original class has not ended yet");
                }

                // 6. Kiểm tra cùng khóa học
                if (originalDangKy.LopHoc.KhoaHocID != newClass.KhoaHocID)
                {
                    return BadRequest("New class must be in the same course as the original class");
                }

                // 7. Kiểm tra điều kiện học lại
                var eligibilityCheck = await CheckEligibilityToRetake(request.OriginalDangKyID);
                if (eligibilityCheck is not OkObjectResult okResult)
                {
                    return eligibilityCheck;
                }

                var eligibilityData = okResult.Value as dynamic;
                if (!eligibilityData?.canRetake)
                {
                    return BadRequest($"Not eligible to retake: {eligibilityData?.reason}");
                }

                // 8. Kiểm tra sức chứa lớp
                var registeredCount = await _context.DangKyLops
                    .CountAsync(dk => dk.LopID == request.NewLopID && dk.TrangThaiDangKy == "DangHoc");

                if (newClass.SoLuongToiDa.HasValue && registeredCount >= newClass.SoLuongToiDa.Value)
                {
                    return BadRequest("Class is full, cannot register");
                }

                // 9. Kiểm tra học viên chưa đăng ký lớp này
                var existingRegistration = await _context.DangKyLops
                    .FirstOrDefaultAsync(dk => dk.HocVienID == request.HocVienID && dk.LopID == request.NewLopID);

                if (existingRegistration != null)
                {
                    return BadRequest("Student is already registered for this class");
                }

                // 10. Tạo đăng ký học lại
                var strategy = _context.Database.CreateExecutionStrategy();

                return await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        var newDangKyLop = new DangKyLop
                        {
                            HocVienID = request.HocVienID,
                            LopID = request.NewLopID,
                            NgayDangKy = DateTime.Now,
                            TrangThaiDangKy = "DangHoc",
                            TrangThaiThanhToan = "DaThanhToan" // Miễn phí học lại
                        };

                        await _context.DangKyLops.AddAsync(newDangKyLop);
                        await _context.SaveChangesAsync();

                        await transaction.CommitAsync();

                        return CreatedAtAction(nameof(GetById), new { id = newDangKyLop.DangKyID }, new
                        {
                            dangKyID = newDangKyLop.DangKyID,
                            hocVienID = newDangKyLop.HocVienID,
                            lopID = newDangKyLop.LopID,
                            ngayDangKy = newDangKyLop.NgayDangKy,
                            trangThaiDangKy = newDangKyLop.TrangThaiDangKy,
                            trangThaiThanhToan = newDangKyLop.TrangThaiThanhToan,
                            message = "Successfully registered for retake! Registration is free.",
                            originalClass = new
                            {
                                lopID = originalDangKy.LopID,
                                tenKhoaHoc = originalDangKy.LopHoc?.KhoaHoc?.TenKhoaHoc
                            },
                            newClass = new
                            {
                                lopID = newClass.LopID,
                                tenKhoaHoc = newClass.KhoaHoc?.TenKhoaHoc,
                                ngayBatDau = newClass.NgayBatDau.ToString("yyyy-MM-dd")
                            }
                        });
                    }
                    catch (Exception)
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error registering for retake", error = ex.Message });
            }
        }

        // GET: api/DangKyLop/{dangKyId}/eligibility-to-change
        [HttpGet("{dangKyId}/eligibility-to-change")]
        public async Task<IActionResult> CheckEligibilityToChange(int dangKyId)
        {
            try
            {
                // 1. Lấy thông tin đăng ký
                var dangKy = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .ThenInclude(l => l.KhoaHoc)
                    .Include(dk => dk.HocVien)
                    .FirstOrDefaultAsync(dk => dk.DangKyID == dangKyId);

                if (dangKy == null)
                {
                    return NotFound($"Registration with ID {dangKyId} not found");
                }

                // 2. Kiểm tra lớp có đang diễn ra hoặc chưa bắt đầu không
                if (dangKy.LopHoc?.TrangThai != "ChuaBatDau" && dangKy.LopHoc?.TrangThai != "DangDienRa")
                {
                    return Ok(new
                    {
                        dangKyID = dangKy.DangKyID,
                        lopID = dangKy.LopID,
                        hocVienID = dangKy.HocVienID,
                        tenLop = dangKy.LopHoc?.KhoaHoc?.TenKhoaHoc ?? "Unknown",
                        trangThaiLop = dangKy.LopHoc?.TrangThai ?? "Unknown",
                        canChange = false,
                        reason = "Chỉ có thể đổi lớp chưa bắt đầu hoặc đang diễn ra",
                        sessionsAttended = 0,
                        maxSessionsAllowed = 1,
                        isFreeRegistration = false
                    });
                }

                // 3. KIỂM TRA ĐĂNG KÝ MIỄN PHÍ - KHÔNG CHO ĐỔI LỚP
                // Nếu không có bản ghi ThanhToan nào liên kết = đăng ký miễn phí
                var hasPayment = await _context.ThanhToans
                    .AnyAsync(t => t.DangKyID == dangKyId);

                if (!hasPayment)
                {
                    return Ok(new
                    {
                        dangKyID = dangKy.DangKyID,
                        lopID = dangKy.LopID,
                        hocVienID = dangKy.HocVienID,
                        tenLop = dangKy.LopHoc?.KhoaHoc?.TenKhoaHoc ?? "Unknown",
                        trangThaiLop = dangKy.LopHoc?.TrangThai ?? "Unknown",
                        canChange = false,
                        reason = "Không được phép đổi lớp từ đăng ký miễn phí (học lại/bảo lưu)",
                        sessionsAttended = 0,
                        maxSessionsAllowed = 1,
                        isFreeRegistration = true
                    });
                }

                // 4. Tính số buổi đã học (chỉ cần buổi đã diễn ra)
                var sessionsAttended = await _context.BuoiHocs
                    .CountAsync(bh => bh.LopID == dangKy.LopID
                        && bh.TrangThai == "DaDienRa"
                        && bh.NgayHoc <= DateTime.Today);

                bool canChange = sessionsAttended <= 1;

                var result = new
                {
                    dangKyID = dangKy.DangKyID,
                    lopID = dangKy.LopID,
                    hocVienID = dangKy.HocVienID,
                    tenLop = dangKy.LopHoc?.KhoaHoc?.TenKhoaHoc ?? "Unknown",
                    trangThaiLop = dangKy.LopHoc?.TrangThai ?? "Unknown",

                    // Thông tin điều kiện
                    sessionsAttended = sessionsAttended,
                    maxSessionsAllowed = 1,
                    canChange = canChange,
                    reason = canChange
                        ? "Đủ điều kiện đổi lớp"
                        : $"Đã học {sessionsAttended} buổi, chỉ được đổi khi học ≤ 1 buổi",

                    // Thông tin chi tiết
                    currentClass = new
                    {
                        lopID = dangKy.LopID,
                        tenKhoaHoc = dangKy.LopHoc?.KhoaHoc?.TenKhoaHoc,
                        hocPhi = dangKy.LopHoc?.KhoaHoc?.HocPhi,
                        ngayBatDau = dangKy.LopHoc?.NgayBatDau.ToString("yyyy-MM-dd")
                    },
                    isFreeRegistration = false
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error checking eligibility to change class", error = ex.Message });
            }
        }

        // GET: api/DangKyLop/{dangKyId}/available-classes-for-change
        [HttpGet("{dangKyId}/available-classes-for-change")]
        public async Task<IActionResult> GetAvailableClassesForChange(int dangKyId)
        {
            try
            {
                // 1. Lấy thông tin đăng ký hiện tại
                var currentDangKy = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .ThenInclude(l => l.KhoaHoc)
                    .Include(dk => dk.HocVien)
                    .FirstOrDefaultAsync(dk => dk.DangKyID == dangKyId);

                if (currentDangKy == null)
                {
                    return NotFound($"Registration with ID {dangKyId} not found");
                }

                // 2. Lấy tất cả lớp học có thể đổi (không giới hạn khóa học)
                var availableClasses = await _context.LopHocs
                    .Include(l => l.KhoaHoc)
                    .Include(l => l.GiangVien)
                    .Include(l => l.DiaDiem)
                    .Where(l =>
                        l.LopID != currentDangKy.LopID && // Loại trừ lớp hiện tại
                        (l.TrangThai == "ChuaBatDau" || l.TrangThai == "DangDienRa") &&
                        l.NgayBatDau >= DateTime.Today)
                    .OrderBy(l => l.NgayBatDau)
                    .ToListAsync();

                // 3. Loại trừ các lớp mà học viên đã đăng ký
                var registeredClassIds = await _context.DangKyLops
                    .Where(dk => dk.HocVienID == currentDangKy.HocVienID && dk.TrangThaiDangKy == "DangHoc")
                    .Select(dk => dk.LopID)
                    .ToListAsync();

                availableClasses = availableClasses
                    .Where(l => !registeredClassIds.Contains(l.LopID))
                    .ToList();

                // 4. Tính số chỗ trống cho mỗi lớp
                var result = new List<object>();
                foreach (var lop in availableClasses)
                {
                    var registeredCount = await _context.DangKyLops
                        .CountAsync(dk => dk.LopID == lop.LopID && dk.TrangThaiDangKy == "DangHoc");

                    var availableSpots = lop.SoLuongToiDa.HasValue
                        ? lop.SoLuongToiDa.Value - registeredCount
                        : -1; // Không giới hạn

                    result.Add(new
                    {
                        lopID = lop.LopID,
                        khoaHocID = lop.KhoaHocID,
                        giangVienID = lop.GiangVienID,
                        diaDiemID = lop.DiaDiemID,
                        ngayBatDau = lop.NgayBatDau.ToString("yyyy-MM-dd"),
                        ngayKetThuc = lop.NgayKetThuc?.ToString("yyyy-MM-dd"),
                        caHoc = lop.CaHoc,
                        ngayHocTrongTuan = lop.NgayHocTrongTuan,
                        donGiaBuoiDay = lop.DonGiaBuoiDay,
                        thoiLuongGio = lop.ThoiLuongGio,
                        soLuongToiDa = lop.SoLuongToiDa,
                        trangThai = lop.TrangThai,

                        // Navigation properties
                        khoaHoc = lop.KhoaHoc != null ? new
                        {
                            khoaHocID = lop.KhoaHoc.KhoaHocID,
                            tenKhoaHoc = lop.KhoaHoc.TenKhoaHoc,
                            soBuoi = lop.KhoaHoc.SoBuoi,
                            hocPhi = lop.KhoaHoc.HocPhi,
                            donGiaTaiLieu = lop.KhoaHoc.DonGiaTaiLieu
                        } : null,

                        giangVien = lop.GiangVien != null ? new
                        {
                            giangVienID = lop.GiangVien.GiangVienID,
                            hoTen = lop.GiangVien.HoTen,
                            chuyenMon = lop.GiangVien.ChuyenMon
                        } : null,

                        diaDiem = lop.DiaDiem != null ? new
                        {
                            diaDiemID = lop.DiaDiem.DiaDiemID,
                            tenCoSo = lop.DiaDiem.TenCoSo,
                            diaChi = lop.DiaDiem.DiaChi,
                            sucChua = lop.DiaDiem.SucChua
                        } : null,

                        // Thông tin đăng ký
                        registeredCount = registeredCount,
                        availableSpots = availableSpots,
                        isFull = lop.SoLuongToiDa.HasValue && registeredCount >= lop.SoLuongToiDa.Value
                    });
                }

                return Ok(new
                {
                    currentClass = new
                    {
                        dangKyID = currentDangKy.DangKyID,
                        lopID = currentDangKy.LopID,
                        tenKhoaHoc = currentDangKy.LopHoc?.KhoaHoc?.TenKhoaHoc,
                        hocPhi = currentDangKy.LopHoc?.KhoaHoc?.HocPhi,
                        ngayBatDau = currentDangKy.LopHoc?.NgayBatDau.ToString("yyyy-MM-dd")
                    },
                    availableClasses = result,
                    totalAvailable = result.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting available classes for change", error = ex.Message });
            }
        }

        // POST: api/DangKyLop/change-class
        [HttpPost("change-class")]
        public async Task<IActionResult> ChangeClass([FromBody] ContinueLearningRequest request)
        {
            try
            {
                // 1. Validate request
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (request.OriginalDangKyID <= 0 || request.NewLopID <= 0 || request.HocVienID <= 0)
                {
                    return BadRequest("All IDs must be positive numbers");
                }

                // 2. Kiểm tra học viên tồn tại
                var student = await _context.HocViens.FindAsync(request.HocVienID);
                if (student == null)
                {
                    return NotFound($"Student with ID {request.HocVienID} not found");
                }

                // 3. Kiểm tra lớp mới tồn tại
                var newClass = await _context.LopHocs
                    .Include(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(l => l.LopID == request.NewLopID);

                if (newClass == null)
                {
                    return NotFound($"Class with ID {request.NewLopID} not found");
                }

                // 4. Lấy thông tin đăng ký gốc
                var originalDangKy = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .ThenInclude(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(dk => dk.DangKyID == request.OriginalDangKyID);

                if (originalDangKy == null)
                {
                    return NotFound($"Original registration with ID {request.OriginalDangKyID} not found");
                }

                // 5. Kiểm tra lớp gốc có đang diễn ra không
                if (originalDangKy.LopHoc?.TrangThai != "DangDienRa")
                {
                    return BadRequest("Original class is not currently in progress");
                }

                // 6. Kiểm tra điều kiện đổi lớp (≤ 1 buổi đã học)
                var sessionsAttended = await _context.BuoiHocs
                    .CountAsync(bh => bh.LopID == originalDangKy.LopID
                        && bh.TrangThai == "DaDienRa"
                        && bh.NgayHoc <= DateTime.Today);

                if (sessionsAttended > 1)
                {
                    return BadRequest($"Cannot change class. Student has already attended {sessionsAttended} sessions. Only allowed to change after attending ≤ 1 session.");
                }

                // 7. Kiểm tra sức chứa lớp mới
                var registeredCount = await _context.DangKyLops
                    .CountAsync(dk => dk.LopID == request.NewLopID && dk.TrangThaiDangKy == "DangHoc");

                if (newClass.SoLuongToiDa.HasValue && registeredCount >= newClass.SoLuongToiDa.Value)
                {
                    return BadRequest("New class is full, cannot register");
                }

                // 8. Kiểm tra học viên chưa đăng ký lớp mới
                var existingRegistration = await _context.DangKyLops
                    .FirstOrDefaultAsync(dk => dk.HocVienID == request.HocVienID && dk.LopID == request.NewLopID);

                if (existingRegistration != null)
                {
                    return BadRequest("Student is already registered for this class");
                }

                // 9. Tính toán học phí
                decimal originalFee = (originalDangKy.LopHoc != null && originalDangKy.LopHoc.KhoaHoc != null)
                    ? originalDangKy.LopHoc.KhoaHoc.HocPhi : 0;
                decimal newFee = (newClass.KhoaHoc != null) ? newClass.KhoaHoc.HocPhi : 0;
                decimal feeDifference = newFee - originalFee;

                // 10. Thực hiện đổi lớp với transaction
                var strategy = _context.Database.CreateExecutionStrategy();

                return await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Tạo đăng ký mới
                        var newDangKyLop = new DangKyLop
                        {
                            HocVienID = request.HocVienID,
                            LopID = request.NewLopID,
                            NgayDangKy = DateTime.Now,
                            TrangThaiDangKy = "DangHoc",
                            TrangThaiThanhToan = feeDifference <= 0 ? "DaThanhToan" : "ChuaThanhToan"
                        };

                        await _context.DangKyLops.AddAsync(newDangKyLop);

                        // Cập nhật đăng ký cũ thành "DaHuy"
                        originalDangKy.TrangThaiDangKy = "DaHuy";
                        originalDangKy.NgayHuy = DateTime.Now;
                        originalDangKy.LyDoHuy = "Đổi sang lớp khác";

                        // LƯU THAY ĐỔI ĐỂ TẠO ID TRONG DATABASE TRƯỚC
                        await _context.SaveChangesAsync();

                        // Xử lý học phí SAU KHI ĐÃ CÓ ID
                        if (feeDifference > 0)
                        {
                            // Lớp mới đắt hơn - tạo thanh toán
                            var transactionRef = $"CHANGE-{DateTime.Now:yyyyMMddHHmmss}-{request.HocVienID}";
                            var payment = new ThanhToan
                            {
                                HocVienID = request.HocVienID,
                                DangKyID = newDangKyLop.DangKyID, // Bây giờ ID đã có trong database
                                SoTien = feeDifference,
                                NgayThanhToan = DateTime.Now,
                                PhuongThuc = "Bank",
                                Provider = "VNPay",
                                TransactionRef = transactionRef,
                                Status = "Pending",
                                GhiChu = $"Thanh toán phần chênh lệch khi đổi từ lớp {originalDangKy.LopID} sang lớp {request.NewLopID}"
                            };
                            await _context.ThanhToans.AddAsync(payment);
                            await _context.SaveChangesAsync(); // Lưu để có ThanhToanID
                        }
                        else if (feeDifference < 0)
                        {
                            // Lớp mới rẻ hơn - hoàn tiền vào ví
                            var refundAmount = Math.Abs(feeDifference);
                            var walletTransaction = new ViHocVien
                            {
                                HocVienID = request.HocVienID,
                                LoaiTx = "Hoan", // Sửa từ "HoanTien" thành "Hoan" theo CHECK constraint
                                SoTien = refundAmount,
                                DangKyID = newDangKyLop.DangKyID, // Bây giờ ID đã có trong database
                                GhiChu = $"Hoàn tiền chênh lệch khi đổi từ lớp {originalDangKy.LopID} sang lớp {request.NewLopID}",
                                NgayGiaoDich = DateTime.Now
                            };
                            await _context.ViHocViens.AddAsync(walletTransaction);

                            // Cộng tiền vào ví học viên
                            student.TaiKhoanVi += refundAmount;
                        }

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        // Nếu cần thanh toán, tạo VNPay payment URL
                        string? vnpayUrl = null;
                        if (feeDifference > 0)
                        {
                            try
                            {
                                // Lấy thanh toán vừa tạo để có ThanhToanID
                                var createdPayment = await _context.ThanhToans
                                    .FirstOrDefaultAsync(t => t.DangKyID == newDangKyLop.DangKyID && t.Status == "Pending");

                                if (createdPayment != null)
                                {
                                    var vnpayPaymentUrl = GenerateVNPayPaymentUrl(
                                        amount: feeDifference,
                                        orderInfo: $"IZONE-CHANGE-CLASS-{newDangKyLop.DangKyID}",
                                        orderType: "class_change_payment",
                                        transactionRef: createdPayment.TransactionRef ?? $"CHANGE-{DateTime.Now:yyyyMMddHHmmss}-{request.HocVienID}",
                                        thanhToanId: createdPayment.ThanhToanID
                                    );
                                    vnpayUrl = vnpayPaymentUrl;
                                }
                            }
                            catch (Exception ex)
                            {
                                // Log error but don't fail the whole operation
                                Console.WriteLine($"Error generating VNPay URL: {ex.Message}");
                            }
                        }

                        return CreatedAtAction(nameof(GetById), new { id = newDangKyLop.DangKyID }, new
                        {
                            dangKyID = newDangKyLop.DangKyID,
                            hocVienID = newDangKyLop.HocVienID,
                            lopID = newDangKyLop.LopID,
                            ngayDangKy = newDangKyLop.NgayDangKy,
                            trangThaiDangKy = newDangKyLop.TrangThaiDangKy,
                            trangThaiThanhToan = newDangKyLop.TrangThaiThanhToan,
                            message = "Successfully changed class!",
                            feeDifference = feeDifference,
                            paymentRequired = feeDifference > 0,
                            refundAmount = feeDifference < 0 ? Math.Abs(feeDifference) : 0,
                            vnpayUrl = vnpayUrl, // Thêm VNPay URL
                            originalClass = new
                            {
                                lopID = originalDangKy.LopID,
                                tenKhoaHoc = originalDangKy.LopHoc?.KhoaHoc?.TenKhoaHoc,
                                hocPhi = originalFee
                            },
                            newClass = new
                            {
                                lopID = newClass.LopID,
                                tenKhoaHoc = newClass.KhoaHoc?.TenKhoaHoc,
                                hocPhi = newFee,
                                ngayBatDau = newClass.NgayBatDau.ToString("yyyy-MM-dd")
                            }
                        });
                    }
                    catch (Exception)
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error changing class", error = ex.Message });
            }
        }

        // Helper: Generate VNPay payment URL - Copy from ThanhToanController
        private string GenerateVNPayPaymentUrl(decimal amount, string orderInfo, string orderType, string transactionRef, int thanhToanId)
        {
            try
            {
                // Lấy thông tin cấu hình VNPay từ appsettings.json
                var configuration = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json")
                    .Build();

                var vnpayConfig = configuration.GetSection("VNPay");
                var vnp_TmnCode = vnpayConfig["TmnCode"] ?? "";
                var vnp_HashSecret = vnpayConfig["HashSecret"] ?? "";
                var vnp_PaymentUrl = vnpayConfig["PaymentUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
                var vnp_ReturnUrl = $"{Request.Scheme}://{Request.Host}/api/ThanhToan/vnpay-return";
                var vnp_IpnUrl = $"{Request.Scheme}://{Request.Host}/api/ThanhToan/vnpay-ipn";

                // Tạo các tham số bắt buộc theo VNPay documentation
                var vnp_Amount = (long)(amount * 100); // Số tiền nhân với 100 (khử phần thập phân)
                var vnp_CreateDate = DateTime.Now.ToString("yyyyMMddHHmmss");
                var vnp_ExpireDate = DateTime.Now.AddMinutes(15).ToString("yyyyMMddHHmmss");
                var vnp_IpAddr = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

                // Tạo danh sách tham số theo thứ tự chính xác của VNPay
                var vnp_Params = new SortedDictionary<string, string>
                {
                    { "vnp_Amount", vnp_Amount.ToString() },
                    { "vnp_Command", "pay" },
                    { "vnp_CreateDate", vnp_CreateDate },
                    { "vnp_CurrCode", "VND" },
                    { "vnp_ExpireDate", vnp_ExpireDate },
                    { "vnp_IpAddr", GetIPv4Address(vnp_IpAddr) },
                    { "vnp_Locale", "vn" },
                    { "vnp_OrderInfo", orderInfo },
                    { "vnp_OrderType", orderType },
                    { "vnp_ReturnUrl", vnp_ReturnUrl },
                    { "vnp_TmnCode", vnp_TmnCode },
                    { "vnp_TxnRef", transactionRef },
                    { "vnp_Version", "2.1.0" }
                };

                // Tạo chuỗi hash data (CÓ encode URL cho hash)
                var hashData = string.Join("&", vnp_Params.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));

                // Tạo secure hash bằng HMAC-SHA512
                var vnp_SecureHash = GenerateVNPaySecureHash(hashData, vnp_HashSecret);

                vnp_Params.Add("vnp_SecureHash", vnp_SecureHash);

                // Build payment URL (có encode URL cho query string)
                var queryString = string.Join("&", vnp_Params.Select(kv => $"{kv.Key}={HttpUtility.UrlEncode(kv.Value)}"));
                var paymentUrl = $"{vnp_PaymentUrl}?{queryString}";

                return paymentUrl;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating VNPay payment URL: {ex.Message}");
                throw;
            }
        }

        // Helper: Generate VNPay secure hash
        private string GenerateVNPaySecureHash(string data, string secretKey)
        {
            try
            {
                using (var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(secretKey)))
                {
                    var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
                    return BitConverter.ToString(hash).Replace("-", "").ToLower();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating VNPay secure hash: {ex.Message}");
                return string.Empty;
            }
        }

        // Helper: Convert IP address to IPv4 format for VNPay
        private string GetIPv4Address(string ipAddress)
        {
            try
            {
                // Nếu là IPv6 localhost (::1), chuyển thành IPv4 (127.0.0.1)
                if (ipAddress == "::1")
                {
                    return "127.0.0.1";
                }

                // Nếu là IPv4, trả về nguyên
                if (ipAddress.Contains(".") && !ipAddress.Contains(":"))
                {
                    return ipAddress;
                }

                // Nếu là IPv6, lấy phần IPv4 cuối cùng
                if (ipAddress.Contains(":"))
                {
                    var parts = ipAddress.Split(':');
                    foreach (var part in parts)
                    {
                        if (part.Contains("."))
                        {
                            return part;
                        }
                    }
                }

                // Fallback
                return "127.0.0.1";
            }
            catch
            {
                return "127.0.0.1";
            }
        }
    }
}
