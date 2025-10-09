using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IDangKyLopRepository : IGenericRepository<DangKyLop>
    {
        Task<IEnumerable<DangKyLop>> GetByHocVienIdAsync(int hocVienId);
        Task<IEnumerable<DangKyLop>> GetByLopIdAsync(int lopId);
        Task<IEnumerable<DangKyLop>> GetByTrangThaiAsync(string trangThai);
        Task<IEnumerable<DangKyLop>> GetByTrangThaiThanhToanAsync(string trangThaiThanhToan);
        Task<DangKyLop?> GetByHocVienAndLopAsync(int hocVienId, int lopId);
    }
}