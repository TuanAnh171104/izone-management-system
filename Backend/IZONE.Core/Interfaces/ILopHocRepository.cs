using IZONE.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IZONE.Core.Interfaces
{
    public interface ILopHocRepository : IGenericRepository<LopHoc>
    {
        Task<IReadOnlyList<LopHoc>> GetActiveLopHocAsync();
        Task<IReadOnlyList<LopHoc>> GetByGiangVienIdAsync(int giangVienId);
        Task<IReadOnlyList<HocVien>> GetHocViensByLopHocAsync(int lopId);
        Task<IReadOnlyList<BuoiHoc>> GetBuoiHocsByLopHocAsync(int lopId);
        Task<int> GetSoLuongHocVienByLopHocAsync(int lopId);
        Task<DateTime> CalculateEndDate(int khoaHocId, DateTime startDate);
        Task<bool> UpdateEndDateAsync(int lopHocId, DateTime endDate);
    }
}
