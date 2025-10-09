using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class ThanhToanRepository : GenericRepository<ThanhToan>, IThanhToanRepository
    {
        public ThanhToanRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ThanhToan>> GetByHocVienIdAsync(int hocVienId)
        {
            return await _context.ThanhToans
                .Include(tt => tt.HocVien)
                .Include(tt => tt.DangKyLop)
                .Where(tt => tt.HocVienID == hocVienId)
                .OrderByDescending(tt => tt.NgayThanhToan)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThanhToan>> GetByDangKyIdAsync(int dangKyId)
        {
            return await _context.ThanhToans
                .Include(tt => tt.HocVien)
                .Include(tt => tt.DangKyLop)
                .Where(tt => tt.DangKyID == dangKyId)
                .OrderByDescending(tt => tt.NgayThanhToan)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThanhToan>> GetByStatusAsync(string status)
        {
            return await _context.ThanhToans
                .Include(tt => tt.HocVien)
                .Include(tt => tt.DangKyLop)
                .Where(tt => tt.Status == status)
                .OrderByDescending(tt => tt.NgayThanhToan)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThanhToan>> GetByPhuongThucAsync(string phuongThuc)
        {
            return await _context.ThanhToans
                .Include(tt => tt.HocVien)
                .Include(tt => tt.DangKyLop)
                .Where(tt => tt.PhuongThuc == phuongThuc)
                .OrderByDescending(tt => tt.NgayThanhToan)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThanhToan>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.ThanhToans
                .Include(tt => tt.HocVien)
                .Include(tt => tt.DangKyLop)
                .Where(tt => tt.NgayThanhToan >= startDate && tt.NgayThanhToan <= endDate)
                .OrderByDescending(tt => tt.NgayThanhToan)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalByHocVienIdAsync(int hocVienId)
        {
            return await _context.ThanhToans
                .Where(tt => tt.HocVienID == hocVienId && tt.Status == "Thành công")
                .SumAsync(tt => tt.SoTien);
        }

        public async Task<decimal> GetTotalByDangKyIdAsync(int dangKyId)
        {
            return await _context.ThanhToans
                .Where(tt => tt.DangKyID == dangKyId && tt.Status == "Thành công")
                .SumAsync(tt => tt.SoTien);
        }
    }
}