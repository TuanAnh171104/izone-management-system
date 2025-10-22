using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IDiemDanhRepository : IGenericRepository<DiemDanh>
    {
        Task<IEnumerable<DiemDanh>> GetByBuoiHocIdAsync(int buoiHocId);
        Task<IEnumerable<DiemDanh>> GetByHocVienIdAsync(int hocVienId);
        Task<IEnumerable<DiemDanh>> GetByHocVienAndLopIdAsync(int hocVienId, int lopId);
        Task<DiemDanh?> GetByBuoiHocAndHocVienAsync(int buoiHocId, int hocVienId);
        Task<IEnumerable<DiemDanh>> GetAttendanceByLopIdAsync(int lopId);
        Task<double> GetAttendanceRateByHocVienAsync(int hocVienId, int lopId);
        Task<IEnumerable<DiemDanh>> CreateBulkAsync(IEnumerable<DiemDanh> diemDanhs);
    }
}
