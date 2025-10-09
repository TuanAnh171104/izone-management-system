using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IZONE.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CreateReportStoredProcedures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BaoCaos",
                columns: table => new
                {
                    BaoCaoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoaiBaoCao = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ThamSo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    KetQua = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NguoiTao = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NgayBatDau = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NgayKetThuc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BaoCaos", x => x.BaoCaoID);
                });

            // Tạo các stored procedures cho báo cáo

            // Stored procedure cho báo cáo tài chính tổng hợp
            migrationBuilder.Sql(@"
CREATE OR ALTER PROCEDURE sp_GetFinancialReportByPeriod
(
    @StartDate DATE,
    @EndDate DATE
)
AS
BEGIN
    SELECT
        SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) AS TongDoanhThu,
        SUM(cp.SoTien) AS TongChiPhi,
        (SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) - SUM(cp.SoTien)) AS LoiNhuanRong,
        SUM(CASE WHEN cp.LoaiChiPhi = 'TrucTiep' THEN cp.SoTien ELSE 0 END) AS ChiPhiTrucTiep,
        SUM(CASE WHEN cp.LoaiChiPhi != 'TrucTiep' THEN cp.SoTien ELSE 0 END) AS ChiPhiChung,
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
END");

            // Stored procedure cho báo cáo lợi nhuận ròng theo lớp
            migrationBuilder.Sql(@"
CREATE OR ALTER PROCEDURE sp_GetAllClassesNetProfit
AS
BEGIN
    SELECT
        lh.LopID,
        kh.TenKhoaHoc,
        gv.HoTen AS GiangVien,
        dd.TenCoSo AS DiaDiem,
        SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) AS DoanhThu,
        SUM(CASE WHEN cp.LoaiChiPhi = 'TrucTiep' THEN cp.SoTien ELSE 0 END) AS ChiPhiTrucTiep,
        SUM(CASE WHEN cp.LoaiChiPhi != 'TrucTiep' THEN cp.SoTien * 0.1 ELSE 0 END) AS ChiPhiChungPhanBo,
        (SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) -
         SUM(CASE WHEN cp.LoaiChiPhi = 'TrucTiep' THEN cp.SoTien ELSE 0 END) -
         SUM(CASE WHEN cp.LoaiChiPhi != 'TrucTiep' THEN cp.SoTien * 0.1 ELSE 0 END)) AS LoiNhuanGop,
        (SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) -
         SUM(cp.SoTien)) AS LoiNhuanRong,
        COUNT(DISTINCT dk.HocVienID) AS SoLuongHocVien,
        COUNT(DISTINCT bh.BuoiHocID) AS SoBuoi
    FROM LopHoc lh
    JOIN KhoaHoc kh ON kh.KhoaHocID = lh.KhoaHocID
    JOIN GiangVien gv ON gv.GiangVienID = lh.GiangVienID
    JOIN DiaDiem dd ON dd.DiaDiemID = lh.DiaDiemID
    LEFT JOIN DangKyLop dk ON dk.LopID = lh.LopID
    LEFT JOIN ThanhToan tt ON tt.DangKyID = dk.DangKyID AND tt.Status = 'Success'
    LEFT JOIN ChiPhi cp ON cp.LopID = lh.LopID
    LEFT JOIN BuoiHoc bh ON bh.LopID = lh.LopID
    GROUP BY lh.LopID, kh.TenKhoaHoc, gv.HoTen, dd.TenCoSo
END");

            // View cho lợi nhuận gộp theo lớp
            migrationBuilder.Sql(@"
CREATE OR ALTER VIEW V_GrossProfit_By_Class AS
SELECT
    lh.LopID,
    kh.TenKhoaHoc,
    gv.HoTen AS GiangVien,
    dd.TenCoSo AS DiaDiem,
    SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) AS DoanhThu,
    SUM(CASE WHEN cp.LoaiChiPhi = 'TrucTiep' THEN cp.SoTien ELSE 0 END) AS ChiPhiTrucTiep,
    SUM(CASE WHEN cp.LoaiChiPhi != 'TrucTiep' THEN cp.SoTien * 0.1 ELSE 0 END) AS ChiPhiChungPhanBo,
    (SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) -
     SUM(CASE WHEN cp.LoaiChiPhi = 'TrucTiep' THEN cp.SoTien ELSE 0 END) -
     SUM(CASE WHEN cp.LoaiChiPhi != 'TrucTiep' THEN cp.SoTien * 0.1 ELSE 0 END)) AS LoiNhuanGop,
    (SUM(CASE WHEN tt.Status = 'Success' THEN tt.SoTien ELSE 0 END) -
     SUM(cp.SoTien)) AS LoiNhuanRong,
    COUNT(DISTINCT dk.HocVienID) AS SoLuongHocVien,
    COUNT(DISTINCT bh.BuoiHocID) AS SoBuoi
FROM LopHoc lh
JOIN KhoaHoc kh ON kh.KhoaHocID = lh.KhoaHocID
JOIN GiangVien gv ON gv.GiangVienID = lh.GiangVienID
JOIN DiaDiem dd ON dd.DiaDiemID = lh.DiaDiemID
LEFT JOIN DangKyLop dk ON dk.LopID = lh.LopID
LEFT JOIN ThanhToan tt ON tt.DangKyID = dk.DangKyID AND tt.Status = 'Success'
LEFT JOIN ChiPhi cp ON cp.LopID = lh.LopID
LEFT JOIN BuoiHoc bh ON bh.LopID = lh.LopID
GROUP BY lh.LopID, kh.TenKhoaHoc, gv.HoTen, dd.TenCoSo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa các stored procedures và views
            migrationBuilder.Sql("DROP VIEW IF EXISTS V_GrossProfit_By_Class");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_GetAllClassesNetProfit");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_GetFinancialReportByPeriod");

            migrationBuilder.DropTable(
                name: "BaoCaos");
        }
    }
}
