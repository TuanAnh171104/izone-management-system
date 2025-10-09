using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IThongBaoRepository : IGenericRepository<ThongBao>
    {
        Task<IEnumerable<ThongBao>> GetByNguoiNhanAsync(int nguoiNhanId);
        Task<IEnumerable<ThongBao>> GetByLoaiNguoiNhanAsync(string loaiNguoiNhan);
        Task<IEnumerable<ThongBao>> GetRecentNotificationsAsync(int count = 10);
    }
}