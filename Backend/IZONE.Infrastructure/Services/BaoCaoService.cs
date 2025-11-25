using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Text.Json;

// Helper classes for teacher performance report
internal class StudentFinalResult
{
    public int HocVienID { get; set; }
    public int LopID { get; set; }
    public decimal DiemGiuaKy { get; set; }
    public decimal DiemCuoiKy { get; set; }
    public decimal DiemXetTotNghiep { get; set; }
    public string KetQuaTotNghiep { get; set; } = string.Empty;
}

internal class ClassAggregate
{
    public int LopID { get; set; }
    public int SoHocVienDuocXet { get; set; }
    public int SoHocVienDat { get; set; }
    public decimal DiemTbXetTotNghiep { get; set; }
}

namespace IZONE.Infrastructure.Services
{
    /// <summary>
    /// Service xử lý logic báo cáo và tích hợp với các stored procedures có sẵn
    /// </summary>
    public class BaoCaoService : IBaoCaoService
    {
        private readonly IBaoCaoRepository _baoCaoRepository;
        private readonly IZONEDbContext _context;

        public BaoCaoService(IBaoCaoRepository baoCaoRepository, IZONEDbContext context)
        {
            _baoCaoRepository = baoCaoRepository;
            _context = context;
        }

        /// <summary>
        /// Tạo báo cáo mới (chỉ trả về dữ liệu, không lưu vào database)
        /// </summary>
        public async Task<BaoCaoResponse> TaoBaoCaoAsync(TaoBaoCaoRequest request, string nguoiTao)
        {
            try
            {
                // Tạo dữ liệu báo cáo dựa trên loại
                var response = await GenerateReportDataAsync(request, 0);

                return response;
            }
            catch (Exception ex)
            {
                // Log lỗi và trả về response rỗng thay vì throw exception
                Console.WriteLine($"Lỗi khi tạo báo cáo: {ex.Message}");

                return new BaoCaoResponse
                {
                    BaoCaoID = 0,
                    LoaiBaoCao = request.LoaiBaoCao,
                    NgayTao = DateTime.Now,
                    Data = new List<Dictionary<string, object>>(),
                    Summary = new Dictionary<string, object>(),
                    Parameters = new Dictionary<string, object>()
                };
            }
        }

        /// <summary>
        /// Lấy báo cáo theo ID
        /// </summary>
        public async Task<BaoCaoResponse?> LayBaoCaoAsync(int baoCaoId)
        {
            var baoCao = await _baoCaoRepository.GetByIdAsync(baoCaoId);
            if (baoCao == null) return null;

            return JsonSerializer.Deserialize<BaoCaoResponse>(baoCao.KetQua);
        }

        /// <summary>
        /// Lấy danh sách báo cáo với phân trang
        /// </summary>
        public async Task<IEnumerable<BaoCao>> LayDanhSachBaoCaoAsync(int page = 1, int pageSize = 20)
        {
            return await _baoCaoRepository.GetAllAsync(page, pageSize);
        }

        /// <summary>
        /// Lấy báo cáo theo loại
        /// </summary>
        public async Task<IEnumerable<BaoCao>> LayBaoCaoTheoLoaiAsync(string loaiBaoCao, int page = 1, int pageSize = 20)
        {
            return await _baoCaoRepository.GetByLoaiAsync(loaiBaoCao, page, pageSize);
        }

        /// <summary>
        /// Xóa báo cáo
        /// </summary>
        public async Task XoaBaoCaoAsync(int baoCaoId)
        {
            await _baoCaoRepository.DeleteAsync(baoCaoId);
        }

        /// <summary>
        /// Lấy báo cáo gần đây
        /// </summary>
        public async Task<IEnumerable<BaoCao>> LayBaoCaoGanDayAsync(int count = 10)
        {
            return await _baoCaoRepository.GetRecentAsync(count);
        }

        /// <summary>
        /// Báo cáo tài chính tổng hợp theo tháng
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoTaiChinhTongHopAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            // Doanh thu theo tháng
            var revenueQuery = from tt in _context.ThanhToans
                              where tt.Status == "Success" && tt.NgayThanhToan >= startDate && tt.NgayThanhToan <= endDate
                              group tt by new { Nam = tt.NgayThanhToan.Year, Thang = tt.NgayThanhToan.Month } into g
                              select new
                              {
                                  Nam = g.Key.Nam,
                                  Thang = g.Key.Thang,
                                  DoanhThu = g.Sum(x => x.SoTien)
                              };

            // Chi phí trực tiếp theo tháng (có LopID)
            var directCostQuery = from cp in _context.ChiPhis
                                 where cp.NgayPhatSinh >= startDate && cp.NgayPhatSinh <= endDate && cp.LopID.HasValue
                                 group cp by new { Nam = cp.NgayPhatSinh.Year, Thang = cp.NgayPhatSinh.Month } into g
                                 select new
                                 {
                                     Nam = g.Key.Nam,
                                     Thang = g.Key.Thang,
                                     ChiPhiTrucTiep = g.Sum(x => x.SoTien)
                                 };

            // Chi phí chung theo tháng (không có LopID)
            var overheadQuery = from cp in _context.ChiPhis
                               where cp.NgayPhatSinh >= startDate && cp.NgayPhatSinh <= endDate && !cp.LopID.HasValue
                               group cp by new { Nam = cp.NgayPhatSinh.Year, Thang = cp.NgayPhatSinh.Month } into g
                               select new
                               {
                                   Nam = g.Key.Nam,
                                   Thang = g.Key.Thang,
                                   ChiPhiChung = g.Sum(x => x.SoTien)
                               };

            var revenueData = await revenueQuery.ToListAsync();
            var directCostData = await directCostQuery.ToListAsync();
            var overheadData = await overheadQuery.ToListAsync();

            // Kết hợp dữ liệu theo tháng
            var allMonths = revenueData.Select(r => new { r.Nam, r.Thang })
                              .Union(directCostData.Select(dc => new { dc.Nam, dc.Thang }))
                              .Union(overheadData.Select(o => new { o.Nam, o.Thang }))
                              .Distinct()
                              .OrderBy(m => m.Nam).ThenBy(m => m.Thang);

            var data = new List<Dictionary<string, object>>();

            foreach (var month in allMonths)
            {
                var doanhThu = revenueData.FirstOrDefault(r => r.Nam == month.Nam && r.Thang == month.Thang)?.DoanhThu ?? 0;
                var chiPhiTrucTiep = directCostData.FirstOrDefault(dc => dc.Nam == month.Nam && dc.Thang == month.Thang)?.ChiPhiTrucTiep ?? 0;
                var chiPhiChung = overheadData.FirstOrDefault(o => o.Nam == month.Nam && o.Thang == month.Thang)?.ChiPhiChung ?? 0;

                var loiNhuanRong = doanhThu - chiPhiTrucTiep - chiPhiChung;
                var tySuatLoiNhuan = doanhThu > 0 ? Math.Round((loiNhuanRong / doanhThu) * 100, 2) : 0;

                data.Add(new Dictionary<string, object>
                {
                    ["KyBaoCao"] = $"{month.Nam:D4}-{month.Thang:D2}",
                    ["TongDoanhThu"] = doanhThu,
                    ["TongChiPhiTrucTiep"] = chiPhiTrucTiep,
                    ["TongChiPhiChung"] = chiPhiChung,
                    ["LoiNhuanRong"] = loiNhuanRong,
                    ["TySuatLoiNhuan"] = tySuatLoiNhuan
                });
            }

            var response = new BaoCaoResponse
            {
                BaoCaoID = 0,
                LoaiBaoCao = "BaoCaoTaiChinhTongHop",
                NgayTao = DateTime.Now,
                Data = data,
                Summary = new Dictionary<string, object>
                {
                    ["TongDoanhThu"] = data.Sum(d => (decimal)d["TongDoanhThu"]),
                    ["TongChiPhiTrucTiep"] = data.Sum(d => (decimal)d["TongChiPhiTrucTiep"]),
                    ["TongChiPhiChung"] = data.Sum(d => (decimal)d["TongChiPhiChung"]),
                    ["TongLoiNhuanRong"] = data.Sum(d => (decimal)d["LoiNhuanRong"]),
                    ["TySuatLoiNhuanTrungBinh"] = data.Any(d => (decimal)d["TongDoanhThu"] > 0)
                        ? Math.Round(data.Where(d => (decimal)d["TongDoanhThu"] > 0).Average(d => (decimal)d["TySuatLoiNhuan"]), 2)
                        : 0,
                    ["SoThang"] = data.Count
                },
                Parameters = new Dictionary<string, object>
                {
                    ["NgayBatDau"] = startDate,
                    ["NgayKetThuc"] = endDate
                }
            };

            return response;
        }

        /// <summary>
        /// Báo cáo doanh thu chi tiết theo cấu trúc phân cấp - ẩn giá trị trùng lặp
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoDoanhThuChiTietAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            var result = new List<Dictionary<string, object>>();

            // 1. Lấy dữ liệu thanh toán chi tiết để xử lý
            var paymentData = await (from tt in _context.ThanhToans
                                   join dk in _context.DangKyLops on tt.DangKyID equals dk.DangKyID
                                   join hv in _context.HocViens on dk.HocVienID equals hv.HocVienID
                                   join lh in _context.LopHocs on dk.LopID equals lh.LopID
                                   join kh in _context.KhoaHocs on lh.KhoaHocID equals kh.KhoaHocID
                                   join gv in _context.GiangViens on lh.GiangVienID equals gv.GiangVienID
                                   where tt.Status == "Success" && tt.NgayThanhToan >= startDate && tt.NgayThanhToan <= endDate
                                   select new
                                   {
                                       KhoaHocID = kh.KhoaHocID,
                                       KhoaHoc = kh.TenKhoaHoc,
                                       LopHocID = lh.LopID,
                                       LopHoc = $"Lớp {lh.LopID}",
                                       GiangVien = gv.HoTen,
                                       HocVienID = hv.HocVienID,
                                       HocVien = hv.HoTen,
                                       DoanhThu = tt.SoTien,
                                       NgayThanhToan = tt.NgayThanhToan
                                   }).ToListAsync();

            // 4. Nhóm theo khóa học và tạo cấu trúc phân cấp với logic ẩn trùng lặp
            var khoaHocGroups = paymentData.GroupBy(x => x.KhoaHocID);

            foreach (var khoaHocGroup in khoaHocGroups.OrderBy(x => x.Key))
            {
                var khoaHoc = khoaHocGroup.First();
                var doanhThuKhoaHoc = khoaHocGroup.Sum(x => x.DoanhThu);

                // Tính tổng số lớp của khóa học này
                var soLuongLopHocCuaKhoa = khoaHocGroup.Select(x => x.LopHocID).Distinct().Count();

                // Tính tổng số học viên của khóa học này
                var soLuongHocVienCuaKhoa = khoaHocGroup.Select(x => x.HocVienID).Distinct().Count();

                // Thêm dòng khóa học (cấp cao - hiển thị ở dòng đầu tiên)
                result.Add(new Dictionary<string, object>
                {
                    ["KhoaHoc"] = khoaHoc.KhoaHoc,      // ✅ Hiển thị tên khóa học (dòng đầu)
                    ["LopHoc"] = $"{soLuongLopHocCuaKhoa} Lớp học", // ✅ Hiển thị tổng số lớp của khóa học
                    ["HocVien"] = $"{soLuongHocVienCuaKhoa} Học viên", // ✅ Hiển thị tổng số học viên của khóa học
                    ["DoanhThu"] = doanhThuKhoaHoc,   // ✅ Tổng doanh thu khóa học
                    ["NgayThanhToan"] = ""            // ❌ Để trống
                });

                // 5. Nhóm theo lớp học trong mỗi khóa học và ẩn trùng lặp
                var lopHocGroups = khoaHocGroup.GroupBy(x => x.LopHocID);

                foreach (var lopHocGroup in lopHocGroups.OrderBy(x => x.Key))
                {
                    var lopHoc = lopHocGroup.First();
                    var doanhThuLopHoc = lopHocGroup.Sum(x => x.DoanhThu);

                    // Tính tổng số học viên của lớp học này
                    var soLuongHocVienCuaLop = lopHocGroup.Select(x => x.HocVienID).Distinct().Count();

                    // Thêm dòng lớp học (cấp trung bình)
                    result.Add(new Dictionary<string, object>
                    {
                        ["KhoaHoc"] = "",                                        // ❌ Ẩn tên khóa học trùng lặp
                        ["LopHoc"] = $"{lopHoc.LopHoc} ({lopHoc.GiangVien})", // ✅ Hiển thị lớp + GV (dòng đầu của lớp)
                        ["HocVien"] = $"{soLuongHocVienCuaLop} Học viên",     // ✅ Hiển thị tổng số học viên lớp
                        ["DoanhThu"] = doanhThuLopHoc,                        // ✅ Tổng doanh thu lớp
                        ["NgayThanhToan"] = ""                                 // ❌ Để trống
                    });

                    // 6. Liệt kê từng học viên trong lớp và ẩn trùng lặp
                    foreach (var hocVien in lopHocGroup.OrderBy(x => x.HocVienID))
                    {
                        result.Add(new Dictionary<string, object>
                        {
                            ["KhoaHoc"] = "",                     // ❌ Ẩn tên khóa học trùng lặp
                            ["LopHoc"] = "",                     // ❌ Ẩn tên lớp trùng lặp (để hoàn toàn trống)
                            ["HocVien"] = hocVien.HocVien,      // ✅ Hiển thị tên học viên cụ thể
                            ["DoanhThu"] = hocVien.DoanhThu,    // ✅ Doanh thu thực tế
                            ["NgayThanhToan"] = hocVien.NgayThanhToan.ToString("yyyy-MM-dd HH:mm") // ✅ Ngày thanh toán cụ thể
                        });
                    }
                }
            }

            var response = new BaoCaoResponse
            {
                BaoCaoID = 0,
                LoaiBaoCao = "BaoCaoDoanhThuChiTiet",
                NgayTao = DateTime.Now,
                Data = result,
                Summary = new Dictionary<string, object>
                {
                    // Tính từ dữ liệu gốc để tránh duplicate
                    ["TongDoanhThu"] = await (from tt in _context.ThanhToans
                                            join dk in _context.DangKyLops on tt.DangKyID equals dk.DangKyID
                                            join lh in _context.LopHocs on dk.LopID equals lh.LopID
                                            join kh in _context.KhoaHocs on lh.KhoaHocID equals kh.KhoaHocID
                                            where tt.Status == "Success" && tt.NgayThanhToan >= startDate && tt.NgayThanhToan <= endDate
                                            select tt.SoTien).SumAsync(),
                    ["SoLuongGiaoDich"] = paymentData.Count,
                    ["SoLuongKhoaHoc"] = khoaHocGroups.Count(),
                    ["SoLuongLopHoc"] = paymentData.Select(x => x.LopHocID).Distinct().Count()
                },
                Parameters = new Dictionary<string, object>
                {
                    ["NgayBatDau"] = startDate,
                    ["NgayKetThuc"] = endDate,
                    ["Filters"] = filters ?? new Dictionary<string, object>()
                }
            };

            return response;
        }

        /// <summary>
        /// Báo cáo chi phí chi tiết
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoChiPhiChiTietAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            var query = from cp in _context.ChiPhis
                       join lh in _context.LopHocs on cp.LopID equals lh.LopID into lhJoin
                       from lh in lhJoin.DefaultIfEmpty()
                       join kh in _context.KhoaHocs on lh.KhoaHocID equals kh.KhoaHocID into khJoin
                       from kh in khJoin.DefaultIfEmpty()
                       join dd in _context.DiaDiems on cp.DiaDiemID equals dd.DiaDiemID into ddJoin
                       from dd in ddJoin.DefaultIfEmpty()
                       where cp.NgayPhatSinh >= startDate && cp.NgayPhatSinh <= endDate
                       select new BaoCaoChiPhiDto
                       {
                           LoaiChiPhi = cp.LoaiChiPhi,
                           SubLoai = cp.SubLoai ?? "",
                           SoTien = cp.SoTien,
                           NgayPhatSinh = cp.NgayPhatSinh,
                           LopHoc = lh.LopID > 0 ? $"Lớp {lh.LopID}" : "",
                           KhoaHoc = kh.TenKhoaHoc ?? "",
                           DiaDiem = dd.TenCoSo ?? ""
                       };

            var data = await query.ToListAsync();

            var response = new BaoCaoResponse
            {
                BaoCaoID = 0,
                LoaiBaoCao = "BaoCaoChiPhiChiTiet",
                NgayTao = DateTime.Now,
                Data = data.Select(d => new Dictionary<string, object>
                {
                    ["LoaiChiPhi"] = d.LoaiChiPhi,
                    ["SubLoai"] = d.SubLoai,
                    ["SoTien"] = d.SoTien,
                    ["NgayPhatSinh"] = d.NgayPhatSinh,
                    ["LopHoc"] = d.LopHoc,
                    ["KhoaHoc"] = d.KhoaHoc,
                    ["DiaDiem"] = d.DiaDiem
                }).Cast<Dictionary<string, object>>().ToList(),
                Summary = new Dictionary<string, object>
                {
                    ["TongChiPhi"] = data.Sum(d => d.SoTien),
                    ["SoLuongChiPhi"] = data.Count
                },
                Parameters = new Dictionary<string, object>
                {
                    ["NgayBatDau"] = startDate,
                    ["NgayKetThuc"] = endDate,
                    ["Filters"] = filters ?? new Dictionary<string, object>()
                }
            };

            return response;
        }

        /// <summary>
        /// Báo cáo lợi nhuận gộp theo lớp học
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoLoiNhuanGopTheoLopAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            // Query trực tiếp từ các bảng thay vì dùng view
            var query = from lh in _context.LopHocs
                       join kh in _context.KhoaHocs on lh.KhoaHocID equals kh.KhoaHocID
                       join gv in _context.GiangViens on lh.GiangVienID equals gv.GiangVienID
                       join dd in _context.DiaDiems on lh.DiaDiemID equals dd.DiaDiemID
                       join dk in _context.DangKyLops on lh.LopID equals dk.LopID into dkGroup
                       from dk in dkGroup.DefaultIfEmpty()
                       join tt in _context.ThanhToans on dk.DangKyID equals tt.DangKyID into ttGroup
                       from tt in ttGroup.DefaultIfEmpty()
                       join cp in _context.ChiPhis on lh.LopID equals cp.LopID into cpGroup
                       from cp in cpGroup.DefaultIfEmpty()
                       join bh in _context.BuoiHocs on lh.LopID equals bh.LopID into bhGroup
                       from bh in bhGroup.DefaultIfEmpty()
                       where (dk != null && dk.NgayDangKy >= startDate && dk.NgayDangKy <= endDate) ||
                             (lh.NgayBatDau >= startDate && lh.NgayKetThuc <= endDate)
                       group new { lh, kh, gv, dd, dk, tt, cp, bh } by new { lh.LopID, kh.TenKhoaHoc, gv.HoTen, dd.TenCoSo } into g
                       select new BaoCaoLoiNhuanLopDto
                       {
                           LopHoc = g.Key.LopID.ToString(),
                           KhoaHoc = g.Key.TenKhoaHoc,
                           GiangVien = g.Key.HoTen,
                           DiaDiem = g.Key.TenCoSo,
                           DoanhThu = g.Sum(x => x.tt != null && x.tt.Status == "Success" ? x.tt.SoTien : 0),
                           ChiPhiTrucTiep = g.Sum(x => x.cp != null && x.cp.LoaiChiPhi == "TrucTiep" ? x.cp.SoTien : 0),
                           ChiPhiChungPhanBo = g.Sum(x => x.cp != null && x.cp.LoaiChiPhi != "TrucTiep" ? x.cp.SoTien * 0.1m : 0),
                           LoiNhuanGop = g.Sum(x => x.tt != null && x.tt.Status == "Success" ? x.tt.SoTien : 0) -
                                       g.Sum(x => x.cp != null && x.cp.LoaiChiPhi == "TrucTiep" ? x.cp.SoTien : 0) -
                                       g.Sum(x => x.cp != null && x.cp.LoaiChiPhi != "TrucTiep" ? x.cp.SoTien * 0.1m : 0),
                           LoiNhuanRong = g.Sum(x => x.tt != null && x.tt.Status == "Success" ? x.tt.SoTien : 0) -
                                        g.Sum(x => x.cp != null ? x.cp.SoTien : 0),
                           SoLuongHocVien = g.Where(x => x.dk != null).Select(x => x.dk.HocVienID).Distinct().Count(),
                           SoBuoi = g.Where(x => x.bh != null).Select(x => x.bh.BuoiHocID).Distinct().Count()
                       };

            var data = await query.ToListAsync();

            var response = new BaoCaoResponse
            {
                BaoCaoID = 0,
                LoaiBaoCao = "BaoCaoLoiNhuanGopTheoLop",
                NgayTao = DateTime.Now,
                Data = data.Select(d => new Dictionary<string, object>
                {
                    ["LopHoc"] = $"Lớp {d.LopHoc}",
                    ["KhoaHoc"] = d.KhoaHoc,
                    ["GiangVien"] = d.GiangVien,
                    ["DiaDiem"] = d.DiaDiem,
                    ["DoanhThu"] = d.DoanhThu,
                    ["ChiPhiTrucTiep"] = d.ChiPhiTrucTiep,
                    ["ChiPhiChungPhanBo"] = d.ChiPhiChungPhanBo,
                    ["LoiNhuanGop"] = d.LoiNhuanGop,
                    ["LoiNhuanRong"] = d.LoiNhuanRong,
                    ["SoLuongHocVien"] = d.SoLuongHocVien,
                    ["SoBuoi"] = d.SoBuoi
                }).Cast<Dictionary<string, object>>().ToList(),
                Summary = new Dictionary<string, object>
                {
                    ["TongDoanhThu"] = data.Sum(d => d.DoanhThu),
                    ["TongChiPhiTrucTiep"] = data.Sum(d => d.ChiPhiTrucTiep),
                    ["TongLoiNhuanGop"] = data.Sum(d => d.LoiNhuanGop),
                    ["TongLoiNhuanRong"] = data.Sum(d => d.LoiNhuanRong)
                },
                Parameters = new Dictionary<string, object>
                {
                    ["NgayBatDau"] = startDate,
                    ["NgayKetThuc"] = endDate,
                    ["Filters"] = filters ?? new Dictionary<string, object>()
                }
            };

            return response;
        }

        /// <summary>
        /// Báo cáo lợi nhuận ròng theo lớp học (theo công thức mới với phân bổ chi phí chung theo SeatHours)
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoLoiNhuanRongTheoLopAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            // Lấy tất cả lớp học trong khoảng thời gian
            var lopHocQuery = from lh in _context.LopHocs
                             join kh in _context.KhoaHocs on lh.KhoaHocID equals kh.KhoaHocID
                             join gv in _context.GiangViens on lh.GiangVienID equals gv.GiangVienID
                             join dd in _context.DiaDiems on lh.DiaDiemID equals dd.DiaDiemID
                             where (lh.NgayBatDau >= startDate && lh.NgayKetThuc <= endDate) ||
                                   (lh.NgayBatDau <= endDate && (lh.NgayKetThuc ?? DateTime.Now) >= startDate)
                             select new
                             {
                                 lh.LopID,
                                 lh.NgayBatDau,
                                 lh.NgayKetThuc,
                                 lh.ThoiLuongGio,
                                 kh.TenKhoaHoc,
                                 kh.SoBuoi,
                                 gv.HoTen,
                                 dd.TenCoSo
                             };

            var lopHocList = await lopHocQuery.ToListAsync();

            var data = new List<Dictionary<string, object>>();

            foreach (var lop in lopHocList)
            {
                var classStartDate = lop.NgayBatDau;
                var classEndDate = lop.NgayKetThuc ?? DateTime.Now;

                // 1. Tính doanh thu của lớp
                var doanhThu = await (from tt in _context.ThanhToans
                                     join dk in _context.DangKyLops on tt.DangKyID equals dk.DangKyID
                                     where tt.Status == "Success" && dk.LopID == lop.LopID
                                     select tt.SoTien).SumAsync();

                // 2. Tính chi phí trực tiếp của lớp
                var chiPhiTrucTiep = await (from cp in _context.ChiPhis
                                           where cp.LopID == lop.LopID && cp.NgayPhatSinh >= classStartDate && cp.NgayPhatSinh <= classEndDate
                                           select cp.SoTien).SumAsync();

                // 3. Tính SeatHours của lớp hiện tại để phục vụ tính toán phân bổ
                var soLuongHocVien = await (from dk in _context.DangKyLops
                                          where dk.LopID == lop.LopID && dk.TrangThaiDangKy != "DaHuy"
                                          select dk.HocVienID).Distinct().CountAsync();

                var seatHours = soLuongHocVien * lop.SoBuoi * (decimal)lop.ThoiLuongGio;

                // 4. Tính tổng SeatHours của tất cả lớp trong kỳ báo cáo (có chồng lấp thời gian)
                var totalSeatHoursQuery = from lh2 in _context.LopHocs
                                         join kh2 in _context.KhoaHocs on lh2.KhoaHocID equals kh2.KhoaHocID
                                         join dk2 in _context.DangKyLops on lh2.LopID equals dk2.LopID into dkGroup2
                                         from dk2 in dkGroup2.DefaultIfEmpty()
                                         where (lh2.NgayBatDau < classEndDate && (lh2.NgayKetThuc ?? DateTime.Now) > classStartDate) &&
                                               dk2 != null && dk2.TrangThaiDangKy != "DaHuy"
                                         select new
                                         {
                                             SoLuongHocVien = dk2 != null ? 1 : 0,
                                             SoBuoi = kh2.SoBuoi,
                                             ThoiLuongGio = lh2.ThoiLuongGio
                                         };

                var totalSeatHoursData = await totalSeatHoursQuery.ToListAsync();
                var totalSeatHours = totalSeatHoursData.Sum(x => x.SoLuongHocVien * x.SoBuoi * (decimal)x.ThoiLuongGio);

                // 5. Tính tổng chi phí chung trong kỳ báo cáo của lớp
                var chiPhiChung = await (from cp in _context.ChiPhis
                                       where cp.LopID == null &&
                                             cp.NgayPhatSinh >= classStartDate &&
                                             cp.NgayPhatSinh <= classEndDate
                                       select cp.SoTien).SumAsync();

                // 6. Tính chi phí chung được phân bổ cho lớp
                var chiPhiChungPhanBo = totalSeatHours > 0 ? (chiPhiChung * seatHours) / totalSeatHours : 0;

                // 7. Tính lợi nhuận ròng
                var loiNhuanRong = doanhThu - chiPhiTrucTiep - chiPhiChungPhanBo;

                data.Add(new Dictionary<string, object>
                {
                    ["LopHoc"] = $"Lớp {lop.LopID}",
                    ["KhoaHoc"] = lop.TenKhoaHoc,
                    ["DiaDiem"] = lop.TenCoSo,
                    ["DoanhThu"] = doanhThu,
                    ["ChiPhiTrucTiep"] = chiPhiTrucTiep,
                    ["ChiPhiChungDuocPhanBo"] = Math.Round(chiPhiChungPhanBo, 2),
                    ["LoiNhuanRong"] = Math.Round(loiNhuanRong, 2)
                });
            }

            var response = new BaoCaoResponse
            {
                BaoCaoID = 0,
                LoaiBaoCao = "BaoCaoLoiNhuanRongTheoLop",
                NgayTao = DateTime.Now,
                Data = data,
                Summary = new Dictionary<string, object>
                {
                    ["TongDoanhThu"] = data.Sum(d => (decimal)d["DoanhThu"]),
                    ["TongChiPhiTrucTiep"] = data.Sum(d => (decimal)d["ChiPhiTrucTiep"]),
                    ["TongChiPhiChungDuocPhanBo"] = data.Sum(d => (decimal)d["ChiPhiChungDuocPhanBo"]),
                    ["TongLoiNhuanRong"] = data.Sum(d => (decimal)d["LoiNhuanRong"])
                },
                Parameters = new Dictionary<string, object>
                {
                    ["NgayBatDau"] = startDate,
                    ["NgayKetThuc"] = endDate,
                    ["Filters"] = filters ?? new Dictionary<string, object>()
                }
            };

            return response;
        }

        /// <summary>
        /// Báo cáo tỷ lệ đạt theo khóa/lớp/giảng viên
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoTyLeDatAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            // Lấy tất cả điểm số trong khoảng thời gian
            var diemSoLop = await _context.DiemSos
                .Include(ds => ds.LopHoc)
                .ThenInclude(lh => lh.KhoaHoc)
                .Include(ds => ds.LopHoc)
                .ThenInclude(lh => lh.GiangVien)
                .Where(ds => ds.LopHoc.NgayBatDau >= startDate && ds.LopHoc.NgayKetThuc <= endDate)
                .ToListAsync();

            // Nhóm theo lớp học để tính tỷ lệ đạt
            var data = new List<BaoCaoTyLeDatDto>();

            var lopGroups = diemSoLop.GroupBy(ds => ds.LopID);

            foreach (var lopGroup in lopGroups)
            {
                var lopHoc = lopGroup.First().LopHoc;
                var khoaHoc = lopHoc.KhoaHoc;
                var giangVien = lopHoc.GiangVien;

                // Tìm học viên có đủ cả 2 loại điểm
                var hocVienCoDuDiem = lopGroup
                    .GroupBy(ds => ds.HocVienID)
                    .Where(g => g.Count() == 2) // Phải có đúng 2 loại điểm
                    .Select(g => g.Key)
                    .ToList();

                var tongSoHocVien = hocVienCoDuDiem.Count;
                var soHocVienDat = 0;

                // Tính điểm tổng kết cho từng học viên
                foreach (var hocVienId in hocVienCoDuDiem)
                {
                    var diemGiuaKy = lopGroup.FirstOrDefault(ds =>
                        ds.HocVienID == hocVienId && ds.LoaiDiem == "Giữa kỳ")?.Diem ?? 0;
                    var diemCuoiKy = lopGroup.FirstOrDefault(ds =>
                        ds.HocVienID == hocVienId && ds.LoaiDiem == "Cuối kỳ")?.Diem ?? 0;

                    var diemTongKet = (diemGiuaKy + diemCuoiKy * 2) / 3;

                    if (diemTongKet > 5.5m)
                    {
                        soHocVienDat++;
                    }
                }

                var tyLeDat = tongSoHocVien > 0 ? (decimal)soHocVienDat / tongSoHocVien * 100 : 0;

                data.Add(new BaoCaoTyLeDatDto
                {
                    KhoaHoc = khoaHoc.TenKhoaHoc,
                    LopHoc = $"Lớp {lopHoc.LopID}",
                    GiangVien = giangVien.HoTen,
                    TongSoHocVien = tongSoHocVien,
                    SoHocVienDat = soHocVienDat,
                    TyLeDat = tyLeDat,
                    DiemTrungBinh = 0 // Có thể tính thêm nếu cần
                });
            }

            var response = new BaoCaoResponse
            {
                BaoCaoID = 0,
                LoaiBaoCao = "BaoCaoTyLeDat",
                NgayTao = DateTime.Now,
                Data = data.Select(d => new Dictionary<string, object>
                {
                    ["KhoaHoc"] = d.KhoaHoc,
                    ["LopHoc"] = d.LopHoc,
                    ["GiangVien"] = d.GiangVien,
                    ["TongSoHocVien"] = d.TongSoHocVien,
                    ["SoHocVienDat"] = d.SoHocVienDat,
                    ["TyLeDat"] = Math.Round(d.TyLeDat, 2),
                    ["DiemTrungBinh"] = Math.Round(d.DiemTrungBinh, 2)
                }).Cast<Dictionary<string, object>>().ToList(),
                Summary = new Dictionary<string, object>
                {
                    ["TongSoHocVien"] = data.Sum(d => d.TongSoHocVien),
                    ["TongSoHocVienDat"] = data.Sum(d => d.SoHocVienDat),
                    ["TyLeDatTrungBinh"] = data.Any() ? Math.Round(data.Average(d => d.TyLeDat), 2) : 0,
                    ["DiemTrungBinhTongThe"] = data.Any() ? Math.Round(data.Average(d => d.DiemTrungBinh), 2) : 0
                },
                Parameters = new Dictionary<string, object>
                {
                    ["NgayBatDau"] = startDate,
                    ["NgayKetThuc"] = endDate,
                    ["Filters"] = filters ?? new Dictionary<string, object>()
                }
            };

            return response;
        }

        /// <summary>
        /// Báo cáo hiệu suất giảng viên theo công thức tính điểm xét tốt nghiệp
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoHieuSuatGiangVienAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters)
{
    var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
    var endDate = ngayKetThuc ?? DateTime.Now;

    // 1. Lấy tất cả điểm số trong kỳ
    var studentScores = await _context.DiemSos
        .Join(_context.LopHocs, ds => ds.LopID, lh => lh.LopID, (ds, lh) => new { ds, lh })
        .Where(x => x.lh.NgayBatDau >= startDate && x.lh.NgayKetThuc <= endDate)
        .Select(x => new { x.ds.HocVienID, x.ds.LopID, x.ds.LoaiDiem, x.ds.Diem })
        .ToListAsync();

    // 2. Tính điểm xét tốt nghiệp cho từng học viên (xử lý trong bộ nhớ)
    var studentFinalResults = studentScores
        .GroupBy(s => new { s.HocVienID, s.LopID })
        .Select(group => {
            var diemGiuaKy = group.FirstOrDefault(s => s.LoaiDiem == "GiuaKy")?.Diem;
            var diemCuoiKy = group.FirstOrDefault(s => s.LoaiDiem == "CuoiKy")?.Diem;

            if (diemGiuaKy.HasValue && diemCuoiKy.HasValue)
            {
                return new StudentFinalResult
                {
                    HocVienID = group.Key.HocVienID,
                    LopID = group.Key.LopID,
                    DiemXetTotNghiep = Math.Round((diemCuoiKy.Value * 2 + diemGiuaKy.Value) / 3.0m, 2),
                    KetQuaTotNghiep = Math.Round((diemCuoiKy.Value * 2 + diemGiuaKy.Value) / 3.0m, 2) > 5.5m ? "Dat" : "Truot" // Sửa lại logic > 5.0
                };
            }
            return null;
        })
        .Where(r => r != null)
        .ToList();

    // 3. Kết hợp và nhóm theo Giảng viên
    var giangVienQuery = from sfr in studentFinalResults
                         join lh in _context.LopHocs on sfr.LopID equals lh.LopID
                         join gv in _context.GiangViens on lh.GiangVienID equals gv.GiangVienID
                         group sfr by new { gv.GiangVienID, gv.HoTen } into g
                         select new BaoCaoHieuSuatGiangVienDto
                         {
                             TenGiangVien = g.Key.HoTen,
                             // [FIXED] Đếm trực tiếp số học viên đạt và tổng số học viên được xét
                             SoLopDay = g.Select(x => x.LopID).Distinct().Count(),
                             TongSoHVDuocXet = g.Count(),
                             SoHVDat = g.Count(x => x.KetQuaTotNghiep == "Dat"),
                             // Tính tổng điểm để có thể tính trung bình có trọng số sau này
                             TongDiemXetTotNghiep = g.Sum(x => x.DiemXetTotNghiep)
                         };

    var data = giangVienQuery.AsEnumerable().ToList();

    // 4. Tính toán các chỉ số cuối cùng
    var finalData = data.Select(d => new
    {
        TenGiangVien = d.TenGiangVien,
        SoLopDay = d.SoLopDay,
        TongSoHVDuocXet = d.TongSoHVDuocXet,
        // Tỷ lệ được tính từ các con số đã được đếm chính xác
        TiLeDat_Pct = d.TongSoHVDuocXet > 0 ? Math.Round(100m * d.SoHVDat / d.TongSoHVDuocXet, 2) : 0,
        // [FIXED] Tính trung bình có trọng số chính xác
        DiemTbXetTotNghiep_ToanGV = d.TongSoHVDuocXet > 0 ? Math.Round(d.TongDiemXetTotNghiep / d.TongSoHVDuocXet, 2) : 0,
        // Giữ lại SoHVDat để dùng trong Summary
        SoHVDat = d.SoHVDat
    }).ToList();


    var response = new BaoCaoResponse
    {
        BaoCaoID = 0,
        LoaiBaoCao = "BaoCaoHieuSuatGiangVien",
        NgayTao = DateTime.Now,
        Data = finalData.Select(d => new Dictionary<string, object>
        {
            ["TenGiangVien"] = d.TenGiangVien,
            ["SoLopDay"] = d.SoLopDay,
            ["TongSoHVDuocXet"] = d.TongSoHVDuocXet,
            ["TiLeDat_Pct"] = d.TiLeDat_Pct,
            ["DiemTbXetTotNghiep_ToanGV"] = d.DiemTbXetTotNghiep_ToanGV
        }).ToList(),
        Summary = new Dictionary<string, object>
        {
            ["TongSoGiangVien"] = finalData.Count,
            ["TongSoLopDay"] = finalData.Sum(d => d.SoLopDay),
            ["TongSoHVDuocXet"] = finalData.Sum(d => d.TongSoHVDuocXet),
            // [FIXED] Tính tổng số HV Đạt bằng cách cộng trực tiếp các con số đã đếm
            ["TongSoHVDat"] = finalData.Sum(d => d.SoHVDat),
            ["TiLeDatTrungBinh"] = finalData.Any() ? Math.Round(finalData.Average(d => d.TiLeDat_Pct), 2) : 0,
            ["DiemTbXetTotNghiepTrungBinh"] = finalData.Any() ? Math.Round(finalData.Average(d => d.DiemTbXetTotNghiep_ToanGV), 2) : 0
        },
        Parameters = new Dictionary<string, object>
        {
            ["NgayBatDau"] = startDate,
            ["NgayKetThuc"] = endDate,
            ["Filters"] = filters ?? new Dictionary<string, object>()
        }
    };

    return response;
}

// Các class DTO hỗ trợ
public class StudentFinalResult
{
    public int HocVienID { get; set; }
    public int LopID { get; set; }
    public decimal DiemXetTotNghiep { get; set; }
    public string KetQuaTotNghiep { get; set; }
}

public class BaoCaoHieuSuatGiangVienDto
{
    public string TenGiangVien { get; set; }
    public int SoLopDay { get; set; }
    public int TongSoHVDuocXet { get; set; }
    public int SoHVDat { get; set; } // Thêm thuộc tính này
    public decimal TongDiemXetTotNghiep { get; set; } // Thêm thuộc tính này
}

public class BaoCaoHieuSuatKhoaHocDto
{
    public string TenKhoaHoc { get; set; }
    public int SoLuongDangKy { get; set; }
    public decimal TongDoanhThu { get; set; }
    public decimal LoiNhuanRong { get; set; }
    public decimal TyLeDat_Pct { get; set; }
}


        /// <summary>
        /// Báo cáo hiệu suất cơ sở theo cách tính mới (tỷ lệ lấp đầy trung bình)
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoHieuSuatCoSoAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, Dictionary<string, object>? filters)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            try
            {
                // Gọi stored procedure sp_GetLocationPerformanceReport
                var sql = "EXEC sp_GetLocationPerformanceReport @StartDate = @StartDateParam, @EndDate = @EndDateParam";

                var parameters = new[]
                {
                    new SqlParameter("@StartDateParam", startDate),
                    new SqlParameter("@EndDateParam", endDate)
                };

                var data = await _context.Database.SqlQueryRaw<BaoCaoHieuSuatCoSoDto>(sql, parameters).ToListAsync();

                var response = new BaoCaoResponse
                {
                    BaoCaoID = 0,
                    LoaiBaoCao = "BaoCaoHieuSuatCoSo",
                    NgayTao = DateTime.Now,
                    Data = data.Select(d => new Dictionary<string, object>
                    {
                        ["TenCoSo"] = d.TenCoSo,
                        ["SoLopHoatDongTrongKy"] = d.SoLopHoatDongTrongKy,
                        ["SoHocVienThucTe"] = d.SoHocVienThucTe,
                        ["DoanhThuTrongKy"] = d.DoanhThuTrongKy,
                        ["ChiPhiTrongKy"] = d.ChiPhiTrongKy,
                        ["LoiNhuanTrongKy"] = d.LoiNhuanTrongKy,
                        ["TyLeLapDayTrungBinh_Pct"] = Math.Round(d.TyLeLapDayTrungBinh_Pct, 2)
                    }).Cast<Dictionary<string, object>>().ToList(),
                    Summary = new Dictionary<string, object>
                    {
                        ["TongSoCoSo"] = data.Count,
                        ["TongSoLopHoatDong"] = data.Sum(d => d.SoLopHoatDongTrongKy),
                        ["TongSoHocVienThucTe"] = data.Sum(d => d.SoHocVienThucTe),
                        ["TongDoanhThu"] = data.Sum(d => d.DoanhThuTrongKy),
                        ["TongChiPhi"] = data.Sum(d => d.ChiPhiTrongKy),
                        ["TongLoiNhuan"] = data.Sum(d => d.LoiNhuanTrongKy),
                        ["TyLeLapDayTrungBinh"] = data.Any() ? Math.Round(data.Average(d => d.TyLeLapDayTrungBinh_Pct), 2) : 0
                    },
                    Parameters = new Dictionary<string, object>
                    {
                        ["NgayBatDau"] = startDate,
                        ["NgayKetThuc"] = endDate,
                        ["Filters"] = filters ?? new Dictionary<string, object>()
                    }
                };

                return response;
            }
            catch (Exception ex)
            {
                // Log lỗi và trả về response rỗng
                Console.WriteLine($"Lỗi khi tạo báo cáo hiệu suất cơ sở: {ex.Message}");

                return new BaoCaoResponse
                {
                    BaoCaoID = 0,
                    LoaiBaoCao = "BaoCaoHieuSuatCoSo",
                    NgayTao = DateTime.Now,
                    Data = new List<Dictionary<string, object>>(),
                    Summary = new Dictionary<string, object>(),
                    Parameters = new Dictionary<string, object>()
                };
            }
        }

        /// <summary>
        /// Báo cáo hiệu suất khóa học theo stored procedure mới
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoHieuSuatKhoaHocAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            try
            {
                // Gọi stored procedure sp_GetCoursePerformanceReport
                var sql = "EXEC sp_GetCoursePerformanceReport @StartDate = @StartDateParam, @EndDate = @EndDateParam";

                var parameters = new[]
                {
                    new SqlParameter("@StartDateParam", startDate),
                    new SqlParameter("@EndDateParam", endDate)
                };

                var data = await _context.Database.SqlQueryRaw<BaoCaoHieuSuatKhoaHocDto>(sql, parameters).ToListAsync();

                var response = new BaoCaoResponse
                {
                    BaoCaoID = 0,
                    LoaiBaoCao = "BaoCaoHieuSuatKhoaHoc",
                    NgayTao = DateTime.Now,
                    Data = data.Select(d => new Dictionary<string, object>
                    {
                        ["TenKhoaHoc"] = d.TenKhoaHoc,
                        ["SoLuongDangKy"] = d.SoLuongDangKy,
                        ["TongDoanhThu"] = d.TongDoanhThu,
                        ["LoiNhuanRong"] = d.LoiNhuanRong,
                        ["TyLeDat_Pct"] = Math.Round(d.TyLeDat_Pct, 2)
                    }).Cast<Dictionary<string, object>>().ToList(),
                    Summary = new Dictionary<string, object>
                    {
                        ["TongSoKhoaHoc"] = data.Count,
                        ["TongSoDangKy"] = data.Sum(d => d.SoLuongDangKy),
                        ["TongDoanhThu"] = data.Sum(d => d.TongDoanhThu),
                        ["TongLoiNhuanRong"] = data.Sum(d => d.LoiNhuanRong),
                        ["TyLeDatTrungBinh"] = data.Any() ? Math.Round(data.Average(d => d.TyLeDat_Pct), 2) : 0
                    },
                    Parameters = new Dictionary<string, object>
                    {
                        ["NgayBatDau"] = startDate,
                        ["NgayKetThuc"] = endDate
                    }
                };

                return response;
            }
            catch (Exception ex)
            {
                // Log lỗi và trả về response rỗng
                Console.WriteLine($"Lỗi khi tạo báo cáo hiệu suất khóa học: {ex.Message}");

                return new BaoCaoResponse
                {
                    BaoCaoID = 0,
                    LoaiBaoCao = "BaoCaoHieuSuatKhoaHoc",
                    NgayTao = DateTime.Now,
                    Data = new List<Dictionary<string, object>>(),
                    Summary = new Dictionary<string, object>(),
                    Parameters = new Dictionary<string, object>()
                };
            }
        }

        /// <summary>
        /// Báo cáo top khóa học có đăng ký nhiều nhất và lợi nhuận cao nhất
        /// </summary>
        public async Task<BaoCaoResponse> BaoCaoTopKhoaHocAsync(DateTime? ngayBatDau, DateTime? ngayKetThuc, int topCount = 10)
        {
            var startDate = ngayBatDau ?? DateTime.Now.AddMonths(-1);
            var endDate = ngayKetThuc ?? DateTime.Now;

            var query = from dk in _context.DangKyLops
                       join lh in _context.LopHocs on dk.LopID equals lh.LopID
                       join kh in _context.KhoaHocs on lh.KhoaHocID equals kh.KhoaHocID
                       join tt in _context.ThanhToans on dk.DangKyID equals tt.DangKyID
                       where tt.Status == "Success" && lh.NgayBatDau >= startDate && lh.NgayKetThuc <= endDate
                       group new { dk, kh, lh, tt } by new { kh.KhoaHocID, kh.TenKhoaHoc } into g
                       select new BaoCaoTopKhoaHocDto
                       {
                           KhoaHoc = g.Key.TenKhoaHoc,
                           SoLuongDangKy = g.Count(),
                           TongDoanhThu = g.Sum(x => x.tt.SoTien),
                           LoiNhuan = g.Sum(x => x.tt.SoTien) - g.Sum(x => x.kh.HocPhi * 0.3m), // Giả sử lợi nhuận = 70% doanh thu
                           SoLopHoc = g.Select(x => x.lh.LopID).Distinct().Count(),
                           TyLeHoanThanh = 85.5m // Giá trị mẫu, cần tính toán thực tế
                       };

            var data = await query
                .OrderByDescending(d => d.SoLuongDangKy)
                .Take(topCount)
                .ToListAsync();

            var response = new BaoCaoResponse
            {
                BaoCaoID = 0,
                LoaiBaoCao = "BaoCaoTopKhoaHoc",
                NgayTao = DateTime.Now,
                Data = data.Select(d => new Dictionary<string, object>
                {
                    ["KhoaHoc"] = d.KhoaHoc,
                    ["SoLuongDangKy"] = d.SoLuongDangKy,
                    ["TongDoanhThu"] = d.TongDoanhThu,
                    ["LoiNhuan"] = d.LoiNhuan,
                    ["SoLopHoc"] = d.SoLopHoc,
                    ["TyLeHoanThanh"] = Math.Round(d.TyLeHoanThanh, 2)
                }).Cast<Dictionary<string, object>>().ToList(),
                Summary = new Dictionary<string, object>
                {
                    ["TongSoLuongDangKy"] = data.Sum(d => d.SoLuongDangKy),
                    ["TongDoanhThu"] = data.Sum(d => d.TongDoanhThu),
                    ["TongLoiNhuan"] = data.Sum(d => d.LoiNhuan),
                    ["SoKhoaHoc"] = data.Count
                },
                Parameters = new Dictionary<string, object>
                {
                    ["NgayBatDau"] = startDate,
                    ["NgayKetThuc"] = endDate,
                    ["TopCount"] = topCount
                }
            };

            return response;
        }

        /// <summary>
        /// Generate report data dựa trên loại báo cáo
        /// </summary>
        private async Task<BaoCaoResponse> GenerateReportDataAsync(TaoBaoCaoRequest request, int baoCaoId)
        {
            try
            {
                return request.LoaiBaoCao switch
                {
                    // Thay BaoCaoTaiChinhTongHop bằng BaoCaoDoanhThuChiTiet phân cấp
                    "BaoCaoTaiChinhTongHop" => await BaoCaoDoanhThuChiTietAsync(request.NgayBatDau, request.NgayKetThuc, request.Filters),
                    "BaoCaoDoanhThuChiTiet" => await BaoCaoDoanhThuChiTietAsync(request.NgayBatDau, request.NgayKetThuc, request.Filters),
                    "BaoCaoChiPhiChiTiet" => await BaoCaoChiPhiChiTietAsync(request.NgayBatDau, request.NgayKetThuc, request.Filters),
                    "BaoCaoLoiNhuanRongTheoLop" => await BaoCaoLoiNhuanRongTheoLopAsync(request.NgayBatDau, request.NgayKetThuc, request.Filters),
                    "BaoCaoHieuSuatGiangVien" => await BaoCaoHieuSuatGiangVienAsync(request.NgayBatDau, request.NgayKetThuc, request.Filters),
                    "BaoCaoHieuSuatCoSo" => await BaoCaoHieuSuatCoSoAsync(request.NgayBatDau, request.NgayKetThuc, request.Filters),
                    "BaoCaoHieuSuatKhoaHoc" => await BaoCaoHieuSuatKhoaHocAsync(request.NgayBatDau, request.NgayKetThuc),
                    "BaoCaoTopKhoaHoc" => await BaoCaoTopKhoaHocAsync(request.NgayBatDau, request.NgayKetThuc, 10),
                    _ => throw new ArgumentException($"Loại báo cáo '{request.LoaiBaoCao}' không được hỗ trợ")
                };
            }
            catch (Exception ex)
            {
                // Log lỗi và trả về response rỗng thay vì throw exception
                Console.WriteLine($"Lỗi khi tạo báo cáo: {ex.Message}");

                return new BaoCaoResponse
                {
                    BaoCaoID = 0,
                    LoaiBaoCao = request.LoaiBaoCao,
                    NgayTao = DateTime.Now,
                    Data = new List<Dictionary<string, object>>(),
                    Summary = new Dictionary<string, object>(),
                    Parameters = new Dictionary<string, object>()
                };
            }
        }
    }
}
