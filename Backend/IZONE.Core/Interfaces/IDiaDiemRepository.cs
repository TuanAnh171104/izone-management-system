using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IDiaDiemRepository : IGenericRepository<DiaDiem>
    {
        Task<IEnumerable<DiaDiem>> GetByTenCoSoAsync(string tenCoSo);
        Task<IEnumerable<DiaDiem>> GetAvailableLocationsAsync(int minCapacity);
    }
}