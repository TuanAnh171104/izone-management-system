using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class BuoiHocRepository : GenericRepository<BuoiHoc>, IBuoiHocRepository
    {
        public BuoiHocRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<BuoiHoc>> GetByLopIdAsync(int lopId)
        {
            return await _context.BuoiHocs
                .Where(bh => bh.LopID == lopId)
                .OrderBy(bh => bh.NgayHoc)
                .ToListAsync();
        }

        public async Task<IEnumerable<BuoiHoc>> GetByNgayHocAsync(DateTime ngayHoc)
        {
            return await _context.BuoiHocs
                .Include(bh => bh.LopHoc)
                .Include(bh => bh.GiangVienThayThe)
                .Include(bh => bh.DiaDiem)
                .Where(bh => bh.NgayHoc.Date == ngayHoc.Date)
                .OrderBy(bh => bh.ThoiGianBatDau)
                .ToListAsync();
        }

        public async Task<IEnumerable<BuoiHoc>> GetByTrangThaiAsync(string trangThai)
        {
            return await _context.BuoiHocs
                .Include(bh => bh.LopHoc)
                .Include(bh => bh.GiangVienThayThe)
                .Include(bh => bh.DiaDiem)
                .Where(bh => bh.TrangThai == trangThai)
                .OrderBy(bh => bh.NgayHoc)
                .ToListAsync();
        }

        public async Task<IEnumerable<BuoiHoc>> GetByGiangVienThayTheIdAsync(int giangVienThayTheId)
        {
            return await _context.BuoiHocs
                .Include(bh => bh.LopHoc)
                .Include(bh => bh.GiangVienThayThe)
                .Where(bh => bh.GiangVienThayTheID == giangVienThayTheId)
                .ToListAsync();
        }

        public async Task<IEnumerable<BuoiHoc>> GetByDiaDiemIdAsync(int diaDiemId)
        {
            return await _context.BuoiHocs
                .Include(bh => bh.LopHoc)
                .Include(bh => bh.GiangVienThayThe)
                .Include(bh => bh.DiaDiem)
                .Where(bh => bh.DiaDiemID == diaDiemId)
                .OrderBy(bh => bh.NgayHoc)
                .ToListAsync();
        }

        public async Task<IEnumerable<BuoiHoc>> GetScheduleByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.BuoiHocs
                .Include(bh => bh.LopHoc)
                .Include(bh => bh.GiangVienThayThe)
                .Where(bh => bh.NgayHoc >= startDate && bh.NgayHoc <= endDate)
                .OrderBy(bh => bh.NgayHoc)
                .ThenBy(bh => bh.ThoiGianBatDau)
                .ToListAsync();
        }

        public async Task<IEnumerable<BuoiHoc>> GetUpcomingSessionsByLopIdAsync(int lopId, int days)
        {
            var endDate = DateTime.Now.AddDays(days);
            return await _context.BuoiHocs
                .Include(bh => bh.LopHoc)
                .Include(bh => bh.GiangVienThayThe)
                .Include(bh => bh.DiaDiem)
                .Where(bh => bh.LopID == lopId && bh.NgayHoc >= DateTime.Now && bh.NgayHoc <= endDate)
                .OrderBy(bh => bh.NgayHoc)
                .ToListAsync();
        }
    }
}
