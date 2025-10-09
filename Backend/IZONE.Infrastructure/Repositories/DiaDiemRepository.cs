using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IZONE.Infrastructure.Repositories
{
    public class DiaDiemRepository : GenericRepository<DiaDiem>, IDiaDiemRepository
    {
        public DiaDiemRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<DiaDiem>> GetByTenCoSoAsync(string tenCoSo)
        {
            return await _context.DiaDiems
                .Where(dd => dd.TenCoSo.Contains(tenCoSo))
                .ToListAsync();
        }

        public async Task<IEnumerable<DiaDiem>> GetAvailableLocationsAsync(int minCapacity)
        {
            return await _context.DiaDiems
                .Where(dd => dd.SucChua >= minCapacity)
                .ToListAsync();
        }
    }
}
