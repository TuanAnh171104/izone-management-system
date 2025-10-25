using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("HocVien")]
    public class HocVien
    {
        public HocVien()
        {
            ViHocViens = new HashSet<ViHocVien>();
            DangKyLops = new HashSet<DangKyLop>();
            DiemDanhs = new HashSet<DiemDanh>();
            DiemSos = new HashSet<DiemSo>();
            ThanhToans = new HashSet<ThanhToan>();
        }

        [Key]
        [Column("HocVienID")]
        public int HocVienID { get; set; }

        [Column("TaiKhoanID")]
        public int? TaiKhoanID { get; set; }

        [Column("HoTen")]
        [Required]
        [StringLength(255)]
        public string HoTen { get; set; } = string.Empty;

        [Column("NgaySinh")]
        public DateTime? NgaySinh { get; set; }

        [Column("Email")]
        [StringLength(255)]
        [Required(AllowEmptyStrings = true)]
        public string Email { get; set; } = string.Empty;

        [Column("SDT")]
        [StringLength(15)]
        [Required(AllowEmptyStrings = true)]
        public string SDT { get; set; } = string.Empty;

        [Column("TaiKhoanVi", TypeName = "decimal(18,2)")]
        public decimal TaiKhoanVi { get; set; } = 0;

        // Navigation properties
        [ForeignKey("TaiKhoanID")]
        public virtual TaiKhoan? TaiKhoan { get; set; }

        public virtual ICollection<ViHocVien> ViHocViens { get; set; }
        public virtual ICollection<DangKyLop> DangKyLops { get; set; }
        public virtual ICollection<DiemDanh> DiemDanhs { get; set; }
        public virtual ICollection<DiemSo> DiemSos { get; set; }
        public virtual ICollection<ThanhToan> ThanhToans { get; set; }
    }
}