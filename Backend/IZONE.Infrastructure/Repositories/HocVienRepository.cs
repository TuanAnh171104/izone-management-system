using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IZONE.Infrastructure.Repositories
{
    public class HocVienRepository : GenericRepository<HocVien>, IHocVienRepository
    {
        public HocVienRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<HocVien> GetByEmailAsync(string email)
        {
            return await _context.HocViens
                .FirstOrDefaultAsync(x => x.Email == email);
        }

        public async Task<IReadOnlyList<HocVien>> GetHocViensByLopHocAsync(int lopId)
        {
            return await _context.DangKyLops
                .Where(dk => dk.LopID == lopId)
                .Select(dk => dk.HocVien)
                .ToListAsync();
        }

        public async Task<ViHocVien> GetViHocVienAsync(int hocVienId)
        {
            return await _context.ViHocViens
                .FirstOrDefaultAsync(v => v.HocVienID == hocVienId);
        }

        public async Task<IReadOnlyList<HocVien>> GetByLopIdAsync(int lopId)
        {
            return await _context.DangKyLops
                .Where(dk => dk.LopID == lopId && dk.TrangThaiDangKy == "DangHoc")
                .Include(dk => dk.HocVien)
                .Select(dk => dk.HocVien)
                .ToListAsync();
        }
    }
}
