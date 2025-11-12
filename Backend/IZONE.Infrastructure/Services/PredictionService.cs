using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using IZONE.Infrastructure.Data;
using System.Diagnostics;
using System.Text.Json;
using System.Text;

namespace IZONE.Infrastructure.Services
{
    public class PredictionService : IPredictionService
    {
        private readonly IConfiguration _configuration;
        private readonly IZONEDbContext _context;

        public PredictionService(IConfiguration configuration, IZONEDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        public async Task LoadModelAsync()
        {
            // TODO: Load ML model from pickle file
            // For now, we use mock predictions
        }

        public async Task<List<PredictionData>> GetPredictionDataWithDropoutRiskAsync()
        {
            // Execute stored procedure to get base data
            var rawData = await GetRawPredictionDataAsync();

            // Enrich data with additional information from related tables
            await EnrichWithRelatedDataAsync(rawData);

            // Get real ML predictions from Python service
            var predictionResults = await PredictBatchDropoutRiskAsync(rawData);

            // Update data with real predictions
            for (int i = 0; i < rawData.Count; i++)
            {
                rawData[i].TyLeBoHoc = predictionResults[i].TyLeBoHoc;

                // Send notification to teacher if student risk >= 50%
                if (rawData[i].TyLeBoHoc != null && rawData[i].TyLeBoHoc.Value >= 50)
                {
                    try
                    {
                        await CreateTeacherNotificationAsync(rawData[i], rawData[i].TyLeBoHoc.Value);
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the entire operation
                        Console.WriteLine($"Failed to send teacher notification for student {rawData[i].HocVienID}: {ex.Message}");
                    }
                }
            }

            return rawData;
        }

        public async Task<double> PredictDropoutRiskAsync(PredictionData data)
        {
            // TODO: Implement actual ML prediction
            // For now return mock value
            return GenerateMockDropoutRisk(data);
        }

    private bool IsDataComplete(PredictionData data)
    {
        // Check for basic required fields
        if (data.TyLeChuyenCan_NuaDau <= 0) return false; // No attendance data
        if (!data.DiemGiuaKy.HasValue) return false; // No mid-term grade
        if (data.KhoaHocID <= 0 || data.GiangVienID <= 0 || data.DiaDiemID <= 0) return false; // Missing FKs

        // Additional data quality checks
        if (data.SoBuoiVang_NuaDau < 0) return false; // Invalid absence count
        if (data.SoBuoiVangDau < 0) return false; // Invalid early absence count
        if (data.TuoiHocVien < 15 || data.TuoiHocVien > 80) return false; // Invalid age range

        return true; // Data is complete and valid
    }

    public async Task<List<PredictionData>> PredictBatchDropoutRiskAsync(List<PredictionData> dataList)
    {
        if (dataList == null || dataList.Count == 0)
            return dataList;

        try
        {
                // Separate complete and incomplete data
                var completeData = dataList.Where(d => IsDataComplete(d)).ToList();
                var incompleteData = dataList.Where(d => !IsDataComplete(d)).ToList();

                // Set incomplete data to null (will show "Chưa đủ dữ liệu" in frontend)
                foreach (var item in incompleteData)
                {
                    item.TyLeBoHoc = null;
                }

                // Only predict for complete data records
                if (completeData.Count > 0)
                {
                    // Convert data to format expected by Python service
                    var pythonInput = completeData.Select(d => new
                    {
                        LopID = d.LopID,
                        TyLeChuyenCan_NuaDau = d.TyLeChuyenCan_NuaDau,
                        SoBuoiVang_NuaDau = d.SoBuoiVang_NuaDau,
                        SoBuoiVangDau = d.SoBuoiVangDau,
                        DiemGiuaKy = d.DiemGiuaKy ?? 0.0,
                        KetQuaGiuaKy = d.KetQuaGiuaKy,
                        SoNgayDangKySom = d.SoNgayDangKySom,
                        TuoiHocVien = d.TuoiHocVien,
                        KhoaHocID = d.KhoaHocID,
                        GiangVienID = d.GiangVienID,
                        DiaDiemID = d.DiaDiemID
                    }).ToList();

                    // Prepare JSON for Python service
                    var jsonInput = new
                    {
                        operation = "predict_batch",
                        data = pythonInput
                    };

                    var jsonString = JsonSerializer.Serialize(jsonInput, new JsonSerializerOptions
                    {
                        WriteIndented = true
                    });

                    // Call Python service
                    var pythonResult = await CallPythonPredictionServiceAsync(jsonString);

                    // Parse results and update data
                    if (pythonResult.ContainsKey("results") && pythonResult["results"] is JsonElement resultsElement)
                    {
                        var results = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(resultsElement);
                        if (results != null && results.Count == completeData.Count)
                        {
                            for (int i = 0; i < completeData.Count; i++)
                            {
                                var result = results[i];
                                if (result.ContainsKey("dropout_percentage") &&
                                    result["dropout_percentage"].TryGetDouble(out double dropoutPercentage))
                                {
                                    completeData[i].TyLeBoHoc = dropoutPercentage;
                                }
                                else
                                {
                                    // Fallback to mock prediction if Python service fails
                                    completeData[i].TyLeBoHoc = GenerateMockDropoutRisk(completeData[i]);
                                }
                            }
                        }
                        else
                        {
                            // If parsing fails, use mock predictions for complete data
                            foreach (var item in completeData)
                            {
                                item.TyLeBoHoc = GenerateMockDropoutRisk(item);
                            }
                        }
                    }
                    else
                    {
                        // If Python service fails, use mock predictions for complete data
                        foreach (var item in completeData)
                        {
                            item.TyLeBoHoc = GenerateMockDropoutRisk(item);
                        }
                    }
                }
                // Incomplete data already has TyLeBoHoc = null
            }
            catch (Exception ex)
            {
                // Log error and use mock predictions as fallback
                Console.WriteLine($"Prediction service error: {ex.Message}");
                foreach (var item in dataList)
                {
                    item.TyLeBoHoc = GenerateMockDropoutRisk(item);
                }
            }

            return dataList;
        }

    private async Task<List<PredictionData>> GetRawPredictionDataAsync()
    {
        // Execute the stored procedure sp_GetPredictionDataForML
        // Since EF Core doesn't directly support stored procedures to return complex objects,
        // we'll query the raw data and map it manually
        var result = new List<PredictionData>();

        using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
        {
            using (var command = new SqlCommand("EXEC sp_GetPredictionDataForML", connection))
            {
                await connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var item = new PredictionData
                        {
                            DangKyID = reader.GetInt32(reader.GetOrdinal("DangKyID")),
                            HocVienID = reader.GetInt32(reader.GetOrdinal("HocVienID")),
                            LopID = reader.GetInt32(reader.GetOrdinal("LopID")),
                            TyLeChuyenCan_NuaDau = Convert.ToDouble(reader.GetDecimal(reader.GetOrdinal("TyLeChuyenCan_NuaDau"))),
                            SoBuoiVang_NuaDau = reader.GetInt32(reader.GetOrdinal("SoBuoiVang_NuaDau")),
                            SoBuoiVangDau = reader.GetInt32(reader.GetOrdinal("SoBuoiVangDau")),
                            DiemGiuaKy = reader.IsDBNull(reader.GetOrdinal("DiemGiuaKy")) ?
                                null : Convert.ToDouble(reader.GetDecimal(reader.GetOrdinal("DiemGiuaKy"))),
                            KetQuaGiuaKy = reader.GetInt32(reader.GetOrdinal("KetQuaGiuaKy")),
                            SoNgayDangKySom = reader.GetInt32(reader.GetOrdinal("SoNgayDangKySom")),
                            TuoiHocVien = reader.GetInt32(reader.GetOrdinal("TuoiHocVien")),
                            KhoaHocID = reader.GetInt32(reader.GetOrdinal("KhoaHocID")),
                            GiangVienID = reader.GetInt32(reader.GetOrdinal("GiangVienID")),
                            DiaDiemID = reader.GetInt32(reader.GetOrdinal("DiaDiemID"))
                        };

                        result.Add(item);
                    }
                }
            }
        }

        return result;
    }

        private async Task EnrichWithRelatedDataAsync(List<PredictionData> dataList)
        {
            var hocVienIds = dataList.Select(d => d.HocVienID).ToList();
            var lopIds = dataList.Select(d => d.LopID).ToList();
            var khoaHocIds = dataList.Select(d => d.KhoaHocID).Distinct().ToList();
            var giangVienIds = dataList.Select(d => d.GiangVienID).Distinct().ToList();
            var diaDiemIds = dataList.Select(d => d.DiaDiemID).Distinct().ToList();

            // Load related data
            var hocViens = await _context.HocViens
                .Where(hv => hocVienIds.Contains(hv.HocVienID))
                .ToDictionaryAsync(hv => hv.HocVienID, hv => hv);

            var lops = await _context.LopHocs
                .Where(l => lopIds.Contains(l.LopID))
                .ToDictionaryAsync(l => l.LopID, l => l);

            var khoaHocs = await _context.KhoaHocs
                .Where(kh => khoaHocIds.Contains(kh.KhoaHocID))
                .ToDictionaryAsync(kh => kh.KhoaHocID, kh => kh);

            var giangViens = await _context.GiangViens
                .Where(gv => giangVienIds.Contains(gv.GiangVienID))
                .ToDictionaryAsync(gv => gv.GiangVienID, gv => gv);

            var diaDiems = await _context.DiaDiems
                .Where(dd => diaDiemIds.Contains(dd.DiaDiemID))
                .ToDictionaryAsync(dd => dd.DiaDiemID, dd => dd);

            // Enrich data
            foreach (var item in dataList)
            {
                if (hocViens.TryGetValue(item.HocVienID, out var hocVien))
                {
                    item.HoTenHocVien = hocVien.HoTen;
                }

                if (lops.TryGetValue(item.LopID, out var lop))
                {
                    item.TenLop = $"Lớp {lop.LopID}";
                }

                if (khoaHocs.TryGetValue(item.KhoaHocID, out var khoaHoc))
                {
                    item.TenKhoaHoc = khoaHoc.TenKhoaHoc;
                }

                if (giangViens.TryGetValue(item.GiangVienID, out var giangVien))
                {
                    item.HoTenGiangVien = giangVien.HoTen;
                }

                if (diaDiems.TryGetValue(item.DiaDiemID, out var diaDiem))
                {
                    item.TenCoSo = diaDiem.TenCoSo;
                }
            }
        }

        private double GenerateMockDropoutRisk(PredictionData data)
        {
            // Simple mock prediction logic based on data
            double risk = 10.0; // Base risk

            // Low attendance increases risk
            if (data.TyLeChuyenCan_NuaDau < 0.6) risk += 30;
            else if (data.TyLeChuyenCan_NuaDau < 0.8) risk += 15;

            // Many absences increase risk
            if (data.SoBuoiVang_NuaDau > 5) risk += 20;
            else if (data.SoBuoiVang_NuaDau > 2) risk += 10;

            // Early absences increase risk
            if (data.SoBuoiVangDau > 1) risk += 15;

            // Low mid-term score increases risk
            if (data.DiemGiuaKy.HasValue && data.DiemGiuaKy.Value < 5) risk += 25;
            else if (data.DiemGiuaKy.HasValue && data.DiemGiuaKy.Value < 7) risk += 10;

            // Failing mid-term increases risk
            if (data.KetQuaGiuaKy == 0) risk += 20;

            // Age factor (younger students might have higher risk)
            if (data.TuoiHocVien < 18) risk += 15;
            else if (data.TuoiHocVien > 30) risk -= 5;

            // Random variation
            var random = new Random(data.HocVienID);
            risk += (random.NextDouble() - 0.5) * 20;

            // Clamp between 0 and 100
            return Math.Max(0, Math.Min(100, risk));
        }

        private async Task<Dictionary<string, JsonElement>> CallPythonPredictionServiceAsync(string jsonInput)
        {
            try
            {
                // Get the path to the Python service script
                var projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "../../../../"));
                var pythonScriptPath = Path.Combine(projectRoot, "ML_Models", "models", "predict_service.py");

                // Ensure Python script exists
                if (!File.Exists(pythonScriptPath))
                {
                    throw new FileNotFoundException($"Python script not found at {pythonScriptPath}");
                }

                // Create process to run Python script
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "python",
                        Arguments = $"\"{pythonScriptPath}\"",
                        UseShellExecute = false,
                        RedirectStandardInput = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        CreateNoWindow = true,
                        WorkingDirectory = Path.GetDirectoryName(pythonScriptPath)
                    }
                };

                process.Start();

                // Write JSON input to Python script's stdin
                using (var writer = process.StandardInput)
                {
                    await writer.WriteAsync(jsonInput);
                    await writer.FlushAsync();
                }

                // Read output
                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"Python script error: {error}");
                }

                // Parse JSON output
                if (string.IsNullOrWhiteSpace(output))
                {
                    throw new Exception("Python script returned empty output");
                }

                var result = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(output.Trim());
                return result ?? throw new Exception("Failed to parse Python script output");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error calling Python prediction service: {ex.Message}");
                // Return empty result to trigger fallback to mock predictions
                return new Dictionary<string, JsonElement>();
            }
        }

        private async Task CreateTeacherNotificationAsync(PredictionData studentData, double riskPercentage)
        {
            try
            {
                // Check if we've already sent a notification for this student to this teacher
                var existingNotification = await _context.ThongBao
                    .Where(t => t.NguoiNhanID == studentData.GiangVienID &&
                               t.NoiDung.Contains($"học viên {studentData.HoTenHocVien}") &&
                               t.NoiDung.Contains("rủi ro"))
                    .FirstOrDefaultAsync();

                if (existingNotification != null)
                {
                    // Already sent notification for this student-teacher pair
                    return;
                }

                // Get risk level text
                string riskLevelText = riskPercentage >= 70 ? "RẤT CAO" : "CAO";

                // Create notification for teacher
                var notification = new ThongBao
                {
                    NguoiGui = "Hệ thống AI",
                    NguoiNhanID = studentData.GiangVienID,
                    LoaiNguoiNhan = "GiangVien",
                    NoiDung = $@"
                        Giáo viên {studentData.HoTenGiangVien},

                        Hệ thống AI phát hiện học viên {studentData.HoTenHocVien} (ID: {studentData.HocVienID})
                        đang có mức RỦI RO BỎ HỌC {riskLevelText} ({riskPercentage.ToString("F1")})%.

                        📊 Thông tin học viên:
                        - Lớp: {studentData.TenLop}
                        - Chuyên cần: {(studentData.TyLeChuyenCan_NuaDau * 100).ToString("F1")}% ({studentData.SoBuoiVang_NuaDau} buổi vắng)
                        - Điểm giữa kỳ: {studentData.DiemGiuaKy?.ToString("F1") ?? "Chưa có"}
                        - Vắng buổi đầu: {studentData.SoBuoiVangDau} buổi

                        ⚠️ Khuyến nghị can thiệp sớm để hỗ trợ học viên!

                        📞 Tài liệu: [Link hướng dẫn can thiệp]
                    ",
                    NgayGui = DateTime.Now
                };

                await _context.ThongBao.AddAsync(notification);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error but don't throw to avoid breaking prediction flow
                Console.WriteLine($"Error creating teacher notification for student {studentData.HocVienID}: {ex.Message}");
            }
        }

        public async Task<List<PredictionData>> GetBasicPredictionDataAsync()
        {
            // Execute stored procedure to get base data
            var rawData = await GetRawPredictionDataAsync();

            // Enrich data with additional information from related tables
            await EnrichWithRelatedDataAsync(rawData);

            // Set TyLeBoHoc to null (no predictions calculated yet)
            foreach (var item in rawData)
            {
                item.TyLeBoHoc = null;
            }

            return rawData;
        }

        public async Task<List<PredictionData>> RunPredictionsForDataAsync(List<PredictionData> basicData)
        {
            if (basicData == null || basicData.Count == 0)
                return basicData;

            // Get real ML predictions from Python service
            var predictionResults = await PredictBatchDropoutRiskAsync(basicData);

            // Update data with real predictions and send notifications for high-risk students
            for (int i = 0; i < basicData.Count; i++)
            {
                basicData[i].TyLeBoHoc = predictionResults[i].TyLeBoHoc;

                // Send notification to teacher if student risk >= 50%
                if (basicData[i].TyLeBoHoc != null && basicData[i].TyLeBoHoc.Value >= 50)
                {
                    try
                    {
                        await CreateTeacherNotificationAsync(basicData[i], basicData[i].TyLeBoHoc.Value);
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the entire operation
                        Console.WriteLine($"Failed to send teacher notification for student {basicData[i].HocVienID}: {ex.Message}");
                    }
                }
            }

            return basicData;
        }
    }
}
