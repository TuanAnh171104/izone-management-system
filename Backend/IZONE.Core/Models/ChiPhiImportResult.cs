using System;
using System.Collections.Generic;

namespace IZONE.Core.Models
{
    public class ChiPhiImportResult
    {
        public int TotalRecords { get; set; }
        public int SuccessCount { get; set; }
        public int ErrorCount { get; set; }
        public List<ChiPhiImportError> Errors { get; set; } = new List<ChiPhiImportError>();
        public bool IsSuccess => ErrorCount == 0;
    }

    public class ChiPhiImportError
    {
        public int RowNumber { get; set; }
        public string Field { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public Dictionary<string, string> RowData { get; set; } = new Dictionary<string, string>();
    }
}
