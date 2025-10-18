using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class DiemSoRepository : GenericRepository<DiemSo>, IDiemSoRepository
    {
        public DiemSoRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<DiemSo>> GetByHocVienIdAsync(int hocVienId)
        {
            return await _context.DiemSos
                .Include(ds => ds.HocVien)
                .Include(ds => ds.LopHoc)
                .Where(ds => ds.HocVienID == hocVienId)
                .OrderBy(ds => ds.LopID)
                .ThenBy(ds => ds.LoaiDiem)
                .ToListAsync();
        }

        public async Task<IEnumerable<DiemSo>> GetByLopIdAsync(int lopId)
        {
            return await _context.DiemSos
                .Include(ds => ds.HocVien)
                .Include(ds => ds.LopHoc)
                .Where(ds => ds.LopID == lopId)
                .OrderBy(ds => ds.HocVien.HoTen)
                .ThenBy(ds => ds.LoaiDiem)
                .ToListAsync();
        }

        public async Task<IEnumerable<DiemSo>> GetByLoaiDiemAsync(string loaiDiem)
        {
            return await _context.DiemSos
                .Include(ds => ds.HocVien)
                .Include(ds => ds.LopHoc)
                .Where(ds => ds.LoaiDiem == loaiDiem)
                .OrderBy(ds => ds.LopID)
                .ThenBy(ds => ds.HocVien.HoTen)
                .ToListAsync();
        }

        public async Task<IEnumerable<DiemSo>> GetByKetQuaAsync(string ketQua)
        {
            return await _context.DiemSos
                .Include(ds => ds.HocVien)
                .Include(ds => ds.LopHoc)
                .Where(ds => ds.KetQua == ketQua)
                .OrderBy(ds => ds.LopID)
                .ThenBy(ds => ds.HocVien.HoTen)
                .ToListAsync();
        }

        public async Task<DiemSo?> GetByHocVienAndLopAndLoaiDiemAsync(int hocVienId, int lopId, string loaiDiem)
        {
            return await _context.DiemSos
                .Include(ds => ds.HocVien)
                .Include(ds => ds.LopHoc)
                .FirstOrDefaultAsync(ds => ds.HocVienID == hocVienId && 
                                         ds.LopID == lopId && 
                                         ds.LoaiDiem == loaiDiem);
        }

        public async Task<IEnumerable<DiemSo>> GetGradesByHocVienAndLopAsync(int hocVienId, int lopId)
        {
            return await _context.DiemSos
                .Include(ds => ds.HocVien)
                .Include(ds => ds.LopHoc)
                .Where(ds => ds.HocVienID == hocVienId && ds.LopID == lopId)
                .OrderBy(ds => ds.LoaiDiem)
                .ToListAsync();
        }

        public async Task<decimal> GetDiemTrungBinhByHocVienAndLopAsync(int hocVienId, int lopId)
        {
            var diemSos = await _context.DiemSos
                .Where(ds => ds.HocVienID == hocVienId && ds.LopID == lopId)
                .ToListAsync();

            if (!diemSos.Any())
                return 0;

            decimal diemGiuaKy = 0;
            decimal diemCuoiKy = 0;

            foreach (var diem in diemSos)
            {
                if (diem.LoaiDiem == "GiuaKy")
                    diemGiuaKy = diem.Diem;
                else if (diem.LoaiDiem == "CuoiKy")
                    diemCuoiKy = diem.Diem;
            }

            // Tính điểm trung bình theo công thức: (Giữa kỳ + Cuối kỳ * 2) / 3
            if (diemGiuaKy > 0 || diemCuoiKy > 0)
            {
                return Math.Round((diemGiuaKy + diemCuoiKy * 2) / 3, 2);
            }

            return 0;
        }
    }
}
