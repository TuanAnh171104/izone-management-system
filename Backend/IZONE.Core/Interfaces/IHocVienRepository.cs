using IZONE.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IZONE.Core.Interfaces
{
    public interface IHocVienRepository : IGenericRepository<HocVien>
    {
        Task<HocVien> GetByEmailAsync(string email);
        Task<IReadOnlyList<HocVien>> GetHocViensByLopHocAsync(int lopId);
        Task<ViHocVien> GetViHocVienAsync(int hocVienId);
    }
}
