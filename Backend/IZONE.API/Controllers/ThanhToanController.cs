using Microsoft.AspNetCore.Mvc;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using IZONE.Infrastructure.Data;
using System.Drawing;
using System.Drawing.Imaging;
using QRCoder;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Configuration;
using System.ComponentModel.DataAnnotations;
using System.Web;

namespace IZONE.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThanhToanController : ControllerBase
    {
        private readonly IThanhToanRepository _thanhToanRepository;
        private readonly IZONEDbContext _context;
        private readonly ILogger<ThanhToanController> _logger;
        private readonly IConfiguration _configuration;

        public ThanhToanController(IThanhToanRepository thanhToanRepository, IZONEDbContext context, ILogger<ThanhToanController> logger, IConfiguration configuration)
        {
            _thanhToanRepository = thanhToanRepository;
            _context = context;
            _logger = logger;
            _configuration = configuration;

            // Initialize Payment configuration with fallback values
            _bankId = _configuration["Payment:BankInfo:BankId"] ?? "970415";
            _bankName = _configuration["Payment:BankInfo:BankName"] ?? "VietinBank (Ngân hàng Công thương Việt Nam)";
            _accountNumber = _configuration["Payment:BankInfo:AccountNumber"] ?? "107876493622";
            _accountName = _configuration["Payment:BankInfo:AccountName"] ?? "IZONE EDUCATION";
            _branch = _configuration["Payment:BankInfo:Branch"] ?? "Chi nhánh Hà Nội";
            _vietQRTemplate = _configuration["Payment:VietQR:Template"] ?? "compact2";
            _vietQRBaseUrl = _configuration["Payment:VietQR:BaseUrl"] ?? "https://img.vietqr.io/image";
            _isProduction = _configuration.GetValue<bool>("IsProduction", false);

            // Log configuration for debugging
            _logger.LogInformation("Payment configuration loaded: BankId={BankId}, BankName={BankName}, AccountNumber={AccountNumber}, AccountName={AccountName}",
                _bankId, _bankName, _accountNumber, _accountName);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetAll()
        {
            var thanhToans = await _thanhToanRepository.GetAllAsync();
            return Ok(thanhToans);
        }

        // NEW: Test configuration loading
        [HttpGet("config-test")]
        public ActionResult<object> TestConfiguration()
        {
            try {
                _logger.LogInformation("Testing configuration loading...");

                var paymentConfig = _configuration.GetSection("Payment");

                var config = new {
                    payment = new {
                        bankInfo = new {
                            bankId = paymentConfig.GetSection("BankInfo")["BankId"],
                            bankName = paymentConfig.GetSection("BankInfo")["BankName"],
                            accountNumber = paymentConfig.GetSection("BankInfo")["AccountNumber"],
                            accountName = paymentConfig.GetSection("BankInfo")["AccountName"],
                            branch = paymentConfig.GetSection("BankInfo")["Branch"]
                        },
                        vietQR = new {
                            template = paymentConfig.GetSection("VietQR")["Template"],
                            baseUrl = paymentConfig.GetSection("VietQR")["BaseUrl"]
                        }
                    },
                    environment = new {
                        bankId = _bankId,
                        bankName = _bankName,
                        accountNumber = _accountNumber,
                        accountName = _accountName,
                        vietQRTemplate = _vietQRTemplate
                    }
                };

                _logger.LogInformation("Configuration test completed successfully");
                _logger.LogInformation("Environment variables: BankId={BankId}, BankName={BankName}, AccountNumber={AccountNumber}, AccountName={AccountName}",
                    _bankId, _bankName, _accountNumber, _accountName);

                return Ok(new {
                    success = true,
                    message = "Configuration loaded successfully",
                    config = config
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error testing configuration");
                return StatusCode(500, new { message = "Configuration test failed", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ThanhToan>> GetById(int id)
        {
            var thanhToan = await _thanhToanRepository.GetByIdAsync(id);
            if (thanhToan == null)
            {
                return NotFound();
            }
            return Ok(thanhToan);
        }

        [HttpGet("hoc-vien/{hocVienId}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByHocVienId(int hocVienId)
        {
            var thanhToans = await _thanhToanRepository.GetByHocVienIdAsync(hocVienId);
            return Ok(thanhToans);
        }

        [HttpGet("dang-ky/{dangKyId}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByDangKyId(int dangKyId)
        {
            var thanhToans = await _thanhToanRepository.GetByDangKyIdAsync(dangKyId);
            return Ok(thanhToans);
        }

        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByStatus(string status)
        {
            var thanhToans = await _thanhToanRepository.GetByStatusAsync(status);
            return Ok(thanhToans);
        }

        [HttpGet("phuong-thuc/{phuongThuc}")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByPhuongThuc(string phuongThuc)
        {
            var thanhToans = await _thanhToanRepository.GetByPhuongThucAsync(phuongThuc);
            return Ok(thanhToans);
        }

        [HttpGet("date-range")]
        public async Task<ActionResult<IEnumerable<ThanhToan>>> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var thanhToans = await _thanhToanRepository.GetByDateRangeAsync(startDate, endDate);
            return Ok(thanhToans);
        }

        [HttpGet("total/hoc-vien/{hocVienId}")]
        public async Task<ActionResult<decimal>> GetTotalByHocVienId(int hocVienId)
        {
            var total = await _thanhToanRepository.GetTotalByHocVienIdAsync(hocVienId);
            return Ok(total);
        }

        [HttpGet("total/dang-ky/{dangKyId}")]
        public async Task<ActionResult<decimal>> GetTotalByDangKyId(int dangKyId)
        {
            var total = await _thanhToanRepository.GetTotalByDangKyIdAsync(dangKyId);
            return Ok(total);
        }

        [HttpGet("transaction/{transactionRef}")]
        public async Task<ActionResult<ThanhToan>> GetByTransactionRef(string transactionRef)
        {
            var thanhToan = await _context.ThanhToans
                .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef);
            if (thanhToan == null)
            {
                return NotFound();
            }
            return Ok(thanhToan);
        }

        [HttpPost]
        public async Task<ActionResult<ThanhToan>> Create([FromBody] ThanhToan thanhToan)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            thanhToan.NgayThanhToan = DateTime.Now;
            var createdThanhToan = await _thanhToanRepository.AddAsync(thanhToan);
            return CreatedAtAction(nameof(GetById), new { id = createdThanhToan.ThanhToanID }, createdThanhToan);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ThanhToan thanhToan)
        {
            if (id != thanhToan.ThanhToanID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingThanhToan = await _thanhToanRepository.GetByIdAsync(id);
            if (existingThanhToan == null)
            {
                return NotFound();
            }

            await _thanhToanRepository.UpdateAsync(thanhToan);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var thanhToan = await _thanhToanRepository.GetByIdAsync(id);
            if (thanhToan == null)
            {
                return NotFound();
            }

            await _thanhToanRepository.DeleteAsync(thanhToan);
            return NoContent();
        }

        // Create payment order with VietQR Quick Link (Real VietQR format) - RESTORED: Create both registration and payment
        [HttpPost("create-payment")]
        public async Task<ActionResult<object>> CreatePayment([FromBody] CreatePaymentRequest request)
        {
            try {
                _logger.LogInformation("Creating payment for student {StudentId}, class {ClassId}, amount {Amount}",
                    (object)request.HocVienID, (object)request.LopID, (object)request.SoTien);

                // 1. Validate lop học và học viên
                var lopHoc = await _context.LopHocs.Include(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(l => l.LopID == request.LopID);
                if (lopHoc == null) {
                    return NotFound("Lớp học không tồn tại");
                }

                var hocVien = await _context.HocViens.FindAsync(request.HocVienID);
                if (hocVien == null) {
                    return NotFound("Học viên không tồn tại");
                }

                // 2. Kiểm tra trạng thái thanh toán hiện tại
                var existingRegistration = await _context.DangKyLops
                    .FirstOrDefaultAsync(d => d.HocVienID == request.HocVienID && d.LopID == request.LopID);

                DangKyLop dangKyLop;
                if (existingRegistration != null) {
                    // Đã có bản ghi đăng ký
                    if (existingRegistration.TrangThaiThanhToan == "DaThanhToan") {
                        return BadRequest("Học viên đã thanh toán lớp học này");
                    }
                    // Sử dụng lại bản ghi đăng ký hiện có
                    dangKyLop = existingRegistration;
                    _logger.LogInformation("Sử dụng lại bản ghi đăng ký hiện có với ID {DangKyID}", dangKyLop.DangKyID);
                } else {
                    // Chưa có bản ghi đăng ký, tạo mới
                    dangKyLop = new DangKyLop {
                        HocVienID = request.HocVienID,
                        LopID = request.LopID,
                        NgayDangKy = DateTime.Now,
                        TrangThaiDangKy = "DangHoc",
                        TrangThaiThanhToan = "ChuaThanhToan"
                    };

                    _context.DangKyLops.Add(dangKyLop);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Tạo mới bản ghi đăng ký với ID {DangKyID}", dangKyLop.DangKyID);
                }

                // 3. Tạo transaction reference
                var transactionRef = $"TXN-{DateTime.Now:yyyyMMddHHmmss}-{request.HocVienID}";

                // 4. Tạo VietQR Quick Link URL (theo chuẩn VietQR.io)
                var vietQRUrl = GenerateVietQRQuickLink(
                    bankId: _bankId,
                    accountNumber: _accountNumber,
                    amount: request.SoTien,
                    description: $"IZONE-{transactionRef}",
                    accountName: _accountName,
                    template: _vietQRTemplate
                );

                // 5. Tạo bản ghi ThanhToan với trạng thái Pending
                var ghiChu = $"Thanh toán khóa học {lopHoc.KhoaHoc?.TenKhoaHoc} - VietQR";
                var thanhToan = new ThanhToan {
                    HocVienID = request.HocVienID,
                    DangKyID = dangKyLop.DangKyID,
                    SoTien = request.SoTien,
                    PhuongThuc = "Bank",
                    Provider = "VietQR",
                    TransactionRef = transactionRef,
                    Status = "Pending",
                    GhiChu = ghiChu,
                    NgayThanhToan = DateTime.Now
                };

                _context.ThanhToans.Add(thanhToan);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment created successfully with ID {PaymentId} for registration {RegistrationId}", thanhToan.ThanhToanID, dangKyLop.DangKyID);
                _logger.LogInformation("VietQR Quick Link: {Url}", vietQRUrl);

                return Ok(new {
                    success = true,
                    message = "Đã tạo thanh toán thành công",
                    transactionRef = transactionRef,
                    soTien = request.SoTien,
                    vietQRUrl = vietQRUrl,
                    bankInfo = new {
                        bankId = _bankId,
                        bankName = $"🏦 {_bankName}",
                        accountNumber = _accountNumber,
                        accountName = _accountName,
                        branch = _branch
                    },
                    isTest = !_isProduction,
                    note = "💡 QR code được tạo từ VietQR.io - có thể quét được bằng tất cả app ngân hàng/MoMo",
                    callbackUrl = $"{Request.Scheme}://{Request.Host}/api/ThanhToan/callback/{transactionRef}",
                    formatNote = "📱 VietQR Quick Link: https://img.vietqr.io/image/BANK-ACCOUNT-TEMPLATE.png?amount=X&addInfo=Y&accountName=Z",
                    directLink = vietQRUrl,
                    registrationId = dangKyLop.DangKyID,
                    paymentId = thanhToan.ThanhToanID,
                    timeoutMinutes = 5,
                    flowNote = "✅ RESTORED: Tạo cả DangKyLop và ThanhToan record để VietQR có thể confirm manual"
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error creating payment");
                return StatusCode(500, new { message = "Không thể tạo thanh toán", error = ex.Message });
            }
        }

        // NEW: Confirm payment success - NEW FLOW: Create actual payment record when payment succeeds
        [HttpPost("confirm-payment-success")]
        public async Task<ActionResult<object>> ConfirmPaymentSuccess([FromBody] ConfirmPaymentSuccessRequest request)
        {
            try {
                _logger.LogInformation("Confirming payment success for transaction {TransactionRef}", request.TransactionRef);

                // 1. Validate lop học và học viên
                var lopHoc = await _context.LopHocs.Include(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(l => l.LopID == request.LopID);
                if (lopHoc == null) {
                    return NotFound("Lớp học không tồn tại");
                }

                var hocVien = await _context.HocViens.FindAsync(request.HocVienID);
                if (hocVien == null) {
                    return NotFound("Học viên không tồn tại");
                }

                // 2. Tìm hoặc tạo mới bản ghi đăng ký
                var dangKyLop = await _context.DangKyLops
                    .FirstOrDefaultAsync(d => d.HocVienID == request.HocVienID && d.LopID == request.LopID);

                if (dangKyLop == null) {
                    // Tạo mới bản ghi đăng ký nếu chưa có
                    dangKyLop = new DangKyLop {
                        HocVienID = request.HocVienID,
                        LopID = request.LopID,
                        NgayDangKy = DateTime.Now,
                        TrangThaiDangKy = "DangHoc",
                        TrangThaiThanhToan = "ChuaThanhToan"
                    };
                    _context.DangKyLops.Add(dangKyLop);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Tạo mới bản ghi đăng ký với ID {DangKyID}", dangKyLop.DangKyID);
                } else {
                    // Kiểm tra nếu đã thanh toán rồi
                    if (dangKyLop.TrangThaiThanhToan == "DaThanhToan") {
                        return BadRequest("Học viên đã thanh toán lớp học này");
                    }
                    _logger.LogInformation("Sử dụng lại bản ghi đăng ký hiện có với ID {DangKyID}", dangKyLop.DangKyID);
                }

                // 3. Tạo bản ghi ThanhToan chính thức
                var ghiChu = $"Thanh toán khóa học {lopHoc.KhoaHoc?.TenKhoaHoc} - {request.PhuongThuc} - {request.Provider}";
                var thanhToan = new ThanhToan {
                    HocVienID = request.HocVienID,
                    DangKyID = dangKyLop.DangKyID,
                    SoTien = request.SoTien,
                    PhuongThuc = request.PhuongThuc,
                    Provider = request.Provider,
                    TransactionRef = request.TransactionRef,
                    Status = "Success",
                    GhiChu = ghiChu,
                    NgayThanhToan = DateTime.Now
                };

                _context.ThanhToans.Add(thanhToan);

                // 4. Cập nhật trạng thái đăng ký
                dangKyLop.TrangThaiDangKy = "DangHoc";
                dangKyLop.TrangThaiThanhToan = "DaThanhToan";

                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment confirmed successfully. Created payment {PaymentId} and updated registration {RegistrationId}",
                    thanhToan.ThanhToanID, dangKyLop.DangKyID);

                return Ok(new {
                    success = true,
                    message = "Thanh toán thành công! Đã đăng ký khóa học.",
                    dangKyID = dangKyLop.DangKyID,
                    thanhToanID = thanhToan.ThanhToanID,
                    lopHoc = new {
                        lopID = lopHoc.LopID,
                        tenKhoaHoc = lopHoc.KhoaHoc?.TenKhoaHoc ?? "N/A"
                    },
                    flowNote = "✅ NEW FLOW: Payment record created successfully after payment confirmation"
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error confirming payment success");
                return StatusCode(500, new { message = "Không thể xác nhận thanh toán", error = ex.Message });
            }
        }

        // OLD: Confirm payment (fake success) - DEPRECATED: Use confirm-payment-success instead
        [HttpPost("confirm-payment/{transactionRef}")]
        public async Task<ActionResult<object>> ConfirmPayment(string transactionRef, [FromBody] ConfirmPaymentRequest request)
        {
            try {
                _logger.LogInformation("Confirming payment for transaction {TransactionRef}", transactionRef);

                // 1. Tìm thanh toán theo transactionRef
                var thanhToan = await _context.ThanhToans
                    .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef && t.Status == "Pending");

                if (thanhToan == null) {
                    return NotFound("Thanh toán không tồn tại hoặc đã được xử lý");
                }

                // 2. Validate lop học
                var lopHoc = await _context.LopHocs.FindAsync(request.LopID);
                if (lopHoc == null) {
                    return NotFound("Lớp học không tồn tại");
                }

                // 3. Fake success - Update thanh toán
                thanhToan.Status = "Success";
                thanhToan.NgayThanhToan = DateTime.Now;
                thanhToan.GhiChu += " - Đã xác nhận thanh toán test";

                // 4. Cập nhật trạng thái đăng ký hiện có
                var dangKyLop = await _context.DangKyLops.FindAsync(thanhToan.DangKyID);
                if (dangKyLop != null) {
                    dangKyLop.TrangThaiDangKy = "DangHoc";
                    dangKyLop.TrangThaiThanhToan = "DaThanhToan";
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment confirmed successfully. Created registration {RegistrationId}", dangKyLop.DangKyID);

                return Ok(new {
                    success = true,
                    message = "Thanh toán thành công! Đã đăng ký khóa học.",
                    dangKyID = dangKyLop.DangKyID,
                    thanhToanID = thanhToan.ThanhToanID,
                    lopHoc = new {
                        lopID = lopHoc.LopID,
                        tenKhoaHoc = lopHoc.KhoaHoc?.TenKhoaHoc ?? "N/A"
                    }
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error confirming payment");
                return StatusCode(500, new { message = "Không thể xác nhận thanh toán", error = ex.Message });
            }
        }

        // Cleanup expired payment sessions (for scheduled job) - RESTORED: cleanup both registrations and payments
        [HttpPost("cleanup-expired")]
        public async Task<ActionResult<object>> CleanupExpiredPayments()
        {
            try {
                _logger.LogInformation("Starting cleanup of expired payment sessions");

                // Tìm các payment pending quá 15 phút
                var expiredTime = DateTime.Now.AddMinutes(-15);
                var expiredPayments = await _context.ThanhToans
                    .Where(t => t.Status == "Pending" && t.NgayThanhToan < expiredTime)
                    .ToListAsync();

                if (!expiredPayments.Any()) {
                    return Ok(new {
                        success = true,
                        message = "Không có payment nào cần cleanup",
                        cleanedCount = 0
                    });
                }

                var cleanedCount = 0;
                foreach (var payment in expiredPayments) {
                    try {
                        // Xóa payment
                        _context.ThanhToans.Remove(payment);

                        // Xóa registration tương ứng
                        var registration = await _context.DangKyLops.FindAsync(payment.DangKyID);
                        if (registration != null) {
                            _context.DangKyLops.Remove(registration);
                        }

                        cleanedCount++;
                        _logger.LogInformation("Cleaned up expired payment {PaymentId} and registration {RegistrationId}",
                            payment.ThanhToanID, payment.DangKyID);
                    } catch (Exception ex) {
                        _logger.LogError(ex, "Error cleaning up payment {PaymentId}", payment.ThanhToanID);
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Cleanup completed. Removed {Count} expired payments and registrations", cleanedCount);

                return Ok(new {
                    success = true,
                    message = $"Đã cleanup {cleanedCount} payment và registration hết hạn",
                    cleanedCount = cleanedCount,
                    flowNote = "✅ RESTORED: Cleaned up both payment records and registrations"
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error during payment cleanup");
                return StatusCode(500, new { message = "Không thể cleanup payment", error = ex.Message });
            }
        }

        // Cancel payment - RESTORED: cleanup both registration and payment
        [HttpPost("cancel-payment/{transactionRef}")]
        public async Task<ActionResult<object>> CancelPayment(string transactionRef)
        {
            try {
                _logger.LogInformation("Canceling payment for transaction {TransactionRef}", transactionRef);

                // Tìm thanh toán theo transactionRef
                var thanhToan = await _context.ThanhToans
                    .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef && t.Status == "Pending");

                if (thanhToan == null) {
                    return NotFound("Thanh toán không tồn tại hoặc đã được xử lý");
                }

                // Xóa bản ghi ThanhToan
                _context.ThanhToans.Remove(thanhToan);

                // Xóa hoặc cập nhật bản ghi DangKyLop
                var dangKyLop = await _context.DangKyLops.FindAsync(thanhToan.DangKyID);
                if (dangKyLop != null) {
                    // Option 1: Xóa hoàn toàn bản ghi đăng ký
                    _context.DangKyLops.Remove(dangKyLop);

                    // Option 2: Hoặc cập nhật trạng thái (uncomment nếu muốn giữ bản ghi)
                    // dangKyLop.TrangThaiDangKy = "DaHuy";
                    // dangKyLop.TrangThaiThanhToan = "ChuaThanhToan";
                    // dangKyLop.NgayHuy = DateTime.Now;
                    // dangKyLop.LyDoHuy = "Hủy thanh toán";
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment canceled successfully for transaction {TransactionRef}", transactionRef);

                return Ok(new {
                    success = true,
                    message = "Đã hủy thanh toán thành công. Bản ghi đăng ký đã được xóa.",
                    transactionRef = transactionRef,
                    flowNote = "✅ RESTORED: Both payment and registration records cleaned up"
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error canceling payment");
                return StatusCode(500, new { message = "Không thể hủy thanh toán", error = ex.Message });
            }
        }

        // NEW: Callback endpoint để nhận thông báo từ ngân hàng
        [HttpPost("callback/{transactionRef}")]
        public async Task<ActionResult<object>> PaymentCallback(string transactionRef, [FromBody] PaymentCallbackRequest request)
        {
            try {
                _logger.LogInformation("Received payment callback for transaction {TransactionRef}", transactionRef);

                // 1. Validate callback request
                if (!ValidateCallbackRequest(request)) {
                    _logger.LogWarning("Invalid callback request for transaction {TransactionRef}", transactionRef);
                    return BadRequest("Invalid callback request");
                }

                // 2. Tìm thanh toán theo transactionRef
                var thanhToan = await _context.ThanhToans
                    .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef && t.Status == "Pending");

                if (thanhToan == null) {
                    _logger.LogWarning("Payment not found or already processed for transaction {TransactionRef}", transactionRef);
                    return NotFound("Thanh toán không tồn tại hoặc đã được xử lý");
                }

                // 3. Cập nhật trạng thái thanh toán
                thanhToan.Status = request.Status == "success" ? "Success" : "Failed";
                thanhToan.NgayThanhToan = DateTime.Now;
                thanhToan.GhiChu += $" - Callback từ {request.BankCode}: {request.Status}";

                if (request.Status == "success") {
                    // 4. Cập nhật trạng thái đăng ký hiện có thay vì tạo mới
                    var dangKyLop = await _context.DangKyLops.FindAsync(thanhToan.DangKyID);
                    if (dangKyLop != null) {
                        dangKyLop.TrangThaiDangKy = "DangHoc";
                        dangKyLop.TrangThaiThanhToan = "DaThanhToan";
                        _logger.LogInformation("Payment callback successful. Updated registration {RegistrationId}", dangKyLop.DangKyID);
                    } else {
                        _logger.LogWarning("Registration not found for payment {PaymentId}", thanhToan.ThanhToanID);
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment callback processed successfully for transaction {TransactionRef}", transactionRef);

                return Ok(new {
                    success = true,
                    message = request.Status == "success" ? "Thanh toán thành công!" : "Thanh toán thất bại",
                    transactionRef = transactionRef,
                    status = thanhToan.Status
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error processing payment callback");
                return StatusCode(500, new { message = "Không thể xử lý callback", error = ex.Message });
            }
        }

        // Helper: Generate VietQR Quick Link URL (theo chuẩn VietQR.io)
        private string GenerateVietQRQuickLink(string bankId, string accountNumber, decimal amount, string description, string accountName, string template = "compact2") {
            try {
                // VietQR Quick Link Format: https://img.vietqr.io/image/BANK-ACCOUNT-TEMPLATE.png?amount=AMOUNT&addInfo=DESCRIPTION&accountName=ACCOUNT_NAME
                // Template options: compact2, compact, qr_only, print

                var amountFormatted = amount.ToString("N0").Replace(",", "").Replace(".", "");
                var encodedDescription = Uri.EscapeDataString(description);
                var encodedAccountName = Uri.EscapeDataString(accountName);

                var vietQRUrl = $"https://img.vietqr.io/image/{bankId}-{accountNumber}-{template}.png?amount={amountFormatted}&addInfo={encodedDescription}&accountName={encodedAccountName}";

                _logger.LogInformation("Generated VietQR Quick Link: {Url}", vietQRUrl);
                _logger.LogInformation("Template: {Template}, Bank: {BankId}, Amount: {Amount}", (object)template, (object)bankId, (object)amountFormatted);
                _logger.LogInformation("Compatible with all Vietnamese banking apps and e-wallets");

                return vietQRUrl;
            } catch (Exception ex) {
                _logger.LogError(ex, "Error generating VietQR Quick Link");
                // Fallback to simple format
                return $"https://img.vietqr.io/image/{bankId}-{accountNumber}-{template}.png";
            }
        }



        // Helper: Generate VietQR content (có thể quét được bằng app ngân hàng/MoMo)
        private string GenerateVietQRContent(string bankId, string accountNumber, decimal amount, string content, string accountName) {
            try {
                // VietQR Standard Format theo VietQR.vn API specification
                // Format: <bankId>|<accountNumber>|<amount>|<content>|<accountName>
                // Hoặc sử dụng format rút gọn: <bankId><accountNumber><amount><content>
                // Các app ngân hàng sẽ parse format này để tự động điền thông tin

                var amountFormatted = amount.ToString("N0").Replace(",", "").Replace(".", "");

                // Option 1: Format đầy đủ (khuyến nghị)
                var vietQRContent = $"{bankId}|{accountNumber}|{amountFormatted}|{content}|{accountName}";

                // Option 2: Format rút gọn (compact format)
                // var vietQRContent = $"{bankId}{accountNumber}{amountFormatted}{content}";

                _logger.LogInformation("Generated VietQR content: {Content}", vietQRContent);
                _logger.LogInformation("Format: bankId|accountNumber|amount|content|accountName");
                _logger.LogInformation("Compatible with: VietQR.vn, MoMo, ViettelPay, Banking Apps");

                return vietQRContent;
            } catch (Exception ex) {
                _logger.LogError(ex, "Error generating VietQR content");
                // Fallback to simple format
                return $"IZONE-{content}-{amount}";
            }
        }

        // Helper: Generate QR code image
        private string GenerateQRCodeImage(string content) {
            try {
                _logger.LogInformation("Generating QR code for content: {Content}", content);

                using (var qrGenerator = new QRCodeGenerator()) {
                    // Use lower error correction level for better compatibility
                    var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
                    var qrCode = new QRCode(qrCodeData);

                    // Use smaller pixel size for better compatibility
                    using (var bitmap = qrCode.GetGraphic(10)) {
                        using (var ms = new MemoryStream()) {
                            bitmap.Save(ms, ImageFormat.Png);
                            var base64 = Convert.ToBase64String(ms.ToArray());
                            _logger.LogInformation("QR code generated successfully, size: {Size} bytes", base64.Length);
                            return base64;
                        }
                    }
                }
            } catch (Exception ex) {
                _logger.LogError(ex, "Error generating QR code for content: {Content}", content);
                // Return a simple fake QR if generation fails
                return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
            }
        }

        // Helper: Validate callback request
        private bool ValidateCallbackRequest(PaymentCallbackRequest request) {
            // Basic validation - trong thực tế cần signature validation
            return request != null &&
                   !string.IsNullOrEmpty(request.TransactionRef) &&
                   !string.IsNullOrEmpty(request.Status) &&
                   request.Amount > 0;
        }

        // Helper: Simple checksum calculation (simplified version)
        private string CalculateSimpleChecksum(string data) {
            int sum = 0;
            foreach (char c in data) {
                sum += (int)c;
            }
            return sum.ToString("X4"); // Return as hex
        }

        // Helper: Convert IP address to IPv4 format for VNPay
        private string GetIPv4Address(string ipAddress) {
            try {
                // Nếu là IPv6 localhost (::1), chuyển thành IPv4 (127.0.0.1)
                if (ipAddress == "::1") {
                    return "127.0.0.1";
                }

                // Nếu là IPv4, trả về nguyên
                if (ipAddress.Contains(".") && !ipAddress.Contains(":")) {
                    return ipAddress;
                }

                // Nếu là IPv6, lấy phần IPv4 cuối cùng
                if (ipAddress.Contains(":")) {
                    var parts = ipAddress.Split(':');
                    foreach (var part in parts) {
                        if (part.Contains(".")) {
                            return part;
                        }
                    }
                }

                // Fallback
                return "127.0.0.1";
            } catch {
                return "127.0.0.1";
            }
        }

        // ===== CONFIGURATION =====

        // Payment Configuration
        private readonly string _bankId;
        private readonly string _bankName;
        private readonly string _accountNumber;
        private readonly string _accountName;
        private readonly string _branch;
        private readonly string _vietQRTemplate;
        private readonly string _vietQRBaseUrl;
        private readonly bool _isProduction;









        // ===== VNPAY INTEGRATION =====

        // Create VNPay payment order - RESTORED: Create both registration and payment
        [HttpPost("create-vnpay-payment")]
        public async Task<ActionResult<object>> CreateVNPayPayment([FromBody] CreatePaymentRequest request)
        {
            try {
                _logger.LogInformation("Creating VNPay payment for student {StudentId}, class {ClassId}, amount {Amount}",
                    (object)request.HocVienID, (object)request.LopID, (object)request.SoTien);

                // 1. Validate lop học và học viên
                var lopHoc = await _context.LopHocs.Include(l => l.KhoaHoc)
                    .FirstOrDefaultAsync(l => l.LopID == request.LopID);
                if (lopHoc == null) {
                    return NotFound("Lớp học không tồn tại");
                }

                var hocVien = await _context.HocViens.FindAsync(request.HocVienID);
                if (hocVien == null) {
                    return NotFound("Học viên không tồn tại");
                }

                // 2. Kiểm tra trạng thái thanh toán hiện tại
                var existingRegistration = await _context.DangKyLops
                    .FirstOrDefaultAsync(d => d.HocVienID == request.HocVienID && d.LopID == request.LopID);

                DangKyLop dangKyLop;
                if (existingRegistration != null) {
                    // Đã có bản ghi đăng ký
                    if (existingRegistration.TrangThaiThanhToan == "DaThanhToan") {
                        return BadRequest("Học viên đã thanh toán lớp học này");
                    }
                    // Sử dụng lại bản ghi đăng ký hiện có
                    dangKyLop = existingRegistration;
                    _logger.LogInformation("Sử dụng lại bản ghi đăng ký hiện có với ID {DangKyID}", dangKyLop.DangKyID);
                } else {
                    // Chưa có bản ghi đăng ký, tạo mới
                    dangKyLop = new DangKyLop {
                        HocVienID = request.HocVienID,
                        LopID = request.LopID,
                        NgayDangKy = DateTime.Now,
                        TrangThaiDangKy = "DangHoc",
                        TrangThaiThanhToan = "ChuaThanhToan"
                    };

                    _context.DangKyLops.Add(dangKyLop);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Tạo mới bản ghi đăng ký với ID {DangKyID}", dangKyLop.DangKyID);
                }

                // 3. Tạo transaction reference
                var transactionRef = $"VNP-{DateTime.Now:yyyyMMddHHmmss}-{request.HocVienID}";

                // 4. Kiểm tra xem đã có bản ghi ThanhToan nào cho đăng ký này chưa
                var existingPayment = await _context.ThanhToans
                    .FirstOrDefaultAsync(t => t.DangKyID == dangKyLop.DangKyID && t.Status == "Pending");

                ThanhToan thanhToan;
                if (existingPayment != null) {
                    // Đã có bản ghi thanh toán pending, sử dụng lại
                    thanhToan = existingPayment;
                    _logger.LogInformation("Sử dụng lại bản ghi thanh toán hiện có với ID {ThanhToanID}", thanhToan.ThanhToanID);
                } else {
                    // Chưa có bản ghi thanh toán, tạo mới
                    var ghiChu = $"Thanh toán khóa học {lopHoc.KhoaHoc?.TenKhoaHoc} - VNPay Gateway";
                    thanhToan = new ThanhToan {
                        HocVienID = request.HocVienID,
                        DangKyID = dangKyLop.DangKyID,
                        SoTien = request.SoTien,
                        PhuongThuc = "Bank", // Sử dụng "Bank" thay vì "Online" để phù hợp với constraint
                        Provider = "VNPay",
                        TransactionRef = transactionRef,
                        Status = "Pending",
                        GhiChu = ghiChu,
                        NgayThanhToan = DateTime.Now
                    };

                    _context.ThanhToans.Add(thanhToan);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Tạo mới bản ghi thanh toán với ID {ThanhToanID}", thanhToan.ThanhToanID);
                }

                // 5. Tạo VNPay payment URL
                var vnpayUrl = GenerateVNPayPaymentUrl(
                    amount: request.SoTien,
                    orderInfo: $"IZONE-{transactionRef}",
                    orderType: "course_payment",
                    transactionRef: transactionRef,
                    thanhToanId: thanhToan.ThanhToanID
                );

                _logger.LogInformation("VNPay payment created successfully with ID {PaymentId}", thanhToan.ThanhToanID);
                _logger.LogInformation("VNPay payment URL: {Url}", vnpayUrl);

                return Ok(new {
                    thanhToanID = thanhToan.ThanhToanID,
                    transactionRef = transactionRef,
                    soTien = request.SoTien,
                    vnpayUrl = vnpayUrl,
                    bankInfo = new {
                        provider = "VNPay Gateway",
                        note = "💳 Thanh toán qua VNPay - Cổng thanh toán trực tuyến"
                    },
                    isTest = !_isProduction,
                    note = "🔗 Click vào URL để chuyển đến trang thanh toán VNPay",
                    callbackUrl = $"{Request.Scheme}://{Request.Host}/api/ThanhToan/vnpay-return",
                    formatNote = "🔗 VNPay Payment URL: {vnpayUrl}",
                    directLink = vnpayUrl,
                    registrationId = dangKyLop.DangKyID,
                    flowNote = "✅ RESTORED: Tạo cả DangKyLop và ThanhToan record để VNPay có thể callback"
                });
            } catch (Exception ex) {
                _logger.LogError(ex, "Error creating VNPay payment");
                return StatusCode(500, new { message = "Không thể tạo thanh toán VNPay", error = ex.Message });
            }
        }

        // NEW: VNPay Return URL (when user returns from payment gateway) - Theo chuẩn VNPay documentation
        [HttpGet("vnpay-return")]
        public async Task<ActionResult<object>> VNPayReturn()
        {
            try {
                _logger.LogInformation("VNPay return received with query parameters: {QueryString}", Request.QueryString);

                // Lấy tất cả tham số từ query string
                var vnpayData = Request.Query;
                var vnp_Params = new SortedDictionary<string, string>();

                foreach (var param in vnpayData) {
                    if (param.Key.StartsWith("vnp_") && !string.IsNullOrEmpty(param.Value)) {
                        vnp_Params.Add(param.Key, param.Value.ToString());
                    }
                }

                // Kiểm tra xem có đủ tham số không
                if (!vnp_Params.ContainsKey("vnp_SecureHash") || !vnp_Params.ContainsKey("vnp_TxnRef")) {
                    _logger.LogWarning("Missing required VNPay parameters");
                    return BadRequest("Thiếu tham số bắt buộc từ VNPay");
                }

                var receivedHash = vnp_Params["vnp_SecureHash"];
                vnp_Params.Remove("vnp_SecureHash");

                // Validate VNPay signature theo documentation
                if (!ValidateVNPaySignature(vnp_Params, receivedHash)) {
                    _logger.LogWarning("Invalid VNPay signature for transaction {TransactionRef}", vnp_Params.GetValueOrDefault("vnp_TxnRef"));
                    return BadRequest("Chữ ký không hợp lệ");
                }

                var transactionRef = vnp_Params["vnp_TxnRef"];
                var responseCode = vnp_Params.GetValueOrDefault("vnp_ResponseCode", "");
                var transactionNo = vnp_Params.GetValueOrDefault("vnp_TransactionNo", "");
                var amount = vnp_Params.GetValueOrDefault("vnp_Amount", "0");
                var bankCode = vnp_Params.GetValueOrDefault("vnp_BankCode", "");
                var payDate = vnp_Params.GetValueOrDefault("vnp_PayDate", "");

                _logger.LogInformation("VNPay return for transaction {TransactionRef}, ResponseCode: {ResponseCode}", transactionRef, responseCode);

                // Find payment by transaction reference
                var thanhToan = await _context.ThanhToans
                    .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef);

                if (thanhToan == null) {
                    _logger.LogWarning("Payment not found for VNPay transaction {TransactionRef}", transactionRef);
                    return NotFound("Thanh toán không tồn tại");
                }

                // Update payment status based on VNPay response
                if (responseCode == "00") {
                    // Payment successful - theo bảng mã lỗi VNPay
                    thanhToan.Status = "Success";
                    thanhToan.GhiChu += $" - VNPay Success: {transactionNo}, Bank: {bankCode}, PayDate: {payDate}";

                    // Update registration status
                    var dangKyLop = await _context.DangKyLops.FindAsync(thanhToan.DangKyID);
                    if (dangKyLop != null) {
                        dangKyLop.TrangThaiDangKy = "DangHoc";
                        dangKyLop.TrangThaiThanhToan = "DaThanhToan";
                        _logger.LogInformation("Payment completed successfully. Updated registration {RegistrationId}", dangKyLop.DangKyID);
                    }
                } else {
                    // Payment failed - log error code theo bảng mã lỗi VNPay
                    thanhToan.Status = "Failed";
                    var errorMessage = GetVNPayErrorMessage(responseCode);
                    thanhToan.GhiChu += $" - VNPay Failed: {responseCode} - {errorMessage}";
                    _logger.LogWarning("VNPay payment failed for transaction {TransactionRef}: {ErrorCode} - {ErrorMessage}", transactionRef, responseCode, errorMessage);

                    // Cleanup khi user hủy thanh toán hoặc lỗi không thể khắc phục
                    if (ShouldCleanupPayment(responseCode)) {
                        await CleanupFailedPayment(thanhToan, responseCode, errorMessage);
                        _logger.LogInformation("Cleaned up failed payment for transaction {TransactionRef}", transactionRef);
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("VNPay return processed successfully for transaction {TransactionRef}", transactionRef);

                // Redirect to PaymentController with result
                var redirectUrl = responseCode == "00"
                    ? $"/payment/success?transactionRef={transactionRef}&amount={amount}&transactionId={transactionNo}&bankCode={bankCode}"
                    : $"/payment/error?transactionRef={transactionRef}&error={responseCode}&errorMessage={Uri.EscapeDataString(GetVNPayErrorMessage(responseCode))}";

                return Redirect(redirectUrl);
            } catch (Exception ex) {
                _logger.LogError(ex, "Error processing VNPay return");
                return StatusCode(500, new { message = "Không thể xử lý kết quả thanh toán", error = ex.Message });
            }
        }

        // NEW: VNPay IPN (Instant Payment Notification) - Theo chuẩn VNPay documentation
        [HttpPost("vnpay-ipn")]
        public async Task<ActionResult<object>> VNPayIPN()
        {
            try {
                _logger.LogInformation("VNPay IPN received with query parameters: {QueryString}", Request.QueryString);

                // Lấy tất cả tham số từ query string (VNPay IPN gửi qua GET)
                var vnpayData = Request.Query;
                var vnp_Params = new SortedDictionary<string, string>();

                foreach (var param in vnpayData) {
                    if (param.Key.StartsWith("vnp_") && !string.IsNullOrEmpty(param.Value)) {
                        vnp_Params.Add(param.Key, param.Value.ToString());
                    }
                }

                // Kiểm tra xem có đủ tham số không
                if (!vnp_Params.ContainsKey("vnp_SecureHash") || !vnp_Params.ContainsKey("vnp_TxnRef")) {
                    _logger.LogWarning("Missing required VNPay IPN parameters");
                    return BadRequest("Thiếu tham số bắt buộc từ VNPay");
                }

                var receivedHash = vnp_Params["vnp_SecureHash"];
                vnp_Params.Remove("vnp_SecureHash");

                // Validate VNPay signature theo documentation
                if (!ValidateVNPaySignature(vnp_Params, receivedHash)) {
                    _logger.LogWarning("Invalid VNPay IPN signature for transaction {TransactionRef}", vnp_Params.GetValueOrDefault("vnp_TxnRef"));
                    return BadRequest("Chữ ký không hợp lệ");
                }

                var transactionRef = vnp_Params["vnp_TxnRef"];
                var responseCode = vnp_Params.GetValueOrDefault("vnp_ResponseCode", "");
                var transactionNo = vnp_Params.GetValueOrDefault("vnp_TransactionNo", "");
                var amount = vnp_Params.GetValueOrDefault("vnp_Amount", "0");
                var bankCode = vnp_Params.GetValueOrDefault("vnp_BankCode", "");
                var payDate = vnp_Params.GetValueOrDefault("vnp_PayDate", "");

                _logger.LogInformation("VNPay IPN for transaction {TransactionRef}, ResponseCode: {ResponseCode}", transactionRef, responseCode);

                // Find payment by transaction reference
                var thanhToan = await _context.ThanhToans
                    .FirstOrDefaultAsync(t => t.TransactionRef == transactionRef);

                if (thanhToan == null) {
                    _logger.LogWarning("Payment not found for VNPay IPN transaction {TransactionRef}", transactionRef);
                    return NotFound("Thanh toán không tồn tại");
                }

                // Update payment based on VNPay status
                if (responseCode == "00") {
                    // Payment successful - theo bảng mã lỗi VNPay
                    thanhToan.Status = "Success";
                    thanhToan.GhiChu += $" - VNPay IPN Success: {transactionNo}, Bank: {bankCode}, PayDate: {payDate}";

                    // Update registration status
                    var dangKyLop = await _context.DangKyLops.FindAsync(thanhToan.DangKyID);
                    if (dangKyLop != null) {
                        dangKyLop.TrangThaiDangKy = "DangHoc";
                        dangKyLop.TrangThaiThanhToan = "DaThanhToan";
                        _logger.LogInformation("VNPay IPN successful. Updated registration {RegistrationId}", dangKyLop.DangKyID);
                    }
                } else {
                    // Payment failed - log error code theo bảng mã lỗi VNPay
                    thanhToan.Status = "Failed";
                    var errorMessage = GetVNPayErrorMessage(responseCode);
                    thanhToan.GhiChu += $" - VNPay IPN Failed: {responseCode} - {errorMessage}";
                    _logger.LogWarning("VNPay IPN failed for transaction {TransactionRef}: {ErrorCode} - {ErrorMessage}", transactionRef, responseCode, errorMessage);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("VNPay IPN processed successfully for transaction {TransactionRef}", transactionRef);

                // Return success response to VNPay theo documentation
                return Ok("OK");
            } catch (Exception ex) {
                _logger.LogError(ex, "Error processing VNPay IPN");
                return StatusCode(500, new { message = "Không thể xử lý IPN", error = ex.Message });
            }
        }

        // Helper: Generate VNPay payment URL - Theo chuẩn VNPay documentation (đã sửa để match TypeScript)
        private string GenerateVNPayPaymentUrl(decimal amount, string orderInfo, string orderType, string transactionRef, int thanhToanId)
        {
            try {
                var vnpayConfig = _configuration.GetSection("VNPay");

                // Lấy thông tin cấu hình VNPay
                var vnp_TmnCode = vnpayConfig["TmnCode"] ?? "";
                var vnp_HashSecret = vnpayConfig["HashSecret"] ?? "";
                var vnp_PaymentUrl = vnpayConfig["PaymentUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
                var vnp_ReturnUrl = $"{Request.Scheme}://{Request.Host}/api/ThanhToan/vnpay-return";
                var vnp_IpnUrl = $"{Request.Scheme}://{Request.Host}/api/ThanhToan/vnpay-ipn";

                // Tạo các tham số bắt buộc theo VNPay documentation
                var vnp_Amount = (long)(amount * 100); // Số tiền nhân với 100 (khử phần thập phân)
                var vnp_CreateDate = DateTime.Now.ToString("yyyyMMddHHmmss");
                var vnp_ExpireDate = DateTime.Now.AddMinutes(15).ToString("yyyyMMddHHmmss");
                var vnp_IpAddr = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

                // Tạo danh sách tham số theo thứ tự chính xác của VNPay
                var vnp_Params = new SortedDictionary<string, string>
                {
                    { "vnp_Amount", vnp_Amount.ToString() },
                    { "vnp_Command", "pay" },
                    { "vnp_CreateDate", vnp_CreateDate },
                    { "vnp_CurrCode", "VND" },
                    { "vnp_ExpireDate", vnp_ExpireDate },
                    { "vnp_IpAddr", GetIPv4Address(vnp_IpAddr) },
                    { "vnp_Locale", "vn" },
                    { "vnp_OrderInfo", orderInfo },
                    { "vnp_OrderType", orderType },
                    { "vnp_ReturnUrl", vnp_ReturnUrl },
                    { "vnp_TmnCode", vnp_TmnCode },
                    { "vnp_TxnRef", transactionRef },
                    { "vnp_Version", "2.1.0" }
                };

                // 🔍 DEBUG: In ra tất cả tham số trước khi tạo hash
                _logger.LogInformation("=== VNPAY DEBUG: ALL PARAMETERS BEFORE HASH ===");
                foreach (var param in vnp_Params)
                {
                    _logger.LogInformation("Parameter: {Key} = {Value}", param.Key, param.Value);
                }

                // Tạo chuỗi hash data (CÓ encode URL cho hash) - theo cách của TypeScript
                var hashData = string.Join("&", vnp_Params.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));

                // 🔍 DEBUG: In ra hash data
                _logger.LogInformation("=== VNPAY DEBUG: HASH DATA ===");
                _logger.LogInformation("Hash Data: {HashData}", hashData);

                // Tạo secure hash bằng HMAC-SHA512
                var vnp_SecureHash = GenerateVNPaySecureHash(hashData, vnp_HashSecret);

                // 🔍 DEBUG: In ra secure hash được tạo
                _logger.LogInformation("=== VNPAY DEBUG: GENERATED HASH ===");
                _logger.LogInformation("Generated Secure Hash: {SecureHash}", vnp_SecureHash);

                vnp_Params.Add("vnp_SecureHash", vnp_SecureHash);

                // 🔍 DEBUG: In ra tất cả tham số sau khi thêm hash
                _logger.LogInformation("=== VNPAY DEBUG: ALL PARAMETERS AFTER HASH ===");
                foreach (var param in vnp_Params)
                {
                    _logger.LogInformation("Parameter: {Key} = {Value}", param.Key, param.Value);
                }

                // Build payment URL (có encode URL cho query string)
                var queryString = string.Join("&", vnp_Params.Select(kv => $"{kv.Key}={HttpUtility.UrlEncode(kv.Value)}"));
                var paymentUrl = $"{vnp_PaymentUrl}?{queryString}";

                // 🔍 DEBUG: In ra final URL
                _logger.LogInformation("=== VNPAY DEBUG: FINAL URL ===");
                _logger.LogInformation("Final Payment URL: {Url}", paymentUrl);

                // 🔍 DEBUG: In ra thông tin cấu hình
                _logger.LogInformation("=== VNPAY DEBUG: CONFIGURATION ===");
                _logger.LogInformation("VNPay Parameters: TmnCode={TmnCode}, HashSecret={HashSecret}, PaymentUrl={PaymentUrl}",
                    (object)vnp_TmnCode, (object)"[HIDDEN]", (object)vnp_PaymentUrl);
                _logger.LogInformation("VNPay Parameters: Amount={Amount}, TxnRef={TxnRef}, CreateDate={CreateDate}",
                    (object)vnp_Amount, (object)transactionRef, (object)vnp_CreateDate);

                return paymentUrl;
            } catch (Exception ex) {
                _logger.LogError(ex, "Error generating VNPay payment URL");
                throw;
            }
        }

        // Helper: Generate VNPay secure hash
        private string GenerateVNPaySecureHash(string data, string secretKey)
        {
            try {
                using (var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(secretKey))) {
                    var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
                    return BitConverter.ToString(hash).Replace("-", "").ToLower();
                }
            } catch (Exception ex) {
                _logger.LogError(ex, "Error generating VNPay secure hash");
                return string.Empty;
            }
        }

        // Helper: Validate VNPay signature (works for both Return and IPN requests) - Theo chuẩn VNPay documentation (đã sửa để match TypeScript)
        private bool ValidateVNPaySignature(SortedDictionary<string, string> vnp_Params, string receivedHash)
        {
            try {
                var vnpayConfig = _configuration.GetSection("VNPay");
                var secretKey = vnpayConfig["HashSecret"] ?? "";

                if (string.IsNullOrEmpty(secretKey)) {
                    _logger.LogError("VNPay secret key is not configured");
                    return false;
                }

                // 🔍 DEBUG: In ra tất cả tham số nhận được từ VNPay
                _logger.LogInformation("=== VNPAY DEBUG: RECEIVED PARAMETERS FOR VALIDATION ===");
                foreach (var param in vnp_Params)
                {
                    _logger.LogInformation("Received Parameter: {Key} = {Value}", param.Key, param.Value);
                }
                _logger.LogInformation("Received Hash: {ReceivedHash}", receivedHash);

                // Generate hash data theo cách của TypeScript (URL encoded)
                var hashData = string.Join("&", vnp_Params.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));

                // 🔍 DEBUG: In ra hash data được tạo để validate
                _logger.LogInformation("=== VNPAY DEBUG: VALIDATION HASH DATA ===");
                _logger.LogInformation("Validation Hash Data: {HashData}", hashData);

                // Generate expected hash
                var expectedHash = GenerateVNPaySecureHash(hashData, secretKey);

                // 🔍 DEBUG: In ra expected hash
                _logger.LogInformation("=== VNPAY DEBUG: VALIDATION EXPECTED HASH ===");
                _logger.LogInformation("Expected Hash: {ExpectedHash}", expectedHash);

                // Compare with received hash
                var isValid = receivedHash?.ToLower() == expectedHash.ToLower();

                // 🔍 DEBUG: In ra kết quả validation
                _logger.LogInformation("=== VNPAY DEBUG: VALIDATION RESULT ===");
                _logger.LogInformation("VNPay signature validation: Expected={Expected}, Received={Received}, Valid={Valid}",
                    expectedHash, receivedHash, isValid);

                if (!isValid) {
                    _logger.LogWarning("=== VNPAY SIGNATURE MISMATCH ===");
                    _logger.LogWarning("Hash mismatch detected!");
                    _logger.LogWarning("Expected: {Expected}", expectedHash);
                    _logger.LogWarning("Received: {Received}", receivedHash);
                    _logger.LogWarning("Hash Data: {HashData}", hashData);

                    // Kiểm tra từng ký tự để tìm sự khác biệt
                    if (expectedHash.Length == receivedHash.Length) {
                        for (int i = 0; i < expectedHash.Length; i++) {
                            if (expectedHash[i] != receivedHash[i]) {
                                _logger.LogWarning("First difference at position {Position}: Expected '{ExpectedChar}', Received '{ReceivedChar}'",
                                    i, expectedHash[i], receivedHash[i]);
                                break;
                            }
                        }
                    }
                }

                return isValid;
            } catch (Exception ex) {
                _logger.LogError(ex, "Error validating VNPay signature");
                return false;
            }
        }

        // Helper: Get VNPay error message theo bảng mã lỗi VNPay
        private string GetVNPayErrorMessage(string responseCode)
        {
            return responseCode switch {
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

        // Helper: Validate VNPay IPN request theo documentation
        private bool ValidateVNPayIPNRequest(SortedDictionary<string, string> vnp_Params, string receivedHash)
        {
            try {
                // Kiểm tra các tham số bắt buộc
                var requiredParams = new[] { "vnp_TmnCode", "vnp_Amount", "vnp_BankCode", "vnp_BankTranNo", "vnp_CardType",
                                           "vnp_PayDate", "vnp_OrderInfo", "vnp_TransactionNo", "vnp_ResponseCode",
                                           "vnp_TransactionStatus", "vnp_TxnRef", "vnp_SecureHash" };

                foreach (var param in requiredParams) {
                    if (!vnp_Params.ContainsKey(param) || string.IsNullOrEmpty(vnp_Params[param])) {
                        _logger.LogWarning("Missing required VNPay IPN parameter: {Param}", param);
                        return false;
                    }
                }

                // Validate signature
                return ValidateVNPaySignature(vnp_Params, receivedHash);
            } catch (Exception ex) {
                _logger.LogError(ex, "Error validating VNPay IPN request");
                return false;
            }
        }

        // Helper: Check if payment should be cleaned up based on response code
        private bool ShouldCleanupPayment(string responseCode)
        {
            // Cleanup khi user hủy hoặc lỗi không thể khắc phục
            var cleanupCodes = new[] {
                "24", // Khách hàng hủy giao dịch
                "11", // Đã hết hạn chờ thanh toán
                "09", // Thẻ/tài khoản chưa đăng ký InternetBanking
                "10", // Xác thực thông tin sai quá 3 lần
                "12", // Thẻ/tài khoản bị khóa
                "13", // Nhập sai OTP
                "51", // Không đủ số dư
                "65", // Vượt hạn mức giao dịch
                "75", // Ngân hàng bảo trì
                "79", // Nhập sai mật khẩu quá số lần
                "99"  // Lỗi khác
            };

            return cleanupCodes.Contains(responseCode);
        }

        // Helper: Cleanup failed payment and related registration
        private async Task CleanupFailedPayment(ThanhToan thanhToan, string responseCode, string errorMessage)
        {
            try {
                _logger.LogInformation("Starting cleanup for failed payment {PaymentId}, responseCode: {ResponseCode}", thanhToan.ThanhToanID, responseCode);

                // Xóa bản ghi ThanhToan
                _context.ThanhToans.Remove(thanhToan);

                // Xóa hoặc cập nhật bản ghi DangKyLop
                var dangKyLop = await _context.DangKyLops.FindAsync(thanhToan.DangKyID);
                if (dangKyLop != null) {
                    // Xóa hoàn toàn bản ghi đăng ký vì payment đã bị hủy
                    _context.DangKyLops.Remove(dangKyLop);
                    _logger.LogInformation("Removed registration {RegistrationId} for failed payment", dangKyLop.DangKyID);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully cleaned up failed payment {PaymentId}", thanhToan.ThanhToanID);

            } catch (Exception ex) {
                _logger.LogError(ex, "Error cleaning up failed payment {PaymentId}", thanhToan.ThanhToanID);
                // Không throw exception để không làm gián đoạn flow chính
            }
        }


    }

    // Request/Response models
    public class CreatePaymentRequest {
        [Required(ErrorMessage = "Học viên ID là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Học viên ID phải lớn hơn 0")]
        public int HocVienID { get; set; }

        [Required(ErrorMessage = "Lớp học ID là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Lớp học ID phải lớn hơn 0")]
        public int LopID { get; set; }

        [Required(ErrorMessage = "Số tiền là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn 0")]
        public decimal SoTien { get; set; }
    }

    public class ConfirmPaymentRequest {
        [Required(ErrorMessage = "Lớp học ID là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Lớp học ID phải lớn hơn 0")]
        public int LopID { get; set; }
    }

    public class ConfirmPaymentSuccessRequest {
        [Required(ErrorMessage = "Học viên ID là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Học viên ID phải lớn hơn 0")]
        public int HocVienID { get; set; }

        [Required(ErrorMessage = "Lớp học ID là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Lớp học ID phải lớn hơn 0")]
        public int LopID { get; set; }

        [Required(ErrorMessage = "Số tiền là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn 0")]
        public decimal SoTien { get; set; }

        [Required(ErrorMessage = "Transaction reference là bắt buộc")]
        public string TransactionRef { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phương thức thanh toán là bắt buộc")]
        public string PhuongThuc { get; set; } = string.Empty;

        [Required(ErrorMessage = "Provider là bắt buộc")]
        public string Provider { get; set; } = string.Empty;
    }

    public class PaymentCallbackRequest {
        [Required(ErrorMessage = "Transaction reference là bắt buộc")]
        public string TransactionRef { get; set; } = string.Empty;

        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        public string Status { get; set; } = string.Empty; // "success" or "failed"

        [Required(ErrorMessage = "Số tiền là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn 0")]
        public decimal Amount { get; set; }

        public string BankCode { get; set; } = string.Empty;
        public int LopID { get; set; }
        public string? Signature { get; set; }
    }



    // VNPay Request/Response models
    public class VNPayReturnRequest {
        public string vnp_Amount { get; set; } = string.Empty;
        public string vnp_BankCode { get; set; } = string.Empty;
        public string vnp_BankTranNo { get; set; } = string.Empty;
        public string vnp_CardType { get; set; } = string.Empty;
        public string vnp_OrderInfo { get; set; } = string.Empty;
        public string vnp_PayDate { get; set; } = string.Empty;
        public string vnp_ResponseCode { get; set; } = string.Empty;
        public string vnp_TmnCode { get; set; } = string.Empty;
        public string vnp_TransactionNo { get; set; } = string.Empty;
        public string vnp_TransactionStatus { get; set; } = string.Empty;
        public string vnp_TxnRef { get; set; } = string.Empty;
        public string vnp_SecureHash { get; set; } = string.Empty;
        public string vnp_Message { get; set; } = string.Empty;
    }

    public class VNPayIPNRequest {
        public string vnp_Amount { get; set; } = string.Empty;
        public string vnp_BankCode { get; set; } = string.Empty;
        public string vnp_BankTranNo { get; set; } = string.Empty;
        public string vnp_CardType { get; set; } = string.Empty;
        public string vnp_OrderInfo { get; set; } = string.Empty;
        public string vnp_PayDate { get; set; } = string.Empty;
        public string vnp_ResponseCode { get; set; } = string.Empty;
        public string vnp_TmnCode { get; set; } = string.Empty;
        public string vnp_TransactionNo { get; set; } = string.Empty;
        public string vnp_TransactionStatus { get; set; } = string.Empty;
        public string vnp_TxnRef { get; set; } = string.Empty;
        public string vnp_SecureHash { get; set; } = string.Empty;
        public string vnp_SecureHashType { get; set; } = string.Empty;
    }
}
