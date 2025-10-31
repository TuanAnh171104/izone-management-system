using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("ThongBao")]
    public class ThongBao
    {
        [Key]
        public int TBID { get; set; }

        [StringLength(100)]
        public string? NguoiGui { get; set; }

        public int? NguoiNhanID { get; set; }

        [StringLength(50)]
        public string? LoaiNguoiNhan { get; set; }

        [Required]
        public string NoiDung { get; set; } = string.Empty;

        [Column(TypeName = "datetime2")]
        public DateTime NgayGui { get; set; } = DateTime.Now;
    }
}
