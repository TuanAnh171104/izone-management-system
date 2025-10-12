using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("DangKyLop")]
    public class DangKyLop
    {
        public DangKyLop()
        {
            ThanhToans = new HashSet<ThanhToan>();
            BaoLuus = new HashSet<BaoLuu>();
        }

        [Key]
        [Column("DangKyID")]
        public int DangKyID { get; set; }

        [Column("HocVienID")]
        public int HocVienID { get; set; }

        [Column("LopID")]
        public int LopID { get; set; }

        [Column("NgayDangKy", TypeName = "datetime2")]
        public DateTime NgayDangKy { get; set; } = DateTime.Now;

        [Column("TrangThaiDangKy")]
        [StringLength(50)]
        public string TrangThaiDangKy { get; set; } = "DangHoc";

        [Column("TrangThaiThanhToan")]
        [StringLength(50)]
        public string TrangThaiThanhToan { get; set; } = "ChuaThanhToan";

        [Column("NgayHuy", TypeName = "datetime2")]
        public DateTime? NgayHuy { get; set; }

        [Column("LyDoHuy")]
        [StringLength(255)]
        public string? LyDoHuy { get; set; }

        // Navigation properties
        [ForeignKey("HocVienID")]
        public virtual HocVien? HocVien { get; set; }

        [ForeignKey("LopID")]
        public virtual LopHoc? LopHoc { get; set; }

        public virtual ICollection<ThanhToan> ThanhToans { get; set; }
        public virtual ICollection<BaoLuu> BaoLuus { get; set; }
    }
}
