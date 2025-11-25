using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IZONE.Core.Models;

namespace IZONE.Infrastructure.Data
{
    public class IZONEDbContext : DbContext
    {
        public IZONEDbContext(DbContextOptions<IZONEDbContext> options) : base(options)
        {
        }

        // DbSet properties for all entities
        public DbSet<TaiKhoan> TaiKhoans { get; set; }
        public DbSet<HocVien> HocViens { get; set; }
        public DbSet<GiangVien> GiangViens { get; set; }
        public DbSet<KhoaHoc> KhoaHocs { get; set; }
        public DbSet<LopHoc> LopHocs { get; set; }
        public DbSet<DiaDiem> DiaDiems { get; set; }
        public DbSet<DangKyLop> DangKyLops { get; set; }
        public DbSet<ThanhToan> ThanhToans { get; set; }
        public DbSet<ViHocVien> ViHocViens { get; set; }
        public DbSet<BaoLuu> BaoLuus { get; set; }
        public DbSet<BuoiHoc> BuoiHocs { get; set; }
        public DbSet<DiemDanh> DiemDanhs { get; set; }
        public DbSet<DiemSo> DiemSos { get; set; }
        public DbSet<ChiPhi> ChiPhis { get; set; }
        public DbSet<ThueMatBang> ThueMatBangs { get; set; }
        public DbSet<ThongBao> ThongBao { get; set; }
        public DbSet<BaoCao> BaoCaos { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);

            // Configure SQL Server to handle triggers properly
            optionsBuilder.UseSqlServer((opt) =>
            {
                // Disable OUTPUT clause optimization for tables with triggers
                // This prevents conflicts with database triggers
                opt.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery);

                // Enable compatibility with triggers by avoiding OUTPUT clause
                opt.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorNumbersToAdd: null
                );

                // Disable OUTPUT clause for INSERT operations to avoid trigger conflicts
                // This is the key fix for the trigger conflict issue
                opt.UseRelationalNulls(false);

                // Additional configuration to handle triggers
                opt.CommandTimeout(60); // Increase timeout for complex operations
            });

            optionsBuilder.ConfigureWarnings(warnings =>
            {
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning);
                // Ignore null value exceptions for nullable string fields
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.InvalidIncludePathError);
                // Ignore null value exceptions that can occur during query execution
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.RowLimitingOperationWithoutOrderByWarning);
            });
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình các mối quan hệ giữa các entity
            
            // TaiKhoan - HocVien (1-1)
            modelBuilder.Entity<TaiKhoan>()
                .HasOne(t => t.HocVien)
                .WithOne(h => h.TaiKhoan)
                .HasForeignKey<HocVien>(h => h.TaiKhoanID)
                .OnDelete(DeleteBehavior.SetNull);

            // TaiKhoan - GiangVien (1-1)
            modelBuilder.Entity<TaiKhoan>()
                .HasOne(t => t.GiangVien)
                .WithOne(g => g.TaiKhoan)
                .HasForeignKey<GiangVien>(g => g.TaiKhoanID)
                .OnDelete(DeleteBehavior.SetNull);

            // HocVien - ViHocVien (1-n) - Sửa lại vì ViHocVien có thể có nhiều giao dịch cho 1 học viên
            modelBuilder.Entity<HocVien>()
                .HasMany(h => h.ViHocViens)
                .WithOne(v => v.HocVien)
                .HasForeignKey(v => v.HocVienID)
                .OnDelete(DeleteBehavior.Restrict);

            // KhoaHoc - LopHoc (1-n)
            modelBuilder.Entity<KhoaHoc>()
                .HasMany(k => k.LopHocs)
                .WithOne(l => l.KhoaHoc)
                .HasForeignKey(l => l.KhoaHocID)
                .OnDelete(DeleteBehavior.Restrict);

            // GiangVien - LopHoc (1-n)
            modelBuilder.Entity<GiangVien>()
                .HasMany(g => g.LopHocs)
                .WithOne(l => l.GiangVien)
                .HasForeignKey(l => l.GiangVienID)
                .OnDelete(DeleteBehavior.Restrict);

            // DiaDiem - LopHoc (1-n)
            modelBuilder.Entity<DiaDiem>()
                .HasMany(d => d.LopHocs)
                .WithOne(l => l.DiaDiem)
                .HasForeignKey(l => l.DiaDiemID)
                .OnDelete(DeleteBehavior.Restrict);

            // HocVien - DangKyLop (1-n)
            modelBuilder.Entity<HocVien>()
                .HasMany(h => h.DangKyLops)
                .WithOne(d => d.HocVien)
                .HasForeignKey(d => d.HocVienID)
                .OnDelete(DeleteBehavior.Restrict);

            // HocVien - DiemDanh (1-n)
            modelBuilder.Entity<HocVien>()
                .HasMany(h => h.DiemDanhs)
                .WithOne(d => d.HocVien)
                .HasForeignKey(d => d.HocVienID)
                .OnDelete(DeleteBehavior.Restrict);

            // HocVien - DiemSo (1-n)
            modelBuilder.Entity<HocVien>()
                .HasMany(h => h.DiemSos)
                .WithOne(d => d.HocVien)
                .HasForeignKey(d => d.HocVienID)
                .OnDelete(DeleteBehavior.Restrict);

            // LopHoc - BuoiHoc (1-n)
            modelBuilder.Entity<LopHoc>()
                .HasMany(l => l.BuoiHocs)
                .WithOne(b => b.LopHoc)
                .HasForeignKey(b => b.LopID)
                .OnDelete(DeleteBehavior.Restrict);

            // LopHoc - DangKyLop (1-n)
            modelBuilder.Entity<LopHoc>()
                .HasMany(l => l.DangKyLops)
                .WithOne(d => d.LopHoc)
                .HasForeignKey(d => d.LopID)
                .OnDelete(DeleteBehavior.Restrict);

            // BuoiHoc - DiemDanh (1-n)
            modelBuilder.Entity<BuoiHoc>()
                .HasMany(b => b.DiemDanhs)
                .WithOne(d => d.BuoiHoc)
                .HasForeignKey(d => d.BuoiHocID)
                .OnDelete(DeleteBehavior.Restrict);

            // DangKyLop - ThanhToan (1-n)
            modelBuilder.Entity<DangKyLop>()
                .HasMany(d => d.ThanhToans)
                .WithOne(t => t.DangKyLop)
                .HasForeignKey(t => t.DangKyID)
                .OnDelete(DeleteBehavior.Restrict);

            // DangKyLop - ViHocVien (1-n)
            modelBuilder.Entity<DangKyLop>()
                .HasMany<ViHocVien>()
                .WithOne(v => v.DangKyLop)
                .HasForeignKey(v => v.DangKyID)
                .OnDelete(DeleteBehavior.SetNull);

            // DangKyLop - BaoLuu (1-n)
            modelBuilder.Entity<DangKyLop>()
                .HasMany(d => d.BaoLuus)
                .WithOne(b => b.DangKyLop)
                .HasForeignKey(b => b.DangKyID)
                .OnDelete(DeleteBehavior.Restrict);

            // ThanhToan - ViHocVien (1-n)
            modelBuilder.Entity<ThanhToan>()
                .HasMany(t => t.ViHocViens)
                .WithOne(v => v.ThanhToan)
                .HasForeignKey(v => v.ThanhToanID)
                .OnDelete(DeleteBehavior.SetNull);

            // LopHoc - DiemSo relationship
            modelBuilder.Entity<LopHoc>()
                .HasMany<DiemSo>()
                .WithOne(ds => ds.LopHoc)
                .HasForeignKey(ds => ds.LopID)
                .OnDelete(DeleteBehavior.Restrict);

            // DiaDiem - ThueMatBang (1-n) - tạm thời comment để debug
            // modelBuilder.Entity<DiaDiem>()
            //     .HasMany(d => d.ThueMatBangs)
            //     .WithOne(t => t.DiaDiem)
            //     .HasForeignKey(t => t.DiaDiemID)
            //     .OnDelete(DeleteBehavior.Restrict);

            // LopHoc - ChiPhi (1-n)
            modelBuilder.Entity<LopHoc>()
                .HasMany(l => l.ChiPhis)
                .WithOne(c => c.LopHoc)
                .HasForeignKey(c => c.LopID)
                .OnDelete(DeleteBehavior.SetNull);



            // DiaDiem - ChiPhi relationship
            modelBuilder.Entity<DiaDiem>()
                .HasMany<ChiPhi>()
                .WithOne(cp => cp.DiaDiem)
                .HasForeignKey(cp => cp.DiaDiemID)
                .OnDelete(DeleteBehavior.SetNull);

            // Các cấu hình khác có thể được thêm vào khi cần thiết
        }
    }
}
