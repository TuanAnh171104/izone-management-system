using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IZONE.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BaoCaoTableAndStoredProcedures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tạo bảng BaoCaos nếu chưa tồn tại
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BaoCaos' AND xtype='U')
BEGIN
    CREATE TABLE [BaoCaos] (
        [BaoCaoID] int IDENTITY(1,1) NOT NULL,
        [LoaiBaoCao] nvarchar(100) NOT NULL,
        [NgayTao] datetime2 NOT NULL,
        [ThamSo] nvarchar(500) NOT NULL,
        [KetQua] nvarchar(max) NOT NULL,
        [NguoiTao] nvarchar(100) NOT NULL,
        [NgayBatDau] datetime2 NULL,
        [NgayKetThuc] datetime2 NULL,
        [GhiChu] nvarchar(255) NOT NULL,
        CONSTRAINT [PK_BaoCaos] PRIMARY KEY ([BaoCaoID])
    );
END");

            // Tạo các stored procedures cho báo cáo

            // Stored procedure cho báo cáo tài chính tổng hợp
            migrationBuilder.Sql(@"
IF OBJECT_ID('dbo.sp_GetFinancialReportByPeriod', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetFinancialReportByPeriod;
EXEC('
CREATE PROCEDURE sp_GetFinancialReportByPeriod
(
    @StartDate DATE,
    @EndDate DATE
)
AS
BEGIN
    SELECT
        SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) AS TongDoanhThu,
        SUM(cp.SoTien) AS TongChiPhi,
        (SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) - SUM(cp.SoTien)) AS LoiNhuanRong,
        SUM(CASE WHEN cp.LoaiChiPhi = ''TrucTiep'' THEN cp.SoTien ELSE 0 END) AS ChiPhiTrucTiep,
        SUM(CASE WHEN cp.LoaiChiPhi != ''TrucTiep'' THEN cp.SoTien ELSE 0 END) AS ChiPhiChung,
        COUNT(DISTINCT hv.HocVienID) AS SoLuongHocVien,
        COUNT(DISTINCT lh.LopID) AS SoLuongLopHoc
    FROM ThanhToan tt
    JOIN DangKyLop dk ON dk.DangKyID = tt.DangKyID
    JOIN LopHoc lh ON lh.LopID = dk.LopID
    JOIN HocVien hv ON hv.HocVienID = dk.HocVienID
    LEFT JOIN ChiPhi cp ON cp.LopID = lh.LopID
        AND cp.NgayPhatSinh BETWEEN @StartDate AND @EndDate
    WHERE tt.NgayThanhToan BETWEEN @StartDate AND @EndDate
    GROUP BY lh.LopID
END')");

            // Stored procedure cho báo cáo lợi nhuận ròng theo lớp
            migrationBuilder.Sql(@"
IF OBJECT_ID('dbo.sp_GetAllClassesNetProfit', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAllClassesNetProfit;
EXEC('
CREATE PROCEDURE sp_GetAllClassesNetProfit
AS
BEGIN
    SELECT
        lh.LopID,
        kh.TenKhoaHoc,
        gv.HoTen AS GiangVien,
        dd.TenCoSo AS DiaDiem,
        SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) AS DoanhThu,
        SUM(CASE WHEN cp.LoaiChiPhi = ''TrucTiep'' THEN cp.SoTien ELSE 0 END) AS ChiPhiTrucTiep,
        SUM(CASE WHEN cp.LoaiChiPhi != ''TrucTiep'' THEN cp.SoTien * 0.1 ELSE 0 END) AS ChiPhiChungPhanBo,
        (SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) -
         SUM(CASE WHEN cp.LoaiChiPhi = ''TrucTiep'' THEN cp.SoTien ELSE 0 END) -
         SUM(CASE WHEN cp.LoaiChiPhi != ''TrucTiep'' THEN cp.SoTien * 0.1 ELSE 0 END)) AS LoiNhuanGop,
        (SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) -
         SUM(cp.SoTien)) AS LoiNhuanRong,
        COUNT(DISTINCT dk.HocVienID) AS SoLuongHocVien,
        COUNT(DISTINCT bh.BuoiHocID) AS SoBuoi
    FROM LopHoc lh
    JOIN KhoaHoc kh ON kh.KhoaHocID = lh.KhoaHocID
    JOIN GiangVien gv ON gv.GiangVienID = lh.GiangVienID
    JOIN DiaDiem dd ON dd.DiaDiemID = lh.DiaDiemID
    LEFT JOIN DangKyLop dk ON dk.LopID = lh.LopID
    LEFT JOIN ThanhToan tt ON tt.DangKyID = dk.DangKyID AND tt.Status = ''Success''
    LEFT JOIN ChiPhi cp ON cp.LopID = lh.LopID
    LEFT JOIN BuoiHoc bh ON bh.LopID = lh.LopID
    GROUP BY lh.LopID, kh.TenKhoaHoc, gv.HoTen, dd.TenCoSo
END')");

            // View cho lợi nhuận gộp theo lớp
            migrationBuilder.Sql(@"
IF OBJECT_ID('dbo.V_GrossProfit_By_Class', 'V') IS NOT NULL
    DROP VIEW dbo.V_GrossProfit_By_Class;
EXEC('
CREATE VIEW V_GrossProfit_By_Class AS
SELECT
    lh.LopID,
    kh.TenKhoaHoc,
    gv.HoTen AS GiangVien,
    dd.TenCoSo AS DiaDiem,
    SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) AS DoanhThu,
    SUM(CASE WHEN cp.LoaiChiPhi = ''TrucTiep'' THEN cp.SoTien ELSE 0 END) AS ChiPhiTrucTiep,
    SUM(CASE WHEN cp.LoaiChiPhi != ''TrucTiep'' THEN cp.SoTien * 0.1 ELSE 0 END) AS ChiPhiChungPhanBo,
    (SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) -
     SUM(CASE WHEN cp.LoaiChiPhi = ''TrucTiep'' THEN cp.SoTien ELSE 0 END) -
     SUM(CASE WHEN cp.LoaiChiPhi != ''TrucTiep'' THEN cp.SoTien * 0.1 ELSE 0 END)) AS LoiNhuanGop,
    (SUM(CASE WHEN tt.Status = ''Success'' THEN tt.SoTien ELSE 0 END) -
     SUM(cp.SoTien)) AS LoiNhuanRong,
    COUNT(DISTINCT dk.HocVienID) AS SoLuongHocVien,
    COUNT(DISTINCT bh.BuoiHocID) AS SoBuoi
FROM LopHoc lh
JOIN KhoaHoc kh ON kh.KhoaHocID = lh.KhoaHocID
JOIN GiangVien gv ON gv.GiangVienID = lh.GiangVienID
JOIN DiaDiem dd ON dd.DiaDiemID = lh.DiaDiemID
LEFT JOIN DangKyLop dk ON dk.LopID = lh.LopID
LEFT JOIN ThanhToan tt ON tt.DangKyID = dk.DangKyID AND tt.Status = ''Success''
LEFT JOIN ChiPhi cp ON cp.LopID = lh.LopID
LEFT JOIN BuoiHoc bh ON bh.LopID = lh.LopID
GROUP BY lh.LopID, kh.TenKhoaHoc, gv.HoTen, dd.TenCoSo')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa view và stored procedures
            migrationBuilder.Sql("DROP VIEW IF EXISTS V_GrossProfit_By_Class");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_GetAllClassesNetProfit");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_GetFinancialReportByPeriod");

            // Xóa bảng BaoCaos nếu tồn tại
            migrationBuilder.Sql("DROP TABLE IF EXISTS BaoCaos");
        }
    }
}
