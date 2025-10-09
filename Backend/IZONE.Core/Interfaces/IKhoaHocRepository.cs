using IZONE.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IZONE.Core.Interfaces
{
    public interface IKhoaHocRepository : IGenericRepository<KhoaHoc>
    {
        Task<IReadOnlyList<KhoaHoc>> GetActiveKhoaHocAsync();
        Task<IReadOnlyList<LopHoc>> GetLopHocsByKhoaHocAsync(int khoaHocId);
    }
}
