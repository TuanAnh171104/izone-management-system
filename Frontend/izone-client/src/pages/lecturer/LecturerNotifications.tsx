import React, { useState, useEffect } from 'react';
import { thongBaoService, ThongBao } from '../../services/api';
import '../../styles/Lecturer.css';

interface NotificationWithType extends ThongBao {
  type: 'personal' | 'class' | 'system';
  className?: string;
  classId?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const LecturerNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'personal' | 'class' | 'system'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 5
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Reset to first page when filter or search changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filter, searchTerm]);

  useEffect(() => {
    // Update pagination info when notifications change
    updatePaginationInfo();
  }, [notifications, filter, searchTerm]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user info to get giangVienID
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        setError('Không tìm thấy thông tin user trong localStorage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userInfo);
      const giangVienID = user.giangVienID;

      if (!giangVienID) {
        setError('Tài khoản của bạn chưa được liên kết với thông tin giảng viên');
        setLoading(false);
        return;
      }

      console.log('🔄 Đang lấy thông báo cho giảng viên:', giangVienID);

      // Get notifications by recipient ID (this will include both personal and class notifications)
      const response = await thongBaoService.getByNguoiNhan(giangVienID);
      console.log('✅ Nhận thông báo:', response);

      // Process notifications to add type information
      const processedNotifications: NotificationWithType[] = response.map(notification => {
        let type: 'personal' | 'class' | 'system' = 'personal';
        let className = '';
        let classId: number | undefined;

        if (notification.loaiNguoiNhan === 'LopHoc' && notification.nguoiNhanID) {
          type = 'class';
          classId = notification.nguoiNhanID;
        } else if (notification.loaiNguoiNhan === 'ToanHeThong') {
          type = 'system';
        }

        return {
          ...notification,
          type,
          classId
        };
      });

      // Sort by date (newest first)
      processedNotifications.sort((a, b) => new Date(b.ngayGui).getTime() - new Date(a.ngayGui).getTime());

      setNotifications(processedNotifications);
    } catch (error: any) {
      console.error('❌ Lỗi khi tải thông báo:', error);
      setError('Không thể tải danh sách thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const updatePaginationInfo = () => {
    const filteredCount = filteredNotifications.length;
    const totalPages = Math.ceil(filteredCount / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalPages,
      totalItems: filteredCount
    }));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return 'fas fa-user';
      case 'class':
        return 'fas fa-chalkboard-teacher';
      case 'system':
        return 'fas fa-bullhorn';
      default:
        return 'fas fa-bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'personal':
        return { backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6' };
      case 'class':
        return { backgroundColor: '#dcfce7', borderLeft: '4px solid #10b981' };
      case 'system':
        return { backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' };
      default:
        return { backgroundColor: '#f3f4f6', borderLeft: '4px solid #6b7280' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      // Hiển thị cả thời gian tương đối và giờ chính xác cho thông báo trong ngày
      const timeStr = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${diffInHours} giờ trước (${timeStr})`;
    } else if (diffInHours < 168) { // 7 days
      // Hiển thị cả số ngày trước và ngày giờ chính xác cho thông báo trong tuần
      const days = Math.floor(diffInHours / 24);
      const dateStr = date.toLocaleDateString('vi-VN');
      const timeStr = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${days} ngày trước (${dateStr} ${timeStr})`;
    } else {
      // Hiển thị đầy đủ ngày giờ cho thông báo cũ
      return date.toLocaleString('vi-VN');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filter !== 'all' && notification.type !== filter) {
      return false;
    }

    // Filter by search term
    if (searchTerm && !notification.noiDung.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Get current page notifications
  const getCurrentPageNotifications = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredNotifications.slice(startIndex, endIndex);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleNextPage = () => {
    handlePageChange(pagination.currentPage + 1);
  };

  const handlePrevPage = () => {
    handlePageChange(pagination.currentPage - 1);
  };

  // Generate page numbers for pagination UI
  const getPageNumbers = () => {
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

    return pages;
  };

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case 'personal':
        return 'Cá nhân';
      case 'class':
        return 'Lớp học';
      case 'system':
        return 'Hệ thống';
      default:
        return 'Tất cả';
    }
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Thông báo</h2>
        </div>
        <div className="loading">Đang tải thông báo...</div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Thông báo</h2>
      </div>

      {/* Filter and Search Section */}
      <div className="notification-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div className="filter-buttons" style={{ display: 'flex', gap: '10px' }}>
          {['all', 'personal', 'class', 'system'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`filter-btn ${filter === filterType ? 'active' : ''}`}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                background: filter === filterType ? '#dc2626' : 'white',
                color: filter === filterType ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {getFilterLabel(filterType)}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '250px'
            }}
          />
          <i className="fas fa-search" style={{ color: '#6b7280' }}></i>
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
        </div>
      )}

      {/* Notifications List */}
      <div className="notifications-container">
        {filteredNotifications.length === 0 && !error ? (
          <div className="no-notifications" style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <i className="fas fa-bell-slash" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <h3 style={{ margin: '0 0 8px 0' }}>
              {filter === 'all' ? 'Chưa có thông báo nào' :
               `Chưa có thông báo ${getFilterLabel(filter).toLowerCase()} nào`}
            </h3>
            <p style={{ margin: 0 }}>
              {searchTerm ? 'Không tìm thấy thông báo phù hợp với từ khóa tìm kiếm.' :
               'Thông báo mới sẽ xuất hiện ở đây.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getCurrentPageNotifications().map((notification) => (
                <div
                  key={notification.tBID}
                  className="notification-card"
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    ...getNotificationColor(notification.type)
                  }}
                >
                  <div className="notification-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: notification.type === 'personal' ? '#3b82f6' :
                                   notification.type === 'class' ? '#10b981' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className={getNotificationIcon(notification.type)}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {notification.type === 'personal' && 'Thông báo cá nhân'}
                          {notification.type === 'class' && `Thông báo lớp học`}
                          {notification.type === 'system' && 'Thông báo hệ thống'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {notification.nguoiGui && `Từ: ${notification.nguoiGui} • `}
                          {formatDate(notification.ngayGui)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="notification-content" style={{
                    color: '#374151',
                    lineHeight: '1.5',
                    marginBottom: '12px'
                  }}>
                    {notification.noiDung}
                  </div>

                  {notification.type === 'class' && notification.classId && (
                    <div style={{
                      fontSize: '12px',
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      <i className="fas fa-tag"></i> Lớp ID: {notification.classId}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination UI */}
            {pagination.totalPages > 1 && (
              <div className="pagination-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                marginTop: '30px',
                padding: '20px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: pagination.currentPage === 1 ? '#f3f4f6' : 'white',
                    color: pagination.currentPage === 1 ? '#9ca3af' : '#333',
                    cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fas fa-chevron-left"></i> Trước
                </button>

                <div className="page-numbers" style={{ display: 'flex', gap: '5px' }}>
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: pagination.currentPage === pageNum ? '#dc2626' : 'white',
                        color: pagination.currentPage === pageNum ? 'white' : '#333',
                        cursor: 'pointer',
                        fontSize: '14px',
                        minWidth: '40px'
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: pagination.currentPage === pagination.totalPages ? '#f3f4f6' : 'white',
                    color: pagination.currentPage === pagination.totalPages ? '#9ca3af' : '#333',
                    cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Sau <i className="fas fa-chevron-right"></i>
                </button>

                <div style={{
                  marginLeft: '20px',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} của {pagination.totalItems} thông báo
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LecturerNotifications;
