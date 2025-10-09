using IZONE.Core.Models;

namespace IZONE.Core.Interfaces
{
    public interface IChiPhiImportService
    {
        Task<ChiPhiImportResult> ImportFromExcelAsync(Stream fileStream);
        Task<ChiPhiImportResult> ImportFromCsvAsync(Stream fileStream);
        Task<List<object>> PreviewFromExcelAsync(Stream fileStream);
        Task<List<object>> PreviewFromCsvAsync(Stream fileStream);
    }
}
