using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class DangKyLopRepository : GenericRepository<DangKyLop>, IDangKyLopRepository
    {
        public DangKyLopRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<DangKyLop>> GetByHocVienIdAsync(int hocVienId)
        {
            return await _context.DangKyLops
                .Include(dk => dk.LopHoc)
                .Include(dk => dk.HocVien)
                .Where(dk => dk.HocVienID == hocVienId)
                .ToListAsync();
        }

        public async Task<IEnumerable<DangKyLop>> GetByLopIdAsync(int lopId)
        {
            return await _context.DangKyLops
                .Include(dk => dk.HocVien)
                .Include(dk => dk.LopHoc)
                .Where(dk => dk.LopID == lopId)
                .ToListAsync();
        }

        public async Task<IEnumerable<DangKyLop>> GetByTrangThaiAsync(string trangThai)
        {
            return await _context.DangKyLops
                .Include(dk => dk.HocVien)
                .Include(dk => dk.LopHoc)
                .Where(dk => dk.TrangThaiDangKy == trangThai)
                .ToListAsync();
        }

        public async Task<IEnumerable<DangKyLop>> GetByTrangThaiThanhToanAsync(string trangThaiThanhToan)
        {
            return await _context.DangKyLops
                .Include(dk => dk.HocVien)
                .Include(dk => dk.LopHoc)
                .Where(dk => dk.TrangThaiThanhToan == trangThaiThanhToan)
                .ToListAsync();
        }

        public async Task<DangKyLop?> GetByHocVienAndLopAsync(int hocVienId, int lopId)
        {
            return await _context.DangKyLops
                .Include(dk => dk.HocVien)
                .Include(dk => dk.LopHoc)
                .FirstOrDefaultAsync(dk => dk.HocVienID == hocVienId && dk.LopID == lopId);
        }
    }
}
