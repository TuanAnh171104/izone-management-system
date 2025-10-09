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

        [Column("BuoiHocID")]
        public int BuoiHocID { get; set; }

        [Column("HocVienID")]
        public int HocVienID { get; set; }

        [Column("CoMat")]
        public bool CoMat { get; set; }

        [Column("GhiChu")]
        public string? GhiChu { get; set; }

        // Navigation properties
        [ForeignKey("BuoiHocID")]
        public virtual BuoiHoc BuoiHoc { get; set; } = null!;

        [ForeignKey("HocVienID")]
        public virtual HocVien HocVien { get; set; } = null!;
    }
}
