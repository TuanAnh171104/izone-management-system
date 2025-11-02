using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IZONE.Infrastructure.Services
{
    public class LopHocService : ILopHocService
    {
        private readonly IZONEDbContext _context;
        private readonly ILogger<LopHocService> _logger;

        public LopHocService(IZONEDbContext context, ILogger<LopHocService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tự động tạo các buổi học dựa trên thông tin lớp học
        /// </summary>
        public async Task<IEnumerable<BuoiHoc>> CreateBuoiHocTuDongAsync(int lopHocId)
        {
            _logger.LogInformation("=== BẮT ĐẦU TẠO BUỔI HỌC TỰ ĐỘNG ===");
            _logger.LogInformation("LopHocID: {LopHocId}", lopHocId);

            // Lấy thông tin lớp học
            var lopHoc = await _context.LopHocs
                .Include(l => l.KhoaHoc)
                .FirstOrDefaultAsync(l => l.LopID == lopHocId);

            if (lopHoc == null)
            {
                _logger.LogError("Không tìm thấy lớp học với ID: {LopHocId}", lopHocId);
                throw new ArgumentException($"Không tìm thấy lớp học với ID: {lopHocId}");
            }

            if (!lopHoc.NgayKetThuc.HasValue)
            {
                _logger.LogError("Lớp học chưa có ngày kết thúc: {LopHocId}", lopHocId);
                throw new ArgumentException($"Lớp học {lopHocId} chưa có ngày kết thúc");
            }

            if (string.IsNullOrEmpty(lopHoc.NgayHocTrongTuan))
            {
                _logger.LogError("Lớp học chưa có lịch học trong tuần: {LopHocId}", lopHocId);
                throw new ArgumentException($"Lớp học {lopHocId} chưa có lịch học trong tuần");
            }

            if (string.IsNullOrEmpty(lopHoc.CaHoc))
            {
                _logger.LogError("Lớp học chưa có ca học: {LopHocId}", lopHocId);
                throw new ArgumentException($"Lớp học {lopHocId} chưa có ca học");
            }

            // Parse ca học để lấy thời gian bắt đầu và kết thúc
            var (thoiGianBatDau, thoiGianKetThuc) = ParseCaHoc(lopHoc.CaHoc);

            // Tính toán các ngày học
            var ngayHocList = await CalculateNgayHocAsync(
                lopHoc.NgayBatDau,
                lopHoc.NgayKetThuc.Value,
                lopHoc.NgayHocTrongTuan
            );

            _logger.LogInformation("Tính toán được {Count} ngày học cho lớp {LopHocId}", ngayHocList.Count(), lopHocId);

            var buoiHocList = new List<BuoiHoc>();

            // Tạo buổi học cho từng ngày
            foreach (var ngayHoc in ngayHocList)
            {
                try
                {
                    var buoiHoc = await CreateBuoiHocAsync(lopHocId, ngayHoc, thoiGianBatDau, thoiGianKetThuc);
                    buoiHocList.Add(buoiHoc);
                    _logger.LogInformation("Đã tạo buổi học cho ngày {NgayHoc} của lớp {LopHocId}", ngayHoc.ToString("yyyy-MM-dd"), lopHocId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tạo buổi học cho ngày {NgayHoc} của lớp {LopHocId}", ngayHoc.ToString("yyyy-MM-dd"), lopHocId);
                    // Tiếp tục tạo các buổi học khác
                }
            }

            _logger.LogInformation("=== HOÀN THÀNH TẠO BUỔI HỌC TỰ ĐỘNG ===");
            _logger.LogInformation("Đã tạo {Count} buổi học cho lớp {LopHocId}", buoiHocList.Count, lopHocId);

            return buoiHocList;
        }

        /// <summary>
        /// Tính toán các ngày học dựa trên lịch học trong tuần
        /// </summary>
        public async Task<IEnumerable<DateTime>> CalculateNgayHocAsync(DateTime ngayBatDau, DateTime ngayKetThuc, string ngayHocTrongTuan)
        {
            var ngayHocList = new List<DateTime>();

            // Parse lịch học trong tuần
            var thuHocList = ParseNgayHocTrongTuan(ngayHocTrongTuan);

            if (!thuHocList.Any())
            {
                _logger.LogWarning("Không có thứ học hợp lệ trong lịch học: {NgayHocTrongTuan}", ngayHocTrongTuan);
                return ngayHocList;
            }

            // Duyệt qua từng ngày từ ngày bắt đầu đến ngày kết thúc
            var currentDate = ngayBatDau.Date;
            var endDate = ngayKetThuc.Date;

            while (currentDate <= endDate)
            {
                // Kiểm tra xem ngày hiện tại có phải là ngày học không
                if (thuHocList.Contains(currentDate.DayOfWeek))
                {
                    ngayHocList.Add(currentDate);
                    _logger.LogDebug("Thêm ngày học: {NgayHoc} ({Thu})", currentDate.ToString("yyyy-MM-dd"), currentDate.DayOfWeek);
                }

                currentDate = currentDate.AddDays(1);
            }

            return ngayHocList;
        }

        /// <summary>
        /// Parse lịch học trong tuần từ string (ví dụ: "2,4,6") thành danh sách thứ
        /// </summary>
        public List<DayOfWeek> ParseNgayHocTrongTuan(string ngayHocTrongTuan)
        {
            var thuHocList = new List<DayOfWeek>();

            if (string.IsNullOrEmpty(ngayHocTrongTuan))
                return thuHocList;

            try
            {
                var thuNumbers = ngayHocTrongTuan.Split(',')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .Select(int.Parse)
                    .ToList();

                foreach (var thuNumber in thuNumbers)
                {
                    // Chuyển đổi từ số (2,3,4,5,6,7,8) thành DayOfWeek
                    // 2 = Monday, 3 = Tuesday, ..., 8 = Sunday
                    switch (thuNumber)
                    {
                        case 2:
                            thuHocList.Add(DayOfWeek.Monday);
                            break;
                        case 3:
                            thuHocList.Add(DayOfWeek.Tuesday);
                            break;
                        case 4:
                            thuHocList.Add(DayOfWeek.Wednesday);
                            break;
                        case 5:
                            thuHocList.Add(DayOfWeek.Thursday);
                            break;
                        case 6:
                            thuHocList.Add(DayOfWeek.Friday);
                            break;
                        case 7:
                            thuHocList.Add(DayOfWeek.Saturday);
                            break;
                        case 8:
                            thuHocList.Add(DayOfWeek.Sunday);
                            break;
                        default:
                            _logger.LogWarning("Số thứ không hợp lệ: {ThuNumber}", thuNumber);
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi parse lịch học trong tuần: {NgayHocTrongTuan}", ngayHocTrongTuan);
            }

            return thuHocList;
        }

        /// <summary>
        /// Parse ca học từ string (ví dụ: "19:45-21:15") thành TimeSpan bắt đầu và kết thúc
        /// </summary>
        public (TimeSpan thoiGianBatDau, TimeSpan thoiGianKetThuc) ParseCaHoc(string caHoc)
        {
            try
            {
                if (string.IsNullOrEmpty(caHoc))
                {
                    _logger.LogWarning("Ca học rỗng, sử dụng thời gian mặc định");
                    return (new TimeSpan(19, 0, 0), new TimeSpan(21, 0, 0)); // 19:00 - 21:00
                }

                var timeParts = caHoc.Split('-');
                if (timeParts.Length != 2)
                {
                    _logger.LogWarning("Định dạng ca học không đúng: {CaHoc}, sử dụng thời gian mặc định", caHoc);
                    return (new TimeSpan(19, 0, 0), new TimeSpan(21, 0, 0));
                }

                var startTime = TimeSpan.Parse(timeParts[0].Trim());
                var endTime = TimeSpan.Parse(timeParts[1].Trim());

                return (startTime, endTime);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi parse ca học: {CaHoc}", caHoc);
                return (new TimeSpan(19, 0, 0), new TimeSpan(21, 0, 0)); // Default fallback
            }
        }

        /// <summary>
        /// Cập nhật trạng thái các buổi học dựa trên thời gian hiện tại
        /// </summary>
        public async Task UpdateTrangThaiBuoiHocAsync()
        {
            _logger.LogInformation("=== BẮT ĐẦU CẬP NHẬT TRẠNG THÁI BUỔI HỌC ===");

            var now = DateTime.Now;
            var today = DateTime.Today;

            try
            {
                // Lấy tất cả buổi học chưa kết thúc
                var buoiHocs = await _context.BuoiHocs
                    .Where(b => b.TrangThai != "DaKetThuc")
                    .ToListAsync();

                _logger.LogInformation("Tìm thấy {Count} buổi học cần cập nhật trạng thái", buoiHocs.Count);

                foreach (var buoiHoc in buoiHocs)
                {
                    var ngayHoc = buoiHoc.NgayHoc.Date;
                    var thoiGianKetThuc = buoiHoc.ThoiGianKetThuc ?? new TimeSpan(21, 0, 0);
                    var ngayGioKetThuc = ngayHoc.Add(thoiGianKetThuc);

                    // Nếu đã quá thời gian kết thúc của buổi học
                    if (now > ngayGioKetThuc)
                    {
                        buoiHoc.TrangThai = "DaKetThuc";
                        _logger.LogDebug("Cập nhật buổi học {BuoiHocId} từ {TrangThaiCu} thành DaKetThuc",
                            buoiHoc.BuoiHocID, buoiHoc.TrangThai);
                    }
                    // Nếu đang trong thời gian buổi học
                    else if (now >= ngayHoc.Add(buoiHoc.ThoiGianBatDau ?? new TimeSpan(19, 0, 0)) && now <= ngayGioKetThuc)
                    {
                        buoiHoc.TrangThai = "DangDienRa";
                        _logger.LogDebug("Cập nhật buổi học {BuoiHocId} từ {TrangThaiCu} thành DangDienRa",
                            buoiHoc.BuoiHocID, buoiHoc.TrangThai);
                    }
                    // Nếu chưa đến thời gian buổi học
                    else
                    {
                        buoiHoc.TrangThai = "ChuaDienRa";
                        _logger.LogDebug("Cập nhật buổi học {BuoiHocId} thành ChuaDienRa",
                            buoiHoc.BuoiHocID);
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("=== HOÀN THÀNH CẬP NHẬT TRẠNG THÁI BUỔI HỌC ===");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật trạng thái buổi học");
                throw;
            }
        }

        /// <summary>
        /// Tạo một buổi học cụ thể
        /// </summary>
        public async Task<BuoiHoc> CreateBuoiHocAsync(int lopHocId, DateTime ngayHoc, TimeSpan thoiGianBatDau, TimeSpan thoiGianKetThuc)
        {
            // Kiểm tra xem buổi học đã tồn tại chưa
            var existingBuoiHoc = await _context.BuoiHocs
                .FirstOrDefaultAsync(b => b.LopID == lopHocId && b.NgayHoc.Date == ngayHoc.Date);

            if (existingBuoiHoc != null)
            {
                _logger.LogWarning("Buổi học đã tồn tại cho lớp {LopHocId} vào ngày {NgayHoc}", lopHocId, ngayHoc.ToString("yyyy-MM-dd"));
                return existingBuoiHoc;
            }

            // Lấy thông tin lớp học để set DiaDiemID
            var lopHoc = await _context.LopHocs.FindAsync(lopHocId);
            if (lopHoc == null)
            {
                throw new ArgumentException($"Không tìm thấy lớp học với ID: {lopHocId}");
            }

            var buoiHoc = new BuoiHoc
            {
                LopID = lopHocId,
                NgayHoc = ngayHoc,
                ThoiGianBatDau = thoiGianBatDau,
                ThoiGianKetThuc = thoiGianKetThuc,
                DiaDiemID = lopHoc.DiaDiemID, // Sử dụng địa điểm của lớp học
                TrangThai = "ChuaDienRa"
            };

            await _context.BuoiHocs.AddAsync(buoiHoc);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Đã tạo buổi học ID {BuoiHocId} cho lớp {LopHocId} vào ngày {NgayHoc}",
                buoiHoc.BuoiHocID, lopHocId, ngayHoc.ToString("yyyy-MM-dd"));

            return buoiHoc;
        }

        /// <summary>
        /// Tái tạo các buổi học tự động sau khi cập nhật thông tin lớp học
        /// </summary>
        public async Task<IEnumerable<BuoiHoc>> RecreateBuoiHocTuDongAsync(int lopHocId)
        {
            _logger.LogInformation("=== BẮT ĐẦU TÁI TẠO BUỔI HỌC TỰ ĐỘNG ===");
            _logger.LogInformation("LopHocID: {LopHocId}", lopHocId);

            // Lấy thông tin lớp học
            var lopHoc = await _context.LopHocs
                .Include(l => l.KhoaHoc)
                .FirstOrDefaultAsync(l => l.LopID == lopHocId);

            if (lopHoc == null)
            {
                _logger.LogError("Không tìm thấy lớp học với ID: {LopHocId}", lopHocId);
                throw new ArgumentException($"Không tìm thấy lớp học với ID: {lopHocId}");
            }

            if (!lopHoc.NgayKetThuc.HasValue)
            {
                _logger.LogError("Lớp học chưa có ngày kết thúc: {LopHocId}", lopHocId);
                throw new ArgumentException($"Lớp học {lopHocId} chưa có ngày kết thúc");
            }

            if (string.IsNullOrEmpty(lopHoc.NgayHocTrongTuan))
            {
                _logger.LogError("Lớp học chưa có lịch học trong tuần: {LopHocId}", lopHocId);
                throw new ArgumentException($"Lớp học {lopHocId} chưa có lịch học trong tuần");
            }

            if (string.IsNullOrEmpty(lopHoc.CaHoc))
            {
                _logger.LogError("Lớp học chưa có ca học: {LopHocId}", lopHocId);
                throw new ArgumentException($"Lớp học {lopHocId} chưa có ca học");
            }

            var today = DateTime.Today;
            var classHasStarted = lopHoc.NgayBatDau <= today;

            _logger.LogInformation("Lớp học đã bắt đầu: {ClassHasStarted} (Ngày bắt đầu: {NgayBatDau}, Hôm nay: {Today})",
                classHasStarted, lopHoc.NgayBatDau.ToString("yyyy-MM-dd"), today.ToString("yyyy-MM-dd"));

            // XÓA CÁC BUỔI HỌC CŨ
            _logger.LogInformation("Bắt đầu xử lý các buổi học cũ...");

            // Lấy danh sách buổi học hiện tại
            var existingBuoiHocs = await _context.BuoiHocs
                .Where(b => b.LopID == lopHocId)
                .Include(b => b.DiemDanhs)
                .ToListAsync();

            _logger.LogInformation("Tìm thấy {Count} buổi học hiện tại", existingBuoiHocs.Count);

            var buoiHocToDelete = new List<BuoiHoc>();
            var buoiHocToUpdate = new List<BuoiHoc>();
            var buoiHocUntouchable = new List<BuoiHoc>();

            foreach (var buoiHoc in existingBuoiHocs)
            {
                var sessionDate = buoiHoc.NgayHoc.Date;
                var sessionHasPassed = sessionDate < today;

                // Kiểm tra xem buổi học có dữ liệu điểm danh không
                bool hasDiemDanh = buoiHoc.DiemDanhs != null && buoiHoc.DiemDanhs.Any();                

                bool hasImportantData = hasDiemDanh;

                _logger.LogDebug("Buổi học {BuoiHocId} ngày {NgayHoc}: Đã qua={SessionHasPassed}, Có dữ liệu={HasImportantData}",
                    buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"), sessionHasPassed, hasImportantData);

                if (classHasStarted && sessionHasPassed && hasImportantData)
                {
                    // Buổi học đã qua và có dữ liệu quan trọng - không được động vào
                    buoiHocUntouchable.Add(buoiHoc);
                    _logger.LogInformation("Buổi học {BuoiHocId} ngày {NgayHoc} đã qua và có dữ liệu - giữ nguyên",
                        buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                }
                else if (hasImportantData)
                {
                    // Buổi học có dữ liệu nhưng chưa qua - có thể cập nhật thông tin
                    buoiHocToUpdate.Add(buoiHoc);
                    _logger.LogInformation("Buổi học {BuoiHocId} ngày {NgayHoc} có dữ liệu - sẽ cập nhật",
                        buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                }
                else
                {
                    // Buổi học không có dữ liệu - có thể xóa
                    buoiHocToDelete.Add(buoiHoc);
                    _logger.LogInformation("Buổi học {BuoiHocId} ngày {NgayHoc} không có dữ liệu - sẽ xóa",
                        buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                }
            }

            // Xóa các buổi học không có dữ liệu
            if (buoiHocToDelete.Any())
            {
                _context.BuoiHocs.RemoveRange(buoiHocToDelete);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Đã xóa {Count} buổi học cũ không có dữ liệu", buoiHocToDelete.Count);
            }

            // TẠO LẠI CÁC BUỔI HỌC MỚI
            _logger.LogInformation("Bắt đầu tạo lại các buổi học mới...");

            // Parse ca học để lấy thời gian bắt đầu và kết thúc
            var (thoiGianBatDau, thoiGianKetThuc) = ParseCaHoc(lopHoc.CaHoc);

            // Tính toán các ngày học
            var ngayHocList = await CalculateNgayHocAsync(
                lopHoc.NgayBatDau,
                lopHoc.NgayKetThuc.Value,
                lopHoc.NgayHocTrongTuan
            );

            _logger.LogInformation("Tính toán được {Count} ngày học mới cho lớp {LopHocId}", ngayHocList.Count(), lopHocId);

            var buoiHocList = new List<BuoiHoc>();

            // Xử lý từng ngày học
            foreach (var ngayHoc in ngayHocList)
            {
                try
                {
                    var sessionDate = ngayHoc.Date;
                    var sessionHasPassed = sessionDate < today;

                    // Kiểm tra xem buổi học đã tồn tại chưa
                    var existingBuoiHoc = buoiHocToUpdate.FirstOrDefault(b => b.NgayHoc.Date == sessionDate) ??
                                         buoiHocUntouchable.FirstOrDefault(b => b.NgayHoc.Date == sessionDate);

                    if (existingBuoiHoc != null)
                    {
                        // Buổi học đã tồn tại
                        if (buoiHocUntouchable.Contains(existingBuoiHoc))
                        {
                            // Buổi học đã qua và có dữ liệu - chỉ thêm vào danh sách, không cập nhật
                            buoiHocList.Add(existingBuoiHoc);
                            _logger.LogInformation("Giữ nguyên buổi học đã qua {BuoiHocId} cho ngày {NgayHoc} của lớp {LopHocId}",
                                existingBuoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"), lopHocId);
                        }
                        else
                        {
                            // Buổi học có dữ liệu nhưng chưa qua - cập nhật thông tin
                            existingBuoiHoc.ThoiGianBatDau = thoiGianBatDau;
                            existingBuoiHoc.ThoiGianKetThuc = thoiGianKetThuc;
                            existingBuoiHoc.DiaDiemID = lopHoc.DiaDiemID;

                            buoiHocList.Add(existingBuoiHoc);
                            _logger.LogInformation("Đã cập nhật buổi học có dữ liệu {BuoiHocId} cho ngày {NgayHoc} của lớp {LopHocId}",
                                existingBuoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"), lopHocId);
                        }
                    }
                    else
                    {
                        // Tạo buổi học mới
                        var buoiHoc = await CreateBuoiHocAsync(lopHocId, ngayHoc, thoiGianBatDau, thoiGianKetThuc);
                        buoiHocList.Add(buoiHoc);
                        _logger.LogInformation("Đã tạo buổi học mới cho ngày {NgayHoc} của lớp {LopHocId}",
                            sessionDate.ToString("yyyy-MM-dd"), lopHocId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tạo/cập nhật buổi học cho ngày {NgayHoc} của lớp {LopHocId}", ngayHoc.ToString("yyyy-MM-dd"), lopHocId);
                    // Tiếp tục tạo các buổi học khác
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("=== HOÀN THÀNH TÁI TẠO BUỔI HỌC TỰ ĐỘNG ===");
            _logger.LogInformation("Đã xử lý {Total} buổi học cho lớp {LopHocId} (xóa {Deleted}, cập nhật {Updated}, giữ nguyên {Untouchable}, tạo mới {Created})",
                buoiHocList.Count, lopHocId, buoiHocToDelete.Count, buoiHocToUpdate.Count, buoiHocUntouchable.Count,
                buoiHocList.Count - buoiHocToUpdate.Count - buoiHocUntouchable.Count);

            return buoiHocList;
        }
    }
}
