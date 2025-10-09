using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IThueMatBangRepository : IGenericRepository<ThueMatBang>
    {
        Task<IEnumerable<ThueMatBang>> GetByDiaDiemIdAsync(int diaDiemId);
        Task<IEnumerable<ThueMatBang>> GetActiveContractsAsync();
        Task<IEnumerable<ThueMatBang>> GetExpiringContractsAsync(DateTime beforeDate);
        Task<decimal> GetTotalRentByDiaDiemAsync(int diaDiemId);
        Task<IEnumerable<ThueMatBang>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    }
}