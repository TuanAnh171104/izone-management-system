using IZONE.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IZONE.API.Controllers
{
    /// <summary>
    /// Controller xử lý các API liên quan đến dự báo học viên bỏ học
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PredictionController : ControllerBase
    {
        private readonly IPredictionService _predictionService;

        public PredictionController(IPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        /// <summary>
        /// Lấy danh sách học viên đang học với tỷ lệ dự báo bỏ học
        /// </summary>
        [HttpGet("student-dropout-predictions")]
        public async Task<IActionResult> GetStudentDropoutPredictions()
        {
            try
            {
                var predictions = await _predictionService.GetPredictionDataWithDropoutRiskAsync();

                return Ok(new
                {
                    success = true,
                    message = "Lấy dữ liệu dự báo thành công",
                    data = predictions,
                    count = predictions.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy dữ liệu dự báo",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Load model ML
        /// </summary>
        [HttpPost("load-model")]
        public async Task<IActionResult> LoadModel()
        {
            try
            {
                await _predictionService.LoadModelAsync();

                return Ok(new
                {
                    success = true,
                    message = "Mô hình ML đã được tải thành công"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tải mô hình ML",
                    error = ex.Message
                });
            }
        }
    }
}
