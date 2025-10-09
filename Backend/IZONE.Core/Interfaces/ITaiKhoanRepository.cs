using IZONE.Core.Models;
using System.Threading.Tasks;

namespace IZONE.Core.Interfaces
{
    public interface ITaiKhoanRepository : IGenericRepository<TaiKhoan>
    {
        Task<TaiKhoan> GetByUsernameAsync(string username);
        Task<bool> CheckLoginAsync(string username, string password);
    }
}