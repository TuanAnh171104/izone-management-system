using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class DiemDanhRepository : GenericRepository<DiemDanh>, IDiemDanhRepository
    {
        public DiemDanhRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<DiemDanh>> GetByBuoiHocIdAsync(int buoiHocId)
        {
            return await _context.DiemDanhs
                .Include(dd => dd.HocVien)
                .Include(dd => dd.BuoiHoc)
                .ThenInclude(bh => bh.LopHoc)
                .Where(dd => dd.BuoiHocID == buoiHocId)
                .ToListAsync();
        }

        public async Task<IEnumerable<DiemDanh>> GetByHocVienIdAsync(int hocVienId)
        {
            return await _context.DiemDanhs
                .Include(dd => dd.HocVien)
                .Include(dd => dd.BuoiHoc)
                .ThenInclude(bh => bh.LopHoc)
                .Where(dd => dd.HocVienID == hocVienId)
                .OrderByDescending(dd => dd.BuoiHoc.NgayHoc)
                .ToListAsync();
        }

        public async Task<DiemDanh?> GetByBuoiHocAndHocVienAsync(int buoiHocId, int hocVienId)
        {
            return await _context.DiemDanhs
                .Include(dd => dd.HocVien)
                .Include(dd => dd.BuoiHoc)
                .ThenInclude(bh => bh.LopHoc)
                .FirstOrDefaultAsync(dd => dd.BuoiHocID == buoiHocId && dd.HocVienID == hocVienId);
        }

        public async Task<IEnumerable<DiemDanh>> GetAttendanceByLopIdAsync(int lopId)
        {
            return await _context.DiemDanhs
                .Include(dd => dd.HocVien)
                .Include(dd => dd.BuoiHoc)
                .Where(dd => dd.BuoiHoc.LopID == lopId)
                .OrderBy(dd => dd.BuoiHoc.NgayHoc)
                .ToListAsync();
        }

        public async Task<double> GetAttendanceRateByHocVienAsync(int hocVienId, int lopId)
        {
            var totalSessions = await _context.BuoiHocs
                .Where(bh => bh.LopID == lopId)
                .CountAsync();

            if (totalSessions == 0) return 0;

            var attendedSessions = await _context.DiemDanhs
                .Where(dd => dd.HocVienID == hocVienId &&
                           dd.BuoiHoc.LopID == lopId &&
                           dd.CoMat == true)
                .CountAsync();

            return (double)attendedSessions / totalSessions * 100;
        }
    }
}