using IZONE.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IZONE.Core.Interfaces
{
    /// <summary>
    /// Interface cho service xử lý logic báo cáo
    /// </summary>
    public interface IBaoCaoService
    {
        /// <summary>
        /// Tạo báo cáo mới
        /// </summary>
        Task<BaoCaoResponse> TaoBaoCaoAsync(TaoBaoCaoRequest request, string nguoiTao);

        /// <summary>
        /// Lấy báo cáo theo ID
        /// </summary>
        Task<BaoCaoResponse?> LayBaoCaoAsync(int baoCaoId);

        /// <summary>
        /// Lấy danh sách báo cáo với phân trang
        /// </summary>
        Task<IEnumerable<BaoCao>> LayDanhSachBaoCaoAsync(int page = 1, int pageSize = 20);

        /// <summary>
        /// Lấy báo cáo theo loại
        /// </summary>
        Task<IEnumerable<BaoCao>> LayBaoCaoTheoLoaiAsync(string loaiBaoCao, int page = 1, int pageSize = 20);

        /// <summary>
        /// Xóa báo cáo
        /// </summary>
        Task XoaBaoCaoAsync(int baoCaoId);

        /// <summary>
        /// Lấy báo cáo gần đây
        /// </summary>
        Task<IEnumerable<BaoCao>> LayBaoCaoGanDayAsync(int count = 10);

        // Các phương thức xử lý báo cáo cụ thể

        /// <summary>
        /// Báo cáo tài chính tổng hợp
        /// </summary>
        Task<BaoCaoResponse> BaoCaoTaiChinhTongHopAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc);

        /// <summary>
        /// Báo cáo doanh thu chi tiết
        /// </summary>
        Task<BaoCaoResponse> BaoCaoDoanhThuChiTietAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters);

        /// <summary>
        /// Báo cáo chi phí chi tiết
        /// </summary>
        Task<BaoCaoResponse> BaoCaoChiPhiChiTietAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters);

        /// <summary>
        /// Báo cáo lợi nhuận gộp theo lớp học
        /// </summary>
        Task<BaoCaoResponse> BaoCaoLoiNhuanGopTheoLopAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters);

        /// <summary>
        /// Báo cáo lợi nhuận ròng theo lớp học
        /// </summary>
        Task<BaoCaoResponse> BaoCaoLoiNhuanRongTheoLopAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters);

        /// <summary>
        /// Báo cáo tỷ lệ đạt theo khóa/lớp/giảng viên
        /// </summary>
        Task<BaoCaoResponse> BaoCaoTyLeDatAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters);

        /// <summary>
        /// Báo cáo hiệu suất giảng viên theo công thức tính điểm xét tốt nghiệp
        /// </summary>
        Task<BaoCaoResponse> BaoCaoHieuSuatGiangVienAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters);

        /// <summary>
        /// Báo cáo top khóa học có đăng ký nhiều nhất và lợi nhuận cao nhất
        /// </summary>
        Task<BaoCaoResponse> BaoCaoTopKhoaHocAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, int topCount = 10);

        /// <summary>
        /// Báo cáo hiệu suất cơ sở theo cách tính mới (tỷ lệ lấp đầy trung bình)
        /// </summary>
        Task<BaoCaoResponse> BaoCaoHieuSuatCoSoAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters);
    }
}
