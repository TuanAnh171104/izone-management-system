using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace IZONE.API
{
    public class JwtTokenService
    {
    private readonly string _secretKey = "your-very-long-secret-key-here-that-is-at-least-32-characters-long";

        public string GenerateToken(int taiKhoanId, string vaiTro, int? giangVienId = null, int? hocVienId = null)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, taiKhoanId.ToString()),
                new Claim(ClaimTypes.Role, vaiTro),
                new Claim("TaiKhoanID", taiKhoanId.ToString())
            };

            if (giangVienId.HasValue)
            {
                claims.Add(new Claim("GiangVienID", giangVienId.Value.ToString()));
            }

            if (hocVienId.HasValue)
            {
                claims.Add(new Claim("HocVienID", hocVienId.Value.ToString()));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddHours(8), // Token expires in 8 hours
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
