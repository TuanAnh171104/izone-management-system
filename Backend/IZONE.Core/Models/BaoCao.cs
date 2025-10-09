using System.ComponentModel.DataAnnotations;

namespace IZONE.Core.Models
{
    /// <summary>
    /// Model đại diện cho báo cáo được tạo bởi admin
    /// </summary>
    public class BaoCao
    {
        public int BaoCaoID { get; set; }

        [Required]
        [StringLength(100)]
        public string LoaiBaoCao { get; set; } = string.Empty;

        [Required]
        public DateTime NgayTao { get; set; } = DateTime.Now;

        [StringLength(500)]
        public string ThamSo { get; set; } = string.Empty; // JSON parameters

        public string KetQua { get; set; } = string.Empty; // JSON results

        [StringLength(100)]
        public string NguoiTao { get; set; } = string.Empty;

        public DateTime? NgayBatDau { get; set; }

        public DateTime? NgayKetThuc { get; set; }

        [StringLength(255)]
        public string GhiChu { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO cho request tạo báo cáo
    /// </summary>
    public class TaoBaoCaoRequest
    {
        [Required]
        public string LoaiBaoCao { get; set; } = string.Empty;

        public DateTime? NgayBatDau { get; set; }

        public DateTime? NgayKetThuc { get; set; }

        public Dictionary<string, object>? Filters { get; set; }

        public string? GhiChu { get; set; }
    }

    /// <summary>
    /// DTO cho response báo cáo
    /// </summary>
    public class BaoCaoResponse
    {
        public int BaoCaoID { get; set; }
        public string LoaiBaoCao { get; set; } = string.Empty;
        public DateTime NgayTao { get; set; }
        public List<Dictionary<string, object>> Data { get; set; } = new();
        public Dictionary<string, object> Summary { get; set; } = new();
        public Dictionary<string, object> Parameters { get; set; } = new();
    }

    /// <summary>
    /// DTO cho báo cáo tài chính tổng hợp
    /// </summary>
    public class BaoCaoTaiChinhDto
    {
        public decimal TongDoanhThu { get; set; }
        public decimal TongChiPhi { get; set; }
        public decimal LoiNhuanRong { get; set; }
        public decimal ChiPhiTrucTiep { get; set; }
        public decimal ChiPhiChung { get; set; }
        public int SoLuongHocVien { get; set; }
        public int SoLuongLopHoc { get; set; }
    }

    /// <summary>
    /// DTO cho báo cáo doanh thu chi tiết
    /// </summary>
    public class BaoCaoDoanhThuDto
    {
        public string KhoaHoc { get; set; } = string.Empty;
        public string LopHoc { get; set; } = string.Empty;
        public int SoLuongDangKy { get; set; }
        public decimal HocPhi { get; set; }
        public decimal TaiLieu { get; set; }
        public decimal TongDoanhThu { get; set; }
        public DateTime NgayBatDau { get; set; }
        public string GiangVien { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO cho báo cáo chi phí chi tiết
    /// </summary>
    public class BaoCaoChiPhiDto
    {
        public string LoaiChiPhi { get; set; } = string.Empty;
        public string SubLoai { get; set; } = string.Empty;
        public decimal SoTien { get; set; }
        public DateTime NgayPhatSinh { get; set; }
        public string NguonChiPhi { get; set; } = string.Empty;
        public string KhoaHoc { get; set; } = string.Empty;
        public string LopHoc { get; set; } = string.Empty;
        public string DiaDiem { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO cho báo cáo lợi nhuận theo lớp
    /// </summary>
    public class BaoCaoLoiNhuanLopDto
    {
        public string LopHoc { get; set; } = string.Empty;
        public string KhoaHoc { get; set; } = string.Empty;
        public string GiangVien { get; set; } = string.Empty;
        public string DiaDiem { get; set; } = string.Empty;
        public decimal DoanhThu { get; set; }
        public decimal ChiPhiTrucTiep { get; set; }
        public decimal ChiPhiChungPhanBo { get; set; }
        public decimal LoiNhuanGop { get; set; }
        public decimal LoiNhuanRong { get; set; }
        public int SoLuongHocVien { get; set; }
        public int SoBuoi { get; set; }
    }

    /// <summary>
    /// DTO cho báo cáo tỷ lệ đạt
    /// </summary>
    public class BaoCaoTyLeDatDto
    {
        public string KhoaHoc { get; set; } = string.Empty;
        public string LopHoc { get; set; } = string.Empty;
        public string GiangVien { get; set; } = string.Empty;
        public int TongSoHocVien { get; set; }
        public int SoHocVienDat { get; set; }
        public decimal TyLeDat { get; set; }
        public decimal DiemTrungBinh { get; set; }
    }

    /// <summary>
    /// DTO cho báo cáo thống kê điểm
    /// </summary>
    public class BaoCaoThongKeDiemDto
    {
        public string KhoaHoc { get; set; } = string.Empty;
        public string LopHoc { get; set; } = string.Empty;
        public string GiangVien { get; set; } = string.Empty;
        public string LoaiDiem { get; set; } = string.Empty;
        public decimal DiemCaoNhat { get; set; }
        public decimal DiemThapNhat { get; set; }
        public decimal DiemTrungBinh { get; set; }
        public int SoLuongDiem { get; set; }
    }

    /// <summary>
    /// DTO cho báo cáo top khóa học
    /// </summary>
    public class BaoCaoTopKhoaHocDto
    {
        public string KhoaHoc { get; set; } = string.Empty;
        public int SoLuongDangKy { get; set; }
        public decimal TongDoanhThu { get; set; }
        public decimal LoiNhuan { get; set; }
        public int SoLopHoc { get; set; }
        public decimal TyLeHoanThanh { get; set; }
    }

    /// <summary>
    /// DTO cho báo cáo hiệu suất giảng viên
    /// </summary>
    public class BaoCaoHieuSuatGiangVienDto
    {
        public string TenGiangVien { get; set; } = string.Empty;
        public int SoLopDay { get; set; }
        public int TongSoHVDuocXet { get; set; }
        public decimal TiLeDat_Pct { get; set; }
        public decimal DiemTbXetTotNghiep_ToanGV { get; set; }
    }

    /// <summary>
    /// DTO cho báo cáo hiệu suất cơ sở
    /// </summary>
    public class BaoCaoHieuSuatCoSoDto
    {
        public string TenCoSo { get; set; } = string.Empty;
        public int SoLopHoatDongTrongKy { get; set; }
        public int SoHocVienThucTe { get; set; }
        public decimal DoanhThuTrongKy { get; set; }
        public decimal ChiPhiTrongKy { get; set; }
        public decimal LoiNhuanTrongKy { get; set; }
        public decimal TyLeLapDayTrungBinh_Pct { get; set; }
    }
}
