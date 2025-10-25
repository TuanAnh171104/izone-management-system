using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace IZONE.Core.Models
{
    [Table("DiemSo")]
    public class DiemSo
    {
        [Key]
        [Column("DiemID")]
        public int DiemID { get; set; }

        [Column("HocVienID")]
        public int HocVienID { get; set; }

        [Column("LopID")]
        public int LopID { get; set; }

        [Column("LoaiDiem")]
        [StringLength(100)]
        public string LoaiDiem { get; set; } = string.Empty;

        [Column("Diem", TypeName = "decimal(4,2)")]
        public decimal Diem { get; set; }

        [Column("KetQua")]
        [StringLength(50)]
        public string KetQua { get; set; } = "ChuaCo";

        // Navigation properties
        [ForeignKey("HocVienID")]
        [JsonIgnore]
        public virtual HocVien? HocVien { get; set; }

        [ForeignKey("LopID")]
        [JsonIgnore]
        public virtual LopHoc? LopHoc { get; set; }
    }
}
