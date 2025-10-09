using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Models;
using IZONE.Core.Interfaces;
using IZONE.Infrastructure.Data;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace IZONE.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GiangVienController : ControllerBase
    {
        private readonly IGiangVienRepository _giangVienRepository;
        private readonly IZONEDbContext _context;

        public GiangVienController(IGiangVienRepository giangVienRepository, IZONEDbContext context)
        {
            _giangVienRepository = giangVienRepository;
            _context = context;
        }

        // GET: api/GiangVien
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllGiangVien()
        {
            var giangViens = await _giangVienRepository.GetAllWithEmailAsync();
            return Ok(giangViens);
        }

        // GET: api/GiangVien/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GiangVien>> GetGiangVienById(int id)
        {
            var giangVien = await _giangVienRepository.GetByIdAsync(id);

            if (giangVien == null)
            {
                return NotFound();
            }

            return giangVien;
        }

        // GET: api/GiangVien/email/example@email.com
        [HttpGet("email/{email}")]
        public async Task<ActionResult<GiangVien>> GetGiangVienByEmail(string email)
        {
            var giangVien = await _giangVienRepository.GetByEmailAsync(email);

            if (giangVien == null)
            {
                return NotFound();
            }

            return giangVien;
        }

        // GET: api/GiangVien/chuyenmon/{chuyenMon}
        [HttpGet("chuyenmon/{chuyenMon}")]
        public async Task<ActionResult<IEnumerable<GiangVien>>> GetGiangViensByChuyenMon(string chuyenMon)
        {
            var giangViens = await _giangVienRepository.GetGiangViensByChuyenMonAsync(chuyenMon);
            return Ok(giangViens);
        }

        // GET: api/GiangVien/5/lophoc
        [HttpGet("{id}/lophoc")]
        public async Task<ActionResult<IEnumerable<LopHoc>>> GetLopHocsByGiangVien(int id)
        {
            var giangVien = await _giangVienRepository.GetByIdAsync(id);

            if (giangVien == null)
            {
                return NotFound();
            }

            var lopHocs = await _giangVienRepository.GetLopHocsByGiangVienAsync(id);
            return Ok(lopHocs);
        }

        // POST: api/GiangVien
        [HttpPost]
        public async Task<ActionResult<GiangVien>> CreateGiangVien(GiangVien giangVien)
        {
            await _giangVienRepository.AddAsync(giangVien);
            return CreatedAtAction(nameof(GetGiangVienById), new { id = giangVien.GiangVienID }, giangVien);
        }

        // POST: api/GiangVien/with-account
        [HttpPost("with-account")]
        public async Task<ActionResult<GiangVienWithEmailDto>> CreateGiangVienWithAccount([FromBody] CreateGiangVienWithAccountRequest request)
        {
            // Tạo tài khoản trước
            var taiKhoan = new TaiKhoan
            {
                Email = request.Email,
                MatKhau = request.MatKhau, // Nên hash mật khẩu ở đây
                VaiTro = "GiangVien"
            };

            _context.TaiKhoans.Add(taiKhoan);
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

            // Trả về DTO với thông tin email
            var result = new GiangVienWithEmailDto
            {
                GiangVienID = giangVien.GiangVienID,
                TaiKhoanID = giangVien.TaiKhoanID,
                HoTen = giangVien.HoTen,
                ChuyenMon = giangVien.ChuyenMon,
                Email = taiKhoan.Email
            };

            return CreatedAtAction(nameof(GetGiangVienById), new { id = giangVien.GiangVienID }, result);
        }

        // PUT: api/GiangVien/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGiangVien(int id, GiangVien giangVien)
        {
            if (id != giangVien.GiangVienID)
            {
                return BadRequest();
            }

            await _giangVienRepository.UpdateAsync(giangVien);
            return NoContent();
        }

        // DELETE: api/GiangVien/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGiangVien(int id)
        {
            var giangVien = await _giangVienRepository.GetByIdAsync(id);
            if (giangVien == null)
            {
                return NotFound();
            }

            // Nếu giảng viên có tài khoản liên kết, xóa cả tài khoản
            if (giangVien.TaiKhoanID.HasValue)
            {
                var taiKhoan = await _context.TaiKhoans.FindAsync(giangVien.TaiKhoanID.Value);
                if (taiKhoan != null)
                {
                    _context.TaiKhoans.Remove(taiKhoan);
                }
            }

            // Xóa giảng viên
            await _giangVienRepository.DeleteAsync(giangVien);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
