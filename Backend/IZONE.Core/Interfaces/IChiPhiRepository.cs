using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IChiPhiRepository : IGenericRepository<ChiPhi>
    {
        Task<IEnumerable<ChiPhi>> GetByLopIdAsync(int lopId);
        Task<IEnumerable<ChiPhi>> GetByDiaDiemIdAsync(int diaDiemId);
        Task<IEnumerable<ChiPhi>> GetByLoaiAsync(string loai);
        Task<IEnumerable<ChiPhi>> GetBySubLoaiAsync(string subLoai);
        Task<IEnumerable<ChiPhi>> GetByNguonChiPhiAsync(string nguonChiPhi);
        Task<IEnumerable<ChiPhi>> GetByAllocationMethodAsync(string allocationMethod);
        Task<IEnumerable<ChiPhi>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetTotalCostByLopIdAsync(int lopId);
        Task<IEnumerable<ChiPhi>> GetRecurringCostsAsync();
    }
}
