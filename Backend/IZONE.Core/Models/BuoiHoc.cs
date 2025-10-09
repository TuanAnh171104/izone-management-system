using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("BuoiHoc")]
    public class BuoiHoc
    {
        public BuoiHoc()
        {
            DiemDanhs = new HashSet<DiemDanh>();
        }

        [Key]
        [Column("BuoiHocID")]
        public int BuoiHocID { get; set; }

        [Column("LopID")]
        public int LopID { get; set; }

        [Column("NgayHoc")]
        public DateTime NgayHoc { get; set; }

        [Column("ThoiGianBatDau")]
        public TimeSpan? ThoiGianBatDau { get; set; }

        [Column("ThoiGianKetThuc")]
        public TimeSpan? ThoiGianKetThuc { get; set; }

        [Column("GiangVienThayTheID")]
        public int? GiangVienThayTheID { get; set; }

        [Column("DiaDiemID")]
        public int? DiaDiemID { get; set; }

        [Column("TrangThai")]
        [StringLength(50)]
        public string TrangThai { get; set; } = "ChuaDienRa";

        // Navigation properties
        [ForeignKey("LopID")]
        public virtual LopHoc LopHoc { get; set; } = null!;

        [ForeignKey("GiangVienThayTheID")]
        public virtual GiangVien? GiangVienThayThe { get; set; }

        [ForeignKey("DiaDiemID")]
        public virtual DiaDiem? DiaDiem { get; set; }

        public virtual ICollection<DiemDanh> DiemDanhs { get; set; }
    }
}
