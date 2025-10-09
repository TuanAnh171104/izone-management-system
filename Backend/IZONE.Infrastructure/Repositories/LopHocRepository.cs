using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace IZONE.Infrastructure.Repositories
{
    public class LopHocRepository : GenericRepository<LopHoc>, ILopHocRepository
    {
        public LopHocRepository(IZONEDbContext context) : base(context)
        {
        }

        /// <summary>
        /// Tính toán ngày kết thúc tự động dựa trên khóa học và ngày bắt đầu
        /// </summary>
        public async Task<DateTime> CalculateEndDate(int khoaHocId, DateTime startDate)
        {
            // Lấy thông tin khóa học từ database
            var khoaHoc = await _context.KhoaHocs
                .FirstOrDefaultAsync(kh => kh.KhoaHocID == khoaHocId);

            if (khoaHoc == null)
            {
                throw new ArgumentException($"Không tìm thấy khóa học với ID: {khoaHocId}");
            }

            // Lấy thông tin ngày học trong tuần từ lớp học đầu tiên của khóa học này
            var lopHoc = await _context.LopHocs
                .FirstOrDefaultAsync(l => l.KhoaHocID == khoaHocId && !string.IsNullOrEmpty(l.NgayHocTrongTuan));

            if (lopHoc == null)
            {
                throw new ArgumentException($"Không tìm thấy lớp học nào cho khóa học ID: {khoaHocId} hoặc chưa có thông tin ngày học trong tuần");
            }

            Console.WriteLine($"=== BẮT ĐẦU TÍNH NGÀY KẾT THÚC ===");
            Console.WriteLine($"Khóa học ID: {khoaHocId}");
            Console.WriteLine($"Ngày bắt đầu: {startDate}");
            Console.WriteLine($"Ngày học trong tuần: {lopHoc.NgayHocTrongTuan}");
            Console.WriteLine($"Số buổi học: {khoaHoc.SoBuoi}");

            if (string.IsNullOrEmpty(lopHoc.NgayHocTrongTuan) || khoaHoc.SoBuoi <= 0)
            {
                throw new ArgumentException("Thông tin khóa học hoặc lớp học không hợp lệ");
            }

            try
            {
                // Đếm số buổi học trong tuần từ chuỗi ngày học (ví dụ: "2,4,6" = 3 buổi)
                var ngayHocList = lopHoc.NgayHocTrongTuan.Split(',')
                    .Where(s => !string.IsNullOrWhiteSpace(s.Trim()))
                    .Select(s => s.Trim())
                    .ToList();

                Console.WriteLine($"Danh sách ngày học sau khi tách: {string.Join(", ", ngayHocList)}");

                int soBuoiTrongTuan = ngayHocList.Count();
                Console.WriteLine($"Số buổi học trong tuần: {soBuoiTrongTuan}");

                if (soBuoiTrongTuan == 0)
                {
                    throw new ArgumentException("Không có buổi học nào trong tuần");
                }

                // Tính tổng số tuần cần thiết (làm tròn lên)
                double soTuanDouble = (double)khoaHoc.SoBuoi / soBuoiTrongTuan;
                int tongSoTuan = (int)Math.Ceiling(soTuanDouble);

                Console.WriteLine($"Số buổi học: {khoaHoc.SoBuoi}");
                Console.WriteLine($"Số buổi trong tuần: {soBuoiTrongTuan}");
                Console.WriteLine($"Số tuần (trước làm tròn): {soTuanDouble}");
                Console.WriteLine($"Tổng số tuần (sau làm tròn): {tongSoTuan}");

                // Tính ngày kết thúc
                // Ví dụ: Nếu học thứ 2,4,6 (3 buổi/tuần) và có 12 buổi học
                // Tổng số tuần = CEILING(12/3) = 4 tuần
                // Ngày kết thúc = Ngày bắt đầu + (4 * 7) - 1 ngày
                int soNgayCongThem = tongSoTuan * 7 - 1;
                DateTime ngayKetThuc = startDate.AddDays(soNgayCongThem);

                Console.WriteLine($"Số ngày cộng thêm: {soNgayCongThem}");
                Console.WriteLine($"Ngày kết thúc tính được: {ngayKetThuc}");
                Console.WriteLine($"=== KẾT THÚC TÍNH NGÀY KẾT THÚC ===");

                return ngayKetThuc;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi tính ngày kết thúc: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        /// <summary>
        /// Cập nhật ngày kết thúc cho lớp học với ngày kết thúc được chỉ định
        /// </summary>
        public async Task<bool> UpdateEndDateAsync(int lopHocId, DateTime endDate)
        {
            var lopHoc = await _context.LopHocs
                .FirstOrDefaultAsync(l => l.LopID == lopHocId);

            if (lopHoc == null)
                return false;

            lopHoc.NgayKetThuc = endDate;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IReadOnlyList<LopHoc>> GetActiveLopHocAsync()
        {
            try
            {
                return await _context.LopHocs
                    .Where(l => l.TrangThai == "Đang học" || l.TrangThai == "Sắp khai giảng")
                    .Include(l => l.KhoaHoc)
                    .Include(l => l.GiangVien)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                // Nếu có lỗi với Entity Framework, thử truy vấn raw SQL
                var sql = @"
                    SELECT l.LopID, l.KhoaHocID, l.GiangVienID, l.DiaDiemID,
                           l.NgayBatDau, l.NgayKetThuc, l.CaHoc, l.NgayHocTrongTuan,
                           l.DonGiaBuoiDay, l.ThoiLuongGio, l.SoLuongToiDa, l.TrangThai,
                           k.KhoaHocID as KhoaHoc_KhoaHocID, k.TenKhoaHoc, k.SoBuoi, k.HocPhi, k.DonGiaTaiLieu,
                           g.GiangVienID as GiangVien_GiangVienID, g.HoTen, g.ChuyenMon, g.TaiKhoanID,
                           d.DiaDiemID as DiaDiem_DiaDiemID, d.TenCoSo, d.DiaChi, d.SucChua
                    FROM LopHoc l
                    LEFT JOIN KhoaHoc k ON l.KhoaHocID = k.KhoaHocID
                    LEFT JOIN GiangVien g ON l.GiangVienID = g.GiangVienID
                    LEFT JOIN DiaDiem d ON l.DiaDiemID = d.DiaDiemID
                    WHERE l.TrangThai IN ('Đang học', 'Sắp khai giảng')";

                var lopHocs = new List<LopHoc>();
                var connection = _context.Database.GetDbConnection();

                await connection.OpenAsync();
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = sql;
                    command.CommandType = System.Data.CommandType.Text;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        var lopHocDict = new Dictionary<int, LopHoc>();

                        while (await reader.ReadAsync())
                        {
                            var lopId = reader.GetInt32(0);

                            if (!lopHocDict.TryGetValue(lopId, out var lopHoc))
                            {
                                lopHoc = new LopHoc
                                {
                                    LopID = lopId,
                                    KhoaHocID = reader.GetInt32(1),
                                    GiangVienID = reader.GetInt32(2),
                                    DiaDiemID = reader.IsDBNull(3) ? null : (int?)reader.GetInt32(3),
                                    NgayBatDau = reader.GetDateTime(4),
                                    NgayKetThuc = reader.IsDBNull(5) ? null : (DateTime?)reader.GetDateTime(5),
                                    CaHoc = reader.IsDBNull(6) ? string.Empty : reader.GetString(6),
                                    NgayHocTrongTuan = reader.IsDBNull(7) ? string.Empty : reader.GetString(7),
                                    DonGiaBuoiDay = reader.GetDecimal(8),
                                    ThoiLuongGio = reader.GetDecimal(9),
                                    SoLuongToiDa = reader.GetInt32(10),
                                    TrangThai = reader.IsDBNull(11) ? "ChuaBatDau" : reader.GetString(11)
                                };

                                // Set navigation properties
                                if (!reader.IsDBNull(12))
                                {
                                    lopHoc.KhoaHoc = new KhoaHoc
                                    {
                                        KhoaHocID = reader.GetInt32(12),
                                        TenKhoaHoc = reader.IsDBNull(13) ? string.Empty : reader.GetString(13),
                                        SoBuoi = reader.GetInt32(14),
                                        HocPhi = reader.GetDecimal(15),
                                        DonGiaTaiLieu = reader.GetDecimal(16)
                                    };
                                }

                                if (!reader.IsDBNull(17))
                                {
                                    lopHoc.GiangVien = new GiangVien
                                    {
                                        GiangVienID = reader.GetInt32(17),
                                        HoTen = reader.IsDBNull(18) ? string.Empty : reader.GetString(18),
                                        ChuyenMon = reader.IsDBNull(19) ? string.Empty : reader.GetString(19),
                                        TaiKhoanID = reader.IsDBNull(20) ? 0 : reader.GetInt32(20)
                                    };
                                }

                                if (!reader.IsDBNull(21))
                                {
                                    lopHoc.DiaDiem = new DiaDiem
                                    {
                                        DiaDiemID = reader.GetInt32(21),
                                        TenCoSo = reader.IsDBNull(22) ? string.Empty : reader.GetString(22),
                                        DiaChi = reader.IsDBNull(23) ? string.Empty : reader.GetString(23),
                                        SucChua = reader.IsDBNull(24) ? 0 : reader.GetInt32(24)
                                    };
                                }

                                lopHocDict[lopId] = lopHoc;
                                lopHocs.Add(lopHoc);
                            }
                        }
                    }
                }

                await connection.CloseAsync();
                return lopHocs;
            }
        }

        public async Task<IReadOnlyList<LopHoc>> GetAllAsync()
        {
            try
            {
                // Thử sử dụng Entity Framework trước
                return await _context.LopHocs
                    .Include(l => l.KhoaHoc)
                    .Include(l => l.GiangVien)
                    .Include(l => l.DiaDiem)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                // Nếu có lỗi với Entity Framework, thử truy vấn raw SQL
                Console.WriteLine($"Lỗi Entity Framework, thử truy vấn raw SQL: {ex.Message}");

                var sql = @"
                    SELECT l.LopID, l.KhoaHocID, l.GiangVienID, l.DiaDiemID,
                           l.NgayBatDau, l.NgayKetThuc, l.CaHoc, l.NgayHocTrongTuan,
                           l.DonGiaBuoiDay, l.ThoiLuongGio, l.SoLuongToiDa, l.TrangThai,
                           k.KhoaHocID as KhoaHoc_KhoaHocID, k.TenKhoaHoc, k.SoBuoi, k.HocPhi, k.DonGiaTaiLieu,
                           g.GiangVienID as GiangVien_GiangVienID, g.HoTen, g.ChuyenMon, g.TaiKhoanID,
                           d.DiaDiemID as DiaDiem_DiaDiemID, d.TenCoSo, d.DiaChi, d.SucChua
                    FROM LopHoc l
                    LEFT JOIN KhoaHoc k ON l.KhoaHocID = k.KhoaHocID
                    LEFT JOIN GiangVien g ON l.GiangVienID = g.GiangVienID
                    LEFT JOIN DiaDiem d ON l.DiaDiemID = d.DiaDiemID";

                var lopHocs = new List<LopHoc>();
                var connection = _context.Database.GetDbConnection();

                try
                {
                    await connection.OpenAsync();
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = sql;
                        command.CommandType = System.Data.CommandType.Text;

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            var lopHocDict = new Dictionary<int, LopHoc>();

                            while (await reader.ReadAsync())
                            {
                                var lopId = reader.GetInt32(0);

                                if (!lopHocDict.TryGetValue(lopId, out var lopHoc))
                                {
                                    lopHoc = new LopHoc
                                    {
                                        LopID = lopId,
                                        KhoaHocID = reader.GetInt32(1),
                                        GiangVienID = reader.GetInt32(2),
                                        DiaDiemID = reader.IsDBNull(3) ? null : (int?)reader.GetInt32(3),
                                        NgayBatDau = reader.GetDateTime(4),
                                        NgayKetThuc = reader.IsDBNull(5) ? null : (DateTime?)reader.GetDateTime(5),
                                        CaHoc = reader.IsDBNull(6) ? string.Empty : reader.GetString(6),
                                        NgayHocTrongTuan = reader.IsDBNull(7) ? string.Empty : reader.GetString(7),
                                        DonGiaBuoiDay = reader.IsDBNull(8) ? 0 : reader.GetDecimal(8),
                                        ThoiLuongGio = reader.IsDBNull(9) ? 1.5m : reader.GetDecimal(9),
                                        SoLuongToiDa = reader.IsDBNull(10) ? 0 : reader.GetInt32(10),
                                        TrangThai = reader.IsDBNull(11) ? "ChuaBatDau" : reader.GetString(11)
                                    };

                                    // Set navigation properties với null checking tốt hơn
                                    if (!reader.IsDBNull(12))
                                    {
                                        lopHoc.KhoaHoc = new KhoaHoc
                                        {
                                            KhoaHocID = reader.GetInt32(12),
                                            TenKhoaHoc = reader.IsDBNull(13) ? string.Empty : reader.GetString(13),
                                            SoBuoi = reader.IsDBNull(14) ? 0 : reader.GetInt32(14),
                                            HocPhi = reader.IsDBNull(15) ? 0 : reader.GetDecimal(15),
                                            DonGiaTaiLieu = reader.IsDBNull(16) ? 0 : reader.GetDecimal(16)
                                        };
                                    }

                                    if (!reader.IsDBNull(17))
                                    {
                                        lopHoc.GiangVien = new GiangVien
                                        {
                                            GiangVienID = reader.GetInt32(17),
                                            HoTen = reader.IsDBNull(18) ? string.Empty : reader.GetString(18),
                                            ChuyenMon = reader.IsDBNull(19) ? string.Empty : reader.GetString(19),
                                            TaiKhoanID = reader.IsDBNull(20) ? null : (int?)reader.GetInt32(20)
                                        };
                                    }

                                    if (!reader.IsDBNull(21))
                                    {
                                        lopHoc.DiaDiem = new DiaDiem
                                        {
                                            DiaDiemID = reader.GetInt32(21),
                                            TenCoSo = reader.IsDBNull(22) ? string.Empty : reader.GetString(22),
                                            DiaChi = reader.IsDBNull(23) ? string.Empty : reader.GetString(23),
                                            SucChua = reader.IsDBNull(24) ? null : (int?)reader.GetInt32(24)
                                        };
                                    }

                                    lopHocDict[lopId] = lopHoc;
                                    lopHocs.Add(lopHoc);
                                }
                            }
                        }
                    }

                    Console.WriteLine($"Truy vấn raw SQL thành công, tìm thấy {lopHocs.Count} lớp học");
                    return lopHocs;
                }
                catch (Exception rawEx)
                {
                    Console.WriteLine($"Lỗi khi truy vấn raw SQL: {rawEx.Message}");
                    Console.WriteLine($"Stack trace: {rawEx.StackTrace}");
                    return new List<LopHoc>();
                }
                finally
                {
                    await connection.CloseAsync();
                }
            }
        }

        public async Task<IReadOnlyList<HocVien>> GetHocViensByLopHocAsync(int lopId)
        {
            return await _context.DangKyLops
                .Where(dk => dk.LopID == lopId && dk.TrangThaiDangKy == "DangHoc")
                .Include(dk => dk.HocVien)
                .Select(dk => dk.HocVien)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<BuoiHoc>> GetBuoiHocsByLopHocAsync(int lopId)
        {
            return await _context.BuoiHocs
                .Where(b => b.LopID == lopId)
                .OrderBy(b => b.NgayHoc)
                .ToListAsync();
        }

        public async Task<int> GetSoLuongHocVienByLopHocAsync(int lopId)
        {
            return await _context.DangKyLops
                .CountAsync(dk => dk.LopID == lopId && dk.TrangThaiDangKy == "DangHoc");
        }
    }
}
