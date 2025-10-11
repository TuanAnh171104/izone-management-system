using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IZONE.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixThongBaoCheckConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the existing CHECK constraint
            migrationBuilder.Sql("ALTER TABLE [ThongBao] DROP CONSTRAINT [CK__ThongBao__LoaiNg__09A971A2]");

            // Add the new CHECK constraint with the correct values including GiangVien
            migrationBuilder.Sql("ALTER TABLE [ThongBao] ADD CONSTRAINT [CK__ThongBao__LoaiNg__09A971A2] CHECK ([LoaiNguoiNhan] IN ('HocVien','LopHoc','ToanHeThong','GiangVien'))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the updated CHECK constraint
            migrationBuilder.Sql("ALTER TABLE [ThongBao] DROP CONSTRAINT [CK__ThongBao__LoaiNg__09A971A2]");

            // Restore the original CHECK constraint (if needed for rollback)
            migrationBuilder.Sql("ALTER TABLE [ThongBao] ADD CONSTRAINT [CK__ThongBao__LoaiNg__09A971A2] CHECK ([LoaiNguoiNhan] IN ('HocVien','Lop','ToanHeThong'))");
        }
    }
}
