using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("DiemDanh")]
    public class DiemDanh
    {
        [Key]
        [Column("DiemDanhID")]
        public int DiemDanhID { get; set; }

        [Required(ErrorMessage = "BuoiHocID là bắt buộc")]
        [Column("BuoiHocID")]
        public int BuoiHocID { get; set; }

        [Required(ErrorMessage = "HocVienID là bắt buộc")]
        [Column("HocVienID")]
        public int HocVienID { get; set; }

        [Column("CoMat")]
        public bool CoMat { get; set; }

        [Column("GhiChu")]
        public string? GhiChu { get; set; }

        // Navigation properties - không bắt buộc khi tạo mới (chỉ load khi cần thiết)
        [ForeignKey("BuoiHocID")]
        public virtual BuoiHoc? BuoiHoc { get; set; }

        [ForeignKey("HocVienID")]
        public virtual HocVien? HocVien { get; set; }
    }
}
