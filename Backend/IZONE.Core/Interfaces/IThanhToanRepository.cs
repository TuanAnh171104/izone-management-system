using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IThanhToanRepository : IGenericRepository<ThanhToan>
    {
        Task<IEnumerable<ThanhToan>> GetByHocVienIdAsync(int hocVienId);
        Task<IEnumerable<ThanhToan>> GetByDangKyIdAsync(int dangKyId);
        Task<IEnumerable<ThanhToan>> GetByStatusAsync(string status);
        Task<IEnumerable<ThanhToan>> GetByPhuongThucAsync(string phuongThuc);
        Task<IEnumerable<ThanhToan>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetTotalByHocVienIdAsync(int hocVienId);
        Task<decimal> GetTotalByDangKyIdAsync(int dangKyId);
    }
}