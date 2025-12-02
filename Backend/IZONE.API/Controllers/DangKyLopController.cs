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
using System.ComponentModel.DataAnnotations;

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

        [HttpGet("hoc-vien/{hocVienId}/details")]
        public async Task<ActionResult<IEnumerable<object>>> GetByHocVienIdWithDetails(int hocVienId)
        {
            var dangKyLops = await _context.DangKyLops
                .Include(dk => dk.LopHoc)
                .ThenInclude(l => l.KhoaHoc)
                .Include(dk => dk.LopHoc)
                .ThenInclude(l => l.GiangVien)
                .Include(dk => dk.LopHoc)
                .ThenInclude(l => l.DiaDiem)
                .Where(dk => dk.HocVienID == hocVienId)
                .OrderByDescending(dk => dk.NgayDangKy)
                .ToListAsync();

            var result = dangKyLops.Select(dk => {
                // Phân loại đăng ký - Cải tiến logic để tránh trường hợp "Không xác định"
                string loaiDangKy = "BinhThuong"; // Mặc định là đăng ký bình thường
                object thongTinLienQuan = null; // Thông tin về lớp liên quan (đổi, học lại, đi học tiếp)

                // Kiểm tra có phải đăng ký miễn phí không (đi học tiếp hoặc học lại)
                bool isFreeRegistration = !_context.ThanhToans.Any(t => t.DangKyID == dk.DangKyID);

                // 1. Kiểm tra đăng ký đã hủy do đổi lớp (ưu tiên cao nhất)
                if (dk.TrangThaiDangKy == "DaHuy" && !string.IsNullOrEmpty(dk.LyDoHuy) && dk.LyDoHuy.Contains("Đổi sang lớp"))
                {
                    loaiDangKy = "DaDoiLop";
                    // Trích xuất thông tin lớp mới từ LyDoHuy
                    var match = System.Text.RegularExpressions.Regex.Match(dk.LyDoHuy, @"Đổi sang lớp.*ID[:\s]+(\d+)");
                    if (match.Success)
                    {
                        int newLopId = int.Parse(match.Groups[1].Value);
                        string tenKhoaHocMoi = System.Text.RegularExpressions.Regex.Replace(dk.LyDoHuy, @"Đổi sang lớp.*ID[:\s]+\d+\s*-\s*", "").Trim();

                        // Tìm thông tin lớp mới
                        var lopMoi = _context.LopHocs
                            .Include(l => l.KhoaHoc)
                            .Include(l => l.GiangVien)
                            .Include(l => l.DiaDiem)
                            .FirstOrDefault(l => l.LopID == newLopId);

                        thongTinLienQuan = new
                        {
                            lopHocLienQuan = new
                            {
                                lopID = newLopId,
                                tenKhoaHoc = tenKhoaHocMoi,
                                khoaHoc = lopMoi?.KhoaHoc != null ? new
                                {
                                    khoaHocID = lopMoi.KhoaHoc.KhoaHocID,
                                    tenKhoaHoc = lopMoi.KhoaHoc.TenKhoaHoc
                                } : null,
                                giangVien = lopMoi?.GiangVien != null ? new
                                {
                                    giangVienID = lopMoi.GiangVien.GiangVienID,
                                    hoTen = lopMoi.GiangVien.HoTen
                                } : null,
                                diaDiem = lopMoi?.DiaDiem != null ? new
                                {
                                    diaDiemID = lopMoi.DiaDiem.DiaDiemID,
                                    tenCoSo = lopMoi.DiaDiem.TenCoSo
                                } : null,
                                ngayBatDau = lopMoi?.NgayBatDau.ToString("yyyy-MM-dd")
                            }
                        };
                    }
                }
                // 2. Kiểm tra đăng ký đang bảo lưu
                else if (dk.TrangThaiDangKy == "DaBaoLuu")
                {
                    loaiDangKy = "DaBaoLuu";
                    // Tìm đăng ký đang học tiếp từ bảo lưu này
                    var dangKyDangHocTiep = _context.DangKyLops
                        .Include(dkl => dkl.LopHoc)
                        .ThenInclude(l => l.KhoaHoc)
                        .Include(dkl => dkl.LopHoc)
                        .ThenInclude(l => l.GiangVien)
                        .Include(dkl => dkl.LopHoc)
                        .ThenInclude(l => l.DiaDiem)
                        .FirstOrDefault(dkl => dkl.HocVienID == dk.HocVienID
                                             && dkl.LopHoc.KhoaHocID == dk.LopHoc.KhoaHocID
                                             && dkl.TrangThaiDangKy == "DangHoc"
                                             && !_context.ThanhToans.Any(t => t.DangKyID == dkl.DangKyID)
                                             && dkl.DangKyID != dk.DangKyID); // Không phải chính nó

                    if (dangKyDangHocTiep != null)
                    {
                        thongTinLienQuan = new
                        {
                            lopHocLienQuan = new
                            {
                                lopID = dangKyDangHocTiep.LopID,
                                khoaHocID = dangKyDangHocTiep.LopHoc?.KhoaHocID,
                                tenKhoaHoc = dangKyDangHocTiep.LopHoc?.KhoaHoc?.TenKhoaHoc,
                                khoaHoc = dangKyDangHocTiep.LopHoc?.KhoaHoc != null ? new
                                {
                                    khoaHocID = dangKyDangHocTiep.LopHoc.KhoaHoc.KhoaHocID,
                                    tenKhoaHoc = dangKyDangHocTiep.LopHoc.KhoaHoc.TenKhoaHoc
                                } : null,
                                giangVien = dangKyDangHocTiep.LopHoc?.GiangVien != null ? new
                                {
                                    giangVienID = dangKyDangHocTiep.LopHoc.GiangVien.GiangVienID,
                                    hoTen = dangKyDangHocTiep.LopHoc.GiangVien.HoTen
                                } : null,
                                diaDiem = dangKyDangHocTiep.LopHoc?.DiaDiem != null ? new
                                {
                                    diaDiemID = dangKyDangHocTiep.LopHoc.DiaDiem.DiaDiemID,
                                    tenCoSo = dangKyDangHocTiep.LopHoc.DiaDiem.TenCoSo
                                } : null,
                                ngayBatDau = dangKyDangHocTiep.LopHoc?.NgayBatDau.ToString("yyyy-MM-dd")
                            }
                        };
                    }
                }
                // 3. Xử lý đăng ký miễn phí (đi học tiếp, học lại, miễn phí khác)
                else if (isFreeRegistration)
                {
                    // Kiểm tra xem học viên có sử dụng bảo lưu cho khóa học này không
                    var baoLuuSuDung = _context.BaoLuus
                        .Include(bl => bl.DangKyLop)
                        .ThenInclude(dkl => dkl.LopHoc)
                        .FirstOrDefault(bl => bl.DangKyLop.HocVienID == dk.HocVienID
                                           && bl.DangKyLop.LopHoc.KhoaHocID == dk.LopHoc.KhoaHocID
                                           && bl.TrangThai == "DaSuDung");

                    if (baoLuuSuDung != null)
                    {
                        // Đây là đăng ký "đi học tiếp" từ bảo lưu
                        loaiDangKy = "HocTiep";
                    }
                    else
                    {
                        // Kiểm tra xem có phải đăng ký học lại không (có ≥ 2 đăng ký cùng khóa học)
                        var allCourseRegistrations = _context.DangKyLops
                            .Include(dkl => dkl.LopHoc)
                            .Where(dkl => dkl.HocVienID == dk.HocVienID
                                       && dkl.LopHoc.KhoaHocID == dk.LopHoc.KhoaHocID
                                       && dkl.TrangThaiDangKy != "DaHuy") // Không tính đăng ký đã hủy
                            .OrderBy(dkl => dkl.NgayDangKy)
                            .ToList();

                        // Nếu có nhiều hơn 1 đăng ký cho khóa học này = có học lại
                        if (allCourseRegistrations.Count > 1)
                        {
                            loaiDangKy = "HocLai";

                            // Tìm đăng ký trả phí đầu tiên (lớp gốc)
                            var firstPaidRegistration = allCourseRegistrations
                                .Where(dkl => _context.ThanhToans.Any(t => t.DangKyID == dkl.DangKyID))
                                .OrderBy(dkl => dkl.NgayDangKy)
                                .FirstOrDefault();

                            if (firstPaidRegistration?.DangKyID == dk.DangKyID)
                            {
                                // Đây là lớp gốc và đã có học lại
                                // Thêm thông tin lớp học lại (lớp mới nhất được đăng ký miễn phí)
                                var lastFreeRegistration = allCourseRegistrations
                                    .Where(dkl => !_context.ThanhToans.Any(t => t.DangKyID == dkl.DangKyID)) // Miễn phí
                                    .OrderByDescending(dkl => dkl.NgayDangKy)
                                    .FirstOrDefault();

                                if (lastFreeRegistration != null)
                                {
                                    thongTinLienQuan = new
                                    {
                                        daHocLai = true,
                                        lopHocLai = new
                                        {
                                            lopID = lastFreeRegistration.LopID,
                                            tenKhoaHoc = lastFreeRegistration.LopHoc?.KhoaHoc?.TenKhoaHoc,
                                            khoaHoc = lastFreeRegistration.LopHoc?.KhoaHoc != null ? new
                                            {
                                                khoaHocID = lastFreeRegistration.LopHoc.KhoaHoc.KhoaHocID,
                                                tenKhoaHoc = lastFreeRegistration.LopHoc.KhoaHoc.TenKhoaHoc
                                            } : null,
                                            giangVien = lastFreeRegistration.LopHoc?.GiangVien != null ? new
                                            {
                                                giangVienID = lastFreeRegistration.LopHoc.GiangVien.GiangVienID,
                                                hoTen = lastFreeRegistration.LopHoc.GiangVien.HoTen
                                            } : null,
                                            diaDiem = lastFreeRegistration.LopHoc?.DiaDiem != null ? new
                                            {
                                                diaDiemID = lastFreeRegistration.LopHoc.DiaDiem.DiaDiemID,
                                                tenCoSo = lastFreeRegistration.LopHoc.DiaDiem.TenCoSo
                                            } : null,
                                            ngayBatDau = lastFreeRegistration.LopHoc?.NgayBatDau.ToString("yyyy-MM-dd"),
                                            ngayKetThuc = lastFreeRegistration.LopHoc?.NgayKetThuc?.ToString("yyyy-MM-dd")
                                        }
                                    };
                                }
                            }
                            else
                            {
                                // Đây là lớp học lại, tìm thông tin lớp gốc
                                var originalRegistration = firstPaidRegistration;
                                if (originalRegistration != null)
                                {
                                    thongTinLienQuan = new
                                    {
                                        lopHocGoc = new
                                        {
                                            lopID = originalRegistration.LopID,
                                            tenKhoaHoc = originalRegistration.LopHoc?.KhoaHoc?.TenKhoaHoc,
                                            khoaHoc = originalRegistration.LopHoc?.KhoaHoc != null ? new
                                            {
                                                khoaHocID = originalRegistration.LopHoc.KhoaHoc.KhoaHocID,
                                                tenKhoaHoc = originalRegistration.LopHoc.KhoaHoc.TenKhoaHoc
                                            } : null,
                                            giangVien = originalRegistration.LopHoc?.GiangVien != null ? new
                                            {
                                                giangVienID = originalRegistration.LopHoc.GiangVien.GiangVienID,
                                                hoTen = originalRegistration.LopHoc.GiangVien.HoTen
                                            } : null,
                                            diaDiem = originalRegistration.LopHoc?.DiaDiem != null ? new
                                            {
                                                diaDiemID = originalRegistration.LopHoc.DiaDiem.DiaDiemID,
                                                tenCoSo = originalRegistration.LopHoc.DiaDiem.TenCoSo
                                            } : null,
                                            ngayBatDau = originalRegistration.LopHoc?.NgayBatDau.ToString("yyyy-MM-dd"),
                                            ngayKetThuc = originalRegistration.LopHoc?.NgayKetThuc?.ToString("yyyy-MM-dd")
                                        }
                                    };
                                }
                            }
                        }
                        else
                        {
                            // Có thể là đăng ký miễn phí khác (nếu database có dữ liệu cũ)
                            loaiDangKy = "MienPhi";
                        }
                    }
                }
                // 4. Mặc định: đăng ký bình thường (đã trả phí và không có đặc điểm đặc biệt)
                else
                {
                    loaiDangKy = "BinhThuong";
                }

                return new
                {
                    dangKyID = dk.DangKyID,
                    hocVienID = dk.HocVienID,
                    lopID = dk.LopID,
                    ngayDangKy = dk.NgayDangKy,
                    trangThaiDangKy = dk.TrangThaiDangKy,
                    trangThaiThanhToan = dk.TrangThaiThanhToan,
                    ngayHuy = dk.NgayHuy,
                    lyDoHuy = dk.LyDoHuy,
                    loaiDangKy = loaiDangKy,
                    thongTinLienQuan = thongTinLienQuan,

                // Thông tin lớp học chi tiết
                lopHoc = dk.LopHoc != null ? new
                {
                    lopID = dk.LopHoc.LopID,
                    khoaHocID = dk.LopHoc.KhoaHocID,
                    giangVienID = dk.LopHoc.GiangVienID,
                    diaDiemID = dk.LopHoc.DiaDiemID,
                    ngayBatDau = dk.LopHoc.NgayBatDau,
                    ngayKetThuc = dk.LopHoc.NgayKetThuc,
                    caHoc = dk.LopHoc.CaHoc,
                    ngayHocTrongTuan = dk.LopHoc.NgayHocTrongTuan,
                    donGiaBuoiDay = dk.LopHoc.DonGiaBuoiDay,
                    thoiLuongGio = dk.LopHoc.ThoiLuongGio,
                    soLuongToiDa = dk.LopHoc.SoLuongToiDa,
                    trangThai = dk.LopHoc.TrangThai,

                    // Navigation properties
                    khoaHoc = dk.LopHoc.KhoaHoc != null ? new
                    {
                        khoaHocID = dk.LopHoc.KhoaHoc.KhoaHocID,
                        tenKhoaHoc = dk.LopHoc.KhoaHoc.TenKhoaHoc,
                        soBuoi = dk.LopHoc.KhoaHoc.SoBuoi,
                        hocPhi = dk.LopHoc.KhoaHoc.HocPhi,
                        donGiaTaiLieu = dk.LopHoc.KhoaHoc.DonGiaTaiLieu,
                    } : null,

                    giangVien = dk.LopHoc.GiangVien != null ? new
                    {
                        giangVienID = dk.LopHoc.GiangVien.GiangVienID,
                        hoTen = dk.LopHoc.GiangVien.HoTen,
                        chuyenMon = dk.LopHoc.GiangVien.ChuyenMon
                    } : null,

                    diaDiem = dk.LopHoc.DiaDiem != null ? new
                    {
                        diaDiemID = dk.LopHoc.DiaDiem.DiaDiemID,
                        tenCoSo = dk.LopHoc.DiaDiem.TenCoSo,
                        diaChi = dk.LopHoc.DiaDiem.DiaChi,
                        sucChua = dk.LopHoc.DiaDiem.SucChua
                    } : null
                } : null
                };
            });

            return Ok(result);
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

                // Kiểm tra xem lớp này đã được dùng để học lại chưa
                var hasBeenRetaken = await _context.DangKyLops
                    .AnyAsync(dk => dk.HocVienID == dangKy.HocVienID
                                 && dk.LopHoc.KhoaHocID == dangKy.LopHoc.KhoaHocID
                                 && dk.DangKyID != dangKyId
                                 && dk.NgayDangKy > dangKy.LopHoc.NgayKetThuc
                                 && !dk.ThanhToans.Any()
                                 && dk.TrangThaiDangKy != "DaHuy");

                if (hasBeenRetaken)
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
                        reason = "Lớp này đã được dùng để học lại. Hãy học lại từ lớp học lại gần nhất.",

                        // Thông tin bổ sung
                        hasBeenRetaken = true
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

                // 5. Kiểm tra lớp gốc có đang diễn ra hoặc chưa bắt đầu không
                if (originalDangKy.LopHoc?.TrangThai != "DangDienRa" && originalDangKy.LopHoc?.TrangThai != "ChuaBatDau")
                {
                    return BadRequest("Original class must be in progress or not started yet");
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

                // 9. Tính toán học phí và kiểm tra ví học viên
                decimal originalFee = (originalDangKy.LopHoc != null && originalDangKy.LopHoc.KhoaHoc != null)
                    ? originalDangKy.LopHoc.KhoaHoc.HocPhi : 0;
                decimal newFee = (newClass.KhoaHoc != null) ? newClass.KhoaHoc.HocPhi : 0;
                decimal feeDifference = newFee - originalFee;

                // Lấy số dư ví hiện tại của học viên
                decimal walletBalance = student.TaiKhoanVi;

                // Khởi tạo các biến để theo dõi
                decimal amountFromWallet = 0;
                decimal remainingPayment = 0;
                decimal refundAmount = 0;

                // Xử lý logic kiểm tra ví trước khi tính chênh lệch
                if (feeDifference > 0)
                {
                    // Lớp mới đắt hơn - cần thanh toán thêm
                    // Trừ từ ví trước, tối đa bằng số dư ví
                    amountFromWallet = Math.Min(feeDifference, walletBalance);
                    remainingPayment = feeDifference - amountFromWallet;
                }
                else if (feeDifference < 0)
                {
                    // Lớp mới rẻ hơn - hoàn tiền
                    refundAmount = Math.Abs(feeDifference);
                }
                // feeDifference == 0: không cần làm gì

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
                            TrangThaiThanhToan = remainingPayment > 0 ? "ChuaThanhToan" : "DaThanhToan"
                        };

                        await _context.DangKyLops.AddAsync(newDangKyLop);

                        // Cập nhật đăng ký cũ thành "DaHuy" và lưu thông tin lớp mới
                        originalDangKy.TrangThaiDangKy = "DaHuy";
                        originalDangKy.NgayHuy = DateTime.Now;
                        originalDangKy.LyDoHuy = $"Đổi sang lớp ID: {newClass.LopID}";

                        // LƯU THAY ĐỔI ĐỂ TẠO ID TRONG DATABASE TRƯỚC
                        await _context.SaveChangesAsync();

                        // Xử lý học phí SAU KHI ĐÃ CÓ ID
                        if (amountFromWallet > 0)
                        {
                            // Trừ tiền từ ví học viên
                            var walletDebit = new ViHocVien
                            {
                                HocVienID = request.HocVienID,
                                LoaiTx = "Tru", // Trừ tiền từ ví
                                SoTien = amountFromWallet,
                                DangKyID = newDangKyLop.DangKyID,
                                GhiChu = $"Trừ từ ví để thanh toán chênh lệch khi đổi từ lớp {originalDangKy.LopID} sang lớp {request.NewLopID}",
                                NgayGiaoDich = DateTime.Now
                            };
                            await _context.ViHocViens.AddAsync(walletDebit);

                            // Cập nhật số dư ví học viên
                            student.TaiKhoanVi -= amountFromWallet;
                        }

                        if (remainingPayment > 0)
                        {
                            // Còn cần thanh toán thêm - tạo thanh toán VNPay
                            var transactionRef = $"CHANGE-{DateTime.Now:yyyyMMddHHmmss}-{request.HocVienID}";
                            var payment = new ThanhToan
                            {
                                HocVienID = request.HocVienID,
                                DangKyID = newDangKyLop.DangKyID,
                                SoTien = remainingPayment,
                                NgayThanhToan = DateTime.Now,
                                PhuongThuc = "Bank",
                                Provider = "VNPay",
                                TransactionRef = transactionRef,
                                Status = "Pending",
                                GhiChu = $"Thanh toán phần chênh lệch còn lại khi đổi từ lớp {originalDangKy.LopID} sang lớp {request.NewLopID}"
                            };
                            await _context.ThanhToans.AddAsync(payment);
                            await _context.SaveChangesAsync(); // Lưu để có ThanhToanID
                        }
                        else if (feeDifference < 0)
                        {
                            // Lớp mới rẻ hơn - hoàn tiền vào ví
                            var walletTransaction = new ViHocVien
                            {
                                HocVienID = request.HocVienID,
                                LoaiTx = "Hoan", // Hoàn tiền
                                SoTien = refundAmount,
                                DangKyID = newDangKyLop.DangKyID,
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
                                        amount: remainingPayment, // Sử dụng remainingPayment thay vì feeDifference
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
                            walletBalance = walletBalance, // Số dư ví ban đầu
                            amountFromWallet = amountFromWallet, // Số tiền đã trừ từ ví
                            remainingPayment = remainingPayment, // Số tiền còn cần thanh toán
                            paymentRequired = remainingPayment > 0,
                            refundAmount = refundAmount,
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

        // POST: api/DangKyLop/admin-register-student
        [HttpPost("admin-register-student")]
        public async Task<IActionResult> AdminRegisterStudent([FromBody] AdminRegisterStudentRequest request)
        {
            try
            {
                // 1. Validate request
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (request.HocVienID <= 0 || request.LopID <= 0)
                {
                    return BadRequest("HocVienID và LopID phải lớn hơn 0");
                }

                // 2. Kiểm tra học viên tồn tại
                var hocVien = await _context.HocViens.FindAsync(request.HocVienID);
                if (hocVien == null)
                {
                    return NotFound($"Học viên với ID {request.HocVienID} không tồn tại");
                }

                // 3. Kiểm tra lớp học tồn tại
                var lopHoc = await _context.LopHocs
                    .Include(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(l => l.LopID == request.LopID);

                if (lopHoc == null)
                {
                    return NotFound($"Lớp học với ID {request.LopID} không tồn tại");
                }

                // 4. Kiểm tra học viên đã đăng ký lớp này chưa
                var existingRegistration = await _context.DangKyLops
                    .FirstOrDefaultAsync(dk => dk.HocVienID == request.HocVienID && dk.LopID == request.LopID);

                if (existingRegistration != null)
                {
                    return BadRequest("Học viên đã đăng ký lớp học này");
                }

                // 5. Kiểm tra sức chứa lớp
                var registeredCount = await _context.DangKyLops
                    .CountAsync(dk => dk.LopID == request.LopID && dk.TrangThaiDangKy == "DangHoc");

                if (lopHoc.SoLuongToiDa.HasValue && registeredCount >= lopHoc.SoLuongToiDa.Value)
                {
                    return BadRequest("Lớp học đã đầy, không thể đăng ký thêm");
                }

                // 6. Lấy học phí từ khóa học
                decimal hocPhi = lopHoc.KhoaHoc?.HocPhi ?? 0;

                // 7. Tạo đăng ký và thanh toán với transaction
                var strategy = _context.Database.CreateExecutionStrategy();

                return await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Tạo đăng ký lớp
                        var dangKyLop = new DangKyLop
                        {
                            HocVienID = request.HocVienID,
                            LopID = request.LopID,
                            NgayDangKy = DateTime.Now,
                            TrangThaiDangKy = "DangHoc",
                            TrangThaiThanhToan = "DaThanhToan" // Thanh toán tiền mặt ngay lập tức
                        };

                        await _context.DangKyLops.AddAsync(dangKyLop);
                        await _context.SaveChangesAsync(); // Lưu để có DangKyID

                        // Tạo thanh toán tiền mặt
                        var transactionRef = $"CASH-{DateTime.Now:yyyyMMddHHmmss}-{request.HocVienID}";
                        var thanhToan = new ThanhToan
                        {
                            HocVienID = request.HocVienID,
                            DangKyID = dangKyLop.DangKyID,
                            SoTien = hocPhi,
                            PhuongThuc = "TienMat", // Thanh toán tiền mặt
                            Provider = "Admin",
                            TransactionRef = transactionRef,
                            Status = "Success", // Thanh toán thành công ngay lập tức
                            GhiChu = $"Thanh toán tiền mặt tại trung tâm - {lopHoc.KhoaHoc?.TenKhoaHoc}",
                            NgayThanhToan = DateTime.Now
                        };

                        await _context.ThanhToans.AddAsync(thanhToan);
                        await _context.SaveChangesAsync();

                        await transaction.CommitAsync();

                        return CreatedAtAction(nameof(GetById), new { id = dangKyLop.DangKyID }, new
                        {
                            dangKyID = dangKyLop.DangKyID,
                            hocVienID = dangKyLop.HocVienID,
                            lopID = dangKyLop.LopID,
                            ngayDangKy = dangKyLop.NgayDangKy,
                            trangThaiDangKy = dangKyLop.TrangThaiDangKy,
                            trangThaiThanhToan = dangKyLop.TrangThaiThanhToan,
                            thanhToanID = thanhToan.ThanhToanID,
                            soTien = thanhToan.SoTien,
                            phuongThuc = thanhToan.PhuongThuc,
                            message = "Đăng ký học viên thành công với thanh toán tiền mặt",
                            lopHoc = new
                            {
                                lopID = lopHoc.LopID,
                                tenKhoaHoc = lopHoc.KhoaHoc?.TenKhoaHoc,
                                hocPhi = hocPhi
                            },
                            hocVien = new
                            {
                                hocVienID = hocVien.HocVienID,
                                hoTen = hocVien.HoTen
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
                return StatusCode(500, new { message = "Lỗi khi đăng ký học viên", error = ex.Message });
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

    // Request/Response models
    public class AdminRegisterStudentRequest {
        [Required(ErrorMessage = "HocVienID là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "HocVienID phải lớn hơn 0")]
        public int HocVienID { get; set; }

        [Required(ErrorMessage = "LopID là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "LopID phải lớn hơn 0")]
        public int LopID { get; set; }
    }
}
