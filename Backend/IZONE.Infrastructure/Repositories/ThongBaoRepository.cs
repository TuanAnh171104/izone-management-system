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
            var thongBaos = new List<ThongBao>();

            // Nếu là giảng viên, lấy thông báo của các lớp mà họ dạy
            var giangVien = await _context.GiangViens
                .FirstOrDefaultAsync(gv => gv.GiangVienID == nguoiNhanId);

            if (giangVien != null)
            {
                // Lấy danh sách ID các lớp mà giảng viên này dạy
                var lopHocIds = await _context.LopHocs
                    .Where(lh => lh.GiangVienID == nguoiNhanId)
                    .Select(lh => lh.LopID)
                    .ToListAsync();

                if (lopHocIds.Any())
                {
                    // Lấy thông báo của các lớp đó
                    var classThongBaos = await _context.ThongBao
                        .Where(tb => tb.LoaiNguoiNhan == "LopHoc" && lopHocIds.Contains(tb.NguoiNhanID.Value))
                        .OrderByDescending(tb => tb.NgayGui)
                        .ToListAsync();

                    thongBaos.AddRange(classThongBaos);
                }
            }

            // Chỉ lấy thông báo cá nhân nếu thực sự gửi riêng cho giảng viên (không phải thông báo lớp học)
            var personalThongBaos = await _context.ThongBao
                .Where(tb => tb.NguoiNhanID == nguoiNhanId &&
                            (tb.LoaiNguoiNhan != "LopHoc" || tb.LoaiNguoiNhan == null))
                .OrderByDescending(tb => tb.NgayGui)
                .ToListAsync();

            thongBaos.AddRange(personalThongBaos);

            // Sắp xếp theo thời gian giảm dần
            return thongBaos.OrderByDescending(tb => tb.NgayGui);
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
