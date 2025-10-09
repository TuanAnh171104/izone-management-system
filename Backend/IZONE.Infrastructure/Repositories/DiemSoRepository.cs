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
    }
}
