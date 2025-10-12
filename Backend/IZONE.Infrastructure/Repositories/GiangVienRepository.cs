using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IZONE.Infrastructure.Repositories
{
    public class GiangVienRepository : GenericRepository<GiangVien>, IGiangVienRepository
    {
        public GiangVienRepository(IZONEDbContext context) : base(context)
        {
        }

    public override async Task<IReadOnlyList<GiangVien>> GetAllAsync()
    {
        return await _context.GiangViens.ToListAsync();
    }

    public async Task<GiangVien> GetByEmailAsync(string email)
    {
        // Tìm tài khoản theo email trước
        var taiKhoan = await _context.TaiKhoans
            .FirstOrDefaultAsync(t => t.Email == email && t.VaiTro == "GiangVien");

        if (taiKhoan == null)
        {
            Console.WriteLine($"Không tìm thấy tài khoản với email: {email}");
            return null;
        }

        Console.WriteLine($"Tìm thấy tài khoản: ID={taiKhoan.TaiKhoanID}, Email={taiKhoan.Email}");

        // Tìm giảng viên theo TaiKhoanID
        var giangVien = await _context.GiangViens
            .FirstOrDefaultAsync(gv => gv.TaiKhoanID == taiKhoan.TaiKhoanID);

        if (giangVien == null)
        {
            Console.WriteLine($"Không tìm thấy giảng viên với TaiKhoanID: {taiKhoan.TaiKhoanID}");
        }
        else
        {
            Console.WriteLine($"Tìm thấy giảng viên: ID={giangVien.GiangVienID}, HoTen={giangVien.HoTen}");
        }

        return giangVien;
    }

    public async Task<IReadOnlyList<GiangVien>> GetGiangViensByChuyenMonAsync(string chuyenMon)
    {
        return await _context.GiangViens
            .Where(g => g.ChuyenMon.Contains(chuyenMon))
            .ToListAsync();
    }

        public async Task<IReadOnlyList<LopHoc>> GetLopHocsByGiangVienAsync(int giangVienId)
        {
            return await _context.LopHocs
                .Where(l => l.GiangVienID == giangVienId)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<GiangVienWithEmailDto>> GetAllWithEmailAsync()
        {
            return await _context.GiangViens
                .Include(gv => gv.TaiKhoan)
                .Select(gv => new GiangVienWithEmailDto
                {
                    GiangVienID = gv.GiangVienID,
                    TaiKhoanID = gv.TaiKhoanID,
                    HoTen = gv.HoTen,
                    ChuyenMon = gv.ChuyenMon,
                    Email = gv.TaiKhoan != null ? gv.TaiKhoan.Email : null
                })
                .ToListAsync();
        }
    }
}
