using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IZONE.Core.Models
{
    [Table("ChiPhi")]
    public class ChiPhi
    {
        [Key]
        public int ChiPhiID { get; set; }
        
        public int? KhoaHocID { get; set; }
        
        public int? LopID { get; set; }
        
        public int? DiaDiemID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string LoaiChiPhi { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string? SubLoai { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal SoTien { get; set; }
        
        public DateTime NgayPhatSinh { get; set; }
        
        [StringLength(100)]
        public string? NguoiNhap { get; set; }
        
        public bool Recurring { get; set; } = false;
        
        public string? NguonChiPhi { get; set; }
        
        [StringLength(50)]
        public string? ThoiGianKy { get; set; }
        
        [StringLength(20)]
        public string NguonGoc { get; set; } = "NhapTay";
        
        [StringLength(20)]
        public string AllocationMethod { get; set; } = "SeatHours";
        
        public DateTime? PeriodStart { get; set; }
        
        public DateTime? PeriodEnd { get; set; }
        
        // Navigation properties
        [ForeignKey("KhoaHocID")]
        public virtual KhoaHoc? KhoaHoc { get; set; }
        
        [ForeignKey("LopID")]
        public virtual LopHoc? LopHoc { get; set; }
        
        [ForeignKey("DiaDiemID")]
        public virtual DiaDiem? DiaDiem { get; set; }
    }
}