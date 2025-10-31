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

        public async Task<bool> IsReservationValidForContinuingAsync(int dangKyId)
        {
            var baoLuu = await _context.BaoLuus
                .FirstOrDefaultAsync(bl =>
                    bl.DangKyID == dangKyId &&
                    bl.TrangThai == "DaDuyet" &&
                    bl.HanBaoLuu > DateTime.Now);

            return baoLuu != null;
        }

        public async Task<bool> CanContinueLearningAsync(int dangKyId, int newLopId)
        {
            // Kiểm tra bảo lưu có hợp lệ không
            var isValid = await IsReservationValidForContinuingAsync(dangKyId);
            if (!isValid) return false;

            // Kiểm tra lớp mới có cùng khóa học không
            var originalDangKy = await _context.DangKyLops
                .Include(dk => dk.LopHoc)
                .ThenInclude(l => l.KhoaHoc)
                .FirstOrDefaultAsync(dk => dk.DangKyID == dangKyId);

            if (originalDangKy?.LopHoc?.KhoaHoc == null) return false;

            var newClass = await _context.LopHocs
                .Include(l => l.KhoaHoc)
                .FirstOrDefaultAsync(l => l.LopID == newLopId);

            if (newClass?.KhoaHoc == null) return false;

            // Phải cùng khóa học và khác lớp cũ
            return originalDangKy.LopHoc.KhoaHocID == newClass.KhoaHocID &&
                   originalDangKy.LopID != newLopId;
        }
    }
}