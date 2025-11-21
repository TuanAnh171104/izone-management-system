using IZONE.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace IZONE.Core.Interfaces
{
    public interface ILopHocService
    {
        /// <summary>
        /// Tự động tạo các buổi học dựa trên thông tin lớp học
        /// </summary>
        Task<IEnumerable<BuoiHoc>> CreateBuoiHocTuDongAsync(int lopHocId);

        /// <summary>
        /// Tính toán các ngày học dựa trên lịch học trong tuần
        /// </summary>
        Task<IEnumerable<DateTime>> CalculateNgayHocAsync(DateTime ngayBatDau, DateTime ngayKetThuc, string ngayHocTrongTuan);

        /// <summary>
        /// Parse lịch học trong tuần từ string (ví dụ: "2,4,6") thành danh sách thứ
        /// </summary>
        List<DayOfWeek> ParseNgayHocTrongTuan(string ngayHocTrongTuan);

        /// <summary>
        /// Parse ca học từ string (ví dụ: "19:45-21:15") thành TimeSpan bắt đầu và kết thúc
        /// </summary>
        (TimeSpan thoiGianBatDau, TimeSpan thoiGianKetThuc) ParseCaHoc(string caHoc);

        /// <summary>
        /// Cập nhật trạng thái các buổi học dựa trên thời gian hiện tại
        /// </summary>
        Task UpdateTrangThaiBuoiHocAsync();

        /// <summary>
        /// Tạo một buổi học cụ thể
        /// </summary>
        Task<BuoiHoc> CreateBuoiHocAsync(int lopHocId, DateTime ngayHoc, TimeSpan thoiGianBatDau, TimeSpan thoiGianKetThuc);

        /// <summary>
        /// Tái tạo các buổi học tự động sau khi cập nhật thông tin lớp học
        /// </summary>
        Task<IEnumerable<BuoiHoc>> RecreateBuoiHocTuDongAsync(int lopHocId);

        /// <summary>
        /// Cập nhật thông tin giảng viên và địa điểm cho các buổi học tương lai
        /// </summary>
        Task UpdateBuoiHocThongTinAsync(int lopHocId, int? giangVienId = null, int? diaDiemId = null);
    }
}
