using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("ThueMatBang")]
    public class ThueMatBang
    {
        [Key]
        [Column("ThueID")]
        public int ThueID { get; set; }

        [Column("DiaDiemID")]
        public int DiaDiemID { get; set; }

        [Column("GiaThueThang", TypeName = "decimal(18,2)")]
        public decimal GiaThueThang { get; set; }

        [Column("NgayApDung")]
        public DateTime NgayApDung { get; set; }

        [Column("HanHopDong")]
        public DateTime? HanHopDong { get; set; }

        [Column("GhiChu")]
        public string? GhiChu { get; set; }

        // Navigation properties - tạm thời comment để debug
        // [ForeignKey("DiaDiemID")]
        // public virtual DiaDiem DiaDiem { get; set; } = null!;
    }
}
