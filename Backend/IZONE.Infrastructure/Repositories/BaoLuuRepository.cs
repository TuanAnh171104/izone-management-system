using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class BaoLuuRepository : GenericRepository<BaoLuu>, IBaoLuuRepository
    {
        public BaoLuuRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<BaoLuu>> GetByDangKyIdAsync(int dangKyId)
        {
            return await _context.BaoLuus
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.HocVien)
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.LopHoc)
                .Where(bl => bl.DangKyID == dangKyId)
                .OrderByDescending(bl => bl.NgayBaoLuu)
                .ToListAsync();
        }

        public async Task<IEnumerable<BaoLuu>> GetByTrangThaiAsync(string trangThai)
        {
            return await _context.BaoLuus
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.HocVien)
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.LopHoc)
                .Where(bl => bl.TrangThai == trangThai)
                .OrderByDescending(bl => bl.NgayBaoLuu)
                .ToListAsync();
        }

        public async Task<IEnumerable<BaoLuu>> GetExpiredBaoLuuAsync()
        {
            return await _context.BaoLuus
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.HocVien)
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.LopHoc)
                .Where(bl => bl.HanBaoLuu < DateTime.Now && bl.TrangThai == "DaDuyet")
                .OrderByDescending(bl => bl.NgayBaoLuu)
                .ToListAsync();
        }

        public async Task<IEnumerable<BaoLuu>> GetPendingApprovalAsync()
        {
            return await _context.BaoLuus
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.HocVien)
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.LopHoc)
                .Where(bl => bl.TrangThai == "DangChoDuyet")
                .OrderByDescending(bl => bl.NgayBaoLuu)
                .ToListAsync();
        }

        public async Task<BaoLuu?> GetActiveBaoLuuByDangKyIdAsync(int dangKyId)
        {
            return await _context.BaoLuus
                .Include(bl => bl.DangKyLop)
                .ThenInclude(dk => dk.HocVien)
                .FirstOrDefaultAsync(bl => bl.DangKyID == dangKyId && bl.TrangThai == "DaDuyet");
        }
    }
}