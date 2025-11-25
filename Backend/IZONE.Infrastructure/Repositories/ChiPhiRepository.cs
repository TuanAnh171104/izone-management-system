using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class ChiPhiRepository : GenericRepository<ChiPhi>, IChiPhiRepository
    {
        public ChiPhiRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ChiPhi>> GetByLopIdAsync(int lopId)
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.LopID == lopId)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }



        public async Task<IEnumerable<ChiPhi>> GetByDiaDiemIdAsync(int diaDiemId)
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.DiaDiemID == diaDiemId)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChiPhi>> GetByLoaiAsync(string loai)
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.LoaiChiPhi == loai)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChiPhi>> GetBySubLoaiAsync(string subLoai)
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.SubLoai == subLoai)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChiPhi>> GetByNguonChiPhiAsync(string nguonChiPhi)
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.NguonChiPhi == nguonChiPhi)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChiPhi>> GetByAllocationMethodAsync(string allocationMethod)
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.AllocationMethod == allocationMethod)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChiPhi>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.NgayPhatSinh >= startDate && cp.NgayPhatSinh <= endDate)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalCostByLopIdAsync(int lopId)
        {
            return await _context.ChiPhis
                .Where(cp => cp.LopID == lopId)
                .SumAsync(cp => cp.SoTien);
        }



        public async Task<IEnumerable<ChiPhi>> GetRecurringCostsAsync()
        {
            return await _context.ChiPhis
                .Include(cp => cp.LopHoc)
                .Include(cp => cp.DiaDiem)
                .Where(cp => cp.Recurring == true)
                .OrderByDescending(cp => cp.NgayPhatSinh)
                .ToListAsync();
        }
    }
}
