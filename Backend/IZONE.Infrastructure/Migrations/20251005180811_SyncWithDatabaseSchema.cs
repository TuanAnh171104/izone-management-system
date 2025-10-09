using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IZONE.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncWithDatabaseSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DangKyLop_HocVien_MaHV",
                table: "DangKyLop");

            migrationBuilder.DropForeignKey(
                name: "FK_DangKyLop_LopHoc_MaLop",
                table: "DangKyLop");

            migrationBuilder.DropForeignKey(
                name: "FK_ThanhToan_DangKyLop_MaDK",
                table: "ThanhToan");

            migrationBuilder.DropForeignKey(
                name: "FK_ThanhToan_ViHocVien_MaViHV",
                table: "ThanhToan");

            migrationBuilder.DropForeignKey(
                name: "FK_ViHocVien_HocVien_MaHV",
                table: "ViHocVien");

            migrationBuilder.DropIndex(
                name: "IX_ViHocVien_MaHV",
                table: "ViHocVien");

            migrationBuilder.DropIndex(
                name: "IX_ThanhToan_MaViHV",
                table: "ThanhToan");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "ViHocVien");

            migrationBuilder.DropColumn(
                name: "MaViHV",
                table: "ThanhToan");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "ThanhToan");

            migrationBuilder.DropColumn(
                name: "NgayTao",
                table: "TaiKhoan");

            migrationBuilder.DropColumn(
                name: "TenDangNhap",
                table: "TaiKhoan");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "TaiKhoan");

            migrationBuilder.DropColumn(
                name: "GhiChu",
                table: "LopHoc");

            migrationBuilder.DropColumn(
                name: "TenLop",
                table: "LopHoc");

            migrationBuilder.DropColumn(
                name: "MoTa",
                table: "KhoaHoc");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "KhoaHoc");

            migrationBuilder.DropColumn(
                name: "DiaChi",
                table: "HocVien");

            migrationBuilder.DropColumn(
                name: "GhiChu",
                table: "HocVien");

            migrationBuilder.DropColumn(
                name: "GioiTinh",
                table: "HocVien");

            migrationBuilder.DropColumn(
                name: "NgayDangKy",
                table: "HocVien");

            migrationBuilder.DropColumn(
                name: "SoDienThoai",
                table: "HocVien");

            migrationBuilder.DropColumn(
                name: "DiaChi",
                table: "GiangVien");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "GiangVien");

            migrationBuilder.DropColumn(
                name: "GioiTinh",
                table: "GiangVien");

            migrationBuilder.DropColumn(
                name: "LuongCoBan",
                table: "GiangVien");

            migrationBuilder.DropColumn(
                name: "NgaySinh",
                table: "GiangVien");

            migrationBuilder.DropColumn(
                name: "NgayVaoLam",
                table: "GiangVien");

            migrationBuilder.DropColumn(
                name: "SoDienThoai",
                table: "GiangVien");

            migrationBuilder.DropColumn(
                name: "SoDienThoai",
                table: "DiaDiem");

            migrationBuilder.DropColumn(
                name: "TenDiaDiem",
                table: "DiaDiem");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "DiaDiem");

            migrationBuilder.DropColumn(
                name: "GhiChu",
                table: "DangKyLop");

            migrationBuilder.DropColumn(
                name: "HocPhi",
                table: "DangKyLop");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "DangKyLop");

            migrationBuilder.RenameColumn(
                name: "MaHV",
                table: "ViHocVien",
                newName: "HocVienID");

            migrationBuilder.RenameColumn(
                name: "MaViHV",
                table: "ViHocVien",
                newName: "ViID");

            migrationBuilder.RenameColumn(
                name: "NgayTao",
                table: "ViHocVien",
                newName: "NgayGiaoDich");

            migrationBuilder.RenameColumn(
                name: "MaDK",
                table: "ThanhToan",
                newName: "DangKyID");

            migrationBuilder.RenameColumn(
                name: "MaTT",
                table: "ThanhToan",
                newName: "ThanhToanID");

            migrationBuilder.RenameColumn(
                name: "PhuongThucThanhToan",
                table: "ThanhToan",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "LoaiThanhToan",
                table: "ThanhToan",
                newName: "PhuongThuc");

            migrationBuilder.RenameIndex(
                name: "IX_ThanhToan_MaDK",
                table: "ThanhToan",
                newName: "IX_ThanhToan_DangKyID");

            migrationBuilder.RenameColumn(
                name: "SoLuongToiDa",
                table: "LopHoc",
                newName: "SucChua");

            migrationBuilder.RenameColumn(
                name: "MaDD",
                table: "DiaDiem",
                newName: "DiaDiemID");

            migrationBuilder.RenameColumn(
                name: "MaLop",
                table: "DangKyLop",
                newName: "LopID");

            migrationBuilder.RenameColumn(
                name: "MaHV",
                table: "DangKyLop",
                newName: "HocVienID");

            migrationBuilder.RenameColumn(
                name: "MaDK",
                table: "DangKyLop",
                newName: "DangKyID");

            migrationBuilder.RenameIndex(
                name: "IX_DangKyLop_MaLop",
                table: "DangKyLop",
                newName: "IX_DangKyLop_LopID");

            migrationBuilder.RenameIndex(
                name: "IX_DangKyLop_MaHV",
                table: "DangKyLop",
                newName: "IX_DangKyLop_HocVienID");

            migrationBuilder.AddColumn<int>(
                name: "DangKyID",
                table: "ViHocVien",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GhiChu",
                table: "ViHocVien",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoaiTx",
                table: "ViHocVien",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ThanhToanID",
                table: "ViHocVien",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GhiChu",
                table: "ThanhToan",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "ThanhToan",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionRef",
                table: "ThanhToan",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "LopHoc",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "NgayHocTrongTuan",
                table: "LopHoc",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "CaHoc",
                table: "LopHoc",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<decimal>(
                name: "DonGiaTaiLieu",
                table: "KhoaHoc",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "NgaySinh",
                table: "HocVien",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "HocVien",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<string>(
                name: "SDT",
                table: "HocVien",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaiKhoanVi",
                table: "HocVien",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<string>(
                name: "ChuyenMon",
                table: "GiangVien",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<int>(
                name: "SucChua",
                table: "DiaDiem",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "DiaChi",
                table: "DiaDiem",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<string>(
                name: "TenCoSo",
                table: "DiaDiem",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LyDoHuy",
                table: "DangKyLop",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayHuy",
                table: "DangKyLop",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrangThaiDangKy",
                table: "DangKyLop",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TrangThaiThanhToan",
                table: "DangKyLop",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ViHocVien_DangKyID",
                table: "ViHocVien",
                column: "DangKyID");

            migrationBuilder.CreateIndex(
                name: "IX_ViHocVien_HocVienID",
                table: "ViHocVien",
                column: "HocVienID");

            migrationBuilder.CreateIndex(
                name: "IX_ViHocVien_ThanhToanID",
                table: "ViHocVien",
                column: "ThanhToanID");

            migrationBuilder.AddForeignKey(
                name: "FK_DangKyLop_HocVien_HocVienID",
                table: "DangKyLop",
                column: "HocVienID",
                principalTable: "HocVien",
                principalColumn: "HocVienID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DangKyLop_LopHoc_LopID",
                table: "DangKyLop",
                column: "LopID",
                principalTable: "LopHoc",
                principalColumn: "LopID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ThanhToan_DangKyLop_DangKyID",
                table: "ThanhToan",
                column: "DangKyID",
                principalTable: "DangKyLop",
                principalColumn: "DangKyID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ViHocVien_DangKyLop_DangKyID",
                table: "ViHocVien",
                column: "DangKyID",
                principalTable: "DangKyLop",
                principalColumn: "DangKyID");

            migrationBuilder.AddForeignKey(
                name: "FK_ViHocVien_HocVien_HocVienID",
                table: "ViHocVien",
                column: "HocVienID",
                principalTable: "HocVien",
                principalColumn: "HocVienID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ViHocVien_ThanhToan_ThanhToanID",
                table: "ViHocVien",
                column: "ThanhToanID",
                principalTable: "ThanhToan",
                principalColumn: "ThanhToanID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DangKyLop_HocVien_HocVienID",
                table: "DangKyLop");

            migrationBuilder.DropForeignKey(
                name: "FK_DangKyLop_LopHoc_LopID",
                table: "DangKyLop");

            migrationBuilder.DropForeignKey(
                name: "FK_ThanhToan_DangKyLop_DangKyID",
                table: "ThanhToan");

            migrationBuilder.DropForeignKey(
                name: "FK_ViHocVien_DangKyLop_DangKyID",
                table: "ViHocVien");

            migrationBuilder.DropForeignKey(
                name: "FK_ViHocVien_HocVien_HocVienID",
                table: "ViHocVien");

            migrationBuilder.DropForeignKey(
                name: "FK_ViHocVien_ThanhToan_ThanhToanID",
                table: "ViHocVien");

            migrationBuilder.DropIndex(
                name: "IX_ViHocVien_DangKyID",
                table: "ViHocVien");

            migrationBuilder.DropIndex(
                name: "IX_ViHocVien_HocVienID",
                table: "ViHocVien");

            migrationBuilder.DropIndex(
                name: "IX_ViHocVien_ThanhToanID",
                table: "ViHocVien");

            migrationBuilder.DropColumn(
                name: "DangKyID",
                table: "ViHocVien");

            migrationBuilder.DropColumn(
                name: "GhiChu",
                table: "ViHocVien");

            migrationBuilder.DropColumn(
                name: "LoaiTx",
                table: "ViHocVien");

            migrationBuilder.DropColumn(
                name: "ThanhToanID",
                table: "ViHocVien");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "ThanhToan");

            migrationBuilder.DropColumn(
                name: "TransactionRef",
                table: "ThanhToan");

            migrationBuilder.DropColumn(
                name: "SDT",
                table: "HocVien");

            migrationBuilder.DropColumn(
                name: "TaiKhoanVi",
                table: "HocVien");

            migrationBuilder.DropColumn(
                name: "TenCoSo",
                table: "DiaDiem");

            migrationBuilder.DropColumn(
                name: "LyDoHuy",
                table: "DangKyLop");

            migrationBuilder.DropColumn(
                name: "NgayHuy",
                table: "DangKyLop");

            migrationBuilder.DropColumn(
                name: "TrangThaiDangKy",
                table: "DangKyLop");

            migrationBuilder.DropColumn(
                name: "TrangThaiThanhToan",
                table: "DangKyLop");

            migrationBuilder.RenameColumn(
                name: "HocVienID",
                table: "ViHocVien",
                newName: "MaHV");

            migrationBuilder.RenameColumn(
                name: "ViID",
                table: "ViHocVien",
                newName: "MaViHV");

            migrationBuilder.RenameColumn(
                name: "NgayGiaoDich",
                table: "ViHocVien",
                newName: "NgayTao");

            migrationBuilder.RenameColumn(
                name: "DangKyID",
                table: "ThanhToan",
                newName: "MaDK");

            migrationBuilder.RenameColumn(
                name: "ThanhToanID",
                table: "ThanhToan",
                newName: "MaTT");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "ThanhToan",
                newName: "PhuongThucThanhToan");

            migrationBuilder.RenameColumn(
                name: "PhuongThuc",
                table: "ThanhToan",
                newName: "LoaiThanhToan");

            migrationBuilder.RenameIndex(
                name: "IX_ThanhToan_DangKyID",
                table: "ThanhToan",
                newName: "IX_ThanhToan_MaDK");

            migrationBuilder.RenameColumn(
                name: "SucChua",
                table: "LopHoc",
                newName: "SoLuongToiDa");

            migrationBuilder.RenameColumn(
                name: "DiaDiemID",
                table: "DiaDiem",
                newName: "MaDD");

            migrationBuilder.RenameColumn(
                name: "LopID",
                table: "DangKyLop",
                newName: "MaLop");

            migrationBuilder.RenameColumn(
                name: "HocVienID",
                table: "DangKyLop",
                newName: "MaHV");

            migrationBuilder.RenameColumn(
                name: "DangKyID",
                table: "DangKyLop",
                newName: "MaDK");

            migrationBuilder.RenameIndex(
                name: "IX_DangKyLop_LopID",
                table: "DangKyLop",
                newName: "IX_DangKyLop_MaLop");

            migrationBuilder.RenameIndex(
                name: "IX_DangKyLop_HocVienID",
                table: "DangKyLop",
                newName: "IX_DangKyLop_MaHV");

            migrationBuilder.AddColumn<string>(
                name: "TrangThai",
                table: "ViHocVien",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "GhiChu",
                table: "ThanhToan",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaViHV",
                table: "ThanhToan",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrangThai",
                table: "ThanhToan",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayTao",
                table: "TaiKhoan",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "TenDangNhap",
                table: "TaiKhoan",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "TrangThai",
                table: "TaiKhoan",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "LopHoc",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NgayHocTrongTuan",
                table: "LopHoc",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CaHoc",
                table: "LopHoc",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GhiChu",
                table: "LopHoc",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TenLop",
                table: "LopHoc",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<decimal>(
                name: "DonGiaTaiLieu",
                table: "KhoaHoc",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MoTa",
                table: "KhoaHoc",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "TrangThai",
                table: "KhoaHoc",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<DateTime>(
                name: "NgaySinh",
                table: "HocVien",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "HocVien",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiaChi",
                table: "HocVien",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GhiChu",
                table: "HocVien",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GioiTinh",
                table: "HocVien",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayDangKy",
                table: "HocVien",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "SoDienThoai",
                table: "HocVien",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "ChuyenMon",
                table: "GiangVien",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiaChi",
                table: "GiangVien",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "GiangVien",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GioiTinh",
                table: "GiangVien",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "LuongCoBan",
                table: "GiangVien",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgaySinh",
                table: "GiangVien",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayVaoLam",
                table: "GiangVien",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "SoDienThoai",
                table: "GiangVien",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "SucChua",
                table: "DiaDiem",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DiaChi",
                table: "DiaDiem",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "SoDienThoai",
                table: "DiaDiem",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TenDiaDiem",
                table: "DiaDiem",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TrangThai",
                table: "DiaDiem",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GhiChu",
                table: "DangKyLop",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "HocPhi",
                table: "DangKyLop",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TrangThai",
                table: "DangKyLop",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ViHocVien_MaHV",
                table: "ViHocVien",
                column: "MaHV",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ThanhToan_MaViHV",
                table: "ThanhToan",
                column: "MaViHV");

            migrationBuilder.AddForeignKey(
                name: "FK_DangKyLop_HocVien_MaHV",
                table: "DangKyLop",
                column: "MaHV",
                principalTable: "HocVien",
                principalColumn: "HocVienID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DangKyLop_LopHoc_MaLop",
                table: "DangKyLop",
                column: "MaLop",
                principalTable: "LopHoc",
                principalColumn: "LopID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ThanhToan_DangKyLop_MaDK",
                table: "ThanhToan",
                column: "MaDK",
                principalTable: "DangKyLop",
                principalColumn: "MaDK",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ThanhToan_ViHocVien_MaViHV",
                table: "ThanhToan",
                column: "MaViHV",
                principalTable: "ViHocVien",
                principalColumn: "MaViHV");

            migrationBuilder.AddForeignKey(
                name: "FK_ViHocVien_HocVien_MaHV",
                table: "ViHocVien",
                column: "MaHV",
                principalTable: "HocVien",
                principalColumn: "HocVienID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
