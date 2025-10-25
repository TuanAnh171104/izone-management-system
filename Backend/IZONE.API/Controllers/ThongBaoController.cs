using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    // Request models
    public class SystemNotificationRequest
    {
        public string NoiDung { get; set; } = string.Empty;
    }

    public class ClassNotificationRequest
    {
        public string NoiDung { get; set; } = string.Empty;
        public int LopId { get; set; }
    }

    public class PersonalNotificationRequest
    {
        public string NoiDung { get; set; } = string.Empty;
        public int NguoiNhanId { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ThongBaoController : ControllerBase
    {
        private readonly IThongBaoRepository _thongBaoRepository;
        private readonly ILopHocRepository _lopHocRepository;

        public ThongBaoController(IThongBaoRepository thongBaoRepository, ILopHocRepository lopHocRepository)
        {
            _thongBaoRepository = thongBaoRepository;
            _lopHocRepository = lopHocRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThongBao>>> GetAll()
        {
            var thongBaos = await _thongBaoRepository.GetAllAsync();
            return Ok(thongBaos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ThongBao>> GetById(int id)
        {
            var thongBao = await _thongBaoRepository.GetByIdAsync(id);
            if (thongBao == null)
            {
                return NotFound();
            }
            return Ok(thongBao);
        }

        [HttpGet("nguoi-nhan/{nguoiNhanId}")]
        public async Task<ActionResult<IEnumerable<ThongBao>>> GetByNguoiNhan(int nguoiNhanId)
        {
            var thongBaos = await _thongBaoRepository.GetByNguoiNhanAsync(nguoiNhanId);
            return Ok(thongBaos);
        }

        [HttpGet("nguoi-nhan/{nguoiNhanId}/loai/{loaiNguoiNhan}")]
        public async Task<ActionResult<IEnumerable<ThongBao>>> GetByNguoiNhanAndLoai(int nguoiNhanId, string loaiNguoiNhan)
        {
            var thongBaos = await _thongBaoRepository.GetByNguoiNhanAsync(nguoiNhanId);
            var filteredThongBaos = thongBaos.Where(tb => tb.LoaiNguoiNhan == loaiNguoiNhan);
            return Ok(filteredThongBaos);
        }

        [HttpGet("loai-nguoi-nhan/{loaiNguoiNhan}")]
        public async Task<ActionResult<IEnumerable<ThongBao>>> GetByLoaiNguoiNhan(string loaiNguoiNhan)
        {
            var thongBaos = await _thongBaoRepository.GetByLoaiNguoiNhanAsync(loaiNguoiNhan);
            return Ok(thongBaos);
        }

        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<ThongBao>>> GetRecentNotifications([FromQuery] int count = 10)
        {
            var thongBaos = await _thongBaoRepository.GetRecentNotificationsAsync(count);
            return Ok(thongBaos);
        }

        [HttpPost]
        public async Task<ActionResult<ThongBao>> Create([FromBody] ThongBao thongBao)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            thongBao.NgayGui = DateTime.Now;
            var createdThongBao = await _thongBaoRepository.AddAsync(thongBao);
            return CreatedAtAction(nameof(GetById), new { id = createdThongBao.TBID }, createdThongBao);
        }

        [HttpPost("system")]
        public async Task<ActionResult<ThongBao>> SendSystemNotification([FromBody] SystemNotificationRequest request)
        {
            if (string.IsNullOrEmpty(request.NoiDung))
            {
                return BadRequest("Nội dung thông báo không được trống");
            }

            var thongBao = new ThongBao
            {
                NoiDung = request.NoiDung,
                LoaiNguoiNhan = "ToanHeThong",
                NgayGui = DateTime.Now
            };

            var createdThongBao = await _thongBaoRepository.AddAsync(thongBao);
            return CreatedAtAction(nameof(GetById), new { id = createdThongBao.TBID }, createdThongBao);
        }

        [HttpPost("class")]
        public async Task<ActionResult<ThongBao>> SendClassNotification([FromBody] ClassNotificationRequest request)
        {
            if (string.IsNullOrEmpty(request.NoiDung))
            {
                return BadRequest("Nội dung thông báo không được trống");
            }

            if (request.LopId <= 0)
            {
                return BadRequest("ID lớp học không hợp lệ");
            }

            var thongBao = new ThongBao
            {
                NoiDung = request.NoiDung,
                LoaiNguoiNhan = "LopHoc",
                NguoiNhanID = request.LopId,
                NgayGui = DateTime.Now
            };

            var createdThongBao = await _thongBaoRepository.AddAsync(thongBao);
            return CreatedAtAction(nameof(GetById), new { id = createdThongBao.TBID }, createdThongBao);
        }

        [HttpPost("personal")]
        public async Task<ActionResult<ThongBao>> SendPersonalNotification([FromBody] PersonalNotificationRequest request)
        {
            if (string.IsNullOrEmpty(request.NoiDung))
            {
                return BadRequest("Nội dung thông báo không được trống");
            }

            if (request.NguoiNhanId <= 0)
            {
                return BadRequest("ID người nhận không hợp lệ");
            }

            var thongBao = new ThongBao
            {
                NoiDung = request.NoiDung,
                LoaiNguoiNhan = "HocVien",
                NguoiNhanID = request.NguoiNhanId,
                NgayGui = DateTime.Now
            };

            var createdThongBao = await _thongBaoRepository.AddAsync(thongBao);
            return CreatedAtAction(nameof(GetById), new { id = createdThongBao.TBID }, createdThongBao);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ThongBao thongBao)
        {
            if (id != thongBao.TBID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingThongBao = await _thongBaoRepository.GetByIdAsync(id);
            if (existingThongBao == null)
            {
                return NotFound();
            }

            await _thongBaoRepository.UpdateAsync(thongBao);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var thongBao = await _thongBaoRepository.GetByIdAsync(id);
            if (thongBao == null)
            {
                return NotFound();
            }

            await _thongBaoRepository.DeleteAsync(thongBao);
            return NoContent();
        }
    }
}