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
        return await _context.GiangViens
            .FirstOrDefaultAsync(x => x.TaiKhoan != null && x.TaiKhoan.Email == email);
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
