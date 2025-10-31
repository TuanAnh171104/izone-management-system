using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IBaoLuuRepository : IGenericRepository<BaoLuu>
    {
        Task<IEnumerable<BaoLuu>> GetByDangKyIdAsync(int dangKyId);
        Task<IEnumerable<BaoLuu>> GetByTrangThaiAsync(string trangThai);
        Task<IEnumerable<BaoLuu>> GetExpiredBaoLuuAsync();
        Task<IEnumerable<BaoLuu>> GetPendingApprovalAsync();
        Task<BaoLuu?> GetActiveBaoLuuByDangKyIdAsync(int dangKyId);
        Task<bool> IsReservationValidForContinuingAsync(int dangKyId);
        Task<bool> CanContinueLearningAsync(int dangKyId, int newLopId);
    }
}