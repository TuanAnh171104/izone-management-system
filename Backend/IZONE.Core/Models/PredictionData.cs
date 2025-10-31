namespace IZONE.Core.Models
{
    public class PredictionData
    {
        public int DangKyID { get; set; }
        public int HocVienID { get; set; }
        public int LopID { get; set; }

        // Tỷ lệ chuyên cần nửa đầu
        public double TyLeChuyenCan_NuaDau { get; set; }

        // Số buổi vắng nửa đầu
        public int SoBuoiVang_NuaDau { get; set; }

        // Số buổi vắng đầu (3 buổi đầu)
        public int SoBuoiVangDau { get; set; }

        // Điểm giữa kỳ
        public double? DiemGiuaKy { get; set; }

        // Kết quả giữa kỳ (1: đạt, 0: không đạt)
        public int KetQuaGiuaKy { get; set; }

        // Số ngày đăng ký sớm
        public int SoNgayDangKySom { get; set; }

        // Tuổi học viên
        public int TuoiHocVien { get; set; }

        // Mã khóa học
        public int KhoaHocID { get; set; }

        // Mã giảng viên
        public int GiangVienID { get; set; }

        // Mã địa điểm
        public int DiaDiemID { get; set; }

        // Tỷ lệ bỏ học được dự đoán (0-100%)
    public double? TyLeBoHoc { get; set; }

        // Thông tin bổ sung từ các bảng liên kết
        public string? HoTenHocVien { get; set; }
        public string? TenLop { get; set; }
        public string? TenKhoaHoc { get; set; }
        public string? HoTenGiangVien { get; set; }
        public string? TenCoSo { get; set; }
    }
}
