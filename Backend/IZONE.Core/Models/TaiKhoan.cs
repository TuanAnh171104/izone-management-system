using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("TaiKhoan")]
    public class TaiKhoan
    {
        [Key]
        [Column("TaiKhoanID")]
        public int TaiKhoanID { get; set; }

        [Required]
        [StringLength(255)]
        [Column("Email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        [Column("MatKhau")]
        public string MatKhau { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        [Column("VaiTro")]
        public string VaiTro { get; set; } = string.Empty;

        // Navigation properties
        public virtual HocVien? HocVien { get; set; }
        public virtual GiangVien? GiangVien { get; set; }
    }
}
