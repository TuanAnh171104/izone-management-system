import React, { useState, useEffect } from 'react';
import { predictionService } from '../../services/api';

export interface PredictionData {
  dangKyID: number;
  hocVienID: number;
  lopID: number;
  tyLeChuyenCan_NuaDau: number;
  soBuoiVang_NuaDau: number;
  soBuoiVangDau: number;
  diemGiuaKy?: number;
  ketQuaGiuaKy: number;
  soNgayDangKySom: number;
  tuoiHocVien: number;
  khoaHocID: number;
  giangVienID: number;
  diaDiemID: number;
  tyLeBoHoc: number;
  hoTenHocVien?: string;
  tenLop?: string;
  tenKhoaHoc?: string;
  hoTenGiangVien?: string;
  tenCoSo?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const AdminPrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all'); // 'all', 'low', 'medium', 'high', 'very-high'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await predictionService.getStudentDropoutPredictions();
      setPredictions(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách dự báo:', error);
      setError('Không thể tải danh sách dự báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Get risk level color based on dropout percentage
  const getRiskColor = (riskPercentage: number) => {
    if (riskPercentage >= 70) return 'rgba(239, 68, 68, 0.1)'; // red-500
    if (riskPercentage >= 50) return 'rgba(245, 101, 101, 0.1)'; // red-400
    if (riskPercentage >= 30) return 'rgba(251, 191, 36, 0.1)'; // yellow-400
    return 'rgba(34, 197, 94, 0.1)'; // green-500
  };

  const getRiskTextColor = (riskPercentage: number) => {
    if (riskPercentage >= 70) return '#dc2626'; // red-600
    if (riskPercentage >= 50) return '#ef4444'; // red-500
    if (riskPercentage >= 30) return '#f59e0b'; // yellow-500
    return '#16a34a'; // green-600
  };

  const getRiskLevel = (riskPercentage: number) => {
    if (riskPercentage >= 70) return 'Rất cao';
    if (riskPercentage >= 50) return 'Cao';
    if (riskPercentage >= 30) return 'Trung bình';
    return 'Thấp';
  };

  // Risk filter logic
  const getRiskFilterRange = (filter: string) => {
    switch (filter) {
      case 'low': return [0, 29.9];
      case 'medium': return [30, 49.9];
      case 'high': return [50, 69.9];
      case 'very-high': return [70, 100];
      default: return [0, 100];
    }
  };

  // Pagination logic
  const filteredPredictions = predictions.filter(prediction => {
    if (!prediction) return false;

    // Search filter
    const searchMatch = prediction.hoTenHocVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           prediction.tenLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           prediction.tenKhoaHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           prediction.hoTenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           prediction.tenCoSo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ((prediction.hocVienID || '').toString().includes(searchTerm));

    // Risk filter
    const [minRisk, maxRisk] = getRiskFilterRange(riskFilter);
    const riskMatch = riskFilter === 'all' || (prediction.tyLeBoHoc >= minRisk && prediction.tyLeBoHoc <= maxRisk);

    return searchMatch && riskMatch;
  });

  // Calculate pagination
  const totalFilteredItems = filteredPredictions.length;
  const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedPredictions = filteredPredictions.slice(startIndex, startIndex + pagination.itemsPerPage);

  // Update pagination state when filtered results change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(totalFilteredItems / prev.itemsPerPage),
      totalItems: totalFilteredItems,
      currentPage: totalFilteredItems === 0 ? 1 : Math.min(prev.currentPage, Math.ceil(totalFilteredItems / prev.itemsPerPage))
    }));
  }, [totalFilteredItems]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(totalFilteredItems / itemsPerPage)
    }));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị {startIndex + 1}-{Math.min(startIndex + pagination.itemsPerPage, totalFilteredItems)} của {totalFilteredItems} kết quả
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            ‹ Trước
          </button>

          {startPage > 1 && (
            <>
              <button onClick={() => handlePageChange(1)} className="pagination-btn">1</button>
              {startPage > 2 && <span className="pagination-dots">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-btn ${pagination.currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
              <button onClick={() => handlePageChange(totalPages)} className="pagination-btn">{totalPages}</button>
            </>
          )}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === totalPages}
            className="pagination-btn"
          >
            Sau ›
          </button>
        </div>

        <div className="pagination-size">
          <label>Hiển thị:</label>
          <select
            value={pagination.itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="pagination-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Dự báo tỷ lệ bỏ học</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Dự báo tỷ lệ bỏ học</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchPredictions} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Dự báo tỷ lệ bỏ học</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên học viên, lớp học hoặc khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '350px'
            }}
          />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginLeft: '10px'
            }}
          >
            <option value="all">Tất cả mức độ</option>
            <option value="low">Thấp {`<`} 30%</option>
            <option value="medium">Trung bình (30-50%)</option>
            <option value="high">Cao (50-70%)</option>
            <option value="very-high">Rất cao {`>`} 70%</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-container" style={{
        background: '#e9ecef',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <strong>Tổng học viên dự báo:</strong> {filteredPredictions.length}
        </div>
        <div>
          <strong>Mức thấp ({`<`} 30%):</strong> {filteredPredictions.filter(p => p.tyLeBoHoc >= 0 && p.tyLeBoHoc < 30).length}
        </div>
        <div>
          <strong>Trung bình (30-50%):</strong> {filteredPredictions.filter(p => p.tyLeBoHoc >= 30 && p.tyLeBoHoc < 50).length}
        </div>
        <div>
          <strong>Mức cao (50-70%):</strong> {filteredPredictions.filter(p => p.tyLeBoHoc >= 50 && p.tyLeBoHoc < 70).length}
        </div>
        <div>
          <strong>Rất cao ({`>`} 70%):</strong> {filteredPredictions.filter(p => p.tyLeBoHoc >= 70).length}
        </div>
      </div>

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã HV</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Khóa học</th>
              <th>Chuyên cần (%)</th>
              <th>Vắng (buổi)</th>
              <th>Điểm GK</th>
              <th>Giảng viên</th>
              <th>Tỷ lệ bỏ học</th>
              <th>Mức độ rủi ro</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPredictions.map(prediction => (
              <tr key={prediction.dangKyID}
                  style={{
                    backgroundColor: getRiskColor(prediction.tyLeBoHoc)
                  }}>
                <td>{prediction.hocVienID}</td>
                <td>{prediction.hoTenHocVien || 'Chưa cập nhật'}</td>
                <td>{prediction.tenLop || 'Chưa cập nhật'}</td>
                <td>{prediction.tenKhoaHoc || 'Chưa cập nhật'}</td>
                <td>{(prediction.tyLeChuyenCan_NuaDau * 100).toFixed(1)}%</td>
                <td>{prediction.soBuoiVang_NuaDau}</td>
                <td>{prediction.diemGiuaKy?.toFixed(1) || 'Chưa có'}</td>
                <td>{prediction.hoTenGiangVien || 'Chưa cập nhật'}</td>
                <td>
                  <span style={{
                    color: prediction.tyLeBoHoc == null ? '#6c757d' : getRiskTextColor(prediction.tyLeBoHoc),
                    fontWeight: 'bold'
                  }}>
                    {prediction.tyLeBoHoc == null ? 'Chưa đủ dữ liệu' : `${prediction.tyLeBoHoc.toFixed(1)}%`}
                  </span>
                </td>
                <td>
                  <span style={{
                    color: prediction.tyLeBoHoc == null ? '#6c757d' : getRiskTextColor(prediction.tyLeBoHoc),
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: prediction.tyLeBoHoc == null ? '#e9ecef' : getRiskColor(prediction.tyLeBoHoc)
                  }}>
                    {prediction.tyLeBoHoc == null ? 'Chưa có' : getRiskLevel(prediction.tyLeBoHoc)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPredictions.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {searchTerm ? 'Không tìm thấy kết quả nào phù hợp.' : 'Không có dữ liệu dự báo nào.'}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default AdminPrediction;
