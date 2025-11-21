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
            _logger.LogInformation("=== BẮT ĐẦU TÁI TẠO BUỔI HỌC TỰ ĐỘNG (LOGIC MỚI) ===");
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
            _logger.LogInformation("Lịch và ngày hôm nay: {NgayHoc}, {Today}",
                lopHoc.NgayHocTrongTuan, today.ToString("yyyy-MM-dd"));

            // ==========================================
            // LOGIC MỚI: GIỮ NGUYÊN BUỔI ĐÃ DIỄN RA, CHỈ ĐỔI BUỔI CHƯA DIỄN RA
            // ==========================================

            _logger.LogInformation("=== BƯỚC 1: LẤY DANH SÁCH BUỔI HỌC HIỆN TẠI ===");

            // Lấy danh sách buổi học hiện tại có kèm dữ liệu điểm danh
            var existingBuoiHocs = await _context.BuoiHocs
                .Where(b => b.LopID == lopHocId)
                .Include(b => b.DiemDanhs)
                .ToListAsync();

            _logger.LogInformation("Tìm thấy {Count} buổi học hiện tại", existingBuoiHocs.Count);

            var buoiHocPast = new List<BuoiHoc>();     // Buổi đã diễn ra (bảo vệ)
            var buoiHocFutureEditable = new List<BuoiHoc>(); // Buổi tương lai có dữ liệu (có thể cập nhật)
            var buoiHocFutureEmpty = new List<BuoiHoc>();    // Buổi tương lai không có dữ liệu (xóa)

            foreach (var buoiHoc in existingBuoiHocs)
            {
                var sessionDate = buoiHoc.NgayHoc.Date;
                var sessionHasPassed = sessionDate < today;
                var hasDiemDanh = buoiHoc.DiemDanhs != null && buoiHoc.DiemDanhs.Any();

                _logger.LogDebug("Buổi học {BuoiHocId}: Ngày {Ngay}, Đã qua: {Passed}, Có điểm danh: {HasData}",
                    buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"), sessionHasPassed, hasDiemDanh);

                if (sessionHasPassed)
                {
                    // BUỔI ĐÃ DIỄN RA → GIỮ NGUYÊN NUÔN (bảo vệ dữ liệu)
                    buoiHocPast.Add(buoiHoc);
                    _logger.LogInformation("🛡️ Buổi đã diễn ra {BuoiHocId} ({Ngay}) - GIỮ NGUYÊN",
                        buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                }
                else if (hasDiemDanh)
                {
                    // BUỔI TƯƠNG LAI CÓ DỮ LIỆU → UPDATE THÔNG TIN MỚI
                    buoiHocFutureEditable.Add(buoiHoc);
                    _logger.LogInformation("✏️ Buổi tương lai có dữ liệu {BuoiHocId} ({Ngay}) - SẼ UPDATE",
                        buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                }
                else
                {
                    // BUỔI TƯƠNG LAI TRỐNG → XÓA ĐI VÀ TẠO LẠI
                    buoiHocFutureEmpty.Add(buoiHoc);
                    _logger.LogInformation("🗑️ Buổi tương lai trống {BuoiHocId} ({Ngay}) - SẼ XÓA THAY BẰNG BUỔI MỚI",
                        buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                }
            }

            _logger.LogInformation("=== PHÂN LOẠI HOÀN THÀNH ===");
            _logger.LogInformation("Buổi đã diễn ra: {Past}, Buổi tương lai có dữ liệu: {FutureData}, Buổi tương lai trống: {FutureEmpty}",
                buoiHocPast.Count, buoiHocFutureEditable.Count, buoiHocFutureEmpty.Count);

            _logger.LogInformation("=== BƯỚC 2: XÓA BUỔI TƯƠNG LAI KHÔNG KHỚP LỊCH MỚI ===");

            // 🔥 FIX: Xóa TẤT CẢ buổi tương lai KHÔNG KHỚP lịch mới
            // Trước tiên tính những ngày nào hợp lệ trong lịch mới (từ hôm nay trở đi)
            var validFutureDates = await CalculateNgayHocAsync(
                lopHoc.NgayBatDau,
                lopHoc.NgayKetThuc.Value,
                lopHoc.NgayHocTrongTuan
            );

            validFutureDates = validFutureDates.Where(date => date.Date >= today).ToList();

            var sessionsToDelete = new List<BuoiHoc>();

            foreach (var buoiHoc in existingBuoiHocs)
            {
                var sessionDate = buoiHoc.NgayHoc.Date;
                var sessionHasPassed = sessionDate < today;

                // Chỉ xử lý buổi chưa diễn ra
                if (!sessionHasPassed)
                {
                    // Kiểm tra xem buổi này có nằm trong lịch mới không
                    var isInNewSchedule = validFutureDates.Any(validDate => validDate.Date == sessionDate);

                    if (!isInNewSchedule)
                    {
                        sessionsToDelete.Add(buoiHoc);
                        _logger.LogInformation("🗑️ Buổi {BuoiHocId} ngày {Ngay} không nằm trong lịch mới - sẽ xóa",
                            buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                    }
                    else
                    {
                        _logger.LogInformation("✅ Buổi {BuoiHocId} ngày {Ngay} nằm trong lịch mới - giữ lại",
                            buoiHoc.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"));
                    }
                }
            }

            // Xóa các buổi không khớp lịch
            if (sessionsToDelete.Any())
            {
                // 🔥 FIX: Xóa DiemDanh trước để tránh conflict với DeleteBehavior.Restrict
                var diemDanhToDelete = new List<DiemDanh>();
                foreach (var buoiHoc in sessionsToDelete)
                {
                    if (buoiHoc.DiemDanhs?.Any() == true)
                    {
                        diemDanhToDelete.AddRange(buoiHoc.DiemDanhs);
                        _logger.LogInformation("🗑️ Sẽ xóa {Count} điểm danh của buổi {BuoiHocId}",
                            buoiHoc.DiemDanhs.Count, buoiHoc.BuoiHocID);
                    }
                }

                if (diemDanhToDelete.Any())
                {
                    _context.DiemDanhs.RemoveRange(diemDanhToDelete);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("✅ Đã xóa {Count} điểm danh của các buổi không khớp lịch", diemDanhToDelete.Count);
                }

                // Bây giờ mới xóa BuoiHoc
                _context.BuoiHocs.RemoveRange(sessionsToDelete);
                await _context.SaveChangesAsync();
                _logger.LogInformation("✅ Đã xóa {Count} buổi học không khớp lịch mới", sessionsToDelete.Count);
            }

            // Cập nhật danh sách sau khi xóa
            buoiHocFutureEditable = buoiHocFutureEditable
                .Where(b => !sessionsToDelete.Contains(b))
                .ToList();

            _logger.LogInformation("=== BƯỚC 3: TẠO LẠI BUỔI HỌC THEO LỊCH MỚI ===");

            // Parse ca học mới
            var (thoiGianBatDau, thoiGianKetThuc) = ParseCaHoc(lopHoc.CaHoc);
            _logger.LogInformation("Ca học mới: {CaHoc} → {Start} đến {End}",
                lopHoc.CaHoc, thoiGianBatDau.ToString(@"hh\:mm"), thoiGianKetThuc.ToString(@"hh\:mm"));

            // Tính toán ngày học mới theo lịch mới
            var ngayHocListMoi = await CalculateNgayHocAsync(
                lopHoc.NgayBatDau,
                lopHoc.NgayKetThuc.Value,
                lopHoc.NgayHocTrongTuan
            );

            _logger.LogInformation("📅 Lịch mới tạo ra {Count} buổi học từ {Start} đến {End}",
                ngayHocListMoi.Count(), lopHoc.NgayBatDau.ToString("yyyy-MM-dd"), lopHoc.NgayKetThuc.Value.ToString("yyyy-MM-dd"));

            var buoiHocDaXuLy = new List<BuoiHoc>();
            var buoiHocMoiTao = 0;

            // Thêm tất cả buổi học đã tồn tại vào danh sách
            buoiHocDaXuLy.AddRange(buoiHocPast);

            // 🔧 FIX: Chỉ lấy các buổi học MỚI từ NGÀY HÔM NAY trở đi
            // KHÔNG tạo buổi học trong quá khứ cho lịch mới!
            var ngayHocMoiSauNgayHienTai = ngayHocListMoi.Where(ngay =>
                ngay.Date >= today).ToList();

            _logger.LogInformation("🎯 Chỉ tạo {Count} buổi học tương lai (từ {Today} trở đi)",
                ngayHocMoiSauNgayHienTai.Count, today.ToString("yyyy-MM-dd"));
            _logger.LogInformation("📅 Bỏ qua {Count} buổi trong quá khứ: {SkippedDates}",
                ngayHocListMoi.Count() - ngayHocMoiSauNgayHienTai.Count,
                string.Join(", ", ngayHocListMoi.Where(ngay => ngay.Date < today).Select(d => d.ToString("yyyy-MM-dd"))));

            // Xử lý từng ngày học mới - CHỈ NHỮNG NGÀY TƯƠNG LAI
            foreach (var ngayHoc in ngayHocMoiSauNgayHienTai)
            {
                try
                {
                    var sessionDate = ngayHoc.Date;
                    _logger.LogDebug("🔄 Xử lý ngày: {Ngay}", sessionDate.ToString("yyyy-MM-dd"));

                    //  FIX: Luôn kiểm tra trực tiếp từ database thay vì dựa vào danh sách trong memory
                    var existingSession = await _context.BuoiHocs
                        .FirstOrDefaultAsync(b => b.LopID == lopHocId && b.NgayHoc.Date == sessionDate);

                    if (existingSession != null)
                    {
                        // BUỔI HỌC ĐÃ TỒN TẠI → UPDATE THÔNG TIN MỚI (luôn update để đảm bảo ca học mới)
                        existingSession.ThoiGianBatDau = thoiGianBatDau;
                        existingSession.ThoiGianKetThuc = thoiGianKetThuc;
                        existingSession.DiaDiemID = lopHoc.DiaDiemID;

                        buoiHocDaXuLy.Add(existingSession);
                        _logger.LogInformation("🔄 Đã cập nhật buổi học {BuoiHocId} cho ngày {Ngay} với ca mới {CaHoc}",
                            existingSession.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"),
                            $"{thoiGianBatDau:hh\\:mm}-{thoiGianKetThuc:hh\\:mm}");
                    }
                    else
                    {
                        // CHƯA CÓ BUỔI HỌC CHO NGÀY NÀY → TẠO MỚI
                        var buoiHocMoi = await CreateBuoiHocAsync(lopHocId, ngayHoc, thoiGianBatDau, thoiGianKetThuc);
                        buoiHocDaXuLy.Add(buoiHocMoi);
                        buoiHocMoiTao++;
                        _logger.LogInformation("🆕 Đã tạo buổi học mới {BuoiHocId} cho ngày {Ngay} với ca {CaHoc}",
                            buoiHocMoi.BuoiHocID, sessionDate.ToString("yyyy-MM-dd"),
                            $"{thoiGianBatDau:hh\\:mm}-{thoiGianKetThuc:hh\\:mm}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Lỗi xử lý ngày {Ngay}: {Error}", ngayHoc.ToString("yyyy-MM-dd"), ex.Message);
                    // Tiếp tục để tránh dừng toàn bộ quá trình
                }
            }

            // Lưu các thay đổi update
            await _context.SaveChangesAsync();

            _logger.LogInformation("=== HOÀN THÀNH: CẬP NHẬT BUỔI HỌC THEO LỊCH MỚI ===");
            _logger.LogInformation("📊 TỔNG KẾT:");
            _logger.LogInformation("   - Buổi đã diễn ra (bảo vệ): {Past}", buoiHocPast.Count);
            _logger.LogInformation("   - Buổi cập nhật: {Updated}", buoiHocFutureEditable.Count);
            _logger.LogInformation("   - Buổi xóa (trống): {Deleted}", buoiHocFutureEmpty.Count);
            _logger.LogInformation("   - Buổi mới tạo: {Created}", buoiHocMoiTao);
            _logger.LogInformation("   - Tổng buổi hiện tại: {Total}", buoiHocDaXuLy.Count);

            return buoiHocDaXuLy;
        }

        /// <summary>
        /// Cập nhật thông tin giảng viên và địa điểm cho các buổi học tương lai
        /// </summary>
        public async Task UpdateBuoiHocThongTinAsync(int lopHocId, int? giangVienId = null, int? diaDiemId = null)
        {
            _logger.LogInformation("=== BẮT ĐẦU CẬP NHẬT THÔNG TIN BUỔI HỌC TƯƠNG LAI ===");
            _logger.LogInformation("LopHocID: {LopHocId}, GiangVienID: {GiangVienId}, DiaDiemID: {DiaDiemId}", lopHocId, giangVienId, diaDiemId);

            if (giangVienId == null && diaDiemId == null)
            {
                _logger.LogWarning("Không có thông tin nào để cập nhật cho lớp {LopHocId}", lopHocId);
                return;
            }

            var today = DateTime.Today;

            // Lấy tất cả buổi học tương lai của lớp
            var futureBuoiHocs = await _context.BuoiHocs
                .Where(b => b.LopID == lopHocId && b.NgayHoc.Date >= today)
                .ToListAsync();

            _logger.LogInformation("Tìm thấy {Count} buổi học tương lai cần cập nhật", futureBuoiHocs.Count);

            if (!futureBuoiHocs.Any())
            {
                _logger.LogInformation("Không có buổi học tương lai nào cho lớp {LopHocId}", lopHocId);
                return;
            }

            var updatedCount = 0;

            foreach (var buoiHoc in futureBuoiHocs)
            {
                var hasChanges = false;

                // Cập nhật giảng viên nếu được chỉ định
                if (giangVienId.HasValue && buoiHoc.GiangVienThayTheID != giangVienId.Value)
                {
                    buoiHoc.GiangVienThayTheID = giangVienId.Value;
                    hasChanges = true;
                    _logger.LogDebug("Cập nhật GiangVienThayTheID từ {Old} thành {New} cho buổi {BuoiHocId}",
                        buoiHoc.GiangVienThayTheID, giangVienId.Value, buoiHoc.BuoiHocID);
                }

                // Cập nhật địa điểm nếu được chỉ định
                if (diaDiemId.HasValue && buoiHoc.DiaDiemID != diaDiemId.Value)
                {
                    buoiHoc.DiaDiemID = diaDiemId.Value;
                    hasChanges = true;
                    _logger.LogDebug("Cập nhật DiaDiemID từ {Old} thành {New} cho buổi {BuoiHocId}",
                        buoiHoc.DiaDiemID, diaDiemId.Value, buoiHoc.BuoiHocID);
                }

                if (hasChanges)
                {
                    updatedCount++;
                    _logger.LogInformation("Đã cập nhật thông tin cho buổi học {BuoiHocId} vào ngày {Ngay}",
                        buoiHoc.BuoiHocID, buoiHoc.NgayHoc.ToString("yyyy-MM-dd"));
                }
            }

            // Lưu thay đổi
            if (updatedCount > 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("✅ Đã cập nhật thông tin cho {Count}/{Total} buổi học tương lai",
                    updatedCount, futureBuoiHocs.Count);
            }
            else
            {
                _logger.LogInformation("ℹ️ Không có buổi học nào cần cập nhật thông tin");
            }

            _logger.LogInformation("=== HOÀN THÀNH CẬP NHẬT THÔNG TIN BUỔI HỌC TƯƠNG LAI ===");
        }
    }
}
