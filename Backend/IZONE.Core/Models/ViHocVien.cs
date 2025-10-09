using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("ViHocVien")]
    public class ViHocVien
    {
        [Key]
        [Column("ViID")]
        public int ViID { get; set; }

        [Column("HocVienID")]
        public int HocVienID { get; set; }

        [Column("LoaiTx")]
        [Required]
        [StringLength(50)]
        public string LoaiTx { get; set; } = string.Empty;

        [Column("SoTien", TypeName = "decimal(18,2)")]
        public decimal SoTien { get; set; }

        [Column("DangKyID")]
        public int? DangKyID { get; set; }

        [Column("ThanhToanID")]
        public int? ThanhToanID { get; set; }

        [Column("GhiChu")]
        public string? GhiChu { get; set; }

        [Column("NgayGiaoDich", TypeName = "datetime2")]
        public DateTime NgayGiaoDich { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("HocVienID")]
        public virtual HocVien HocVien { get; set; } = null!;

        [ForeignKey("DangKyID")]
        public virtual DangKyLop? DangKyLop { get; set; }

        [ForeignKey("ThanhToanID")]
        public virtual ThanhToan? ThanhToan { get; set; }
    }
}
