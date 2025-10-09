using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IViHocVienRepository : IGenericRepository<ViHocVien>
    {
        Task<IEnumerable<ViHocVien>> GetByHocVienIdAsync(int hocVienId);
        Task<IEnumerable<ViHocVien>> GetByLoaiTxAsync(string loaiTx);
        Task<IEnumerable<ViHocVien>> GetByDangKyIdAsync(int dangKyId);
        Task<IEnumerable<ViHocVien>> GetByThanhToanIdAsync(int thanhToanId);
        Task<decimal> GetBalanceByHocVienIdAsync(int hocVienId);
        Task<IEnumerable<ViHocVien>> GetTransactionHistoryAsync(int hocVienId, DateTime? startDate = null, DateTime? endDate = null);
    }
}