using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaoLuuController : ControllerBase
    {
        private readonly IBaoLuuRepository _baoLuuRepository;
        private readonly IZONEDbContext _context;

        public BaoLuuController(IBaoLuuRepository baoLuuRepository, IZONEDbContext context)
        {
            _baoLuuRepository = baoLuuRepository;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetAll()
        {
            var baoLuus = await _baoLuuRepository.GetAllAsync();
            return Ok(baoLuus);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BaoLuu>> GetById(int id)
        {
            var baoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (baoLuu == null)
            {
                return NotFound();
            }
            return Ok(baoLuu);
        }

        [HttpGet("dang-ky/{dangKyId}")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetByDangKyId(int dangKyId)
        {
            var baoLuus = await _baoLuuRepository.GetByDangKyIdAsync(dangKyId);
            return Ok(baoLuus);
        }

        [HttpGet("trang-thai/{trangThai}")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetByTrangThai(string trangThai)
        {
            var baoLuus = await _baoLuuRepository.GetByTrangThaiAsync(trangThai);
            return Ok(baoLuus);
        }

        [HttpGet("expired")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetExpiredBaoLuu()
        {
            var baoLuus = await _baoLuuRepository.GetExpiredBaoLuuAsync();
            return Ok(baoLuus);
        }

        [HttpGet("pending-approval")]
        public async Task<ActionResult<IEnumerable<BaoLuu>>> GetPendingApproval()
        {
            var baoLuus = await _baoLuuRepository.GetPendingApprovalAsync();
            return Ok(baoLuus);
        }

        [HttpGet("active/dang-ky/{dangKyId}")]
        public async Task<ActionResult<BaoLuu>> GetActiveBaoLuuByDangKyId(int dangKyId)
        {
            var baoLuu = await _baoLuuRepository.GetActiveBaoLuuByDangKyIdAsync(dangKyId);
            if (baoLuu == null)
            {
                return NotFound();
            }
            return Ok(baoLuu);
        }

        [HttpPost]
        public async Task<ActionResult<BaoLuu>> Create([FromBody] BaoLuu baoLuu)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            baoLuu.NgayBaoLuu = DateTime.Now;
            var createdBaoLuu = await _baoLuuRepository.AddAsync(baoLuu);
            return CreatedAtAction(nameof(GetById), new { id = createdBaoLuu.BaoLuuID }, createdBaoLuu);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BaoLuu baoLuu)
        {
            if (id != baoLuu.BaoLuuID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingBaoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (existingBaoLuu == null)
            {
                return NotFound();
            }

            await _baoLuuRepository.UpdateAsync(baoLuu);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var baoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (baoLuu == null)
            {
                return NotFound();
            }

            await _baoLuuRepository.DeleteAsync(baoLuu);
            return NoContent();
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(int id, [FromBody] ApproveBaoLuuRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var baoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (baoLuu == null)
            {
                return NotFound();
            }

            // Cập nhật trạng thái và người duyệt
            baoLuu.TrangThai = "DaDuyet";
            baoLuu.NguoiDuyet = request.NguoiDuyet;

            // Cập nhật hạn bảo lưu (1 năm kể từ ngày duyệt)
            baoLuu.HanBaoLuu = DateTime.Now.AddYears(1);

            await _baoLuuRepository.UpdateAsync(baoLuu);

            // Cập nhật trạng thái đăng ký lớp thành "DaBaoLuu"
            var dangKyLop = await _context.DangKyLops.FindAsync(baoLuu.DangKyID);
            if (dangKyLop != null)
            {
                dangKyLop.TrangThaiDangKy = "DaBaoLuu";
                await _context.SaveChangesAsync();
            }

            return Ok(baoLuu);
        }

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectBaoLuuRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var baoLuu = await _baoLuuRepository.GetByIdAsync(id);
            if (baoLuu == null)
            {
                return NotFound();
            }

            // Cập nhật trạng thái và lý do từ chối
            baoLuu.TrangThai = "TuChoi";
            baoLuu.LyDo = request.LyDo;

            await _baoLuuRepository.UpdateAsync(baoLuu);
            return Ok(baoLuu);
        }

        [HttpGet("{dangKyId}/available-classes")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableClassesForContinuing(int dangKyId)
        {
            try
            {
                // Lấy thông tin đăng ký để tìm khóa học gốc
                var dangKyLop = await _context.DangKyLops
                    .Include(dk => dk.LopHoc)
                    .ThenInclude(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(dk => dk.DangKyID == dangKyId);

                if (dangKyLop == null)
                {
                    return NotFound("Không tìm thấy thông tin đăng ký lớp học");
                }

                if (dangKyLop.LopHoc == null || dangKyLop.LopHoc.KhoaHoc == null)
                {
                    return BadRequest("Không tìm thấy thông tin khóa học của lớp đã đăng ký");
                }

                // Kiểm tra xem có bảo lưu nào khả dụng cho đăng ký này không
                var activeBaoLuu = await _context.BaoLuus
                    .FirstOrDefaultAsync(bl =>
                        bl.DangKyID == dangKyId &&
                        bl.TrangThai == "DaDuyet" && // Đã được duyệt
                        bl.TrangThai != "DaSuDung" && // Chưa được sử dụng
                        bl.HanBaoLuu > DateTime.Now); // Còn hạn

                if (activeBaoLuu == null)
                {
                    return BadRequest("Không có bảo lưu khả dụng hoặc bảo lưu đã hết hạn");
                }

                var originalKhoaHocID = dangKyLop.LopHoc.KhoaHocID;
                var originalLopID = dangKyLop.LopID;

                // Lấy danh sách các lớp học khả dụng cùng khóa học
                var availableClasses = await _context.LopHocs
                    .Include(l => l.KhoaHoc)
                    .Include(l => l.GiangVien)
                    .Include(l => l.DiaDiem)
                    .Where(l =>
                        l.KhoaHocID == originalKhoaHocID && // Cùng khóa học
                        l.LopID != originalLopID && // Không phải lớp đã bảo lưu
                        l.TrangThai == "ChuaBatDau" && // Chưa bắt đầu
                        l.NgayBatDau > DateTime.Now && // Ngày bắt đầu trong tương lai
                        l.SoLuongToiDa > 0 // Còn chỗ trống
                    )
                    .OrderBy(l => l.NgayBatDau)
                    .ToListAsync();

                // Tính số chỗ trống cho mỗi lớp
                var result = new List<object>();
                foreach (var lop in availableClasses)
                {
                    // Đếm số học viên đã đăng ký
                    var registeredCount = await _context.DangKyLops
                        .CountAsync(dk => dk.LopID == lop.LopID && dk.TrangThaiDangKy == "DangHoc");

                    var availableSpots = (lop.SoLuongToiDa ?? 0) - registeredCount;

                    if (availableSpots > 0) // Chỉ lấy những lớp còn chỗ
                    {
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
                            availableSpots = availableSpots,
                            registeredCount = registeredCount,
                            // Thông tin bổ sung
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
                            } : null
                        });
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách lớp học khả dụng", error = ex.Message });
            }
        }
    }
}
