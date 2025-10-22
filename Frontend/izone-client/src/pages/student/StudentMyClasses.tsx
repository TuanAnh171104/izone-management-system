import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { lopHocService, LopHoc, khoaHocService, KhoaHoc, diaDiemService, DiaDiem } from '../../services/api';
import '../../styles/Management.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const StudentMyClasses: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<LopHoc[]>([]);
  const [khoaHocs, setKhoaHocs] = useState<KhoaHoc[]>([]);
  const [diaDiems, setDiaDiems] = useState<DiaDiem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 6
  });
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search term
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      fetchClasses();
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm, statusFilter]);

  // Load khoa hoc and dia diem data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [khoaHocData, diaDiemData] = await Promise.all([
          khoaHocService.getAll(),
          diaDiemService.getAll()
        ]);
        setKhoaHocs(khoaHocData);
        setDiaDiems(diaDiemData);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu tham khảo:', error);
      }
    };

    loadReferenceData();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user info to filter classes for current student
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        setError('Không tìm thấy thông tin user trong localStorage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userInfo);

      if (!user.hocVienID) {
        setError('Tài khoản của bạn chưa được liên kết với thông tin học viên');
        setClasses([]);
        setLoading(false);
        return;
      }

      console.log('🔄 Đang gọi API phân trang cho học viên:', {
        hocVienID: user.hocVienID,
        page: pagination.currentPage,
        pageSize: pagination.itemsPerPage,
        searchTerm: debouncedSearchTerm,
        statusFilter
      });

      const response = await lopHocService.getPaginatedByStudent(
        user.hocVienID,
        pagination.currentPage,
        pagination.itemsPerPage,
        debouncedSearchTerm,
        statusFilter
      );

      console.log('✅ Nhận dữ liệu phân trang:', response);
      setClasses(response.data);
      setPagination(prev => ({
        ...prev,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems
      }));
    } catch (error: any) {
      console.error('❌ Lỗi khi tải danh sách lớp học:', error);
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true); // Hiển thị trạng thái đang tìm kiếm
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1
    }));
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'đang hoạt động':
      case 'danghoc':
      case 'đang học':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'completed':
      case 'hoàn thành':
      case 'hoanthanh':
        return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
      case 'upcoming':
      case 'sắp tới':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      default:
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getKhoaHocName = (khoaHocID: number | null): string => {
    if (!khoaHocID || khoaHocID === 0) return 'Chưa xác định';
    const khoaHoc = khoaHocs.find(k => k.khoaHocID === khoaHocID);
    return khoaHoc ? khoaHoc.tenKhoaHoc : `Khóa học ${khoaHocID}`;
  };

  const getDiaDiemName = (diaDiemID: number | null): string => {
    if (!diaDiemID || diaDiemID === 0) return 'Chưa xác định';
    const diaDiem = diaDiems.find(d => d.diaDiemID === diaDiemID);
    return diaDiem ? diaDiem.tenCoSo : `Địa điểm ${diaDiemID}`;
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}-
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} của {pagination.totalItems} kết quả
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

          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="pagination-dots">...</span>}
              <button onClick={() => handlePageChange(pagination.totalPages)} className="pagination-btn">
                {pagination.totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
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
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Lớp học của tôi</h2>
        </div>
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Lớp học của tôi</h2>
        <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="search-section" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm theo ID lớp, ID khóa học, tên khóa học..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '350px'
            }}
          />
          {isSearching && (
            <div style={{
              position: 'absolute',
              right: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#6b7280',
              fontSize: '12px'
            }}>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Đang tìm...</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: statusFilter === 'all' ? '#dc2626' : 'white',
              color: statusFilter === 'all' ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Tất cả
          </button>
          <button
            onClick={() => handleStatusFilterChange('upcoming')}
            className={`filter-btn ${statusFilter === 'upcoming' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: statusFilter === 'upcoming' ? '#dc2626' : 'white',
              color: statusFilter === 'upcoming' ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Chưa bắt đầu
          </button>
          <button
            onClick={() => handleStatusFilterChange('ongoing')}
            className={`filter-btn ${statusFilter === 'ongoing' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: statusFilter === 'ongoing' ? '#dc2626' : 'white',
              color: statusFilter === 'ongoing' ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Đang diễn ra
          </button>
          <button
            onClick={() => handleStatusFilterChange('completed')}
            className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: statusFilter === 'completed' ? '#dc2626' : 'white',
              color: statusFilter === 'completed' ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Đã kết thúc
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          margin: '20px',
          textAlign: 'center',
          color: '#dc2626'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
          <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>{error}</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
        </div>
      )}

      {/* Classes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}>
        {classes.length === 0 && !error ? (
          <div className="no-data">
            {searchTerm || statusFilter !== 'all' ?
              'Không tìm thấy lớp học nào phù hợp với điều kiện lọc.' :
              'Bạn chưa đăng ký lớp học nào. Hãy đăng ký khóa học để bắt đầu học tập!'}
          </div>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.lopID} className="class-card" style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div className="class-header" style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#dc2626', fontSize: '18px' }}>
                  Lớp ID: {classItem.lopID}
                </h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  <strong>Khóa học:</strong> {getKhoaHocName(classItem.khoaHocID)}
                </p>
              </div>

              <div className="class-info" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-calendar" style={{ color: '#6b7280' }}></i>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      <strong>Bắt đầu:</strong> {formatDate(classItem.ngayBatDau)}
                    </span>
                  </div>

                  {classItem.ngayKetThuc && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-calendar-check" style={{ color: '#6b7280' }}></i>
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        <strong>Kết thúc:</strong> {formatDate(classItem.ngayKetThuc)}
                      </span>
                    </div>
                  )}

                  {classItem.diaDiemID && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-map-marker-alt" style={{ color: '#6b7280' }}></i>
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        <strong>Địa điểm:</strong> {getDiaDiemName(classItem.diaDiemID)}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-clock" style={{ color: '#6b7280' }}></i>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      <strong>Thời lượng:</strong> {classItem.thoiLuongGio} giờ
                    </span>
                  </div>

                  {classItem.soLuongToiDa && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-users" style={{ color: '#6b7280' }}></i>
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        <strong>Sức chứa tối đa:</strong> {classItem.soLuongToiDa}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="class-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  className="status"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    ...getStatusColor(classItem.trangThai || 'unknown')
                  }}
                >
                  {classItem.trangThai || 'Chưa xác định'}
                </span>

                <div className="action-buttons">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/student/class/${classItem.lopID}`)}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-eye"></i> Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default StudentMyClasses;
