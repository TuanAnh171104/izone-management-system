using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("BaoLuu")]
    public class BaoLuu
    {
        [Key]
        [Column("BaoLuuID")]
        public int BaoLuuID { get; set; }

        [Column("DangKyID")]
        public int DangKyID { get; set; }

        [Column("NgayBaoLuu")]
        public DateTime NgayBaoLuu { get; set; }

        [Column("SoBuoiConLai")]
        public int SoBuoiConLai { get; set; }

        [Column("HanBaoLuu")]
        public DateTime? HanBaoLuu { get; set; }

        [Column("TrangThai")]
        [StringLength(50)]
        public string TrangThai { get; set; } = "DangChoDuyet";

        [Column("NguoiDuyet")]
        [StringLength(100)]
        public string? NguoiDuyet { get; set; }

        [Column("LyDo")]
        [StringLength(255)]
        public string? LyDo { get; set; }

        // Navigation properties
        [ForeignKey("DangKyID")]
        public virtual DangKyLop DangKyLop { get; set; } = null!;
    }
}
