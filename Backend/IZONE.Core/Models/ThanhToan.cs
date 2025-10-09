using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("ThanhToan")]
    public class ThanhToan
    {
        public ThanhToan()
        {
            ViHocViens = new HashSet<ViHocVien>();
        }

        [Key]
        public int ThanhToanID { get; set; }
        
        public int HocVienID { get; set; }
        
        public int DangKyID { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal SoTien { get; set; }
        
        [Column(TypeName = "datetime2")]
        public DateTime NgayThanhToan { get; set; } = DateTime.Now;
        
        [StringLength(50)]
        public string? PhuongThuc { get; set; }
        
        [StringLength(50)]
        public string? Provider { get; set; }
        
        [StringLength(200)]
        public string? TransactionRef { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Pending";
        
        public string? GhiChu { get; set; }
        
        // Navigation properties
        [ForeignKey("HocVienID")]
        public virtual HocVien HocVien { get; set; } = null!;
        
        [ForeignKey("DangKyID")]
        public virtual DangKyLop DangKyLop { get; set; } = null!;
        
        public virtual ICollection<ViHocVien> ViHocViens { get; set; }
    }
}