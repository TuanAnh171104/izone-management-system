using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("payment")]
    public class PaymentController : ControllerBase
    {
        private readonly IZONEDbContext _context;
        private readonly ILogger<PaymentController> _logger;
        private readonly IConfiguration _configuration;

        public PaymentController(IZONEDbContext context, ILogger<PaymentController> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        // Handle VNPay success redirect
        [HttpGet("success")]
        public async Task<IActionResult> PaymentSuccess([FromQuery] string transactionRef, [FromQuery] string amount, [FromQuery] string transactionId, [FromQuery] string bankCode)
        {
            try
            {
                _logger.LogInformation("Payment success page accessed for transaction {TransactionRef}", transactionRef);

                // Find payment by transaction reference
                var thanhToan = await _context.ThanhToans
                    .Include(t => t.DangKyLop)
                        .ThenInclude(d => d.LopHoc)
                            .ThenInclude(l => l.KhoaHoc)
                    .Include(t => t.HocVien)
                    .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef);

                if (thanhToan == null)
                {
                    _logger.LogWarning("Payment not found for transaction {TransactionRef}", transactionRef);
                    return Content($@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Không tìm thấy thanh toán</title>
                        <meta charset='utf-8'>
                        <style>
                            body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }}
                            .error-container {{ background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }}
                            .error-icon {{ font-size: 60px; color: #dc3545; margin-bottom: 20px; }}
                            .error-title {{ color: #dc3545; font-size: 24px; margin-bottom: 10px; }}
                            .error-message {{ color: #666; font-size: 16px; }}
                        </style>
                    </head>
                    <body>
                        <div class='error-container'>
                            <div class='error-icon'>❌</div>
                            <h1 class='error-title'>Không tìm thấy thanh toán</h1>
                            <p class='error-message'>Không tìm thấy thông tin thanh toán với mã giao dịch {transactionRef}</p>
                            <p><a href='http://localhost:3000'>Quay về trang chủ</a></p>
                        </div>
                    </body>
                    </html>", "text/html");
                }

                // Check if payment was successful
                if (thanhToan.Status != "Success")
                {
                    _logger.LogWarning("Payment status is not success for transaction {TransactionRef}, status: {Status}", transactionRef, thanhToan.Status);
                    return Content($@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Thanh toán chưa thành công</title>
                        <meta charset='utf-8'>
                        <style>
                            body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #fff5f5; }}
                            .warning-container {{ background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }}
                            .warning-icon {{ font-size: 60px; color: #ffc107; margin-bottom: 20px; }}
                            .warning-title {{ color: #856404; font-size: 24px; margin-bottom: 10px; }}
                            .warning-message {{ color: #666; font-size: 16px; }}
                        </style>
                    </head>
                    <body>
                        <div class='warning-container'>
                            <div class='warning-icon'>⚠️</div>
                            <h1 class='warning-title'>Thanh toán chưa thành công</h1>
                            <p class='warning-message'>Thanh toán với mã giao dịch {transactionRef} chưa được xử lý thành công. Trạng thái: {thanhToan.Status}</p>
                            <p><a href='http://localhost:3000'>Quay về trang chủ</a></p>
                        </div>
                    </body>
                    </html>", "text/html");
                }

                _logger.LogInformation("Payment success confirmed for transaction {TransactionRef}", transactionRef);

                // Create view model
                var viewModel = new PaymentSuccessViewModel
                {
                    Success = true,
                    Message = "Thanh toán thành công!",
                    TransactionRef = transactionRef,
                    Amount = amount,
                    TransactionId = transactionId,
                    BankCode = bankCode,
                    PaymentStatus = thanhToan.Status,
                    PaymentId = thanhToan.ThanhToanID,
                    StudentName = thanhToan.HocVien?.HoTen ?? "N/A",
                    CourseName = thanhToan.DangKyLop?.LopHoc?.KhoaHoc?.TenKhoaHoc ?? "N/A",
                    ClassName = $"{thanhToan.DangKyLop?.LopHoc?.CaHoc} - {thanhToan.DangKyLop?.LopHoc?.NgayHocTrongTuan}" ?? "N/A",
                    PaymentDate = thanhToan.NgayThanhToan,
                    PaymentMethod = thanhToan.PhuongThuc,
                    Provider = thanhToan.Provider
                };

                // Redirect to frontend after showing success page
                var redirectUrl = $"http://localhost:3000/student/courses";

                _logger.LogInformation("Redirecting to frontend: {RedirectUrl}", redirectUrl);

                // Return HTML response that redirects to frontend
                return Content($@"
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Thanh toán thành công</title>
                    <meta charset='utf-8'>
                    <meta http-equiv='refresh' content='3;url={redirectUrl}'>
                    <style>
                        body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f0f8ff; }}
                        .success-container {{ background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }}
                        .success-icon {{ font-size: 60px; color: #28a745; margin-bottom: 20px; }}
                        .success-title {{ color: #28a745; font-size: 24px; margin-bottom: 10px; }}
                        .success-message {{ color: #666; font-size: 16px; margin-bottom: 20px; }}
                        .redirect-message {{ color: #007bff; font-size: 14px; }}
                        .payment-details {{ text-align: left; background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                        .detail-row {{ margin: 10px 0; }}
                        .detail-label {{ font-weight: bold; color: #333; }}
                        .detail-value {{ color: #666; margin-left: 10px; }}
                    </style>
                </head>
                <body>
                    <div class='success-container'>
                        <div class='success-icon'>✅</div>
                        <h1 class='success-title'>Thanh toán thành công!</h1>
                        <p class='success-message'>Cảm ơn bạn đã thanh toán. Bạn sẽ được chuyển hướng về trang chủ trong giây lát...</p>

                        <div class='payment-details'>
                            <h3>Chi tiết thanh toán:</h3>
                            <div class='detail-row'>
                                <span class='detail-label'>Mã giao dịch:</span>
                                <span class='detail-value'>{transactionRef}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Số tiền:</span>
                                <span class='detail-value'>{decimal.Parse(amount) / 100:N0} VND</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Mã giao dịch ngân hàng:</span>
                                <span class='detail-value'>{transactionId}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Ngân hàng:</span>
                                <span class='detail-value'>{bankCode}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Học viên:</span>
                                <span class='detail-value'>{viewModel.StudentName}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Khóa học:</span>
                                <span class='detail-value'>{viewModel.CourseName}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Lớp học:</span>
                                <span class='detail-value'>{viewModel.ClassName}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Thời gian:</span>
                                <span class='detail-value'>{viewModel.PaymentDate:dd/MM/yyyy HH:mm:ss}</span>
                            </div>
                        </div>

                        <p class='redirect-message'>Chuyển hướng tự động sau 3 giây...</p>
                        <p><a href='{redirectUrl}' style='color: #007bff; text-decoration: none;'>Nhấn vào đây nếu không tự động chuyển hướng</a></p>
                    </div>
                </body>
                </html>", "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment success page for transaction {TransactionRef}", transactionRef);
                return Content($@"
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lỗi thanh toán</title>
                    <meta charset='utf-8'>
                    <style>
                        body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }}
                        .error-container {{ background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }}
                        .error-icon {{ font-size: 60px; color: #dc3545; margin-bottom: 20px; }}
                        .error-title {{ color: #dc3545; font-size: 24px; margin-bottom: 10px; }}
                        .error-message {{ color: #666; font-size: 16px; }}
                    </style>
                </head>
                <body>
                    <div class='error-container'>
                        <div class='error-icon'>❌</div>
                        <h1 class='error-title'>Có lỗi xảy ra</h1>
                        <p class='error-message'>Không thể xử lý thông tin thanh toán. Vui lòng liên hệ bộ phận hỗ trợ.</p>
                        <p><a href='http://localhost:3000'>Quay về trang chủ</a></p>
                    </div>
                </body>
                </html>", "text/html");
            }
        }

        // Handle VNPay error redirect
        [HttpGet("error")]
        public async Task<IActionResult> PaymentError([FromQuery] string transactionRef, [FromQuery] string error, [FromQuery] string errorMessage)
        {
            try
            {
                _logger.LogInformation("Payment error page accessed for transaction {TransactionRef}, error: {Error}", transactionRef, error);

                // Find payment by transaction reference
                var thanhToan = await _context.ThanhToans
                    .Include(t => t.DangKyLop)
                        .ThenInclude(d => d.LopHoc)
                            .ThenInclude(l => l.KhoaHoc)
                    .Include(t => t.HocVien)
                    .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef);

                // Create view model
                var viewModel = new PaymentErrorViewModel
                {
                    TransactionRef = transactionRef,
                    ErrorCode = error,
                    ErrorMessage = string.IsNullOrEmpty(errorMessage) ? GetVNPayErrorMessage(error) : errorMessage,
                    PaymentId = thanhToan?.ThanhToanID,
                    StudentName = thanhToan?.HocVien?.HoTen ?? "N/A",
                    CourseName = thanhToan?.DangKyLop?.LopHoc?.KhoaHoc?.TenKhoaHoc ?? "N/A",
                    ClassName = $"{thanhToan?.DangKyLop?.LopHoc?.CaHoc} - {thanhToan?.DangKyLop?.LopHoc?.NgayHocTrongTuan}" ?? "N/A",
                    PaymentDate = thanhToan?.NgayThanhToan,
                    PaymentMethod = thanhToan?.PhuongThuc,
                    Provider = thanhToan?.Provider,
                    PaymentStatus = thanhToan?.Status
                };

                // Redirect to frontend after showing error page
                var redirectUrl = $"http://localhost:3000/student/courses";

                _logger.LogInformation("Redirecting to frontend: {RedirectUrl}", redirectUrl);

                // Return HTML response that redirects to frontend
                return Content($@"
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Thanh toán thất bại</title>
                    <meta charset='utf-8'>
                    <meta http-equiv='refresh' content='5;url={redirectUrl}'>
                    <style>
                        body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #fff5f5; }}
                        .error-container {{ background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }}
                        .error-icon {{ font-size: 60px; color: #dc3545; margin-bottom: 20px; }}
                        .error-title {{ color: #dc3545; font-size: 24px; margin-bottom: 10px; }}
                        .error-message {{ color: #666; font-size: 16px; margin-bottom: 20px; }}
                        .redirect-message {{ color: #007bff; font-size: 14px; }}
                        .payment-details {{ text-align: left; background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                        .detail-row {{ margin: 10px 0; }}
                        .detail-label {{ font-weight: bold; color: #333; }}
                        .detail-value {{ color: #666; margin-left: 10px; }}
                        .error-code {{ background: #dc3545; color: white; padding: 5px 10px; border-radius: 3px; font-family: monospace; }}
                    </style>
                </head>
                <body>
                    <div class='error-container'>
                        <div class='error-icon'>❌</div>
                        <h1 class='error-title'>Thanh toán thất bại</h1>
                        <p class='error-message'>Rất tiếc, thanh toán của bạn không thành công. Bạn sẽ được chuyển hướng về trang chủ trong giây lát...</p>

                        <div class='payment-details'>
                            <h3>Chi tiết lỗi:</h3>
                            <div class='detail-row'>
                                <span class='detail-label'>Mã giao dịch:</span>
                                <span class='detail-value'>{transactionRef}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Mã lỗi:</span>
                                <span class='error-code'>{error}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Thông báo lỗi:</span>
                                <span class='detail-value'>{viewModel.ErrorMessage}</span>
                            </div>
                            {(thanhToan != null ? $@"
                            <div class='detail-row'>
                                <span class='detail-label'>Học viên:</span>
                                <span class='detail-value'>{viewModel.StudentName}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Khóa học:</span>
                                <span class='detail-value'>{viewModel.CourseName}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Lớp học:</span>
                                <span class='detail-value'>{viewModel.ClassName}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Thời gian:</span>
                                <span class='detail-value'>{viewModel.PaymentDate:dd/MM/yyyy HH:mm:ss}</span>
                            </div>
                            <div class='detail-row'>
                                <span class='detail-label'>Trạng thái:</span>
                                <span class='detail-value'>{viewModel.PaymentStatus}</span>
                            </div>
                            " : "")}
                        </div>

                        <p class='redirect-message'>Chuyển hướng tự động sau 5 giây...</p>
                        <p><a href='{redirectUrl}' style='color: #007bff; text-decoration: none;'>Nhấn vào đây nếu không tự động chuyển hướng</a></p>
                        <p><a href='http://localhost:3000' style='color: #28a745; text-decoration: none;'>Quay về trang chủ</a></p>
                    </div>
                </body>
                </html>", "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment error page for transaction {TransactionRef}", transactionRef);
                return Content($@"
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lỗi thanh toán</title>
                    <meta charset='utf-8'>
                    <style>
                        body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }}
                        .error-container {{ background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }}
                        .error-icon {{ font-size: 60px; color: #dc3545; margin-bottom: 20px; }}
                        .error-title {{ color: #dc3545; font-size: 24px; margin-bottom: 10px; }}
                        .error-message {{ color: #666; font-size: 16px; }}
                    </style>
                </head>
                <body>
                    <div class='error-container'>
                        <div class='error-icon'>❌</div>
                        <h1 class='error-title'>Có lỗi xảy ra</h1>
                        <p class='error-message'>Không thể xử lý thông tin thanh toán. Vui lòng liên hệ bộ phận hỗ trợ.</p>
                        <p><a href='http://localhost:3000'>Quay về trang chủ</a></p>
                    </div>
                </body>
                </html>", "text/html");
            }
        }

        // Helper method to get VNPay error message
        private string GetVNPayErrorMessage(string responseCode)
        {
            return responseCode switch
            {
                "00" => "Giao dịch thành công",
                "07" => "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
                "09" => "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng",
                "10" => "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
                "11" => "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch",
                "12" => "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa",
                "13" => "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch",
                "24" => "Giao dịch không thành công do: Khách hàng hủy giao dịch",
                "51" => "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch",
                "65" => "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày",
                "75" => "Ngân hàng thanh toán đang bảo trì",
                "79" => "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
                "99" => "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
                _ => $"Lỗi không xác định: {responseCode}"
            };
        }
    }

    // View Models
    public class PaymentSuccessViewModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string TransactionRef { get; set; } = string.Empty;
        public string Amount { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string BankCode { get; set; } = string.Empty;
        public string? PaymentStatus { get; set; }
        public int? PaymentId { get; set; }
        public string? StudentName { get; set; }
        public string? CourseName { get; set; }
        public string? ClassName { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Provider { get; set; }
    }

    public class PaymentErrorViewModel
    {
        public string TransactionRef { get; set; } = string.Empty;
        public string ErrorCode { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public int? PaymentId { get; set; }
        public string? StudentName { get; set; }
        public string? CourseName { get; set; }
        public string? ClassName { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Provider { get; set; }
        public string? PaymentStatus { get; set; }
    }
}
