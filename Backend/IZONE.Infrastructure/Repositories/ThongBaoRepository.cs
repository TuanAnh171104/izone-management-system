using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class ThongBaoRepository : GenericRepository<ThongBao>, IThongBaoRepository
    {
        private readonly IDangKyLopRepository _dangKyLopRepository;

        public ThongBaoRepository(IZONEDbContext context, IDangKyLopRepository dangKyLopRepository) : base(context)
        {
            _dangKyLopRepository = dangKyLopRepository;
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
            else
            {
                // Nếu không phải giảng viên, kiểm tra xem có phải học viên không
                var hocVien = await _context.HocViens
                    .FirstOrDefaultAsync(hv => hv.HocVienID == nguoiNhanId);

                if (hocVien != null)
                {
                    // Lấy danh sách các lớp mà học viên đã đăng ký (tất cả trạng thái)
                    var dangKyLops = await _dangKyLopRepository.GetByHocVienIdAsync(nguoiNhanId);
                    var lopHocIds = dangKyLops
                        .Select(dk => dk.LopID)
                        .ToList();

                    if (lopHocIds.Any())
                    {
                        // Lấy thông báo của các lớp mà học viên đã đăng ký (tất cả trạng thái)
                        var classThongBaos = await _context.ThongBao
                            .Where(tb => tb.LoaiNguoiNhan == "LopHoc" && lopHocIds.Contains(tb.NguoiNhanID.Value))
                            .OrderByDescending(tb => tb.NgayGui)
                            .ToListAsync();

                        thongBaos.AddRange(classThongBaos);
                    }
                }
            }

            // Lấy thông báo toàn hệ thống (cần thiết cho tất cả người dùng)
            var systemThongBaos = await _context.ThongBao
                .Where(tb => tb.LoaiNguoiNhan == "ToanHeThong")
                .OrderByDescending(tb => tb.NgayGui)
                .ToListAsync();

            thongBaos.AddRange(systemThongBaos);

            // Lấy thông báo cá nhân (bao gồm cả học viên và giảng viên)
            var personalThongBaos = await _context.ThongBao
                .Where(tb => tb.NguoiNhanID == nguoiNhanId &&
                            (tb.LoaiNguoiNhan != "LopHoc" && tb.LoaiNguoiNhan != "ToanHeThong"))
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
