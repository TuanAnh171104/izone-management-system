using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IZONE.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiaDiem",
                columns: table => new
                {
                    MaDD = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenDiaDiem = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DiaChi = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SoDienThoai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SucChua = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiaDiem", x => x.MaDD);
                });

            migrationBuilder.CreateTable(
                name: "KhoaHoc",
                columns: table => new
                {
                    KhoaHocID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenKhoaHoc = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    HocPhi = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SoBuoi = table.Column<int>(type: "int", nullable: false),
                    DonGiaTaiLieu = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KhoaHoc", x => x.KhoaHocID);
                });

            migrationBuilder.CreateTable(
                name: "TaiKhoan",
                columns: table => new
                {
                    TaiKhoanID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    MatKhau = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    VaiTro = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenDangNhap = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaiKhoan", x => x.TaiKhoanID);
                });

            migrationBuilder.CreateTable(
                name: "ThueMatBang",
                columns: table => new
                {
                    MaThue = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaDD = table.Column<int>(type: "int", nullable: false),
                    NgayBatDau = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayKetThuc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GiaThue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThueMatBang", x => x.MaThue);
                    table.ForeignKey(
                        name: "FK_ThueMatBang_DiaDiem_MaDD",
                        column: x => x.MaDD,
                        principalTable: "DiaDiem",
                        principalColumn: "MaDD",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GiangVien",
                columns: table => new
                {
                    GiangVienID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HoTen = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    GioiTinh = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    NgaySinh = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiaChi = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SoDienThoai = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ChuyenMon = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NgayVaoLam = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LuongCoBan = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaiKhoanID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GiangVien", x => x.GiangVienID);
                    table.ForeignKey(
                        name: "FK_GiangVien_TaiKhoan_TaiKhoanID",
                        column: x => x.TaiKhoanID,
                        principalTable: "TaiKhoan",
                        principalColumn: "TaiKhoanID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "HocVien",
                columns: table => new
                {
                    HocVienID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HoTen = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    GioiTinh = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    NgaySinh = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiaChi = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SoDienThoai = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    NgayDangKy = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TaiKhoanID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HocVien", x => x.HocVienID);
                    table.ForeignKey(
                        name: "FK_HocVien_TaiKhoan_TaiKhoanID",
                        column: x => x.TaiKhoanID,
                        principalTable: "TaiKhoan",
                        principalColumn: "TaiKhoanID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LopHoc",
                columns: table => new
                {
                    LopID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenLop = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    KhoaHocID = table.Column<int>(type: "int", nullable: false),
                    GiangVienID = table.Column<int>(type: "int", nullable: false),
                    DiaDiemID = table.Column<int>(type: "int", nullable: true),
                    NgayBatDau = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayKetThuc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CaHoc = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NgayHocTrongTuan = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DonGiaBuoiDay = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ThoiLuongGio = table.Column<decimal>(type: "decimal(4,2)", nullable: false),
                    SoLuongToiDa = table.Column<int>(type: "int", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LopHoc", x => x.LopID);
                    table.ForeignKey(
                        name: "FK_LopHoc_DiaDiem_DiaDiemID",
                        column: x => x.DiaDiemID,
                        principalTable: "DiaDiem",
                        principalColumn: "MaDD",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LopHoc_GiangVien_GiangVienID",
                        column: x => x.GiangVienID,
                        principalTable: "GiangVien",
                        principalColumn: "GiangVienID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LopHoc_KhoaHoc_KhoaHocID",
                        column: x => x.KhoaHocID,
                        principalTable: "KhoaHoc",
                        principalColumn: "KhoaHocID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ViHocVien",
                columns: table => new
                {
                    MaViHV = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHV = table.Column<int>(type: "int", nullable: false),
                    SoDu = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ViHocVien", x => x.MaViHV);
                    table.ForeignKey(
                        name: "FK_ViHocVien_HocVien_MaHV",
                        column: x => x.MaHV,
                        principalTable: "HocVien",
                        principalColumn: "HocVienID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BuoiHoc",
                columns: table => new
                {
                    MaBuoi = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaLop = table.Column<int>(type: "int", nullable: false),
                    MaGV = table.Column<int>(type: "int", nullable: false),
                    NgayHoc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ThoiGianBatDau = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ThoiGianKetThuc = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NoiDung = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuoiHoc", x => x.MaBuoi);
                    table.ForeignKey(
                        name: "FK_BuoiHoc_GiangVien_MaGV",
                        column: x => x.MaGV,
                        principalTable: "GiangVien",
                        principalColumn: "GiangVienID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BuoiHoc_LopHoc_MaLop",
                        column: x => x.MaLop,
                        principalTable: "LopHoc",
                        principalColumn: "LopID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChiPhi",
                columns: table => new
                {
                    MaCP = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaLop = table.Column<int>(type: "int", nullable: true),
                    TenChiPhi = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SoTien = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NgayChi = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LoaiChiPhi = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChiPhi", x => x.MaCP);
                    table.ForeignKey(
                        name: "FK_ChiPhi_LopHoc_MaLop",
                        column: x => x.MaLop,
                        principalTable: "LopHoc",
                        principalColumn: "LopID");
                });

            migrationBuilder.CreateTable(
                name: "DangKyLop",
                columns: table => new
                {
                    MaDK = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHV = table.Column<int>(type: "int", nullable: false),
                    MaLop = table.Column<int>(type: "int", nullable: false),
                    NgayDangKy = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HocPhi = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DangKyLop", x => x.MaDK);
                    table.ForeignKey(
                        name: "FK_DangKyLop_HocVien_MaHV",
                        column: x => x.MaHV,
                        principalTable: "HocVien",
                        principalColumn: "HocVienID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DangKyLop_LopHoc_MaLop",
                        column: x => x.MaLop,
                        principalTable: "LopHoc",
                        principalColumn: "LopID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DiemDanh",
                columns: table => new
                {
                    MaDD = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHV = table.Column<int>(type: "int", nullable: false),
                    MaBuoi = table.Column<int>(type: "int", nullable: false),
                    ThoiGianDiemDanh = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiemDanh", x => x.MaDD);
                    table.ForeignKey(
                        name: "FK_DiemDanh_BuoiHoc_MaBuoi",
                        column: x => x.MaBuoi,
                        principalTable: "BuoiHoc",
                        principalColumn: "MaBuoi",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DiemDanh_HocVien_MaHV",
                        column: x => x.MaHV,
                        principalTable: "HocVien",
                        principalColumn: "HocVienID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DiemSo",
                columns: table => new
                {
                    MaDiem = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHV = table.Column<int>(type: "int", nullable: false),
                    MaBuoi = table.Column<int>(type: "int", nullable: false),
                    Diem = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    LoaiDiem = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NgayNhap = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiemSo", x => x.MaDiem);
                    table.ForeignKey(
                        name: "FK_DiemSo_BuoiHoc_MaBuoi",
                        column: x => x.MaBuoi,
                        principalTable: "BuoiHoc",
                        principalColumn: "MaBuoi",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiemSo_HocVien_MaHV",
                        column: x => x.MaHV,
                        principalTable: "HocVien",
                        principalColumn: "HocVienID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BaoLuu",
                columns: table => new
                {
                    MaBL = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHV = table.Column<int>(type: "int", nullable: false),
                    MaDK = table.Column<int>(type: "int", nullable: false),
                    NgayBaoLuu = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayHetHan = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LyDo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BaoLuu", x => x.MaBL);
                    table.ForeignKey(
                        name: "FK_BaoLuu_DangKyLop_MaDK",
                        column: x => x.MaDK,
                        principalTable: "DangKyLop",
                        principalColumn: "MaDK",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BaoLuu_HocVien_MaHV",
                        column: x => x.MaHV,
                        principalTable: "HocVien",
                        principalColumn: "HocVienID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ThanhToan",
                columns: table => new
                {
                    MaTT = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaDK = table.Column<int>(type: "int", nullable: false),
                    NgayThanhToan = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoTien = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PhuongThucThanhToan = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MaViHV = table.Column<int>(type: "int", nullable: true),
                    LoaiThanhToan = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThanhToan", x => x.MaTT);
                    table.ForeignKey(
                        name: "FK_ThanhToan_DangKyLop_MaDK",
                        column: x => x.MaDK,
                        principalTable: "DangKyLop",
                        principalColumn: "MaDK",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ThanhToan_ViHocVien_MaViHV",
                        column: x => x.MaViHV,
                        principalTable: "ViHocVien",
                        principalColumn: "MaViHV");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BaoLuu_MaDK",
                table: "BaoLuu",
                column: "MaDK");

            migrationBuilder.CreateIndex(
                name: "IX_BaoLuu_MaHV",
                table: "BaoLuu",
                column: "MaHV");

            migrationBuilder.CreateIndex(
                name: "IX_BuoiHoc_MaGV",
                table: "BuoiHoc",
                column: "MaGV");

            migrationBuilder.CreateIndex(
                name: "IX_BuoiHoc_MaLop",
                table: "BuoiHoc",
                column: "MaLop");

            migrationBuilder.CreateIndex(
                name: "IX_ChiPhi_MaLop",
                table: "ChiPhi",
                column: "MaLop");

            migrationBuilder.CreateIndex(
                name: "IX_DangKyLop_MaHV",
                table: "DangKyLop",
                column: "MaHV");

            migrationBuilder.CreateIndex(
                name: "IX_DangKyLop_MaLop",
                table: "DangKyLop",
                column: "MaLop");

            migrationBuilder.CreateIndex(
                name: "IX_DiemDanh_MaBuoi",
                table: "DiemDanh",
                column: "MaBuoi");

            migrationBuilder.CreateIndex(
                name: "IX_DiemDanh_MaHV",
                table: "DiemDanh",
                column: "MaHV");

            migrationBuilder.CreateIndex(
                name: "IX_DiemSo_MaBuoi",
                table: "DiemSo",
                column: "MaBuoi");

            migrationBuilder.CreateIndex(
                name: "IX_DiemSo_MaHV",
                table: "DiemSo",
                column: "MaHV");

            migrationBuilder.CreateIndex(
                name: "IX_GiangVien_TaiKhoanID",
                table: "GiangVien",
                column: "TaiKhoanID",
                unique: true,
                filter: "[TaiKhoanID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_HocVien_TaiKhoanID",
                table: "HocVien",
                column: "TaiKhoanID",
                unique: true,
                filter: "[TaiKhoanID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_LopHoc_DiaDiemID",
                table: "LopHoc",
                column: "DiaDiemID");

            migrationBuilder.CreateIndex(
                name: "IX_LopHoc_GiangVienID",
                table: "LopHoc",
                column: "GiangVienID");

            migrationBuilder.CreateIndex(
                name: "IX_LopHoc_KhoaHocID",
                table: "LopHoc",
                column: "KhoaHocID");

            migrationBuilder.CreateIndex(
                name: "IX_ThanhToan_MaDK",
                table: "ThanhToan",
                column: "MaDK");

            migrationBuilder.CreateIndex(
                name: "IX_ThanhToan_MaViHV",
                table: "ThanhToan",
                column: "MaViHV");

            migrationBuilder.CreateIndex(
                name: "IX_ThueMatBang_MaDD",
                table: "ThueMatBang",
                column: "MaDD");

            migrationBuilder.CreateIndex(
                name: "IX_ViHocVien_MaHV",
                table: "ViHocVien",
                column: "MaHV",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BaoLuu");

            migrationBuilder.DropTable(
                name: "ChiPhi");

            migrationBuilder.DropTable(
                name: "DiemDanh");

            migrationBuilder.DropTable(
                name: "DiemSo");

            migrationBuilder.DropTable(
                name: "ThanhToan");

            migrationBuilder.DropTable(
                name: "ThueMatBang");

            migrationBuilder.DropTable(
                name: "BuoiHoc");

            migrationBuilder.DropTable(
                name: "DangKyLop");

            migrationBuilder.DropTable(
                name: "ViHocVien");

            migrationBuilder.DropTable(
                name: "LopHoc");

            migrationBuilder.DropTable(
                name: "HocVien");

            migrationBuilder.DropTable(
                name: "DiaDiem");

            migrationBuilder.DropTable(
                name: "GiangVien");

            migrationBuilder.DropTable(
                name: "KhoaHoc");

            migrationBuilder.DropTable(
                name: "TaiKhoan");
        }
    }
}
