using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Models;
using IZONE.Core.Interfaces;
using IZONE.Infrastructure.Data;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Text.Json;

namespace IZONE.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LopHocController : ControllerBase
    {
    private readonly ILopHocRepository _lopHocRepository;
    private readonly ILopHocService _lopHocService;
    private readonly IZONEDbContext _context;
    private readonly ILogger<LopHocController> _logger;

    public LopHocController(ILopHocRepository lopHocRepository, ILopHocService lopHocService, IZONEDbContext context, ILogger<LopHocController> logger)
    {
        _lopHocRepository = lopHocRepository;
        _lopHocService = lopHocService;
        _context = context;
        _logger = logger;
    }

        // GET: api/LopHoc
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllLopHoc()
        {
            try
            {
                var lopHocs = await _lopHocRepository.GetAllAsync();

                if (lopHocs == null || !lopHocs.Any())
                {
                    return Ok(new List<object>());
                }

                // Return simplified objects with null safety và thông tin đầy đủ
                var result = lopHocs.Select(l => new
                {
                    lopID = l.LopID,
                    khoaHocID = l.KhoaHocID,
                    giangVienID = l.GiangVienID,
                    diaDiemID = l.DiaDiemID,
                    ngayBatDau = l.NgayBatDau.ToString("yyyy-MM-dd"),
                    ngayKetThuc = l.NgayKetThuc?.ToString("yyyy-MM-dd") ?? "",
                    caHoc = l.CaHoc ?? "",
                    ngayHocTrongTuan = l.NgayHocTrongTuan ?? "",
                    donGiaBuoiDay = l.DonGiaBuoiDay > 0 ? l.DonGiaBuoiDay : 0,
                    thoiLuongGio = l.ThoiLuongGio > 0 ? l.ThoiLuongGio : 1.5m,
                    soLuongToiDa = l.SoLuongToiDa ?? 0,
                    trangThai = l.TrangThai ?? "ChuaBatDau",
                    // Thông tin bổ sung từ navigation properties
                    khoaHoc = l.KhoaHoc != null ? new
                    {
                        khoaHocID = l.KhoaHoc.KhoaHocID,
                        tenKhoaHoc = l.KhoaHoc.TenKhoaHoc ?? "",
                        soBuoi = l.KhoaHoc.SoBuoi,
                        hocPhi = l.KhoaHoc.HocPhi,
                        donGiaTaiLieu = l.KhoaHoc.DonGiaTaiLieu
                    } : null,
                    giangVien = l.GiangVien != null ? new
                    {
                        giangVienID = l.GiangVien.GiangVienID,
                        hoTen = l.GiangVien.HoTen ?? "",
                        chuyenMon = l.GiangVien.ChuyenMon ?? ""
                    } : null,
                    diaDiem = l.DiaDiem != null ? new
                    {
                        diaDiemID = l.DiaDiem.DiaDiemID,
                        tenCoSo = l.DiaDiem.TenCoSo ?? "",
                        diaChi = l.DiaDiem.DiaChi ?? "",
                        sucChua = l.DiaDiem.SucChua ?? 0
                    } : null
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách lớp học");
                return StatusCode(500, new { message = "Không thể tải danh sách lớp học", error = ex.Message });
            }
        }

        // GET: api/LopHoc/active
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<LopHoc>>> GetActiveLopHoc()
        {
            var lopHocs = await _lopHocRepository.GetActiveLopHocAsync();
            return Ok(lopHocs);
        }

        // GET: api/LopHoc/lecturer/{giangVienID}/paginated
        [HttpGet("lecturer/{giangVienID}/paginated")]
        public async Task<ActionResult<object>> GetLopHocByLecturerPaginated(
            int giangVienID,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string searchTerm = "",
            [FromQuery] string statusFilter = "all")
        {
            try
            {
                // Validate pagination parameters
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var allLopHocs = await _lopHocRepository.GetAllAsync();

                if (allLopHocs == null || !allLopHocs.Any())
                {
                    return Ok(new
                    {
                        data = new List<object>(),
                        pagination = new
                        {
                            currentPage = 1,
                            totalPages = 1,
                            totalItems = 0,
                            itemsPerPage = pageSize
                        }
                    });
                }

                // Filter by lecturer ID
                var lecturerLopHocs = allLopHocs.Where(l => l.GiangVienID == giangVienID).ToList();

                // Apply status filter
                var filteredLopHocs = ApplyStatusFilter(lecturerLopHocs, statusFilter);

                // Apply search filter
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    filteredLopHocs = ApplySearchFilter(filteredLopHocs, searchTerm);
                }

                // Calculate pagination
                var totalItems = filteredLopHocs.Count();
                var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
                var skip = (page - 1) * pageSize;
                var paginatedLopHocs = filteredLopHocs.Skip(skip).Take(pageSize).ToList();

                // Map to response format
                var result = paginatedLopHocs.Select(l => new
                {
                    lopID = l.LopID,
                    khoaHocID = l.KhoaHocID,
                    giangVienID = l.GiangVienID,
                    diaDiemID = l.DiaDiemID,
                    ngayBatDau = l.NgayBatDau.ToString("yyyy-MM-dd"),
                    ngayKetThuc = l.NgayKetThuc?.ToString("yyyy-MM-dd") ?? "",
                    caHoc = l.CaHoc ?? "",
                    ngayHocTrongTuan = l.NgayHocTrongTuan ?? "",
                    donGiaBuoiDay = l.DonGiaBuoiDay > 0 ? l.DonGiaBuoiDay : 0,
                    thoiLuongGio = l.ThoiLuongGio > 0 ? l.ThoiLuongGio : 1.5m,
                    soLuongToiDa = l.SoLuongToiDa ?? 0,
                    trangThai = l.TrangThai ?? "ChuaBatDau",
                    // Thông tin bổ sung từ navigation properties
                    khoaHoc = l.KhoaHoc != null ? new
                    {
                        khoaHocID = l.KhoaHoc.KhoaHocID,
                        tenKhoaHoc = l.KhoaHoc.TenKhoaHoc ?? "",
                        soBuoi = l.KhoaHoc.SoBuoi,
                        hocPhi = l.KhoaHoc.HocPhi,
                        donGiaTaiLieu = l.KhoaHoc.DonGiaTaiLieu
                    } : null,
                    giangVien = l.GiangVien != null ? new
                    {
                        giangVienID = l.GiangVien.GiangVienID,
                        hoTen = l.GiangVien.HoTen ?? "",
                        chuyenMon = l.GiangVien.ChuyenMon ?? ""
                    } : null,
                    diaDiem = l.DiaDiem != null ? new
                    {
                        diaDiemID = l.DiaDiem.DiaDiemID,
                        tenCoSo = l.DiaDiem.TenCoSo ?? "",
                        diaChi = l.DiaDiem.DiaChi ?? "",
                        sucChua = l.DiaDiem.SucChua ?? 0
                    } : null
                });

                var paginationInfo = new
                {
                    currentPage = page,
                    totalPages = totalPages,
                    totalItems = totalItems,
                    itemsPerPage = pageSize
                };

                return Ok(new
                {
                    data = result,
                    pagination = paginationInfo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách lớp học phân trang cho giảng viên {GiangVienID}", giangVienID);
                return StatusCode(500, new { message = "Không thể tải danh sách lớp học", error = ex.Message });
            }
        }

        // GET: api/LopHoc/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LopHoc>> GetLopHocById(int id)
        {
            var lopHoc = await _lopHocRepository.GetByIdAsync(id);

            if (lopHoc == null)
            {
                return NotFound();
            }

            return lopHoc;
        }

        // GET: api/LopHoc/5/hocvien
        [HttpGet("{id}/hocvien")]
        public async Task<ActionResult<IEnumerable<HocVien>>> GetHocViensByLopHoc(int id)
        {
            var lopHoc = await _lopHocRepository.GetByIdAsync(id);

            if (lopHoc == null)
            {
                return NotFound();
            }

            var hocViens = await _lopHocRepository.GetHocViensByLopHocAsync(id);
            return Ok(hocViens);
        }

        // GET: api/LopHoc/5/buoihoc
        [HttpGet("{id}/buoihoc")]
        public async Task<ActionResult<IEnumerable<BuoiHoc>>> GetBuoiHocsByLopHoc(int id)
        {
            var lopHoc = await _lopHocRepository.GetByIdAsync(id);

            if (lopHoc == null)
            {
                return NotFound();
            }

            var buoiHocs = await _lopHocRepository.GetBuoiHocsByLopHocAsync(id);
            return Ok(buoiHocs);
        }

        // GET: api/LopHoc/5/soluonghocvien
        [HttpGet("{id}/soluonghocvien")]
        public async Task<ActionResult<int>> GetSoLuongHocVienByLopHoc(int id)
        {
            var lopHoc = await _lopHocRepository.GetByIdAsync(id);

            if (lopHoc == null)
            {
                return NotFound();
            }

            var soLuong = await _lopHocRepository.GetSoLuongHocVienByLopHocAsync(id);
            return Ok(soLuong);
        }

        // POST: api/LopHoc
        [HttpPost]
        public async Task<ActionResult<LopHoc>> CreateLopHoc([FromBody] object requestData)
        {
            try
            {
                // Parse dữ liệu từ request
                var lopHoc = ParseLopHocFromRequest(requestData);
                if (lopHoc == null)
                {
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ" });
                }

                // Validate model với kiểm tra bổ sung
                var validationContext = new ValidationContext(lopHoc, serviceProvider: null, items: null);
                var validationResults = new List<ValidationResult>();
                bool isValid = Validator.TryValidateObject(lopHoc, validationContext, validationResults, true);

                if (!isValid)
                {
                    var errors = validationResults.Select(v => v.ErrorMessage).ToList();
                    return BadRequest(new { message = "Dữ liệu không hợp lệ", errors = errors });
                }

                // Kiểm tra bổ sung về logic nghiệp vụ (chỉ kiểm tra các trường bắt buộc)
                if (lopHoc.KhoaHocID <= 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn khóa học" });
                }

                if (lopHoc.GiangVienID <= 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn giảng viên" });
                }

                if (lopHoc.NgayBatDau == default(DateTime))
                {
                    return BadRequest(new { message = "Vui lòng chọn ngày bắt đầu" });
                }

                // Các trường khác có thể để trống hoặc sẽ được tính tự động

                // Kiểm tra khóa học tồn tại
                _logger.LogInformation("Đang kiểm tra khóa học tồn tại với ID: {KhoaHocID}", lopHoc.KhoaHocID);
                var khoaHoc = await _context.KhoaHocs.FindAsync(lopHoc.KhoaHocID);
                if (khoaHoc == null)
                {
                    _logger.LogWarning("Không tìm thấy khóa học với ID: {KhoaHocID}", lopHoc.KhoaHocID);
                    return BadRequest(new { message = $"Không tìm thấy khóa học với ID {lopHoc.KhoaHocID}" });
                }
                _logger.LogInformation("Khóa học tồn tại: {TenKhoaHoc}", khoaHoc.TenKhoaHoc);

                // Kiểm tra giảng viên tồn tại
                _logger.LogInformation("Đang kiểm tra giảng viên tồn tại với ID: {GiangVienID}", lopHoc.GiangVienID);
                var giangVien = await _context.GiangViens.FindAsync(lopHoc.GiangVienID);
                if (giangVien == null)
                {
                    _logger.LogWarning("Không tìm thấy giảng viên với ID: {GiangVienID}", lopHoc.GiangVienID);
                    return BadRequest(new { message = $"Không tìm thấy giảng viên với ID {lopHoc.GiangVienID}" });
                }
                _logger.LogInformation("Giảng viên tồn tại: {HoTen}", giangVien.HoTen);

                // Kiểm tra địa điểm nếu có
                if (lopHoc.DiaDiemID.HasValue)
                {
                    _logger.LogInformation("Đang kiểm tra địa điểm tồn tại với ID: {DiaDiemID}", lopHoc.DiaDiemID.Value);
                    var diaDiem = await _context.DiaDiems.FindAsync(lopHoc.DiaDiemID.Value);
                    if (diaDiem == null)
                    {
                        _logger.LogWarning("Không tìm thấy địa điểm với ID: {DiaDiemID}", lopHoc.DiaDiemID.Value);
                        return BadRequest(new { message = $"Không tìm thấy địa điểm với ID {lopHoc.DiaDiemID.Value}" });
                    }
                    _logger.LogInformation("Địa điểm tồn tại: {TenCoSo}", diaDiem.TenCoSo);
                }

                // Tính toán ngày kết thúc tự động nếu chưa có
                if (!lopHoc.NgayKetThuc.HasValue && lopHoc.KhoaHocID > 0)
                {
                    var ngayKetThuc = await _lopHocRepository.CalculateEndDate(
                        lopHoc.KhoaHocID,
                        lopHoc.NgayBatDau
                    );
                    lopHoc.NgayKetThuc = ngayKetThuc;
                }

                // Kiểm tra lại các ràng buộc trước khi lưu
                try
                {
                    _logger.LogInformation("Đang kiểm tra ràng buộc trước khi lưu lớp học với ID: {KhoaHocID}, GiangVienID: {GiangVienID}, DiaDiemID: {DiaDiemID}",
                        lopHoc.KhoaHocID, lopHoc.GiangVienID, lopHoc.DiaDiemID);

                    // Tính toán ngày kết thúc của lớp học mới
                    var ngayKetThucMoi = await _lopHocRepository.CalculateEndDate(lopHoc.KhoaHocID, lopHoc.NgayBatDau);
                    _logger.LogInformation("Ngày kết thúc tính toán được: {NgayKetThuc}", ngayKetThucMoi);

                    // Kiểm tra giảng viên có bị trùng lịch không (LOẠI TRỪ lớp hiện tại khỏi kiểm tra)
                    var giangVienConflict = await CheckGiangVienScheduleConflict(_context, lopHoc.GiangVienID, lopHoc.NgayHocTrongTuan, lopHoc.CaHoc, lopHoc.NgayBatDau, ngayKetThucMoi, lopHoc.LopID);
                    if (giangVienConflict.HasConflict)
                    {
                        _logger.LogWarning("Phát hiện xung đột lịch giảng viên: {ConflictInfo}", giangVienConflict.ConflictingClassInfo);
                        return BadRequest(new
                        {
                            message = $"Giảng viên có lịch trùng với lớp học: {giangVienConflict.ConflictingClassInfo}",
                            giangVienID = lopHoc.GiangVienID,
                            ngayHocTrongTuan = lopHoc.NgayHocTrongTuan,
                            caHoc = lopHoc.CaHoc,
                            ngayBatDau = lopHoc.NgayBatDau.ToString("yyyy-MM-dd"),
                            ngayKetThuc = ngayKetThucMoi.ToString("yyyy-MM-dd"),
                            conflictingClassId = giangVienConflict.ConflictingClassId,
                            conflictReason = giangVienConflict.Reason
                        });
                    }

                    // Kiểm tra địa điểm có bị trùng lịch không (nếu có địa điểm - LOẠI TRỪ lớp hiện tại khỏi kiểm tra)
                    if (lopHoc.DiaDiemID.HasValue)
                    {
                        var diaDiemConflict = await CheckDiaDiemScheduleConflict(_context, lopHoc.DiaDiemID.Value, lopHoc.NgayHocTrongTuan, lopHoc.CaHoc, lopHoc.NgayBatDau, ngayKetThucMoi, lopHoc.LopID);
                        if (diaDiemConflict.HasConflict)
                        {
                            _logger.LogWarning("Phát hiện xung đột lịch địa điểm: {ConflictInfo}", diaDiemConflict.ConflictingClassInfo);
                            return BadRequest(new
                            {
                                message = $"Địa điểm có lịch trùng với lớp học: {diaDiemConflict.ConflictingClassInfo}",
                                diaDiemID = lopHoc.DiaDiemID,
                                ngayHocTrongTuan = lopHoc.NgayHocTrongTuan,
                                caHoc = lopHoc.CaHoc,
                                ngayBatDau = lopHoc.NgayBatDau.ToString("yyyy-MM-dd"),
                                ngayKetThuc = ngayKetThucMoi.ToString("yyyy-MM-dd"),
                                conflictingClassId = diaDiemConflict.ConflictingClassId,
                                conflictReason = diaDiemConflict.Reason
                            });
                        }
                    }

                    _logger.LogInformation("Bắt đầu thêm lớp học vào database...");
                    await _lopHocRepository.AddAsync(lopHoc);

                    _logger.LogInformation("Bắt đầu lưu thay đổi vào database...");
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Lớp học đã được tạo thành công với ID: {LopID}", lopHoc.LopID);

                    // Tự động tạo các buổi học dựa trên lịch học của lớp
                    try
                    {
                        _logger.LogInformation("Bắt đầu tạo buổi học tự động cho lớp {LopID}", lopHoc.LopID);
                        var buoiHocList = await _lopHocService.CreateBuoiHocTuDongAsync(lopHoc.LopID);
                        _logger.LogInformation("Đã tạo {Count} buổi học tự động cho lớp {LopID}", buoiHocList.Count(), lopHoc.LopID);
                    }
                    catch (Exception buoiHocEx)
                    {
                        _logger.LogError(buoiHocEx, "Lỗi khi tạo buổi học tự động cho lớp {LopID}", lopHoc.LopID);
                        // Không throw exception vì lớp học đã tạo thành công, chỉ log lỗi
                    }

                    // Trả về response với dữ liệu đơn giản hóa để tránh lỗi serialization
                    try
                    {
                        var responseData = new
                        {
                            lopID = lopHoc.LopID,
                            khoaHocID = lopHoc.KhoaHocID,
                            giangVienID = lopHoc.GiangVienID,
                            diaDiemID = lopHoc.DiaDiemID,
                            ngayBatDau = lopHoc.NgayBatDau.ToString("yyyy-MM-dd"),
                            ngayKetThuc = lopHoc.NgayKetThuc?.ToString("yyyy-MM-dd"),
                            caHoc = lopHoc.CaHoc,
                            ngayHocTrongTuan = lopHoc.NgayHocTrongTuan,
                            donGiaBuoiDay = lopHoc.DonGiaBuoiDay,
                            thoiLuongGio = lopHoc.ThoiLuongGio,
                            soLuongToiDa = lopHoc.SoLuongToiDa,
                            trangThai = lopHoc.TrangThai,
                            message = "Lớp học đã được tạo thành công"
                        };

                        return CreatedAtAction(nameof(GetLopHocById), new { id = lopHoc.LopID }, responseData);
                    }
                    catch (Exception responseEx)
                    {
                        _logger.LogError(responseEx, "Lỗi khi tạo response sau khi lưu thành công lớp học với ID: {LopID}", lopHoc.LopID);
                        // Trả về response đơn giản nếu có lỗi serialization
                        return Ok(new
                        {
                            lopID = lopHoc.LopID,
                            message = "Lớp học đã được tạo thành công",
                            note = "Có lỗi khi tạo response chi tiết"
                        });
                    }
                }
                catch (DbUpdateException dbEx)
                {
                    // Kiểm tra lỗi constraint cụ thể
                    if (dbEx.InnerException?.Message.Contains("FOREIGN KEY") == true)
                    {
                        return BadRequest(new { message = "Lỗi ràng buộc dữ liệu: Một trong các ID (Khóa học, Giảng viên, Địa điểm) không tồn tại" });
                    }
                    else if (dbEx.InnerException?.Message.Contains("CHECK") == true)
                    {
                        return BadRequest(new { message = "Dữ liệu không thỏa mãn ràng buộc kiểm tra trong database" });
                    }
                    else if (dbEx.InnerException?.Message.Contains("UNIQUE") == true)
                    {
                        return BadRequest(new { message = "Dữ liệu bị trùng lặp: Có thể đã tồn tại lớp học với thông tin tương tự" });
                    }

                    return BadRequest(new { message = "Lỗi khi lưu dữ liệu vào database", error = dbEx.InnerException?.Message });
                }
                catch (Exception saveEx)
                {
                    return BadRequest(new { message = "Lỗi không xác định khi lưu lớp học", error = saveEx.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server nội bộ", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        private LopHoc ParseLopHocFromRequest(object requestData, int? expectedLopId = null)
        {
            try
            {
                // Serialize object to JSON string, then deserialize to JsonDocument for proper access
                var jsonString = System.Text.Json.JsonSerializer.Serialize(requestData);
                _logger.LogInformation("Parsing LopHoc data: {RequestData}", jsonString);

                using var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);
                var root = jsonDoc.RootElement;

                // Helper function to get value from JsonElement
                string? GetStringValue(string propertyName)
                {
                    if (root.TryGetProperty(propertyName, out var property))
                    {
                        return property.ValueKind switch
                        {
                            System.Text.Json.JsonValueKind.String => property.GetString(),
                            System.Text.Json.JsonValueKind.Number => property.GetInt32().ToString(),
                            _ => property.ToString()
                        };
                    }
                    return null;
                }

                int? GetIntValue(string propertyName)
                {
                    if (root.TryGetProperty(propertyName, out var property))
                    {
                        return property.ValueKind switch
                        {
                            System.Text.Json.JsonValueKind.Number => property.GetInt32(),
                            System.Text.Json.JsonValueKind.String when int.TryParse(property.GetString(), out var value) => value,
                            _ => null
                        };
                    }
                    return null;
                }

                decimal? GetDecimalValue(string propertyName)
                {
                    if (root.TryGetProperty(propertyName, out var property))
                    {
                        return property.ValueKind switch
                        {
                            System.Text.Json.JsonValueKind.Number => property.GetDecimal(),
                            System.Text.Json.JsonValueKind.String when decimal.TryParse(property.GetString(), out var value) => value,
                            _ => null
                        };
                    }
                    return null;
                }

                // Parse ngày tháng với định dạng chuẩn
                DateTime ngayBatDau = DateTime.Today;
                var ngayBatDauStr = GetStringValue("ngayBatDau");
                if (!string.IsNullOrEmpty(ngayBatDauStr))
                {
                    if (DateTime.TryParse(ngayBatDauStr, out var parsedDate))
                    {
                        ngayBatDau = parsedDate;
                    }
                    else
                    {
                        // Thử parse với format khác
                        ngayBatDau = DateTime.Parse(ngayBatDauStr);
                    }
                }

                // Parse các số liệu với xử lý lỗi tốt hơn
                decimal donGiaBuoiDay = 0;
                var donGiaValue = GetDecimalValue("donGiaBuoiDay");
                if (donGiaValue.HasValue)
                {
                    donGiaBuoiDay = donGiaValue.Value;
                }

                decimal thoiLuongGio = 1.5m;
                var thoiLuongValue = GetDecimalValue("thoiLuongGio");
                if (thoiLuongValue.HasValue)
                {
                    thoiLuongGio = thoiLuongValue.Value;
                }

                int? soLuongToiDa = 0; // Mặc định là 0 thay vì null
                var soLuongValue = GetIntValue("soLuongToiDa");
                if (soLuongValue.HasValue)
                {
                    soLuongToiDa = soLuongValue.Value;
                }

                // Parse các ID với xử lý lỗi tốt hơn
                int lopID = expectedLopId ?? 0;
                var lopIDValue = GetIntValue("lopID");
                if (lopIDValue.HasValue)
                {
                    lopID = lopIDValue.Value;
                }

                int khoaHocID = 0;
                var khoaHocValue = GetIntValue("khoaHocID");
                if (khoaHocValue.HasValue)
                {
                    khoaHocID = khoaHocValue.Value;
                }

                int giangVienID = 0;
                var giangVienValue = GetIntValue("giangVienID");
                if (giangVienValue.HasValue)
                {
                    giangVienID = giangVienValue.Value;
                }

                int? diaDiemID = null;
                var diaDiemValue = GetIntValue("diaDiemID");
                if (diaDiemValue.HasValue)
                {
                    diaDiemID = diaDiemValue.Value;
                }

                // Parse các string fields
                string caHoc = GetStringValue("caHoc") ?? "";
                string ngayHocTrongTuan = GetStringValue("ngayHocTrongTuan") ?? "";
                string trangThai = GetStringValue("trangThai") ?? "ChuaBatDau";

                var lopHoc = new LopHoc
                {
                    LopID = lopID,
                    KhoaHocID = khoaHocID,
                    GiangVienID = giangVienID,
                    DiaDiemID = diaDiemID,
                    NgayBatDau = ngayBatDau,
                    NgayKetThuc = null, // Để tự động tính
                    CaHoc = caHoc,
                    NgayHocTrongTuan = ngayHocTrongTuan,
                    DonGiaBuoiDay = donGiaBuoiDay,
                    ThoiLuongGio = thoiLuongGio,
                    SoLuongToiDa = soLuongToiDa,
                    TrangThai = trangThai
                };

                return lopHoc;
            }
            catch (Exception ex)
            {
                // Log lỗi để debug
                _logger.LogError(ex, "Lỗi khi parse dữ liệu từ request: {RequestData}", requestData?.ToString());
                return null;
            }
        }

        // PUT: api/LopHoc/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLopHoc(int id, [FromBody] object requestData, [FromQuery] bool skipScheduleCheck = false, [FromQuery] string checkOnly = "")
        {
            try
            {
                _logger.LogInformation("Bắt đầu cập nhật lớp học với ID: {Id}", id);

                // Kiểm tra lớp học có tồn tại không
                var existingLopHoc = await _lopHocRepository.GetByIdAsync(id);
                if (existingLopHoc == null)
                {
                    _logger.LogWarning("Không tìm thấy lớp học với ID: {Id}", id);
                    return NotFound(new { message = $"Không tìm thấy lớp học với ID {id}" });
                }

                // Parse dữ liệu từ request với validation nghiêm ngặt
                var lopHocData = ParseLopHocFromRequest(requestData, id);
                if (lopHocData == null)
                {
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ hoặc thiếu thông tin bắt buộc" });
                }

                // Đảm bảo ID từ URL khớp với ID trong dữ liệu
                if (lopHocData.LopID != id)
                {
                    _logger.LogWarning("ID mismatch: URL ID {UrlId} không khớp với body ID {BodyId}", id, lopHocData.LopID);
                    return BadRequest(new { message = $"ID lớp học không khớp. URL chứa ID {id} nhưng dữ liệu chứa ID {lopHocData.LopID}" });
                }

                // Cập nhật dữ liệu vào existingLopHoc thay vì tạo entity mới để tránh conflict tracking
                existingLopHoc.KhoaHocID = lopHocData.KhoaHocID;
                existingLopHoc.GiangVienID = lopHocData.GiangVienID;
                existingLopHoc.DiaDiemID = lopHocData.DiaDiemID;
                existingLopHoc.NgayBatDau = lopHocData.NgayBatDau;
                existingLopHoc.NgayKetThuc = lopHocData.NgayKetThuc;
                existingLopHoc.CaHoc = lopHocData.CaHoc;
                existingLopHoc.NgayHocTrongTuan = lopHocData.NgayHocTrongTuan;
                existingLopHoc.DonGiaBuoiDay = lopHocData.DonGiaBuoiDay;
                existingLopHoc.ThoiLuongGio = lopHocData.ThoiLuongGio;
                existingLopHoc.SoLuongToiDa = lopHocData.SoLuongToiDa;
                existingLopHoc.TrangThai = lopHocData.TrangThai;

                // Validate model với kiểm tra bổ sung trên existingLopHoc
                var validationContext = new ValidationContext(existingLopHoc, serviceProvider: null, items: null);
                var validationResults = new List<ValidationResult>();
                bool isValid = Validator.TryValidateObject(existingLopHoc, validationContext, validationResults, true);

                if (!isValid)
                {
                    var errors = validationResults.Select(v => v.ErrorMessage).ToList();
                    return BadRequest(new { message = "Dữ liệu không hợp lệ", errors = errors });
                }

                // Kiểm tra bổ sung về logic nghiệp vụ (chỉ kiểm tra các trường bắt buộc)
                if (existingLopHoc.KhoaHocID <= 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn khóa học" });
                }

                if (existingLopHoc.GiangVienID <= 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn giảng viên" });
                }

                if (existingLopHoc.NgayBatDau == default(DateTime))
                {
                    return BadRequest(new { message = "Vui lòng chọn ngày bắt đầu" });
                }

                // Kiểm tra khóa học tồn tại
                var khoaHoc = await _context.KhoaHocs.FindAsync(existingLopHoc.KhoaHocID);
                if (khoaHoc == null)
                {
                    return BadRequest(new { message = $"Không tìm thấy khóa học với ID {existingLopHoc.KhoaHocID}" });
                }

                // Kiểm tra giảng viên tồn tại
                var giangVien = await _context.GiangViens.FindAsync(existingLopHoc.GiangVienID);
                if (giangVien == null)
                {
                    return BadRequest(new { message = $"Không tìm thấy giảng viên với ID {existingLopHoc.GiangVienID}" });
                }

                // Kiểm tra địa điểm nếu có
                if (existingLopHoc.DiaDiemID.HasValue)
                {
                    var diaDiem = await _context.DiaDiems.FindAsync(existingLopHoc.DiaDiemID.Value);
                    if (diaDiem == null)
                    {
                        return BadRequest(new { message = $"Không tìm thấy địa điểm với ID {existingLopHoc.DiaDiemID.Value}" });
                    }
                }

                // Tính toán ngày kết thúc tự động nếu chưa có
                if (!existingLopHoc.NgayKetThuc.HasValue && existingLopHoc.KhoaHocID > 0)
                {
                    var ngayKetThuc = await _lopHocRepository.CalculateEndDate(
                        existingLopHoc.KhoaHocID,
                        existingLopHoc.NgayBatDau
                    );
                    existingLopHoc.NgayKetThuc = ngayKetThuc;
                }

                // Kiểm tra lại các ràng buộc trước khi cập nhật
                try
                {
                    _logger.LogInformation("Đang kiểm tra ràng buộc trước khi cập nhật lớp học với ID: {LopID}", existingLopHoc.LopID);

                    // Tính toán ngày kết thúc của lớp học mới
                    var ngayKetThucMoi = await _lopHocRepository.CalculateEndDate(existingLopHoc.KhoaHocID, existingLopHoc.NgayBatDau);
                    _logger.LogInformation("Ngày kết thúc tính toán được: {NgayKetThuc}", ngayKetThucMoi);

                    // So sánh dữ liệu cũ và mới để xác định những gì đã thay đổi
                    var changes = CompareLopHocChanges(existingLopHoc, lopHocData);
                    _logger.LogInformation("Các thay đổi được phát hiện: GiangVien={GiangVienChanged}, DiaDiem={DiaDiemChanged}, NgayHoc={NgayHocChanged}, CaHoc={CaHocChanged}, NgayBatDau={NgayBatDauChanged}",
                        changes.GiangVienChanged, changes.DiaDiemChanged, changes.NgayHocChanged, changes.CaHocChanged, changes.NgayBatDauChanged);

                    // Bỏ qua kiểm tra lịch trùng nếu được yêu cầu
                    if (!skipScheduleCheck)
                    {
                        _logger.LogInformation("Đang kiểm tra lịch trùng...");

                        // Chỉ kiểm tra xung đột giảng viên nếu giảng viên thay đổi
                        if (changes.GiangVienChanged)
                        {
                            _logger.LogInformation("Kiểm tra xung đột lịch giảng viên vì giảng viên đã thay đổi");
                            var giangVienConflict = await CheckGiangVienScheduleConflict(_context, existingLopHoc.GiangVienID, existingLopHoc.NgayHocTrongTuan, existingLopHoc.CaHoc, existingLopHoc.NgayBatDau, ngayKetThucMoi, existingLopHoc.LopID);
                            if (giangVienConflict.HasConflict)
                            {
                                _logger.LogWarning("Phát hiện xung đột lịch giảng viên: {ConflictInfo}", giangVienConflict.ConflictingClassInfo);
                                return BadRequest(new
                                {
                                    message = $"Giảng viên có lịch trùng với lớp học: {giangVienConflict.ConflictingClassInfo}",
                                    giangVienID = existingLopHoc.GiangVienID,
                                    ngayHocTrongTuan = existingLopHoc.NgayHocTrongTuan,
                                    caHoc = existingLopHoc.CaHoc,
                                    ngayBatDau = existingLopHoc.NgayBatDau.ToString("yyyy-MM-dd"),
                                    ngayKetThuc = ngayKetThucMoi.ToString("yyyy-MM-dd"),
                                    conflictingClassId = giangVienConflict.ConflictingClassId,
                                    conflictReason = giangVienConflict.Reason
                                });
                            }
                        }
                        else
                        {
                            _logger.LogInformation("Bỏ qua kiểm tra xung đột giảng viên vì giảng viên không thay đổi");
                        }

                        // Chỉ kiểm tra xung đột địa điểm nếu địa điểm thay đổi hoặc các yếu tố ảnh hưởng đến lịch học thay đổi
                        if (changes.DiaDiemChanged || changes.NgayHocChanged || changes.CaHocChanged || changes.NgayBatDauChanged)
                        {
                            if (existingLopHoc.DiaDiemID.HasValue)
                            {
                                _logger.LogInformation("Kiểm tra xung đột lịch địa điểm vì địa điểm hoặc lịch học đã thay đổi");
                                var diaDiemConflict = await CheckDiaDiemScheduleConflict(_context, existingLopHoc.DiaDiemID.Value, existingLopHoc.NgayHocTrongTuan, existingLopHoc.CaHoc, existingLopHoc.NgayBatDau, ngayKetThucMoi, existingLopHoc.LopID);
                                if (diaDiemConflict.HasConflict)
                                {
                                    _logger.LogWarning("Phát hiện xung đột lịch địa điểm: {ConflictInfo}", diaDiemConflict.ConflictingClassInfo);
                                    return BadRequest(new
                                    {
                                        message = $"Địa điểm có lịch trùng với lớp học: {diaDiemConflict.ConflictingClassInfo}",
                                        diaDiemID = existingLopHoc.DiaDiemID,
                                        ngayHocTrongTuan = existingLopHoc.NgayHocTrongTuan,
                                        caHoc = existingLopHoc.CaHoc,
                                        ngayBatDau = existingLopHoc.NgayBatDau.ToString("yyyy-MM-dd"),
                                        ngayKetThuc = ngayKetThucMoi.ToString("yyyy-MM-dd"),
                                        conflictingClassId = diaDiemConflict.ConflictingClassId,
                                        conflictReason = diaDiemConflict.Reason
                                    });
                                }
                            }
                            else
                            {
                                _logger.LogInformation("Bỏ qua kiểm tra xung đột địa điểm vì lớp học không có địa điểm được chỉ định");
                            }
                        }
                        else
                        {
                            _logger.LogInformation("Bỏ qua kiểm tra xung đột địa điểm vì không có thay đổi nào ảnh hưởng đến lịch học");
                        }

                        _logger.LogInformation("Không tìm thấy xung đột lịch trình");
                    }
                    else
                    {
                        _logger.LogWarning("BỎ QUA KIỂM TRA LỊCH TRÙNG theo yêu cầu của người dùng");
                    }

                    _logger.LogInformation("Bắt đầu cập nhật lớp học vào database...");
                    await _lopHocRepository.UpdateAsync(existingLopHoc);

                    _logger.LogInformation("Lớp học đã được cập nhật thành công với ID: {LopID}", existingLopHoc.LopID);

                    // Trả về response với dữ liệu đã cập nhật
                    var responseData = new
                    {
                        lopID = existingLopHoc.LopID,
                        khoaHocID = existingLopHoc.KhoaHocID,
                        giangVienID = existingLopHoc.GiangVienID,
                        diaDiemID = existingLopHoc.DiaDiemID,
                        ngayBatDau = existingLopHoc.NgayBatDau.ToString("yyyy-MM-dd"),
                        ngayKetThuc = existingLopHoc.NgayKetThuc?.ToString("yyyy-MM-dd"),
                        caHoc = existingLopHoc.CaHoc,
                        ngayHocTrongTuan = existingLopHoc.NgayHocTrongTuan,
                        donGiaBuoiDay = existingLopHoc.DonGiaBuoiDay,
                        thoiLuongGio = existingLopHoc.ThoiLuongGio,
                        soLuongToiDa = existingLopHoc.SoLuongToiDa,
                        trangThai = existingLopHoc.TrangThai,
                        message = "Lớp học đã được cập nhật thành công"
                    };

                    return Ok(responseData);
                }
                catch (DbUpdateException dbEx)
                {
                    // Kiểm tra lỗi constraint cụ thể
                    if (dbEx.InnerException?.Message.Contains("FOREIGN KEY") == true)
                    {
                        return BadRequest(new { message = "Lỗi ràng buộc dữ liệu: Một trong các ID (Khóa học, Giảng viên, Địa điểm) không tồn tại" });
                    }
                    else if (dbEx.InnerException?.Message.Contains("CHECK") == true)
                    {
                        return BadRequest(new { message = "Dữ liệu không thỏa mãn ràng buộc kiểm tra trong database" });
                    }
                    else if (dbEx.InnerException?.Message.Contains("UNIQUE") == true)
                    {
                        return BadRequest(new { message = "Dữ liệu bị trùng lặp: Có thể đã tồn tại lớp học với thông tin tương tự" });
                    }

                    return BadRequest(new { message = "Lỗi khi cập nhật dữ liệu vào database", error = dbEx.InnerException?.Message });
                }
                catch (Exception saveEx)
                {
                    return BadRequest(new { message = "Lỗi không xác định khi cập nhật lớp học", error = saveEx.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server nội bộ", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // POST: api/LopHoc/5/calculate-end-date
        [HttpPost("{id}/calculate-end-date")]
        public async Task<ActionResult<DateTime?>> CalculateEndDate(int id)
        {
            var lopHoc = await _lopHocRepository.GetByIdAsync(id);
            if (lopHoc == null)
            {
                return NotFound();
            }

            // Tính toán ngày kết thúc dựa trên khóa học và ngày bắt đầu
            var ngayKetThuc = await _lopHocRepository.CalculateEndDate(lopHoc.KhoaHocID, lopHoc.NgayBatDau);

            // Cập nhật ngày kết thúc vào database
            var success = await _lopHocRepository.UpdateEndDateAsync(id, ngayKetThuc);

            if (!success)
            {
                return BadRequest("Không thể cập nhật ngày kết thúc. Lớp học không tồn tại.");
            }

            return Ok(ngayKetThuc);
        }

        // DELETE: api/LopHoc/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLopHoc(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("=== BẮT ĐẦU XÓA LỚP HỌC VỚI ID: {LopID} ===", id);

                // Kiểm tra lớp học có tồn tại không
                var lopHoc = await _lopHocRepository.GetByIdAsync(id);
                if (lopHoc == null)
                {
                    _logger.LogWarning("Không tìm thấy lớp học với ID: {LopID}", id);
                    return NotFound(new { message = $"Không tìm thấy lớp học với ID {id}" });
                }

                _logger.LogInformation("Tìm thấy lớp học: {TenKhoaHoc} - {NgayBatDau}",
                    lopHoc.KhoaHoc?.TenKhoaHoc ?? "N/A",
                    lopHoc.NgayBatDau.ToString("yyyy-MM-dd"));

                // Cho phép xóa lớp học ở bất kỳ trạng thái nào (kể cả đang học)
                // Chỉ cần đảm bảo không có ràng buộc dữ liệu

                // KIỂM TRA CÁC BẢNG LIÊN QUAN TRƯỚC KHI XÓA
                _logger.LogInformation("=== KIỂM TRA CÁC RÀNG BUỘC ===");

                // 1. Kiểm tra BuoiHoc (Bảng lá nhất - phải xóa đầu tiên)
                var buoiHocCount = await _context.BuoiHocs.CountAsync(b => b.LopID == id);
                _logger.LogInformation("Số buổi học liên quan: {Count}", buoiHocCount);

                // 2. Kiểm tra DangKyLop
                var dangKyLopCount = await _context.DangKyLops.CountAsync(d => d.LopID == id);
                _logger.LogInformation("Số đăng ký lớp liên quan: {Count}", dangKyLopCount);

                // 3. Kiểm tra ChiPhi
                var chiPhiCount = await _context.ChiPhis.CountAsync(c => c.LopID == id);
                _logger.LogInformation("Số chi phí liên quan: {Count}", chiPhiCount);

                // 4. Kiểm tra DiemSo
                var diemSoCount = await _context.DiemSos.CountAsync(d => d.LopID == id);
                _logger.LogInformation("Số điểm số liên quan: {Count}", diemSoCount);

                // BẮT ĐẦU XÓA THEO THỨ TỰ ĐÚNG (TỪ BẢNG LÁ ĐẾN BẢNG GỐC)
                _logger.LogInformation("=== BẮT ĐẦU XÓA DỮ LIỆU ===");

                // 1. Xóa DiemDanh trước (lá nhất)
                var diemDanhCount = await _context.DiemDanhs.CountAsync(d => d.BuoiHoc.LopID == id);
                if (diemDanhCount > 0)
                {
                    var deletedDiemDanh = await _context.Database.ExecuteSqlRawAsync(
                        "DELETE dd FROM DiemDanh dd INNER JOIN BuoiHoc bh ON dd.BuoiHocID = bh.BuoiHocID WHERE bh.LopID = {0}", id);
                    _logger.LogInformation("Đã xóa {Count} điểm danh liên quan", deletedDiemDanh);
                }

                // 2. Xóa DiemSo liên quan đến các buổi học của lớp
                if (diemSoCount > 0)
                {
                    var deletedDiemSo = await _context.Database.ExecuteSqlRawAsync(
                        "DELETE ds FROM DiemSo ds INNER JOIN BuoiHoc bh ON ds.BuoiHocID = bh.BuoiHocID WHERE bh.LopID = {0}", id);
                    _logger.LogInformation("Đã xóa {Count} điểm số liên quan", deletedDiemSo);
                }

                // 3. Xóa BuoiHoc (bảng lá)
                if (buoiHocCount > 0)
                {
                    var deletedBuoiHoc = await _context.Database.ExecuteSqlRawAsync("DELETE FROM BuoiHoc WHERE LopID = {0}", id);
                    _logger.LogInformation("Đã xóa {Count} buổi học", deletedBuoiHoc);
                }

                // 4. Xóa ThanhToan liên quan đến đăng ký lớp
                if (dangKyLopCount > 0)
                {
                    var thanhToanCount = await _context.ThanhToans.CountAsync(t => t.DangKyLop.LopID == id);
                    if (thanhToanCount > 0)
                    {
                        var deletedThanhToan = await _context.Database.ExecuteSqlRawAsync(
                            "DELETE tt FROM ThanhToan tt INNER JOIN DangKyLop dk ON tt.DangKyID = dk.DangKyID WHERE dk.LopID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} thanh toán liên quan", deletedThanhToan);
                    }
                }

                // 5. Xóa BaoLuu liên quan đến đăng ký lớp
                if (dangKyLopCount > 0)
                {
                    var baoLuuCount = await _context.BaoLuus.CountAsync(b => b.DangKyLop.LopID == id);
                    if (baoLuuCount > 0)
                    {
                        var deletedBaoLuu = await _context.Database.ExecuteSqlRawAsync(
                            "DELETE bl FROM BaoLuu bl INNER JOIN DangKyLop dk ON bl.DangKyID = dk.DangKyID WHERE dk.LopID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} bảo lưu liên quan", deletedBaoLuu);
                    }
                }

                // 6. Xóa ViHocVien liên quan đến đăng ký lớp
                if (dangKyLopCount > 0)
                {
                    var viHocVienCount = await _context.ViHocViens.CountAsync(v => v.DangKyLop.LopID == id);
                    if (viHocVienCount > 0)
                    {
                        var deletedViHocVien = await _context.Database.ExecuteSqlRawAsync(
                            "DELETE vv FROM ViHocVien vv INNER JOIN DangKyLop dk ON vv.DangKyID = dk.DangKyID WHERE dk.LopID = {0}", id);
                        _logger.LogInformation("Đã xóa {Count} ví học viên liên quan", deletedViHocVien);
                    }
                }

                // 7. Xóa DangKyLop
                if (dangKyLopCount > 0)
                {
                    var deletedDangKyLop = await _context.Database.ExecuteSqlRawAsync("DELETE FROM DangKyLop WHERE LopID = {0}", id);
                    _logger.LogInformation("Đã xóa {Count} đăng ký lớp", deletedDangKyLop);
                }

                // 8. Xóa ChiPhi (có thể null)
                if (chiPhiCount > 0)
                {
                    var deletedChiPhi = await _context.Database.ExecuteSqlRawAsync("DELETE FROM ChiPhi WHERE LopID = {0}", id);
                    _logger.LogInformation("Đã xóa {Count} chi phí", deletedChiPhi);
                }

                // 9. Xóa DiemSo trực tiếp liên quan đến lớp (nếu còn sót)
                if (diemSoCount > 0)
                {
                    var deletedDiemSoDirect = await _context.Database.ExecuteSqlRawAsync("DELETE FROM DiemSo WHERE LopID = {0}", id);
                    _logger.LogInformation("Đã xóa {Count} điểm số trực tiếp", deletedDiemSoDirect);
                }

                // 10. Cuối cùng, xóa lớp học
                _logger.LogInformation("Đang xóa lớp học với ID: {LopID}", id);
                var deleteResult = await _context.Database.ExecuteSqlRawAsync("DELETE FROM LopHoc WHERE LopID = {0}", id);

                if (deleteResult == 0)
                {
                    throw new Exception($"Không thể xóa lớp học với ID {id} hoặc lớp học không tồn tại");
                }

                // Commit transaction
                await transaction.CommitAsync();

                _logger.LogInformation("=== LỚP HỌC ĐÃ ĐƯỢC XÓA THÀNH CÔNG ===");
                _logger.LogInformation("LopID: {LopID}, TenKhoaHoc: {TenKhoaHoc}, NgayBatDau: {NgayBatDau}",
                    id, lopHoc.KhoaHoc?.TenKhoaHoc ?? "N/A", lopHoc.NgayBatDau.ToString("yyyy-MM-dd"));

                return Ok(new
                {
                    message = "Lớp học đã được xóa thành công",
                    lopID = id,
                    tenKhoaHoc = lopHoc.KhoaHoc?.TenKhoaHoc ?? "Không xác định",
                    ngayBatDau = lopHoc.NgayBatDau.ToString("yyyy-MM-dd"),
                    deletedRecords = new
                    {
                        buoiHoc = buoiHocCount,
                        dangKyLop = dangKyLopCount,
                        chiPhi = chiPhiCount,
                        diemSo = diemSoCount,
                        diemDanh = diemDanhCount
                    }
                });
            }
            catch (DbUpdateException dbEx)
            {
                await transaction.RollbackAsync();
                _logger.LogError(dbEx, "Lỗi database khi xóa lớp học với ID: {LopID}", id);

                // Kiểm tra lỗi constraint cụ thể
                if (dbEx.InnerException?.Message.Contains("FOREIGN KEY") == true)
                {
                    return BadRequest(new
                    {
                        message = "Không thể xóa lớp học vì vẫn còn dữ liệu liên quan chưa được xử lý.",
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
                    message = "Lỗi khi xóa lớp học khỏi database",
                    error = dbEx.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi không xác định khi xóa lớp học với ID: {LopID}", id);
                return StatusCode(500, new
                {
                    message = "Lỗi server nội bộ khi xóa lớp học",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Kiểm tra lịch học của giảng viên có bị trùng không
        /// </summary>
        private async Task<(bool HasConflict, string ConflictingClassInfo, int ConflictingClassId, string Reason)> CheckGiangVienScheduleConflict(
            IZONEDbContext context, int giangVienId, string ngayHocTrongTuan, string caHoc, DateTime ngayBatDau, DateTime ngayKetThuc, int? excludeLopId = null)
        {
            _logger.LogInformation("=== BẮT ĐẦU KIỂM TRA XUNG ĐỘT GIẢNG VIÊN ===");
            _logger.LogInformation("GiangVienID: {GiangVienID}, NgayHocTrongTuan: {NgayHocTrongTuan}, CaHoc: {CaHoc}", giangVienId, ngayHocTrongTuan, caHoc);
            _logger.LogInformation("NgayBatDau: {NgayBatDau}, NgayKetThuc: {NgayKetThuc}, ExcludeLopID: {ExcludeLopID}", ngayBatDau, ngayKetThuc, excludeLopId);

            // Lấy tất cả lớp học của giảng viên (LOẠI TRỪ lớp đang cập nhật và lớp đã kết thúc)
            var existingClasses = await context.LopHocs
                .Where(l => l.GiangVienID == giangVienId
                       && l.TrangThai != "DaKetThuc"  // Loại trừ lớp đã kết thúc
                       && (excludeLopId == null || l.LopID != excludeLopId))  // Loại trừ lớp đang cập nhật
                .Include(l => l.KhoaHoc)
                .ToListAsync();

            _logger.LogInformation("Tìm thấy {Count} lớp học của giảng viên (sau khi loại trừ)", existingClasses.Count);

            foreach (var existingClass in existingClasses)
            {
                _logger.LogInformation("Kiểm tra lớp ID {LopID}: NgayHocTrongTuan='{NgayHoc}', CaHoc='{CaHoc}', NgayBatDau={NgayBatDau}, NgayKetThuc={NgayKetThuc}",
                    existingClass.LopID, existingClass.NgayHocTrongTuan, existingClass.CaHoc, existingClass.NgayBatDau, existingClass.NgayKetThuc);

                // KIỂM TRA ĐIỀU KIỆN 1: Có ngày trong tuần trùng nhau không
                bool hasOverlappingDays = HasOverlappingDays(ngayHocTrongTuan, existingClass.NgayHocTrongTuan ?? "");
                _logger.LogInformation("Ngày trong tuần chồng chéo: {HasOverlappingDays}", hasOverlappingDays);

                if (!hasOverlappingDays) continue;

                // KIỂM TRA ĐIỀU KIỆN 2: Có ca học chồng nhau không
                bool hasOverlappingTimeSlots = HasOverlappingTimeSlots(caHoc, existingClass.CaHoc ?? "");
                _logger.LogInformation("Ca học chồng chéo: {HasOverlappingTimeSlots}", hasOverlappingTimeSlots);

                if (!hasOverlappingTimeSlots) continue;

                // KIỂM TRA ĐIỀU KIỆN 3: Có chồng chéo thời gian không
                if (existingClass.NgayKetThuc.HasValue)
                {
                    bool isDateOverlapping = IsDateRangeOverlapping(ngayBatDau, ngayKetThuc, existingClass.NgayBatDau, existingClass.NgayKetThuc.Value);
                    _logger.LogInformation("Thời gian chồng chéo: {IsDateOverlapping}", isDateOverlapping);

                    if (isDateOverlapping)
                    {
                        var conflictInfo = $"{existingClass.KhoaHoc?.TenKhoaHoc ?? $"Lớp ID {existingClass.LopID}"} (từ {existingClass.NgayBatDau:dd/MM/yyyy} đến {existingClass.NgayKetThuc.Value:dd/MM/yyyy})";
                        _logger.LogWarning("PHÁT HIỆN XUNG ĐỘT: {ConflictInfo}", conflictInfo);

                        return (
                            true,
                            conflictInfo,
                            existingClass.LopID,
                            $"Lớp mới từ {ngayBatDau:dd/MM/yyyy} đến {ngayKetThuc:dd/MM/yyyy} chồng với lớp hiện tại từ {existingClass.NgayBatDau:dd/MM/yyyy} đến {existingClass.NgayKetThuc.Value:dd/MM/yyyy}"
                        );
                    }
                }
                else
                {
                    // Nếu lớp hiện tại chưa có ngày kết thúc, coi như có xung đột để an toàn
                    var conflictInfo = $"{existingClass.KhoaHoc?.TenKhoaHoc ?? $"Lớp ID {existingClass.LopID}"} (chưa có ngày kết thúc)";
                    _logger.LogWarning("PHÁT HIỆN XUNG ĐỘT: Lớp hiện tại chưa có ngày kết thúc - {ConflictInfo}", conflictInfo);

                    return (
                        true,
                        conflictInfo,
                        existingClass.LopID,
                        $"Lớp hiện tại chưa có ngày kết thúc nên không thể xác định xung đột chính xác"
                    );
                }
            }

            _logger.LogInformation("=== KHÔNG TÌM THẤY XUNG ĐỘT GIẢNG VIÊN ===");
            return (false, "", 0, "");
        }

        /// <summary>
        /// Kiểm tra lịch học của địa điểm có bị trùng không
        /// </summary>
        private async Task<(bool HasConflict, string ConflictingClassInfo, int ConflictingClassId, string Reason)> CheckDiaDiemScheduleConflict(
            IZONEDbContext context, int diaDiemId, string ngayHocTrongTuan, string caHoc, DateTime ngayBatDau, DateTime ngayKetThuc, int? excludeLopId = null)
        {
            _logger.LogInformation("=== BẮT ĐẦU KIỂM TRA XUNG ĐỘT ĐỊA ĐIỂM ===");
            _logger.LogInformation("DiaDiemID: {DiaDiemID}, NgayHocTrongTuan: {NgayHocTrongTuan}, CaHoc: {CaHoc}", diaDiemId, ngayHocTrongTuan, caHoc);
            _logger.LogInformation("NgayBatDau: {NgayBatDau}, NgayKetThuc: {NgayKetThuc}, ExcludeLopID: {ExcludeLopID}", ngayBatDau, ngayKetThuc, excludeLopId);

            // Lấy tất cả lớp học của địa điểm (LOẠI TRỪ lớp đang cập nhật và lớp đã kết thúc)
            var existingClasses = await context.LopHocs
                .Where(l => l.DiaDiemID == diaDiemId
                       && l.TrangThai != "DaKetThuc"  // Loại trừ lớp đã kết thúc
                       && (excludeLopId == null || l.LopID != excludeLopId))  // Loại trừ lớp đang cập nhật
                .Include(l => l.KhoaHoc)
                .ToListAsync();

            _logger.LogInformation("Tìm thấy {Count} lớp học của địa điểm (sau khi loại trừ)", existingClasses.Count);

            foreach (var existingClass in existingClasses)
            {
                _logger.LogInformation("Kiểm tra lớp ID {LopID}: NgayHocTrongTuan='{NgayHoc}', CaHoc='{CaHoc}', NgayBatDau={NgayBatDau}, NgayKetThuc={NgayKetThuc}",
                    existingClass.LopID, existingClass.NgayHocTrongTuan, existingClass.CaHoc, existingClass.NgayBatDau, existingClass.NgayKetThuc);

                // KIỂM TRA ĐIỀU KIỆN 1: Có ngày trong tuần trùng nhau không
                bool hasOverlappingDays = HasOverlappingDays(ngayHocTrongTuan, existingClass.NgayHocTrongTuan ?? "");
                _logger.LogInformation("Ngày trong tuần chồng chéo: {HasOverlappingDays}", hasOverlappingDays);

                if (!hasOverlappingDays) continue;

                // KIỂM TRA ĐIỀU KIỆN 2: Có ca học chồng nhau không
                bool hasOverlappingTimeSlots = HasOverlappingTimeSlots(caHoc, existingClass.CaHoc ?? "");
                _logger.LogInformation("Ca học chồng chéo: {HasOverlappingTimeSlots}", hasOverlappingTimeSlots);

                if (!hasOverlappingTimeSlots) continue;

                // KIỂM TRA ĐIỀU KIỆN 3: Có chồng chéo thời gian không
                if (existingClass.NgayKetThuc.HasValue)
                {
                    bool isDateOverlapping = IsDateRangeOverlapping(ngayBatDau, ngayKetThuc, existingClass.NgayBatDau, existingClass.NgayKetThuc.Value);
                    _logger.LogInformation("Thời gian chồng chéo: {IsDateOverlapping}", isDateOverlapping);

                    if (isDateOverlapping)
                    {
                        var conflictInfo = $"{existingClass.KhoaHoc?.TenKhoaHoc ?? $"Lớp ID {existingClass.LopID}"} (từ {existingClass.NgayBatDau:dd/MM/yyyy} đến {existingClass.NgayKetThuc.Value:dd/MM/yyyy})";
                        _logger.LogWarning("PHÁT HIỆN XUNG ĐỘT: {ConflictInfo}", conflictInfo);

                        return (
                            true,
                            conflictInfo,
                            existingClass.LopID,
                            $"Lớp mới từ {ngayBatDau:dd/MM/yyyy} đến {ngayKetThuc:dd/MM/yyyy} chồng với lớp hiện tại từ {existingClass.NgayBatDau:dd/MM/yyyy} đến {existingClass.NgayKetThuc.Value:dd/MM/yyyy}"
                        );
                    }
                }
            }

            _logger.LogInformation("=== KHÔNG TÌM THẤY XUNG ĐỘT ĐỊA ĐIỂM ===");
            return (false, "", 0, "");
        }

        /// <summary>
        /// Kiểm tra hai khoảng thời gian có chồng chéo nhau không
        /// </summary>
        private bool IsDateRangeOverlapping(DateTime start1, DateTime end1, DateTime start2, DateTime end2)
        {
            // Hai khoảng thời gian chồng chéo nếu:
            // Khoảng 1 bắt đầu trước hoặc cùng lúc khoảng 2 kết thúc VÀ khoảng 1 kết thúc sau hoặc cùng lúc khoảng 2 bắt đầu
            return start1 <= end2 && end1 >= start2;
        }

        /// <summary>
        /// Kiểm tra hai danh sách ngày trong tuần có ngày trùng nhau không
        /// </summary>
        private bool HasOverlappingDays(string days1, string days2)
        {
            if (string.IsNullOrEmpty(days1) || string.IsNullOrEmpty(days2))
                return false;

            var daysList1 = days1.Split(',').Select(d => d.Trim()).Where(d => !string.IsNullOrEmpty(d)).ToList();
            var daysList2 = days2.Split(',').Select(d => d.Trim()).Where(d => !string.IsNullOrEmpty(d)).ToList();

            // Kiểm tra có ít nhất 1 ngày trùng nhau
            return daysList1.Intersect(daysList2).Any();
        }

        /// <summary>
        /// Kiểm tra hai ca học có chồng nhau không
        /// </summary>
        private bool HasOverlappingTimeSlots(string timeSlot1, string timeSlot2)
        {
            if (string.IsNullOrEmpty(timeSlot1) || string.IsNullOrEmpty(timeSlot2))
                return false;

            // Nếu cả hai đều chứa dấu ":" thì coi là định dạng giờ (ví dụ: "08:00-10:00")
            if (timeSlot1.Contains(":") && timeSlot2.Contains(":"))
            {
                return IsTimeSlotOverlapping(timeSlot1, timeSlot2);
            }

            // Nếu là tên ca (ví dụ: "Sáng", "Chiều") thì kiểm tra giống nhau
            return timeSlot1.Trim() == timeSlot2.Trim();
        }

        /// <summary>
        /// Kiểm tra hai khoảng thời gian trong ngày có chồng nhau không
        /// </summary>
        private bool IsTimeSlotOverlapping(string timeSlot1, string timeSlot2)
        {
            try
            {
                // Parse timeSlot1 (ví dụ: "08:00-10:00")
                var times1 = timeSlot1.Split('-');
                if (times1.Length != 2) return false;

                var start1 = TimeSpan.Parse(times1[0].Trim());
                var end1 = TimeSpan.Parse(times1[1].Trim());

                // Parse timeSlot2
                var times2 = timeSlot2.Split('-');
                if (times2.Length != 2) return false;

                var start2 = TimeSpan.Parse(times2[0].Trim());
                var end2 = TimeSpan.Parse(times2[1].Trim());

                // Kiểm tra chồng chéo: start1 <= end2 && end1 >= start2
                return start1 <= end2 && end1 >= start2;
            }
            catch
            {
                // Nếu không parse được, coi là tên ca và kiểm tra giống nhau
                return timeSlot1.Trim() == timeSlot2.Trim();
            }
        }

        /// <summary>
        /// So sánh dữ liệu lớp học cũ và mới để xác định những gì đã thay đổi
        /// </summary>
        private (bool GiangVienChanged, bool DiaDiemChanged, bool NgayHocChanged, bool CaHocChanged, bool NgayBatDauChanged) CompareLopHocChanges(LopHoc existingLopHoc, LopHoc newLopHocData)
        {
            return (
                GiangVienChanged: existingLopHoc.GiangVienID != newLopHocData.GiangVienID,
                DiaDiemChanged: existingLopHoc.DiaDiemID != newLopHocData.DiaDiemID,
                NgayHocChanged: existingLopHoc.NgayHocTrongTuan != newLopHocData.NgayHocTrongTuan,
                CaHocChanged: existingLopHoc.CaHoc != newLopHocData.CaHoc,
                NgayBatDauChanged: existingLopHoc.NgayBatDau != newLopHocData.NgayBatDau
            );
        }

        /// <summary>
        /// Áp dụng bộ lọc trạng thái cho danh sách lớp học
        /// </summary>
        private List<LopHoc> ApplyStatusFilter(List<LopHoc> lopHocs, string statusFilter)
        {
            if (statusFilter == "all")
                return lopHocs;

            var today = DateTime.Today;

            return lopHocs.Where(lopHoc =>
            {
                switch (statusFilter)
                {
                    case "upcoming":
                        // Chưa bắt đầu: ngày bắt đầu > hôm nay
                        return lopHoc.NgayBatDau > today;

                    case "ongoing":
                        // Đang diễn ra: ngày bắt đầu <= hôm nay và (chưa có ngày kết thúc hoặc ngày kết thúc >= hôm nay)
                        return lopHoc.NgayBatDau <= today &&
                               (!lopHoc.NgayKetThuc.HasValue || lopHoc.NgayKetThuc.Value >= today);

                    case "completed":
                        // Đã kết thúc: có ngày kết thúc và ngày kết thúc < hôm nay
                        return lopHoc.NgayKetThuc.HasValue && lopHoc.NgayKetThuc.Value < today;

                    default:
                        return true;
                }
            }).ToList();
        }

        /// <summary>
        /// Áp dụng bộ lọc tìm kiếm cho danh sách lớp học
        /// </summary>
        private List<LopHoc> ApplySearchFilter(List<LopHoc> lopHocs, string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return lopHocs;

            var searchLower = searchTerm.ToLower();

            return lopHocs.Where(lopHoc =>
            {
                // Tìm kiếm theo ID lớp
                if (lopHoc.LopID.ToString().Contains(searchLower))
                    return true;

                // Tìm kiếm theo ID khóa học
                if (lopHoc.KhoaHocID.ToString().Contains(searchLower))
                    return true;

                // Tìm kiếm theo ID giảng viên
                if (lopHoc.GiangVienID.ToString().Contains(searchLower))
                    return true;

                // Tìm kiếm theo tên khóa học (nếu có thông tin khóa học)
                if (lopHoc.KhoaHoc != null && lopHoc.KhoaHoc.TenKhoaHoc != null &&
                    lopHoc.KhoaHoc.TenKhoaHoc.ToLower().Contains(searchLower))
                    return true;

                // Tìm kiếm theo tên giảng viên (nếu có thông tin giảng viên)
                if (lopHoc.GiangVien != null && lopHoc.GiangVien.HoTen != null &&
                    lopHoc.GiangVien.HoTen.ToLower().Contains(searchLower))
                    return true;

                // Tìm kiếm theo địa điểm (nếu có thông tin địa điểm)
                if (lopHoc.DiaDiem != null && lopHoc.DiaDiem.TenCoSo != null &&
                    lopHoc.DiaDiem.TenCoSo.ToLower().Contains(searchLower))
                    return true;

                // Tìm kiếm theo trạng thái
                if (lopHoc.TrangThai != null && lopHoc.TrangThai.ToLower().Contains(searchLower))
                    return true;

                return false;
            }).ToList();
        }
    }
}
