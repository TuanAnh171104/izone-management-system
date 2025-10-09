using IZONE.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IZONE.Core.Interfaces
{
    /// <summary>
    /// Interface cho repository xử lý báo cáo
    /// </summary>
    public interface IBaoCaoRepository
    {
        /// <summary>
        /// Tạo báo cáo mới
        /// </summary>
        Task<BaoCao> CreateAsync(BaoCao baoCao);

        /// <summary>
        /// Lấy báo cáo theo ID
        /// </summary>
        Task<BaoCao?> GetByIdAsync(int baoCaoId);

        /// <summary>
        /// Lấy danh sách báo cáo với phân trang
        /// </summary>
        Task<IEnumerable<BaoCao>> GetAllAsync(int page = 1, int pageSize = 20);

        /// <summary>
        /// Lấy báo cáo theo loại
        /// </summary>
        Task<IEnumerable<BaoCao>> GetByLoaiAsync(string loaiBaoCao, int page = 1, int pageSize = 20);

        /// <summary>
        /// Lấy báo cáo trong khoảng thời gian
        /// </summary>
        Task<IEnumerable<BaoCao>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, int page = 1, int pageSize = 20);

        /// <summary>
        /// Cập nhật báo cáo
        /// </summary>
        Task UpdateAsync(BaoCao baoCao);

        /// <summary>
        /// Xóa báo cáo
        /// </summary>
        Task DeleteAsync(int baoCaoId);

        /// <summary>
        /// Đếm tổng số báo cáo
        /// </summary>
        Task<int> CountAsync();

        /// <summary>
        /// Đếm báo cáo theo loại
        /// </summary>
        Task<int> CountByLoaiAsync(string loaiBaoCao);

        /// <summary>
        /// Lấy báo cáo gần đây
        /// </summary>
        Task<IEnumerable<BaoCao>> GetRecentAsync(int count = 10);
    }
}
