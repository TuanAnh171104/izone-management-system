using OfficeOpenXml;
using IZONE.Core.Models;
using IZONE.Core.Interfaces;
using System.Text.RegularExpressions;
using System.Text;

namespace IZONE.Infrastructure.Services
{
    public class ChiPhiImportService : IChiPhiImportService
    {
        private readonly IChiPhiRepository _chiPhiRepository;
        private readonly ILopHocRepository _lopHocRepository;
        private readonly IKhoaHocRepository _khoaHocRepository;
        private readonly IDiaDiemRepository _diaDiemRepository;

        public ChiPhiImportService(
            IChiPhiRepository chiPhiRepository,
            ILopHocRepository lopHocRepository,
            IKhoaHocRepository khoaHocRepository,
            IDiaDiemRepository diaDiemRepository)
        {
            _chiPhiRepository = chiPhiRepository;
            _lopHocRepository = lopHocRepository;
            _khoaHocRepository = khoaHocRepository;
            _diaDiemRepository = diaDiemRepository;
        }

        public async Task<ChiPhiImportResult> ImportFromExcelAsync(Stream fileStream)
        {
            var result = new ChiPhiImportResult();
            var errors = new List<ChiPhiImportError>();

            try
            {
                // Thiết lập license context cho EPPlus
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using (var package = new ExcelPackage(fileStream))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var rowCount = worksheet.Dimension.Rows;

                    // Bỏ qua header row (row 1)
                    for (int row = 2; row <= rowCount; row++)
                    {
                        result.TotalRecords++;

                        try
                        {
                            var chiPhi = await ParseChiPhiFromRow(worksheet, row);
                            if (chiPhi != null)
                            {
                                await _chiPhiRepository.AddAsync(chiPhi);
                                result.SuccessCount++;
                            }
                        }
                        catch (Exception ex)
                        {
                            result.ErrorCount++;
                            errors.Add(new ChiPhiImportError
                            {
                                RowNumber = row,
                                ErrorMessage = ex.Message,
                                Field = "General"
                            });
                        }
                    }
                }

                result.Errors = errors;
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChiPhiImportService] Lỗi xử lý file Excel: {ex.Message}");
                Console.WriteLine($"[ChiPhiImportService] Stack trace: {ex.StackTrace}");

                result.ErrorCount = result.TotalRecords;
                result.Errors.Add(new ChiPhiImportError
                {
                    RowNumber = 0,
                    ErrorMessage = $"Lỗi xử lý file Excel: {ex.Message}. Vui lòng kiểm tra định dạng file và thử lại.",
                    Field = "File"
                });
                return result;
            }
        }

        public async Task<ChiPhiImportResult> ImportFromCsvAsync(Stream fileStream)
        {
            var result = new ChiPhiImportResult();
            var errors = new List<ChiPhiImportError>();

            try
            {
                // Kiểm tra encoding của file trước khi đọc
                var detectedEncoding = await DetectFileEncodingAsync(fileStream);

                // Reset stream về đầu để đọc lại
                fileStream.Position = 0;

                // Sử dụng encoding phù hợp dựa trên kết quả detect
                Encoding encoding = Encoding.UTF8;
                if (detectedEncoding.Contains("UTF-16"))
                {
                    encoding = Encoding.Unicode;
                }
                else if (detectedEncoding.Contains("UTF-8 with BOM"))
                {
                    encoding = new UTF8Encoding(true);
                }

                using (var reader = new StreamReader(fileStream, encoding))
                {
                    var headerLine = await reader.ReadLineAsync(); // Đọc header
                    if (string.IsNullOrEmpty(headerLine))
                    {
                        throw new Exception("File CSV không có header");
                    }

                    var headers = headerLine.Split(',').Select(h => h.Trim().ToLower()).ToArray();
                    var rowNumber = 2; // Bắt đầu từ row 2 (sau header)

                    while (!reader.EndOfStream)
                    {
                        var line = await reader.ReadLineAsync();
                        if (string.IsNullOrWhiteSpace(line)) continue;

                        result.TotalRecords++;

                        try
                        {
                            var chiPhi = await ParseChiPhiFromCsvRow(line, headers, rowNumber);
                            if (chiPhi != null)
                            {
                                await _chiPhiRepository.AddAsync(chiPhi);
                                result.SuccessCount++;
                            }
                        }
                        catch (Exception ex)
                        {
                            result.ErrorCount++;
                            errors.Add(new ChiPhiImportError
                            {
                                RowNumber = rowNumber,
                                ErrorMessage = ex.Message,
                                Field = "General"
                            });
                        }

                        rowNumber++;
                    }
                }

                result.Errors = errors;
                return result;
            }
            catch (Exception ex)
            {
                result.ErrorCount = result.TotalRecords;
                result.Errors.Add(new ChiPhiImportError
                {
                    RowNumber = 0,
                    ErrorMessage = $"Lỗi xử lý file CSV: {ex.Message}",
                    Field = "File"
                });
                return result;
            }
        }

        private async Task<ChiPhi?> ParseChiPhiFromRow(ExcelWorksheet worksheet, int row)
        {
            try
            {
                var chiPhi = new ChiPhi();

                // Đọc dữ liệu từ các cột (theo thứ tự định sẵn)
                chiPhi.LoaiChiPhi = GetStringValue(worksheet, row, 1); // Cột A
                chiPhi.SubLoai = GetStringValue(worksheet, row, 2); // Cột B
                chiPhi.SoTien = GetDecimalValue(worksheet, row, 3); // Cột C
                chiPhi.NgayPhatSinh = GetDateValue(worksheet, row, 4); // Cột D

                // Đọc các cột ID (có thể null)
                chiPhi.LopID = GetNullableIntValue(worksheet, row, 5); // Cột E - LopID
                chiPhi.DiaDiemID = GetNullableIntValue(worksheet, row, 6); // Cột F - DiaDiemID

                chiPhi.NguoiNhap = GetStringValue(worksheet, row, 7); // Cột G
                chiPhi.NguonChiPhi = GetStringValue(worksheet, row, 8); // Cột H
                chiPhi.AllocationMethod = GetStringValue(worksheet, row, 9) ?? "SeatHours"; // Cột I
                chiPhi.NguonGoc = GetStringValue(worksheet, row, 10) ?? "NhapTay"; // Cột J

                // Validate required fields với thông báo chi tiết
                if (string.IsNullOrEmpty(chiPhi.LoaiChiPhi))
                    throw new Exception($"Dòng {row}: Loại chi phí không được để trống");

                if (chiPhi.SoTien <= 0)
                    throw new Exception($"Dòng {row}: Số tiền phải lớn hơn 0 (giá trị hiện tại: {chiPhi.SoTien})");

                if (chiPhi.NgayPhatSinh == default)
                    throw new Exception($"Dòng {row}: Ngày phát sinh không hợp lệ");

                // Validate LoaiChiPhi
                var validLoaiChiPhi = new[] { "LuongGV", "LuongNV", "TaiLieu", "Marketing",
                                            "MatBang", "Utilities", "BaoHiem", "Thue",
                                            "BaoTri", "CongNghe", "SuKien", "Khac" };
                if (!validLoaiChiPhi.Contains(chiPhi.LoaiChiPhi))
                    throw new Exception($"Dòng {row}: Loại chi phí '{chiPhi.LoaiChiPhi}' không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", validLoaiChiPhi)}");

                // Validate AllocationMethod
                var validAllocationMethods = new[] { "SeatHours", "PerStudent", "Revenue" };
                if (!validAllocationMethods.Contains(chiPhi.AllocationMethod))
                    throw new Exception($"Dòng {row}: Phương pháp phân bổ '{chiPhi.AllocationMethod}' không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", validAllocationMethods)}");

                // Validate NguonGoc
                var validNguonGoc = new[] { "NhapTay", "TuDong" };
                if (!validNguonGoc.Contains(chiPhi.NguonGoc))
                    throw new Exception($"Dòng {row}: Nguồn gốc '{chiPhi.NguonGoc}' không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", validNguonGoc)}");

                return chiPhi;
            }
            catch (Exception ex) when (ex.Message.StartsWith($"Dòng {row}:"))
            {
                throw; // Giữ nguyên thông báo lỗi chi tiết
            }
            catch (Exception ex)
            {
                throw new Exception($"Dòng {row}: Lỗi xử lý dữ liệu - {ex.Message}");
            }
        }

        private async Task<ChiPhi?> ParseChiPhiFromCsvRow(string line, string[] headers, int rowNumber)
        {
            try
            {
                var values = ParseCsvLine(line);
                var chiPhi = new ChiPhi();

                for (int i = 0; i < headers.Length && i < values.Length; i++)
                {
                    var header = headers[i];
                    var value = values[i];

                    switch (header)
                    {
                        case "loaichiphi":
                            chiPhi.LoaiChiPhi = value;
                            break;
                        case "subloai":
                            chiPhi.SubLoai = value;
                            break;
                        case "sotien":
                            if (!decimal.TryParse(value, out decimal soTien))
                                throw new Exception($"Số tiền không hợp lệ: {value}");
                            chiPhi.SoTien = soTien;
                            break;
                        case "ngayphatsinh":
                            if (!DateTime.TryParse(value, out DateTime ngayPhatSinh))
                                throw new Exception($"Ngày phát sinh không hợp lệ: {value}");
                            chiPhi.NgayPhatSinh = ngayPhatSinh;
                            break;
                        case "lopid":
                            chiPhi.LopID = ParseNullableInt(value);
                            break;

                        case "diadiemid":
                            chiPhi.DiaDiemID = ParseNullableInt(value);
                            break;
                        case "nguoinhap":
                            chiPhi.NguoiNhap = value;
                            break;
                        case "nguonchiphi":
                            chiPhi.NguonChiPhi = value;
                            break;
                        case "allocationmethod":
                            chiPhi.AllocationMethod = value ?? "SeatHours";
                            break;
                        case "nguongoc":
                            chiPhi.NguonGoc = value ?? "NhapTay";
                            break;
                    }
                }

                // Validate required fields với thông báo chi tiết
                if (string.IsNullOrEmpty(chiPhi.LoaiChiPhi))
                    throw new Exception($"Dòng {rowNumber}: Loại chi phí không được để trống");

                if (chiPhi.SoTien <= 0)
                    throw new Exception($"Dòng {rowNumber}: Số tiền phải lớn hơn 0 (giá trị hiện tại: {chiPhi.SoTien})");

                if (chiPhi.NgayPhatSinh == default)
                    throw new Exception($"Dòng {rowNumber}: Ngày phát sinh không hợp lệ");

                // Validate LoaiChiPhi
                var validLoaiChiPhi = new[] { "LuongGV", "LuongNV", "TaiLieu", "Marketing",
                                            "MatBang", "Utilities", "BaoHiem", "Thue",
                                            "BaoTri", "CongNghe", "SuKien", "Khac" };
                if (!validLoaiChiPhi.Contains(chiPhi.LoaiChiPhi))
                    throw new Exception($"Dòng {rowNumber}: Loại chi phí '{chiPhi.LoaiChiPhi}' không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", validLoaiChiPhi)}");

                return chiPhi;
            }
            catch (Exception ex) when (ex.Message.StartsWith($"Dòng {rowNumber}:"))
            {
                throw; // Giữ nguyên thông báo lỗi chi tiết
            }
            catch (Exception ex)
            {
                throw new Exception($"Dòng {rowNumber}: Lỗi xử lý dữ liệu - {ex.Message}");
            }
        }

        private string? GetStringValue(ExcelWorksheet worksheet, int row, int column)
        {
            var value = worksheet.Cells[row, column].Value?.ToString()?.Trim();
            return string.IsNullOrEmpty(value) ? null : value;
        }

        private int? GetNullableIntValue(ExcelWorksheet worksheet, int row, int column)
        {
            var value = worksheet.Cells[row, column].Value?.ToString()?.Trim();
            if (string.IsNullOrEmpty(value))
                return null;

            if (int.TryParse(value, out int result))
                return result;

            return null; // Trả về null nếu không thể parse thành int
        }

        private decimal GetDecimalValue(ExcelWorksheet worksheet, int row, int column)
        {
            var value = worksheet.Cells[row, column].Value;
            if (value == null)
                throw new Exception("Số tiền không được để trống");

            if (decimal.TryParse(value.ToString(), out decimal result))
                return result;

            throw new Exception($"Số tiền không hợp lệ: {value}");
        }

        private DateTime GetDateValue(ExcelWorksheet worksheet, int row, int column)
        {
            var value = worksheet.Cells[row, column].Value;
            if (value == null)
                throw new Exception("Ngày phát sinh không được để trống");

            // Handle Excel serial date format (OADate - double type)
            if (value is double serialDate)
            {
                try
                {
                    return DateTime.FromOADate(serialDate);
                }
                catch (Exception)
                {
                    throw new Exception($"Ngày phát sinh không hợp lệ (Excel serial date): {serialDate}");
                }
            }

            // Handle string date format
            if (DateTime.TryParse(value.ToString(), out DateTime result))
                return result;

            throw new Exception($"Ngày phát sinh không hợp lệ: {value}");
        }

        public async Task<List<object>> PreviewFromExcelAsync(Stream fileStream)
        {
            var previewData = new List<object>();

            try
            {
                Console.WriteLine("[ChiPhiImportService] Bắt đầu preview file Excel");

                // Thiết lập license context cho EPPlus
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                Console.WriteLine("[ChiPhiImportService] Đã thiết lập license context");

                using (var package = new ExcelPackage(fileStream))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var rowCount = Math.Min(worksheet.Dimension.Rows, 6); // Preview tối đa 5 dòng dữ liệu (bỏ qua header)

                    // Bỏ qua header row (row 1), bắt đầu từ row 2
                    for (int row = 2; row <= rowCount; row++)
                    {
                        try
                        {
                            var chiPhi = await ParseChiPhiFromRow(worksheet, row);
                            if (chiPhi != null)
                            {
                                previewData.Add(new
                                {
                                    loaiChiPhi = chiPhi.LoaiChiPhi,
                                    subLoai = chiPhi.SubLoai,
                                    soTien = chiPhi.SoTien,
                                    ngayPhatSinh = chiPhi.NgayPhatSinh.ToString("yyyy-MM-dd"),
                                    lopID = chiPhi.LopID,
                                    diaDiemID = chiPhi.DiaDiemID,
                                    nguoiNhap = chiPhi.NguoiNhap,
                                    nguonChiPhi = chiPhi.NguonChiPhi,
                                    allocationMethod = chiPhi.AllocationMethod,
                                    nguonGoc = chiPhi.NguonGoc
                                });
                            }
                        }
                        catch (Exception ex)
                        {
                            previewData.Add(new
                            {
                                loaiChiPhi = "Lỗi",
                                subLoai = $"Lỗi dòng {row}",
                                soTien = 0,
                                ngayPhatSinh = "",
                                lopID = (int?)null,
                                diaDiemID = (int?)null,
                                nguoiNhap = "",
                                nguonChiPhi = ex.Message,
                                allocationMethod = "",
                                nguonGoc = ""
                            });
                        }
                    }
                }

                return previewData;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChiPhiImportService] Lỗi khi đọc file Excel để preview: {ex.Message}");
                Console.WriteLine($"[ChiPhiImportService] Stack trace: {ex.StackTrace}");

                // Đưa ra thông báo lỗi chi tiết hơn dựa trên loại lỗi
                string errorMessage = ex.Message;
                if (ex.Message.Contains("license") || ex.Message.Contains("License"))
                {
                    errorMessage = "Lỗi license EPPlus. Vui lòng liên hệ administrator để khắc phục.";
                }
                else if (ex.Message.Contains("format") || ex.Message.Contains("Format"))
                {
                    errorMessage = "Định dạng file Excel không đúng. Vui lòng kiểm tra và thử lại.";
                }
                else if (ex.Message.Contains("encoding") || ex.Message.Contains("Encoding"))
                {
                    errorMessage = "Lỗi mã hóa file Excel. Vui lòng lưu file với encoding UTF-8.";
                }
                else
                {
                    errorMessage = $"Lỗi khi đọc file Excel: {ex.Message}. Vui lòng kiểm tra định dạng file và thử lại.";
                }

                throw new Exception(errorMessage);
            }
        }

        public async Task<List<object>> PreviewFromCsvAsync(Stream fileStream)
        {
            var previewData = new List<object>();

            try
            {
                // Kiểm tra encoding của file trước khi đọc
                var detectedEncoding = await DetectFileEncodingAsync(fileStream);

                // Reset stream về đầu để đọc lại
                fileStream.Position = 0;

                // Sử dụng encoding phù hợp dựa trên kết quả detect
                Encoding encoding = Encoding.UTF8;
                if (detectedEncoding.Contains("UTF-16"))
                {
                    encoding = Encoding.Unicode;
                }
                else if (detectedEncoding.Contains("UTF-8 with BOM"))
                {
                    encoding = new UTF8Encoding(true);
                }

                using (var reader = new StreamReader(fileStream, encoding))
                {
                    var headerLine = await reader.ReadLineAsync(); // Đọc header
                    if (string.IsNullOrEmpty(headerLine))
                    {
                        throw new Exception("File CSV không có header");
                    }

                    var headers = headerLine.Split(',').Select(h => h.Trim().ToLower()).ToArray();
                    var rowNumber = 2; // Bắt đầu từ row 2 (sau header)
                    var previewCount = 0;
                    var maxPreviewRows = 5; // Preview tối đa 5 dòng

                    while (!reader.EndOfStream && previewCount < maxPreviewRows)
                    {
                        var line = await reader.ReadLineAsync();
                        if (string.IsNullOrWhiteSpace(line)) continue;

                        try
                        {
                            var chiPhi = await ParseChiPhiFromCsvRow(line, headers, rowNumber);
                            if (chiPhi != null)
                            {
                                previewData.Add(new
                                {
                                    loaiChiPhi = chiPhi.LoaiChiPhi,
                                    subLoai = chiPhi.SubLoai,
                                    soTien = chiPhi.SoTien,
                                    ngayPhatSinh = chiPhi.NgayPhatSinh.ToString("yyyy-MM-dd"),
                                    lopID = chiPhi.LopID,
                                    diaDiemID = chiPhi.DiaDiemID,
                                    nguoiNhap = chiPhi.NguoiNhap,
                                    nguonChiPhi = chiPhi.NguonChiPhi,
                                    allocationMethod = chiPhi.AllocationMethod,
                                    nguonGoc = chiPhi.NguonGoc
                                });
                                previewCount++;
                            }
                        }
                        catch (Exception ex)
                        {
                            previewData.Add(new
                            {
                                loaiChiPhi = "Lỗi",
                                subLoai = $"Lỗi dòng {rowNumber}",
                                soTien = 0,
                                ngayPhatSinh = "",
                                nguoiNhap = "",
                                nguonChiPhi = ex.Message,
                                allocationMethod = "",
                                nguonGoc = ""
                            });
                            previewCount++;
                        }

                        rowNumber++;
                    }
                }

                return previewData;
            }
            catch (Exception ex)
            {
                throw new Exception($"Lỗi khi đọc file CSV để preview: {ex.Message}");
            }
        }

        private int? ParseNullableInt(string? value)
        {
            if (string.IsNullOrEmpty(value))
                return null;

            if (int.TryParse(value.Trim(), out int result))
                return result;

            return null;
        }

        private string[] ParseCsvLine(string line)
        {
            var values = new List<string>();
            var current = "";
            var inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                var c = line[i];
                if (c == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current += '"';
                        i++; // Skip next quote
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }
                }
                else if (c == ',' && !inQuotes)
                {
                    values.Add(current.Trim());
                    current = "";
                }
                else
                {
                    current += c;
                }
            }

            values.Add(current.Trim());
            return values.ToArray();
        }

        // Thêm phương thức kiểm tra encoding của file
        public async Task<string> DetectFileEncodingAsync(Stream fileStream)
        {
            try
            {
                // Đọc một phần đầu của file để kiểm tra encoding
                byte[] buffer = new byte[1024];
                int bytesRead = await fileStream.ReadAsync(buffer, 0, buffer.Length);

                if (bytesRead >= 3 && buffer[0] == 0xEF && buffer[1] == 0xBB && buffer[2] == 0xBF)
                {
                    return "UTF-8 with BOM";
                }
                else if (bytesRead >= 2 && buffer[0] == 0xFF && buffer[1] == 0xFE)
                {
                    return "UTF-16 LE";
                }
                else if (bytesRead >= 2 && buffer[0] == 0xFE && buffer[1] == 0xFF)
                {
                    return "UTF-16 BE";
                }
                else
                {
                    return "UTF-8";
                }
            }
            catch
            {
                return "UTF-8";
            }
        }
    }
}
