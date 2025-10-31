using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IPredictionService
    {
        /// <summary>
        /// Lấy dữ liệu dự báo từ stored procedure sp_GetPredictionDataForML
        /// và tính tỷ lệ bỏ học cho từng học viên
        /// </summary>
        Task<List<PredictionData>> GetPredictionDataWithDropoutRiskAsync();

        /// <summary>
        /// Load model ML từ file pickle
        /// </summary>
        Task LoadModelAsync();

        /// <summary>
        /// Dự đoán tỷ lệ bỏ học cho một học viên cụ thể
        /// </summary>
        Task<double> PredictDropoutRiskAsync(PredictionData data);

        /// <summary>
        /// Dự đoán cho danh sách học viên
        /// </summary>
        Task<List<PredictionData>> PredictBatchDropoutRiskAsync(List<PredictionData> dataList);
    }
}
