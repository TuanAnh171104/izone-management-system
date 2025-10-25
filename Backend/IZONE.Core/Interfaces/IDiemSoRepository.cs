using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IDiemSoRepository : IGenericRepository<DiemSo>
    {
        Task<IEnumerable<DiemSo>> GetByHocVienIdAsync(int hocVienId);
        Task<IEnumerable<DiemSo>> GetByLopIdAsync(int lopId);
        Task<IEnumerable<DiemSo>> GetByLoaiDiemAsync(string loaiDiem);
        Task<IEnumerable<DiemSo>> GetByKetQuaAsync(string ketQua);
        Task<DiemSo?> GetByHocVienAndLopAndLoaiDiemAsync(int hocVienId, int lopId, string loaiDiem);
        Task<IEnumerable<DiemSo>> GetGradesByHocVienAndLopAsync(int hocVienId, int lopId);
        Task<decimal> GetDiemTrungBinhByHocVienAndLopAsync(int hocVienId, int lopId);
    }
}