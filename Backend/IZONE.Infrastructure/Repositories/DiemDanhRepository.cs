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

        public async Task<IEnumerable<DiemDanh>> CreateBulkAsync(IEnumerable<DiemDanh> diemDanhs)
        {
            // Kiểm tra dữ liệu đầu vào
            if (diemDanhs == null || !diemDanhs.Any())
                throw new ArgumentException("Danh sách điểm danh không được trống");

            // Validate từng record
            foreach (var diemDanh in diemDanhs)
            {
                if (diemDanh.BuoiHocID <= 0)
                    throw new ArgumentException($"BuoiHocID không hợp lệ: {diemDanh.BuoiHocID}");

                if (diemDanh.HocVienID <= 0)
                    throw new ArgumentException($"HocVienID không hợp lệ: {diemDanh.HocVienID}");

                // Kiểm tra xem buổi học có tồn tại không
                var buoiHocExists = await _context.BuoiHocs.AnyAsync(bh => bh.BuoiHocID == diemDanh.BuoiHocID);
                if (!buoiHocExists)
                    throw new ArgumentException($"Buổi học với ID {diemDanh.BuoiHocID} không tồn tại");

                // Kiểm tra xem học viên có tồn tại không
                var hocVienExists = await _context.HocViens.AnyAsync(hv => hv.HocVienID == diemDanh.HocVienID);
                if (!hocVienExists)
                    throw new ArgumentException($"Học viên với ID {diemDanh.HocVienID} không tồn tại");
            }

            // Tách riêng các record mới và record cần cập nhật
            var buoiHocIds = diemDanhs.Select(d => d.BuoiHocID).Distinct().ToList();
            var hocVienIds = diemDanhs.Select(d => d.HocVienID).Distinct().ToList();

            var existingRecords = await _context.DiemDanhs
                .Where(dd => buoiHocIds.Contains(dd.BuoiHocID) && hocVienIds.Contains(dd.HocVienID))
                .ToListAsync();

            // Cập nhật các record đã tồn tại
            foreach (var existingRecord in existingRecords)
            {
                var diemDanhToUpdate = diemDanhs.FirstOrDefault(d =>
                    d.BuoiHocID == existingRecord.BuoiHocID && d.HocVienID == existingRecord.HocVienID);

                if (diemDanhToUpdate != null)
                {
                    existingRecord.CoMat = diemDanhToUpdate.CoMat;
                    existingRecord.GhiChu = diemDanhToUpdate.GhiChu;
                    _context.DiemDanhs.Update(existingRecord);
                }
            }

            // Tìm các record mới (chưa tồn tại)
            var newRecords = diemDanhs.Where(d =>
                !existingRecords.Any(existing =>
                    existing.BuoiHocID == d.BuoiHocID && existing.HocVienID == d.HocVienID))
                .ToList();

            // Thêm các record mới
            if (newRecords.Any())
            {
                await _context.DiemDanhs.AddRangeAsync(newRecords);
            }

            // Lưu tất cả thay đổi
            await _context.SaveChangesAsync();

            // Trả về tất cả records đã xử lý
            return diemDanhs;
        }
    }
}
