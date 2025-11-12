using IZONE.Core.Interfaces;
using IZONE.Core.Models;
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

        /// <summary>
        /// Lấy dữ liệu cơ bản cho dự báo (không bao gồm prediction)
        /// </summary>
        [HttpGet("basic-data")]
        public async Task<IActionResult> GetBasicPredictionData()
        {
            try
            {
                var basicData = await _predictionService.GetBasicPredictionDataAsync();

                return Ok(new
                {
                    success = true,
                    message = "Lấy dữ liệu cơ bản thành công",
                    data = basicData,
                    count = basicData.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy dữ liệu cơ bản",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Chạy dự báo cho danh sách dữ liệu đã có
        /// </summary>
        [HttpPost("run-predictions")]
        public async Task<IActionResult> RunPredictionsForData([FromBody] List<PredictionData> basicData)
        {
            try
            {
                if (basicData == null || basicData.Count == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ"
                    });
                }

                var predictions = await _predictionService.RunPredictionsForDataAsync(basicData);

                return Ok(new
                {
                    success = true,
                    message = "Chạy dự báo thành công",
                    data = predictions,
                    count = predictions.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi chạy dự báo",
                    error = ex.Message
                });
            }
        }
    }
}
