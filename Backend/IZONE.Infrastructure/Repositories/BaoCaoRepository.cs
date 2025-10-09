using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace IZONE.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho báo cáo
    /// </summary>
    public class BaoCaoRepository : IBaoCaoRepository
    {
        private readonly IZONEDbContext _context;

        public BaoCaoRepository(IZONEDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Tạo báo cáo mới
        /// </summary>
        public async Task<BaoCao> CreateAsync(BaoCao baoCao)
        {
            _context.BaoCaos.Add(baoCao);
            await _context.SaveChangesAsync();
            return baoCao;
        }

        /// <summary>
        /// Lấy báo cáo theo ID
        /// </summary>
        public async Task<BaoCao?> GetByIdAsync(int baoCaoId)
        {
            return await _context.BaoCaos.FindAsync(baoCaoId);
        }

        /// <summary>
        /// Lấy danh sách báo cáo với phân trang
        /// </summary>
        public async Task<IEnumerable<BaoCao>> GetAllAsync(int page = 1, int pageSize = 20)
        {
            return await _context.BaoCaos
                .OrderByDescending(b => b.NgayTao)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy báo cáo theo loại
        /// </summary>
        public async Task<IEnumerable<BaoCao>> GetByLoaiAsync(string loaiBaoCao, int page = 1, int pageSize = 20)
        {
            return await _context.BaoCaos
                .Where(b => b.LoaiBaoCao == loaiBaoCao)
                .OrderByDescending(b => b.NgayTao)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy báo cáo trong khoảng thời gian
        /// </summary>
        public async Task<IEnumerable<BaoCao>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, int page = 1, int pageSize = 20)
        {
            return await _context.BaoCaos
                .Where(b => b.NgayTao >= startDate && b.NgayTao <= endDate)
                .OrderByDescending(b => b.NgayTao)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        /// <summary>
        /// Cập nhật báo cáo
        /// </summary>
        public async Task UpdateAsync(BaoCao baoCao)
        {
            _context.BaoCaos.Update(baoCao);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa báo cáo
        /// </summary>
        public async Task DeleteAsync(int baoCaoId)
        {
            var baoCao = await GetByIdAsync(baoCaoId);
            if (baoCao != null)
            {
                _context.BaoCaos.Remove(baoCao);
                await _context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Đếm tổng số báo cáo
        /// </summary>
        public async Task<int> CountAsync()
        {
            return await _context.BaoCaos.CountAsync();
        }

        /// <summary>
        /// Đếm báo cáo theo loại
        /// </summary>
        public async Task<int> CountByLoaiAsync(string loaiBaoCao)
        {
            return await _context.BaoCaos
                .Where(b => b.LoaiBaoCao == loaiBaoCao)
                .CountAsync();
        }

        /// <summary>
        /// Lấy báo cáo gần đây
        /// </summary>
        public async Task<IEnumerable<BaoCao>> GetRecentAsync(int count = 10)
        {
            return await _context.BaoCaos
                .OrderByDescending(b => b.NgayTao)
                .Take(count)
                .ToListAsync();
        }
    }
}
