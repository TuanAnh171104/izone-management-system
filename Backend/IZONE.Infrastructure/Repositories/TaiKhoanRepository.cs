using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace IZONE.Infrastructure.Repositories
{
    public class TaiKhoanRepository : GenericRepository<TaiKhoan>, ITaiKhoanRepository
    {
        public TaiKhoanRepository(IZONEDbContext context) : base(context)
        {
        }

        public async Task<TaiKhoan> GetByUsernameAsync(string username)
        {
            return await _context.TaiKhoans
                .FirstOrDefaultAsync(x => x.Email == username);
        }

        public async Task<bool> CheckLoginAsync(string username, string password)
        {
            var taiKhoan = await _context.TaiKhoans
                .FirstOrDefaultAsync(x => x.Email == username && x.MatKhau == password);
            
            return taiKhoan != null;
        }
    }
}
