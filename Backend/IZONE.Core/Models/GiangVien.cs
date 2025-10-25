using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("GiangVien")]
    public class GiangVien
    {
        public GiangVien()
        {
            LopHocs = new HashSet<LopHoc>();
            BuoiHocs = new HashSet<BuoiHoc>();
        }

        [Key]
        [Column("GiangVienID")]
        public int GiangVienID { get; set; }

        [Column("TaiKhoanID")]
        public int? TaiKhoanID { get; set; }

        [Column("HoTen")]
        [Required]
        [StringLength(255)]
        public string HoTen { get; set; } = string.Empty;

        [Column("ChuyenMon")]
        [Required(AllowEmptyStrings = true)]
        public string ChuyenMon { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("TaiKhoanID")]
        public virtual TaiKhoan? TaiKhoan { get; set; }

        public virtual ICollection<LopHoc> LopHocs { get; set; }
        public virtual ICollection<BuoiHoc> BuoiHocs { get; set; }
    }

    // DTO để tránh vòng lặp serialization
    public class GiangVienWithEmailDto
    {
        public int GiangVienID { get; set; }
        public int? TaiKhoanID { get; set; }
        public string HoTen { get; set; } = string.Empty;
        public string ChuyenMon { get; set; } = string.Empty;
        public string? Email { get; set; }
    }

    // Request model để tạo giảng viên kèm tài khoản
    public class CreateGiangVienWithAccountRequest
    {
        public string Email { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string ChuyenMon { get; set; } = string.Empty;
    }
}