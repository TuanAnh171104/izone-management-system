import React, { useState, useEffect } from 'react';
import { baoCaoService } from '../../services/api';
import '../../styles/Management.css';
import '../../styles/Reports.css';

// Định nghĩa các loại báo cáo
const FINANCIAL_REPORTS = [
  { value: 'BaoCaoTaiChinhTongHop', label: 'Báo cáo Tài chính Tổng hợp' },
  { value: 'BaoCaoChiPhiChiTiet', label: 'Báo cáo Chi phí Chi tiết' },
  { value: 'BaoCaoLoiNhuanRongTheoLop', label: 'Báo cáo Lợi nhuận Ròng theo Lớp học' }
];

const TRAINING_REPORTS = [
  { value: 'BaoCaoHieuSuatGiangVien', label: 'Báo cáo hiệu suất giảng viên' },
  { value: 'BaoCaoHieuSuatKhoaHoc', label: 'Báo cáo Hiệu suất khóa học' }
];

const OPERATIONAL_REPORTS = [
  { value: 'BaoCaoHieuSuatCoSo', label: 'Báo cáo Hiệu suất Cơ sở' }
];

// Định nghĩa cấu trúc cột cho từng loại báo cáo
const COLUMN_CONFIGS: { [key: string]: any[] } = {
  BaoCaoTaiChinhTongHop: [
    { key: 'KyBaoCao', label: 'Kỳ Báo cáo', type: 'text' },
    { key: 'TongDoanhThu', label: 'Tổng Doanh thu', type: 'currency' },
    { key: 'TongChiPhiTrucTiep', label: 'Chi phí Trực tiếp', type: 'currency' },
    { key: 'TongChiPhiChung', label: 'Chi phí Chung', type: 'currency' },
    { key: 'LoiNhuanRong', label: 'Lợi nhuận Ròng', type: 'currency' },
    { key: 'TySuatLoiNhuan', label: 'Tỷ suất LN (%)', type: 'percentage' }
  ],
  BaoCaoDoanhThuChiTiet: [
    { key: 'KhoaHoc', label: 'Khóa học', type: 'text' },
    { key: 'LopHoc', label: 'Lớp học', type: 'text' },
    { key: 'SoLuongDangKy', label: 'Số lượng Đăng ký', type: 'number' },
    { key: 'HocPhi', label: 'Học phí', type: 'currency' },
    { key: 'TaiLieu', label: 'Tài liệu', type: 'currency' },
    { key: 'TongDoanhThu', label: 'Tổng Doanh thu', type: 'currency' },
    { key: 'NgayBatDau', label: 'Ngày bắt đầu', type: 'date' },
    { key: 'GiangVien', label: 'Giảng viên', type: 'text' }
  ],
  BaoCaoChiPhiChiTiet: [
    { key: 'LoaiChiPhi', label: 'Loại Chi phí', type: 'text' },
    { key: 'SubLoai', label: 'Chi tiết', type: 'text' },
    { key: 'SoTien', label: 'Số tiền', type: 'currency' },
    { key: 'NgayPhatSinh', label: 'Ngày phát sinh', type: 'date' },
    { key: 'LopHoc', label: 'Lớp học', type: 'text' },
    { key: 'DiaDiem', label: 'Địa điểm', type: 'text' }
  ],
  BaoCaoLoiNhuanGopTheoLop: [
    { key: 'LopHoc', label: 'Lớp học', type: 'text' },
    { key: 'KhoaHoc', label: 'Khóa học', type: 'text' },
    { key: 'GiangVien', label: 'Giảng viên', type: 'text' },
    { key: 'DiaDiem', label: 'Địa điểm', type: 'text' },
    { key: 'DoanhThu', label: 'Doanh thu', type: 'currency' },
    { key: 'ChiPhiTrucTiep', label: 'Chi phí Trực tiếp', type: 'currency' },
    { key: 'ChiPhiChungPhanBo', label: 'Chi phí Chung Phân bổ', type: 'currency' },
    { key: 'LoiNhuanGop', label: 'Lợi nhuận Gộp', type: 'currency' },
    { key: 'LoiNhuanRong', label: 'Lợi nhuận Ròng', type: 'currency' },
    { key: 'SoLuongHocVien', label: 'Số lượng Học viên', type: 'number' },
    { key: 'SoBuoi', label: 'Số buổi', type: 'number' }
  ],
  BaoCaoLoiNhuanRongTheoLop: [
    { key: 'LopHoc', label: 'Lớp học', type: 'text' },
    { key: 'KhoaHoc', label: 'Khóa học', type: 'text' },
    { key: 'DiaDiem', label: 'Địa điểm', type: 'text' },
    { key: 'DoanhThu', label: 'Doanh thu', type: 'currency' },
    { key: 'ChiPhiTrucTiep', label: 'Chi phí Trực tiếp', type: 'currency' },
    { key: 'ChiPhiChungDuocPhanBo', label: 'Chi phí Chung Được Phân bổ', type: 'currency' },
    { key: 'LoiNhuanRong', label: 'Lợi nhuận Ròng', type: 'currency' }
  ],
  BaoCaoTyLeDat: [
    { key: 'KhoaHoc', label: 'Khóa học', type: 'text' },
    { key: 'LopHoc', label: 'Lớp học', type: 'text' },
    { key: 'GiangVien', label: 'Giảng viên', type: 'text' },
    { key: 'TongSoHocVien', label: 'Tổng số Học viên', type: 'number' },
    { key: 'SoHocVienDat', label: 'Số Học viên Đạt', type: 'number' },
    { key: 'TyLeDat', label: 'Tỷ lệ Đạt (%)', type: 'percentage' },
    { key: 'DiemTrungBinh', label: 'Điểm Trung bình', type: 'number' }
  ],
  BaoCaoHieuSuatGiangVien: [
    { key: 'TenGiangVien', label: 'Tên Giảng viên', type: 'text' },
    { key: 'SoLopDay', label: 'Số Lớp dạy', type: 'number' },
    { key: 'TongSoHVDuocXet', label: 'Tổng Học viên được xét', type: 'number' },
    { key: 'TiLeDat_Pct', label: 'Tỷ lệ Đạt (%)', type: 'percentage' },
    { key: 'DiemTbXetTotNghiep_ToanGV', label: 'Điểm TB Xét tốt nghiệp', type: 'number' }
  ],
  BaoCaoHieuSuatKhoaHoc: [
    { key: 'TenKhoaHoc', label: 'Tên Khóa học', type: 'text' },
    { key: 'SoLuongDangKy', label: 'Số lượng Đăng ký', type: 'number' },
    { key: 'TongDoanhThu', label: 'Tổng Doanh thu', type: 'currency' },
    { key: 'LoiNhuanRong', label: 'Lợi nhuận Ròng', type: 'currency' },
    { key: 'TyLeDat_Pct', label: 'Tỷ lệ Đạt (%)', type: 'percentage' }
  ],
  BaoCaoHieuSuatCoSo: [
    { key: 'TenCoSo', label: 'Tên Cơ sở', type: 'text' },
    { key: 'SoLopHoatDongTrongKy', label: 'Số Lớp Hoạt động', type: 'number' },
    { key: 'SoHocVienThucTe', label: 'Số Học viên Thực tế', type: 'number' },
    { key: 'DoanhThuTrongKy', label: 'Doanh thu Trong kỳ', type: 'currency' },
    { key: 'ChiPhiTrongKy', label: 'Chi phí Trong kỳ', type: 'currency' },
    { key: 'LoiNhuanTrongKy', label: 'Lợi nhuận Trong kỳ', type: 'currency' },
    { key: 'TyLeLapDayTrungBinh_Pct', label: 'Tỷ lệ Lấp đầy TB (%)', type: 'percentage' }
  ]
};

interface ReportFilters {
  diaDiem?: string[];
  khoaHoc?: string[];
  giangVien?: string[];
  lopHoc?: string[];
}

const AdminReports: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{start: Date, end: Date}>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 ngày trước
    end: new Date()
  });
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách các loại báo cáo từ API
  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        console.log('Đang lấy danh sách loại báo cáo...');
        const response = await baoCaoService.getLoaiBaoCao();
        console.log('Report types loaded:', response);
      } catch (error: any) {
        console.error('Lỗi khi lấy loại báo cáo:', error);
        // Hiển thị thông báo lỗi rõ ràng hơn
        if (error.message && error.message.includes('message channel closed')) {
          console.error('Lỗi Chrome extension - thử refresh trang hoặc tắt extension');
        } else if (error.response) {
          console.error('Lỗi server:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('Không thể kết nối đến server - kiểm tra backend có chạy không');
        }
        // Không throw error để tránh crash component
      }
    };

    fetchReportTypes();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      setError('Vui lòng chọn loại báo cáo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        LoaiBaoCao: selectedReportType,
        NgayBatDau: dateRange.start,
        NgayKetThuc: dateRange.end,
        Filters: filters
      };

      console.log('🚀 Đang tạo báo cáo với dữ liệu:', requestData);
      const response = await baoCaoService.taoBaoCao(requestData);
      console.log('✅ Phản hồi từ server:', response);

      if (response && response.data) {
        console.log('📊 Dữ liệu báo cáo nhận được:', response.data);
        console.log('📋 Kiểm tra cấu trúc dữ liệu:', {
          type: typeof response.data,
          isArray: Array.isArray(response.data),
          length: Array.isArray(response.data) ? response.data.length : 'not array',
          firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : 'no items'
        });

        // Đúng rồi! Dữ liệu nằm trong response.data.data
        const dataArray = response.data.data || [];
        console.log('📋 Dữ liệu thực tế để hiển thị:', dataArray);
        console.log('📋 Số lượng bản ghi:', dataArray.length);

        setReportData(dataArray);

        if (dataArray.length === 0) {
          setError('Không có dữ liệu cho báo cáo này trong khoảng thời gian đã chọn.');
        }
      } else {
        console.warn('⚠️ Không nhận được dữ liệu từ server');
        setReportData([]);
        setError('Không nhận được dữ liệu từ server.');
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi tạo báo cáo:', error);

      // Hiển thị thông báo lỗi chi tiết hơn
      if (error.response) {
        // Lỗi từ server
        console.error('🔥 Lỗi server:', error.response.status, error.response.data);
        setError(`Lỗi server (${error.response.status}): ${error.response.data?.message || 'Không thể tạo báo cáo'}`);
      } else if (error.request) {
        // Lỗi kết nối
        console.error('🌐 Lỗi kết nối:', error.request);
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và khởi động lại server.');
      } else {
        // Lỗi khác
        console.error('💥 Lỗi khác:', error.message);
        setError(`Có lỗi xảy ra: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };



  const handlePrintReport = () => {
    if (reportData.length === 0) {
      setError('Không có dữ liệu để in');
      return;
    }

    // Tạo cửa sổ in với định dạng chuyên nghiệp giống mẫu
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportTitle = FINANCIAL_REPORTS.concat(TRAINING_REPORTS, OPERATIONAL_REPORTS)
      .find(r => r.value === selectedReportType)?.label || 'Báo cáo';

    // Tạo dữ liệu bảng với định dạng giống mẫu
    const columns = getColumnsForReportType(selectedReportType);

    const formatValue = (value: any, type: string) => {
      if (!value) return '';

      switch (type) {
        case 'currency':
          return new Intl.NumberFormat('vi-VN').format(value).replace('₫', 'VND');
        case 'number':
          return new Intl.NumberFormat('vi-VN').format(value);
        case 'percentage':
          return `${Math.round(value * 100) / 100}%`;
        case 'date':
          return new Date(value).toLocaleDateString('vi-VN');
        default:
          return value.toString();
      }
    };

    // Tính tổng cộng cho các báo cáo đặc biệt
    const getTotalRow = () => {
      if (selectedReportType === 'BaoCaoHieuSuatKhoaHoc') {
        const totalRegistrations = reportData.reduce((sum, row) => sum + (row.SoLuongDangKy || 0), 0);
        const totalRevenue = reportData.reduce((sum, row) => sum + (row.TongDoanhThu || 0), 0);
        const totalProfit = reportData.reduce((sum, row) => sum + (row.LoiNhuanRong || 0), 0);
        const avgSuccessRate = reportData.length > 0 ? reportData.reduce((sum, row) => sum + (row.TyLeDat_Pct || 0), 0) / reportData.length : 0;

        return `
          <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Tổng cộng</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: left;">${reportData.length} khóa học</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalRegistrations.toLocaleString('vi-VN')}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalRevenue.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalProfit.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${Math.round(avgSuccessRate * 100) / 100}%</td>
          </tr>`;
      }

      if (selectedReportType === 'BaoCaoTaiChinhTongHop') {
        const totalRevenue = reportData.reduce((sum, row) => sum + (row.TongDoanhThu || 0), 0);
        const totalDirectCost = reportData.reduce((sum, row) => sum + (row.TongChiPhiTrucTiep || 0), 0);
        const totalIndirectCost = reportData.reduce((sum, row) => sum + (row.TongChiPhiChung || 0), 0);
        const totalProfit = reportData.reduce((sum, row) => sum + (row.LoiNhuanRong || 0), 0);

        return `
          <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Tổng cộng</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: left;">${reportData.length} kỳ báo cáo</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalRevenue.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalDirectCost.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalIndirectCost.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalProfit.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${reportData.length > 0 ? Math.round((totalProfit / totalRevenue) * 100 * 100) / 100 : 0}%</td>
          </tr>`;
      }

      if (selectedReportType === 'BaoCaoChiPhiChiTiet') {
        const totalCost = reportData.reduce((sum, row) => sum + (row.SoTien || 0), 0);

        return `
          <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;" colspan="${columns.length}">Tổng cộng: ${reportData.length} khoản chi</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalCost.toLocaleString('vi-VN')} VND</td>
          </tr>`;
      }

      if (selectedReportType === 'BaoCaoLoiNhuanRongTheoLop') {
        const totalRevenue = reportData.reduce((sum, row) => sum + (row.DoanhThu || 0), 0);
        const totalDirectCost = reportData.reduce((sum, row) => sum + (row.ChiPhiTrucTiep || 0), 0);
        const totalIndirectCost = reportData.reduce((sum, row) => sum + (row.ChiPhiChungDuocPhanBo || 0), 0);
        const totalProfit = reportData.reduce((sum, row) => sum + (row.LoiNhuanRong || 0), 0);

        return `
          <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Tổng cộng</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: left;">${reportData.length} lớp học</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: left;">Tất cả khóa học</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: left;">Tất cả địa điểm</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalRevenue.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalDirectCost.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalIndirectCost.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalProfit.toLocaleString('vi-VN')} VND</td>
          </tr>`;
      }

      if (selectedReportType === 'BaoCaoHieuSuatGiangVien') {
        const totalClasses = reportData.reduce((sum, row) => sum + (row.SoLopDay || 0), 0);
        const totalStudents = reportData.reduce((sum, row) => sum + (row.TongSoHVDuocXet || 0), 0);
        const avgSuccessRate = reportData.length > 0 ? reportData.reduce((sum, row) => sum + (row.TiLeDat_Pct || 0), 0) / reportData.length : 0;
        const avgScore = reportData.length > 0 ? reportData.reduce((sum, row) => sum + (row.DiemTbXetTotNghiep_ToanGV || 0), 0) / reportData.length : 0;

        return `
          <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Tổng cộng</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: left;">${reportData.length} giảng viên</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalClasses.toLocaleString('vi-VN')}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalStudents.toLocaleString('vi-VN')}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${Math.round(avgSuccessRate * 100) / 100}%</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${Math.round(avgScore * 100) / 100}</td>
          </tr>`;
      }

      if (selectedReportType === 'BaoCaoHieuSuatCoSo') {
        const totalClasses = reportData.reduce((sum, row) => sum + (row.SoLopHoatDongTrongKy || 0), 0);
        const totalStudents = reportData.reduce((sum, row) => sum + (row.SoHocVienThucTe || 0), 0);
        const totalRevenue = reportData.reduce((sum, row) => sum + (row.DoanhThuTrongKy || 0), 0);
        const totalCost = reportData.reduce((sum, row) => sum + (row.ChiPhiTrongKy || 0), 0);
        const totalProfit = reportData.reduce((sum, row) => sum + (row.LoiNhuanTrongKy || 0), 0);
        const avgOccupancyRate = reportData.length > 0 ? reportData.reduce((sum, row) => sum + (row.TyLeLapDayTrungBinh_Pct || 0), 0) / reportData.length : 0;

        return `
          <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Tổng cộng</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: left;">${reportData.length} cơ sở</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalClasses.toLocaleString('vi-VN')}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalStudents.toLocaleString('vi-VN')}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalRevenue.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalCost.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalProfit.toLocaleString('vi-VN')} VND</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${Math.round(avgOccupancyRate * 100) / 100}%</td>
          </tr>`;
      }

      return '';
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            @page {
              margin: 1cm;
              size: A4;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12px;
              margin: 0;
              padding: 10px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .logo-section {
              display: flex;
              align-items: center;
              justify-content: flex-start;
              margin-bottom: 5px;
            }
            .logo {
              width: 60px;
              height: 40px;
              margin-right: 15px;
              object-fit: contain;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              color: #000;
            }
            .company-info {
              font-size: 11px;
              color: #666;
              margin: 2px 0;
            }
            .report-title {
              font-size: 14px;
              font-weight: bold;
              margin: 10px 0 5px 0;
              text-transform: uppercase;
            }
            .report-period {
              font-size: 11px;
              color: #666;
              margin-bottom: 5px;
            }
            .report-meta {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 10px;
            }
            .table-container {
              margin: 15px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px;
              vertical-align: middle;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .total-row {
              font-weight: bold;
              background-color: #e0e0e0;
            }
            .signature-section {
              margin-top: 30px;
              display: table;
              width: 100%;
            }
            .signature-block {
              display: table-cell;
              width: 50%;
              text-align: center;
              padding: 40px 20px 0 20px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              margin: 20px 0 5px 0;
              display: inline-block;
              width: 150px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .toolbar-spacer {
              width: 30px;
            }
            .report-info {
              margin-left: 20px;
            }
            @media print {
              body { margin: 0; padding: 5px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <img src="/assets/izone-logo-color.png" alt="Logo IZONE" class="logo" />
            </div>
            <div class="company-name">TRUNG TÂM ANH NGỮ IZONE</div>
            <div class="company-info">
              Địa chỉ: Số 4, Ngõ 95 Hoàng Cầu, Phường Đống Đa, TP. Hà Nội 
              Website: https://www.izone.edu.vn    
              Hotline: 1900 63 66 82
            </div>

            <div class="report-title">${reportTitle.toUpperCase()}</div>
            <div class="report-period">
              Từ ngày: ${dateRange.start.toLocaleDateString('vi-VN')} Đến ngày: ${dateRange.end.toLocaleDateString('vi-VN')}
            </div>

            <div class="report-meta">
              <div>Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</div>
              <div>Người tạo: Admin</div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0;">STT</td>
                  ${columns.map(col => `<td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0;">${col.label}</td>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${reportData.map((row, index) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
                    ${columns.map(col => `<td style="border: 1px solid #000; padding: 8px; text-align: ${col.type === 'currency' || col.type === 'number' || col.type === 'percentage' ? 'right' : 'left'};">${formatValue(row[col.key], col.type)}</td>`).join('')}
                  </tr>
                `).join('')}
                ${getTotalRow()}
              </tbody>
            </table>
          </div>

          <div class="signature-section">
            <div class="signature-block">
              <div>Người lập báo cáo</div>
              <div class="signature-line"></div>
              <div>(Ký, ghi rõ họ tên)</div>
            </div>
            <div class="signature-block">
              <div>Quản lý / Giám đốc</div>
              <div class="signature-line"></div>
              <div>(Ký, ghi rõ họ tên)</div>
            </div>
          </div>

          <div class="footer">
            Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}                    
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Đợi một chút để nội dung được render xong
    setTimeout(() => {
      printWindow.print();
      // Đóng cửa sổ sau khi in (tùy chọn)
      // printWindow.close();
    }, 500);
  };

  const getColumnsForReportType = (reportType: string) => {
    return COLUMN_CONFIGS[reportType] || [];
  };

  const formatCellValue = (value: any, type: string) => {
    if (!value) return '';

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('vi-VN').format(value);
      case 'percentage':
        return `${Math.round(value * 100) / 100}%`;
      case 'date':
        return new Date(value).toLocaleDateString('vi-VN');
      default:
        return value.toString();
    }
  };

  return (
    <div className="admin-reports">
      <div className="reports-header">
        <h2>📊 Báo cáo & Thống kê</h2>
      </div>

      <div className="reports-container">
        {/* Khu vực Điều khiển (Control Panel) */}
        <div className="control-panel">
          <div className="control-section">
            <label>Chọn loại báo cáo:</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="report-type-select"
            >
              <option value="">-- Chọn loại báo cáo --</option>
              <optgroup label="📊 Báo cáo Tài chính">
                {FINANCIAL_REPORTS.map(report => (
                  <option key={report.value} value={report.value}>
                    {report.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="📚 Báo cáo Đào tạo">
                {TRAINING_REPORTS.map(report => (
                  <option key={report.value} value={report.value}>
                    {report.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🏢 Báo cáo Vận hành">
                {OPERATIONAL_REPORTS.map(report => (
                  <option key={report.value} value={report.value}>
                    {report.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="control-section">
            <label>Bộ lọc Thời gian:</label>
            <div className="date-range-inputs">
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  start: new Date(e.target.value)
                }))}
              />
              <span>đến</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  end: new Date(e.target.value)
                }))}
              />
            </div>
            <div className="quick-date-buttons">
              <button onClick={() => setDateRange({
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                end: new Date()
              })}>
                7 ngày
              </button>
              <button onClick={() => setDateRange({
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date()
              })}>
                Tháng này
              </button>
              <button onClick={() => setDateRange({
                start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                end: new Date()
              })}>
                Quý này
              </button>
              <button onClick={() => setDateRange({
                start: new Date(new Date().getFullYear(), 0, 1),
                end: new Date()
              })}>
                Năm nay
              </button>
            </div>
          </div>

          <div className="control-section">
            <button
              className="btn-generate-report"
              onClick={handleGenerateReport}
              disabled={loading || !selectedReportType}
            >
              {loading ? '⏳ Đang tạo...' : '📊 Tạo Báo cáo'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


        </div>

        {/* Khu vực Hiển thị Kết quả (Results Area) */}
        <div className="results-area">
          {/* Thanh công cụ cho bảng báo cáo */}
          {reportData.length > 0 && (
            <div className="table-toolbar">
              <div className="toolbar-actions">
                <button
                  className="btn-print-report"
                  onClick={handlePrintReport}
                  title="In báo cáo"
                >
                  🖨️ In Báo cáo
                </button>
              </div>

              <div className="toolbar-spacer"></div>

              <div className="report-info">
                <span><strong>Loại:</strong> {FINANCIAL_REPORTS.concat(TRAINING_REPORTS, OPERATIONAL_REPORTS)
                  .find(r => r.value === selectedReportType)?.label}</span>
                <span><strong>Kỳ báo cáo:</strong> {dateRange.start.toLocaleDateString('vi-VN')} - {dateRange.end.toLocaleDateString('vi-VN')}</span>
                <span><strong>Số bản ghi:</strong> {reportData.length}</span>
                <span><strong>Ngày tạo:</strong> {new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <p>⏳ Đang tạo báo cáo...</p>
            </div>
          ) : reportData.length > 0 ? (
            <div className="report-results">
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      {getColumnsForReportType(selectedReportType).map((col, index) => (
                        <th key={index}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{rowIndex + 1}</td>
                        {getColumnsForReportType(selectedReportType).map((col, colIndex) => (
                          <td key={colIndex}>
                            {formatCellValue(row[col.key], col.type)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dòng tổng kết */}
              <div className="report-summary">
                <strong>Tổng kết:</strong>
                <span>Tổng số bản ghi: {reportData.length}</span>
                {selectedReportType === 'BaoCaoChiPhiChiTiet' && (
                  <span>Tổng chi phí: {formatCellValue(
                    reportData.reduce((sum, row) => sum + (row.SoTien || 0), 0),
                    'currency'
                  )}</span>
                )}
                {selectedReportType === 'BaoCaoTaiChinhTongHop' && (
                  <>
                    <span>Tổng doanh thu: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.TongDoanhThu || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng chi phí trực tiếp: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.TongChiPhiTrucTiep || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng chi phí chung: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.TongChiPhiChung || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng lợi nhuận ròng: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.LoiNhuanRong || 0), 0),
                      'currency'
                    )}</span>
                  </>
                )}
                {selectedReportType === 'BaoCaoLoiNhuanRongTheoLop' && (
                  <>
                    <span>Tổng doanh thu: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.DoanhThu || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng chi phí trực tiếp: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.ChiPhiTrucTiep || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng chi phí chung được phân bổ: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.ChiPhiChungDuocPhanBo || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng lợi nhuận ròng: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.LoiNhuanRong || 0), 0),
                      'currency'
                    )}</span>
                  </>
                )}
                {selectedReportType === 'BaoCaoHieuSuatKhoaHoc' && (
                  <>
                    <span>Tổng số khóa học: {reportData.length}</span>
                    <span>Tổng số đăng ký: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.SoLuongDangKy || 0), 0),
                      'number'
                    )}</span>
                    <span>Tổng doanh thu: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.TongDoanhThu || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng lợi nhuận ròng: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.LoiNhuanRong || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tỷ lệ đạt TB: {formatCellValue(
                      reportData.length > 0 ? reportData.reduce((sum, row) => sum + (row.TyLeDat_Pct || 0), 0) / reportData.length : 0,
                      'percentage'
                    )}</span>
                  </>
                )}
                {selectedReportType === 'BaoCaoHieuSuatCoSo' && (
                  <>
                    <span>Tổng số cơ sở: {reportData.length}</span>
                    <span>Tổng số lớp hoạt động: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.SoLopHoatDongTrongKy || 0), 0),
                      'number'
                    )}</span>
                    <span>Tổng số học viên thực tế: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.SoHocVienThucTe || 0), 0),
                      'number'
                    )}</span>
                    <span>Tổng doanh thu: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.DoanhThuTrongKy || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng chi phí: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.ChiPhiTrongKy || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tổng lợi nhuận: {formatCellValue(
                      reportData.reduce((sum, row) => sum + (row.LoiNhuanTrongKy || 0), 0),
                      'currency'
                    )}</span>
                    <span>Tỷ lệ lấp đầy TB: {formatCellValue(
                      reportData.length > 0 ? reportData.reduce((sum, row) => sum + (row.TyLeLapDayTrungBinh_Pct || 0), 0) / reportData.length : 0,
                      'percentage'
                    )}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>📋 Chọn loại báo cáo và nhấn "Tạo Báo cáo" để xem kết quả</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default AdminReports;
