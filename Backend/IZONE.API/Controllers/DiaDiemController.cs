using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiaDiemController : ControllerBase
    {
        private readonly IDiaDiemRepository _diaDiemRepository;

        public DiaDiemController(IDiaDiemRepository diaDiemRepository)
        {
            _diaDiemRepository = diaDiemRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DiaDiem>>> GetAll()
        {
            var diaDiems = await _diaDiemRepository.GetAllAsync();
            return Ok(diaDiems);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DiaDiem>> GetById(int id)
        {
            var diaDiem = await _diaDiemRepository.GetByIdAsync(id);
            if (diaDiem == null)
            {
                return NotFound();
            }
            return Ok(diaDiem);
        }

        [HttpGet("ten-co-so/{tenCoSo}")]
        public async Task<ActionResult<IEnumerable<DiaDiem>>> GetByTenCoSo(string tenCoSo)
        {
            var diaDiems = await _diaDiemRepository.GetByTenCoSoAsync(tenCoSo);
            return Ok(diaDiems);
        }

        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<DiaDiem>>> GetAvailableLocations([FromQuery] int minCapacity = 1)
        {
            var diaDiems = await _diaDiemRepository.GetAvailableLocationsAsync(minCapacity);
            return Ok(diaDiems);
        }

        [HttpPost]
        public async Task<ActionResult<DiaDiem>> Create([FromBody] DiaDiem diaDiem)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdDiaDiem = await _diaDiemRepository.AddAsync(diaDiem);
            return CreatedAtAction(nameof(GetById), new { id = createdDiaDiem.DiaDiemID }, createdDiaDiem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DiaDiem diaDiem)
        {
            if (id != diaDiem.DiaDiemID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingDiaDiem = await _diaDiemRepository.GetByIdAsync(id);
            if (existingDiaDiem == null)
            {
                return NotFound();
            }

            await _diaDiemRepository.UpdateAsync(diaDiem);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var diaDiem = await _diaDiemRepository.GetByIdAsync(id);
            if (diaDiem == null)
            {
                return NotFound();
            }

            await _diaDiemRepository.DeleteAsync(diaDiem);
            return NoContent();
        }
    }
}