using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("KhoaHoc")]
    public class KhoaHoc
    {
        public KhoaHoc()
        {
            LopHocs = new HashSet<LopHoc>();
        }

        [Key]
        [Column("KhoaHocID")]
        public int KhoaHocID { get; set; }

        [Column("TenKhoaHoc")]
        [Required]
        [StringLength(255)]
        public string TenKhoaHoc { get; set; } = string.Empty;

        [Column("HocPhi", TypeName = "decimal(18,2)")]
        [Required]
        public decimal HocPhi { get; set; }

        [Column("SoBuoi")]
        [Required]
        public int SoBuoi { get; set; }

        [Column("DonGiaTaiLieu", TypeName = "decimal(18,2)")]
        [Required]
        public decimal DonGiaTaiLieu { get; set; } = 0;

        // Navigation properties
        public virtual ICollection<LopHoc> LopHocs { get; set; }
    }
}
