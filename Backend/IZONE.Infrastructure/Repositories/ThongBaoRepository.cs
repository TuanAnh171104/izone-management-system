using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class ThongBaoRepository : GenericRepository<ThongBao>, IThongBaoRepository
    {
        public ThongBaoRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ThongBao>> GetByNguoiNhanAsync(int nguoiNhanId)
        {
            return await _context.ThongBao
                .Where(tb => tb.NguoiNhanID == nguoiNhanId)
                .OrderByDescending(tb => tb.NgayGui)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThongBao>> GetByLoaiNguoiNhanAsync(string loaiNguoiNhan)
        {
            return await _context.ThongBao
                .Where(tb => tb.LoaiNguoiNhan == loaiNguoiNhan)
                .OrderByDescending(tb => tb.NgayGui)
                .ToListAsync();
        }

        public async Task<IEnumerable<ThongBao>> GetRecentNotificationsAsync(int count = 10)
        {
            return await _context.ThongBao
                .OrderByDescending(tb => tb.NgayGui)
                .Take(count)
                .ToListAsync();
        }
    }
}
