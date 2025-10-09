using IZONE.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IZONE.Core.Interfaces
{
    public interface IGiangVienRepository : IGenericRepository<GiangVien>
    {
        Task<GiangVien> GetByEmailAsync(string email);
        Task<IReadOnlyList<GiangVien>> GetGiangViensByChuyenMonAsync(string chuyenMon);
        Task<IReadOnlyList<LopHoc>> GetLopHocsByGiangVienAsync(int giangVienId);
        Task<IReadOnlyList<GiangVienWithEmailDto>> GetAllWithEmailAsync();
    }
}
