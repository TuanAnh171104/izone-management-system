using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class ThueMatBangRepository : GenericRepository<ThueMatBang>, IThueMatBangRepository
    {
        public ThueMatBangRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ThueMatBang>> GetByDiaDiemIdAsync(int diaDiemId)
        {
            return await _context.ThueMatBangs
                .Where(tmb => tmb.DiaDiemID == diaDiemId)
                .OrderByDescending(tmb => tmb.NgayApDung)
                .AsNoTracking() // Thêm AsNoTracking để tránh lỗi navigation property
                .ToListAsync();
        }

        public async Task<IEnumerable<ThueMatBang>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.ThueMatBangs
                .Where(tmb => tmb.NgayApDung >= startDate && tmb.NgayApDung <= endDate)
                .OrderByDescending(tmb => tmb.NgayApDung)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThueMatBang>> GetActiveContractsAsync()
        {
            return await _context.ThueMatBangs
                .Where(tmb => tmb.NgayApDung <= DateTime.Now &&
                             (tmb.HanHopDong == null || tmb.HanHopDong >= DateTime.Now))
                .OrderByDescending(tmb => tmb.NgayApDung)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThueMatBang>> GetExpiringContractsAsync(DateTime beforeDate)
        {
            return await _context.ThueMatBangs
                .Where(tmb => tmb.HanHopDong != null && tmb.HanHopDong <= beforeDate)
                .OrderBy(tmb => tmb.HanHopDong)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalRentByDiaDiemAsync(int diaDiemId)
        {
            return await _context.ThueMatBangs
                .Where(tmb => tmb.DiaDiemID == diaDiemId)
                .SumAsync(tmb => tmb.GiaThueThang);
        }
    }
}