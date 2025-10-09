using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IZONE.Infrastructure.Repositories
{
    public class KhoaHocRepository : GenericRepository<KhoaHoc>, IKhoaHocRepository
    {
        public KhoaHocRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<IReadOnlyList<KhoaHoc>> GetActiveKhoaHocAsync()
        {
            try
            {
                return await _context.KhoaHocs.ToListAsync();
            }
            catch (Exception ex)
            {
                // Nếu có lỗi với Entity Framework, thử truy vấn raw SQL
                var sql = @"SELECT KhoaHocID, TenKhoaHoc, SoBuoi, HocPhi, DonGiaTaiLieu FROM KhoaHoc";

                var khoaHocs = new List<KhoaHoc>();
                var connection = _context.Database.GetDbConnection();

                await connection.OpenAsync();
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = sql;
                    command.CommandType = System.Data.CommandType.Text;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var khoaHoc = new KhoaHoc
                            {
                                KhoaHocID = reader.GetInt32(0),
                                TenKhoaHoc = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                                SoBuoi = reader.GetInt32(2),
                                HocPhi = reader.GetDecimal(3),
                                DonGiaTaiLieu = reader.GetDecimal(4)
                            };
                            khoaHocs.Add(khoaHoc);
                        }
                    }
                }

                await connection.CloseAsync();
                return khoaHocs;
            }
        }

        public async Task<IReadOnlyList<LopHoc>> GetLopHocsByKhoaHocAsync(int khoaHocId)
        {
            return await _context.LopHocs
                .Where(l => l.KhoaHocID == khoaHocId)
                .ToListAsync();
        }

        public override async Task UpdateAsync(KhoaHoc entity)
        {
            try
            {
                var existing = await _context.KhoaHocs.FindAsync(entity.KhoaHocID);
                if (existing != null)
                {
                    _context.Entry(existing).CurrentValues.SetValues(entity);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    throw new KeyNotFoundException($"Không tìm thấy khóa học với ID: {entity.KhoaHocID}");
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                throw new Exception($"Lỗi đồng thời khi cập nhật khóa học: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                throw new Exception($"Lỗi khi cập nhật khóa học: {ex.Message}", ex);
            }
        }
    }
}
