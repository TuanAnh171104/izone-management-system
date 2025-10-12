using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IBuoiHocRepository : IGenericRepository<BuoiHoc>
    {
        Task<IEnumerable<BuoiHoc>> GetByLopIdAsync(int lopId);
        Task<IEnumerable<BuoiHoc>> GetUpcomingSessionsByLopIdAsync(int lopId, int days);
        Task<IEnumerable<BuoiHoc>> GetByNgayHocAsync(DateTime ngayHoc);
        Task<IEnumerable<BuoiHoc>> GetByTrangThaiAsync(string trangThai);
        Task<IEnumerable<BuoiHoc>> GetByGiangVienThayTheIdAsync(int giangVienId);
        Task<IEnumerable<BuoiHoc>> GetByDiaDiemIdAsync(int diaDiemId);
        Task<IEnumerable<BuoiHoc>> GetScheduleByDateRangeAsync(DateTime startDate, DateTime endDate);
    }
}
