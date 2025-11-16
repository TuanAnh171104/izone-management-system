using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IZONE.API.Controllers
{
    /// <summary>
    /// Controller xử lý các API liên quan đến báo cáo
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class BaoCaoController : ControllerBase
    {
        private readonly IBaoCaoService _baoCaoService;

        public BaoCaoController(IBaoCaoService baoCaoService)
        {
            _baoCaoService = baoCaoService;
        }

        /// <summary>
        /// Tạo báo cáo mới (chỉ trả về dữ liệu, không lưu vào database)
        /// </summary>
        [HttpPost("tao-bao-cao")]
        public async Task<IActionResult> TaoBaoCao([FromBody] TaoBaoCaoRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu đầu vào không hợp lệ",
                        errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                    });
                }

                // Tạm thời sử dụng user ID mặc định vì authentication bị tắt
                var userId = "admin";

                var result = await _baoCaoService.TaoBaoCaoAsync(request, userId);

                return Ok(new
                {
                    success = true,
                    message = "Tạo báo cáo thành công",
                    data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy báo cáo theo ID
        /// </summary>
        [HttpGet("{baoCaoId}")]
        public async Task<IActionResult> LayBaoCao(int baoCaoId)
        {
            try
            {
                var result = await _baoCaoService.LayBaoCaoAsync(baoCaoId);

                if (result == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy báo cáo"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy báo cáo",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách báo cáo với phân trang
        /// </summary>
        [HttpGet("danh-sach")]
        public async Task<IActionResult> LayDanhSachBaoCao([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _baoCaoService.LayDanhSachBaoCaoAsync(page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = result,
                    pagination = new
                    {
                        page,
                        pageSize,
                        hasNextPage = result.Count() == pageSize
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách báo cáo",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy báo cáo theo loại
        /// </summary>
        [HttpGet("theo-loai/{loaiBaoCao}")]
        public async Task<IActionResult> LayBaoCaoTheoLoai(string loaiBaoCao, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _baoCaoService.LayBaoCaoTheoLoaiAsync(loaiBaoCao, page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = result,
                    pagination = new
                    {
                        page,
                        pageSize,
                        hasNextPage = result.Count() == pageSize
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy báo cáo theo loại",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Xóa báo cáo
        /// </summary>
        [HttpDelete("{baoCaoId}")]
        public async Task<IActionResult> XoaBaoCao(int baoCaoId)
        {
            try
            {
                await _baoCaoService.XoaBaoCaoAsync(baoCaoId);

                return Ok(new
                {
                    success = true,
                    message = "Xóa báo cáo thành công"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xóa báo cáo",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy báo cáo gần đây
        /// </summary>
        [HttpGet("gan-day")]
        public async Task<IActionResult> LayBaoCaoGanDay([FromQuery] int count = 10)
        {
            try
            {
                var result = await _baoCaoService.LayBaoCaoGanDayAsync(count);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy báo cáo gần đây",
                    error = ex.Message
                });
            }
        }

        // Các API endpoints cho các loại báo cáo cụ thể

        /// <summary>
        /// Báo cáo tài chính tổng hợp
        /// </summary>
        [HttpPost("tai-chinh-tong-hop")]
        public async Task<IActionResult> BaoCaoTaiChinhTongHop([FromBody] DateRangeRequest? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoTaiChinhTongHopAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo tài chính tổng hợp",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo doanh thu chi tiết
        /// </summary>
        [HttpPost("doanh-thu-chi-tiet")]
        public async Task<IActionResult> BaoCaoDoanhThuChiTiet([FromBody] BaoCaoRequestWithFilters? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoDoanhThuChiTietAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    request?.Filters);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo doanh thu chi tiết",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo chi phí chi tiết
        /// </summary>
        [HttpPost("chi-phi-chi-tiet")]
        public async Task<IActionResult> BaoCaoChiPhiChiTiet([FromBody] BaoCaoRequestWithFilters? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoChiPhiChiTietAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    request?.Filters);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo chi phí chi tiết",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo lợi nhuận gộp theo lớp học
        /// </summary>
        [HttpPost("loi-nhuan-gop-lop")]
        public async Task<IActionResult> BaoCaoLoiNhuanGopTheoLop([FromBody] BaoCaoRequestWithFilters? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoLoiNhuanGopTheoLopAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    request?.Filters);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo lợi nhuận gộp theo lớp",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo lợi nhuận ròng theo lớp học
        /// </summary>
        [HttpPost("loi-nhuan-rong-lop")]
        public async Task<IActionResult> BaoCaoLoiNhuanRongTheoLop([FromBody] BaoCaoRequestWithFilters? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoLoiNhuanRongTheoLopAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    request?.Filters);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo lợi nhuận ròng theo lớp",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo tỷ lệ đạt theo khóa/lớp/giảng viên
        /// </summary>
        [HttpPost("ty-le-dat")]
        public async Task<IActionResult> BaoCaoTyLeDat([FromBody] BaoCaoRequestWithFilters? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoTyLeDatAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    request?.Filters);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo tỷ lệ đạt",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo hiệu suất giảng viên theo công thức tính điểm xét tốt nghiệp
        /// </summary>
        [HttpPost("hieu-suat-giang-vien")]
        public async Task<IActionResult> BaoCaoHieuSuatGiangVien([FromBody] BaoCaoRequestWithFilters? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoHieuSuatGiangVienAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    request?.Filters);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo hiệu suất giảng viên",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// API lấy dữ liệu xếp hạng giảng viên cho dashboard (giống báo cáo hiệu suất giảng viên)
        /// </summary>
        [HttpPost("dashboard-teacher-ranking")]
        public async Task<IActionResult> GetDashboardTeacherRanking([FromBody] DateRangeRequest? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoHieuSuatGiangVienAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    null); // Không cần filters cho dashboard

                // Trả về chỉ data array cho dashboard sử dụng
                var teacherRanking = result.Data.Select(d => new
                {
                    giangVienID = 0, // Dashboard không cần ID
                    hoTen = d["TenGiangVien"].ToString(),
                    soLopDay = Convert.ToInt32(d["SoLopDay"]),
                    diemTB = Convert.ToDecimal(d["DiemTbXetTotNghiep_ToanGV"]),
                    tyLeDat = Convert.ToDecimal(d["TiLeDat_Pct"]) / 100 // Chuyển từ % về decimal
                }).ToList();

                return Ok(new
                {
                    success = true,
                    data = teacherRanking
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy dữ liệu xếp hạng giảng viên",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo hiệu suất cơ sở theo cách tính mới (tỷ lệ lấp đầy trung bình)
        /// </summary>
        [HttpPost("hieu-suat-co-so")]
        public async Task<IActionResult> BaoCaoHieuSuatCoSo([FromBody] BaoCaoRequestWithFilters? request)
        {
            try
            {
                var result = await _baoCaoService.BaoCaoHieuSuatCoSoAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    request?.Filters);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo hiệu suất cơ sở",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Báo cáo top khóa học có đăng ký nhiều nhất và lợi nhuận cao nhất
        /// </summary>
        [HttpPost("top-khoa-hoc")]
        public async Task<IActionResult> BaoCaoTopKhoaHoc([FromBody] TopKhoaHocRequest? request)
        {
            try
            {
                var topCount = request?.TopCount ?? 10;
                var result = await _baoCaoService.BaoCaoTopKhoaHocAsync(
                    request?.NgayBatDau,
                    request?.NgayKetThuc,
                    topCount);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo báo cáo top khóa học",
                    error = ex.Message
                });
            }
        }

    /// <summary>
    /// Lấy danh sách các loại báo cáo có sẵn
    /// </summary>
    [HttpGet("loai-bao-cao")]
    [AllowAnonymous]
    public IActionResult LayLoaiBaoCao()
        {
            var reportTypes = new[]
            {
                new { value = "BaoCaoTaiChinhTongHop", label = "Báo cáo Tài chính Tổng hợp", category = "Tài chính" },
                new { value = "BaoCaoChiPhiChiTiet", label = "Báo cáo Chi phí Chi tiết", category = "Tài chính" },
                new { value = "BaoCaoLoiNhuanRongTheoLop", label = "Báo cáo Lợi nhuận Ròng theo Lớp học", category = "Tài chính" },
                new { value = "BaoCaoHieuSuatCoSo", label = "Báo cáo Hiệu suất Cơ sở", category = "Vận hành" },
                new { value = "BaoCaoHieuSuatGiangVien", label = "Báo cáo hiệu suất giảng viên", category = "Đào tạo" },
                new { value = "BaoCaoHieuSuatKhoaHoc", label = "Báo cáo Hiệu suất khóa học", category = "Đào tạo" },
                new { value = "BaoCaoTopKhoaHoc", label = "Top khóa học có đăng ký nhiều nhất, lợi nhuận cao nhất", category = "Đào tạo" }
            };

            return Ok(new
            {
                success = true,
                data = reportTypes
            });
        }
    }

    /// <summary>
    /// DTO cho request với khoảng thời gian
    /// </summary>
    public class DateRangeRequest
    {
        public DateTime? NgayBatDau { get; set; }
        public DateTime? NgayKetThuc { get; set; }
    }

    /// <summary>
    /// DTO cho request báo cáo với filters
    /// </summary>
    public class BaoCaoRequestWithFilters
    {
        public DateTime? NgayBatDau { get; set; }
        public DateTime? NgayKetThuc { get; set; }
        public Dictionary<string, object>? Filters { get; set; }
    }

    /// <summary>
    /// DTO cho request top khóa học
    /// </summary>
    public class TopKhoaHocRequest
    {
        public DateTime? NgayBatDau { get; set; }
        public DateTime? NgayKetThuc { get; set; }
        public int? TopCount { get; set; }
    }
}
