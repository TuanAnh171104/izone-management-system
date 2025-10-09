using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class ViHocVienRepository : GenericRepository<ViHocVien>, IViHocVienRepository
    {
        public ViHocVienRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ViHocVien>> GetByHocVienIdAsync(int hocVienId)
        {
            return await _context.ViHocViens
                .Include(vh => vh.HocVien)
                .Include(vh => vh.DangKyLop)
                .Include(vh => vh.ThanhToan)
                .Where(vh => vh.HocVienID == hocVienId)
                .OrderByDescending(vh => vh.NgayGiaoDich)
                .ToListAsync();
        }

        public async Task<IEnumerable<ViHocVien>> GetByLoaiTxAsync(string loaiTx)
        {
            return await _context.ViHocViens
                .Include(vh => vh.HocVien)
                .Include(vh => vh.DangKyLop)
                .Include(vh => vh.ThanhToan)
                .Where(vh => vh.LoaiTx == loaiTx)
                .OrderByDescending(vh => vh.NgayGiaoDich)
                .ToListAsync();
        }

        public async Task<IEnumerable<ViHocVien>> GetByDangKyIdAsync(int dangKyId)
        {
            return await _context.ViHocViens
                .Include(vh => vh.HocVien)
                .Include(vh => vh.DangKyLop)
                .Include(vh => vh.ThanhToan)
                .Where(vh => vh.DangKyID == dangKyId)
                .OrderByDescending(vh => vh.NgayGiaoDich)
                .ToListAsync();
        }

        public async Task<IEnumerable<ViHocVien>> GetByThanhToanIdAsync(int thanhToanId)
        {
            return await _context.ViHocViens
                .Include(vh => vh.HocVien)
                .Include(vh => vh.DangKyLop)
                .Include(vh => vh.ThanhToan)
                .Where(vh => vh.ThanhToanID == thanhToanId)
                .OrderByDescending(vh => vh.NgayGiaoDich)
                .ToListAsync();
        }

        public async Task<decimal> GetBalanceByHocVienIdAsync(int hocVienId)
        {
            return await _context.ViHocViens
                .Where(vh => vh.HocVienID == hocVienId)
                .SumAsync(vh => vh.SoTien);
        }

        public async Task<IEnumerable<ViHocVien>> GetTransactionHistoryAsync(int hocVienId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.ViHocViens
                .Include(vh => vh.HocVien)
                .Include(vh => vh.DangKyLop)
                .Include(vh => vh.ThanhToan)
                .Where(vh => vh.HocVienID == hocVienId);

            if (startDate.HasValue)
                query = query.Where(vh => vh.NgayGiaoDich >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(vh => vh.NgayGiaoDich <= endDate.Value);

            return await query
                .OrderByDescending(vh => vh.NgayGiaoDich)
                .ToListAsync();
        }
    }
}