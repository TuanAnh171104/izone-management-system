using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("LopHoc")]
    public class LopHoc
    {
        public LopHoc()
        {
            DangKyLops = new HashSet<DangKyLop>();
            BuoiHocs = new HashSet<BuoiHoc>();
            ChiPhis = new HashSet<ChiPhi>();
        }

        [Key]
        [Column("LopID")]
        public int LopID { get; set; }

        [Column("KhoaHocID")]
        public int KhoaHocID { get; set; }

        [Column("GiangVienID")]
        public int GiangVienID { get; set; }

        [Column("DiaDiemID")]
        public int? DiaDiemID { get; set; }

        [Column("NgayBatDau")]
        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
        public DateTime NgayBatDau { get; set; }

        [Column("NgayKetThuc")]
        public DateTime? NgayKetThuc { get; set; }



        [Column("CaHoc")]
        [StringLength(50)]
        [Required(AllowEmptyStrings = true)]
        public string CaHoc { get; set; } = string.Empty;

        [Column("NgayHocTrongTuan")]
        [StringLength(50)]
        [Required(ErrorMessage = "Ngày học trong tuần là bắt buộc")]
        public string NgayHocTrongTuan { get; set; } = string.Empty;

        [Column("DonGiaBuoiDay", TypeName = "decimal(18,2)")]
        [Range(0, 999999999, ErrorMessage = "Đơn giá buổi dạy phải từ 0 đến 999,999,999")]
        [Required]
        public decimal DonGiaBuoiDay { get; set; } = 0;

        [Column("ThoiLuongGio", TypeName = "decimal(4,2)")]
        [Range(0.5, 24, ErrorMessage = "Thời lượng phải từ 0.5 đến 24 giờ")]
        [Required]
        public decimal ThoiLuongGio { get; set; } = 1.5m;

        [Column("SoLuongToiDa")]
        [Range(0, 1000, ErrorMessage = "Số lượng tối đa phải từ 0 đến 1000")]
        public int? SoLuongToiDa { get; set; } = 0;

        [Column("TrangThai")]
        [StringLength(50)]
        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        public string TrangThai { get; set; } = "ChuaBatDau";

        // Navigation properties
        [ForeignKey("KhoaHocID")]
        public virtual KhoaHoc KhoaHoc { get; set; } = null!;

        [ForeignKey("GiangVienID")]
        public virtual GiangVien GiangVien { get; set; } = null!;

        [ForeignKey("DiaDiemID")]
        public virtual DiaDiem? DiaDiem { get; set; }

        public virtual ICollection<DangKyLop> DangKyLops { get; set; }
        public virtual ICollection<BuoiHoc> BuoiHocs { get; set; }
        public virtual ICollection<ChiPhi> ChiPhis { get; set; }
    }
}
