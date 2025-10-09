using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("DiaDiem")]
    public class DiaDiem
    {
        public DiaDiem()
        {
            LopHocs = new HashSet<LopHoc>();
            ThueMatBangs = new HashSet<ThueMatBang>();
        }

        [Key]
        [Column("DiaDiemID")]
        public int DiaDiemID { get; set; }

        [Column("TenCoSo")]
        [Required]
        [StringLength(255)]
        public string TenCoSo { get; set; } = string.Empty;

        [Column("DiaChi")]
        [Required]
        public string DiaChi { get; set; } = string.Empty;

        [Column("SucChua")]
        public int? SucChua { get; set; }

        // Navigation properties
        public virtual ICollection<LopHoc> LopHocs { get; set; }
        public virtual ICollection<ThueMatBang> ThueMatBangs { get; set; }
    }
}
