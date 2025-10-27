using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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
        [JsonIgnore]
        [ForeignKey("DangKyID")]
        public virtual DangKyLop? DangKyLop { get; set; }
    }

    // DTO for approve request
    public class ApproveBaoLuuRequest
    {
        [Required]
        [StringLength(100)]
        public string NguoiDuyet { get; set; } = string.Empty;
    }

    // DTO for reject request
    public class RejectBaoLuuRequest
    {
        [Required]
        [StringLength(255)]
        public string LyDo { get; set; } = string.Empty;
    }
}
