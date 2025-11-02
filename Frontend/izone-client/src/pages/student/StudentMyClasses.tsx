import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { lopHocService, LopHoc, khoaHocService, KhoaHoc, diaDiemService, DiaDiem, dangKyLopService, DangKyLop, baoLuuService, BaoLuu } from '../../services/api';
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
  const [dangKyLops, setDangKyLops] = useState<DangKyLop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [selectedDangKyId, setSelectedDangKyId] = useState<number | null>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [availableRetakeClasses, setAvailableRetakeClasses] = useState<any[]>([]);
  const [eligibilityInfo, setEligibilityInfo] = useState<any>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [availableChangeClasses, setAvailableChangeClasses] = useState<any[]>([]);
  const [changeEligibilityInfo, setChangeEligibilityInfo] = useState<any>(null);
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

      // Fetch registration data for each class
      await fetchRegistrationData(user.hocVienID, response.data);
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

  const fetchRegistrationData = async (hocVienID: number, classes: LopHoc[]) => {
    try {
      // Get all registrations for the student
      const registrations = await dangKyLopService.getByHocVienId(hocVienID);
      setDangKyLops(registrations);

      // Get reservation data for each registration
      const registrationIds = registrations.map(reg => reg.dangKyID);
      if (registrationIds.length > 0) {
        try {
          // Get reservations for all registrations
          const allReservations = await baoLuuService.getAll();
          const relevantReservations = allReservations.filter(bl =>
            registrationIds.includes(bl.dangKyID)
          );
          // Store reservation data in state or use it directly
          (window as any).studentReservations = relevantReservations;
        } catch (error) {
          console.error('Lỗi khi tải dữ liệu bảo lưu:', error);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu đăng ký:', error);
    }
  };

  const handleContinueLearning = async (dangKyId: number) => {
    try {
      setSelectedDangKyId(dangKyId);
      const availableClassesData = await baoLuuService.getAvailableClassesForContinuing(dangKyId);
      setAvailableClasses(availableClassesData);
      setShowContinueModal(true);
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách lớp học khả dụng:', error);
      alert('Không thể lấy danh sách lớp học khả dụng. Vui lòng thử lại.');
    }
  };

  const handleSelectClass = async (newLopId: number) => {
    if (!selectedDangKyId) return;

    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        alert('Không tìm thấy thông tin đăng nhập');
        return;
      }

      const user = JSON.parse(userInfo);
      if (!user.hocVienID) {
        alert('Không tìm thấy thông tin học viên');
        return;
      }

      const request = {
        originalDangKyID: selectedDangKyId,
        newLopID: newLopId,
        hocVienID: user.hocVienID
      };

      await dangKyLopService.continueLearning(request);

      alert('Đăng ký học tiếp thành công! Bạn đã được miễn phí học phí.');
      setShowContinueModal(false);
      setSelectedDangKyId(null);
      setAvailableClasses([]);

      // Refresh the classes list
      fetchClasses();
    } catch (error: any) {
      console.error('Lỗi khi đăng ký học tiếp:', error);
      alert(`Lỗi khi đăng ký học tiếp: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleRetakeClass = async (dangKyId: number) => {
    try {
      // 1. Kiểm tra điều kiện học lại
      const eligibilityResponse = await dangKyLopService.checkEligibilityToRetake(dangKyId);
      setEligibilityInfo(eligibilityResponse);

      if (!eligibilityResponse.canRetake) {
        alert(`Không đủ điều kiện học lại: ${eligibilityResponse.reason}`);
        return;
      }

      // 2. Lấy danh sách lớp học khả dụng
      const availableClassesResponse = await dangKyLopService.getAvailableClassesForRetake(dangKyId);
      setAvailableRetakeClasses(availableClassesResponse.availableClasses);
      setSelectedDangKyId(dangKyId);
      setShowRetakeModal(true);

    } catch (error: any) {
      console.error('Lỗi khi kiểm tra điều kiện học lại:', error);
      alert(`Lỗi khi kiểm tra điều kiện học lại: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleSelectRetakeClass = async (newLopId: number) => {
    if (!selectedDangKyId) return;

    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        alert('Không tìm thấy thông tin đăng nhập');
        return;
      }

      const user = JSON.parse(userInfo);
      if (!user.hocVienID) {
        alert('Không tìm thấy thông tin học viên');
        return;
      }

      const request = {
        originalDangKyID: selectedDangKyId,
        newLopID: newLopId,
        hocVienID: user.hocVienID
      };

      await dangKyLopService.retakeClass(request);

      alert('Đăng ký học lại thành công! Bạn đã được miễn phí học phí.');
      setShowRetakeModal(false);
      setSelectedDangKyId(null);
      setAvailableRetakeClasses([]);
      setEligibilityInfo(null);

      // Refresh the classes list
      fetchClasses();
    } catch (error: any) {
      console.error('Lỗi khi đăng ký học lại:', error);
      alert(`Lỗi khi đăng ký học lại: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleChangeClass = async (dangKyId: number) => {
    try {
      // 1. Kiểm tra điều kiện đổi lớp
      const eligibilityResponse = await dangKyLopService.checkEligibilityToChange(dangKyId);
      setChangeEligibilityInfo(eligibilityResponse);

      if (!eligibilityResponse.canChange) {
        alert(`Không đủ điều kiện đổi lớp: ${eligibilityResponse.reason}`);
        return;
      }

      // 2. Lấy danh sách lớp học khả dụng
      const availableClassesResponse = await dangKyLopService.getAvailableClassesForChange(dangKyId);
      setAvailableChangeClasses(availableClassesResponse.availableClasses);
      setSelectedDangKyId(dangKyId);
      setShowChangeModal(true);

    } catch (error: any) {
      console.error('Lỗi khi kiểm tra điều kiện đổi lớp:', error);
      alert(`Lỗi khi kiểm tra điều kiện đổi lớp: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleSelectChangeClass = async (newLopId: number) => {
    if (!selectedDangKyId) return;

    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        alert('Không tìm thấy thông tin đăng nhập');
        return;
      }

      const user = JSON.parse(userInfo);
      if (!user.hocVienID) {
        alert('Không tìm thấy thông tin học viên');
        return;
      }

      const request = {
        originalDangKyID: selectedDangKyId,
        newLopID: newLopId,
        hocVienID: user.hocVienID
      };

      const response = await dangKyLopService.changeClass(request);

      let message = 'Đổi lớp thành công!';
      if (response.paymentRequired) {
        message += ` Cần thanh toán thêm ${response.feeDifference.toLocaleString('vi-VN')} VNĐ.`;

        // Nếu có VNPay URL, redirect đến trang thanh toán
        if (response.vnpayUrl) {
          message += ' Đang chuyển hướng đến trang thanh toán...';
          alert(message);

          // Redirect to VNPay payment page
          window.location.href = response.vnpayUrl;
          return;
        }
      } else if (response.refundAmount > 0) {
        message += ` Đã hoàn lại ${response.refundAmount.toLocaleString('vi-VN')} VNĐ vào ví.`;
      }

      alert(message);
      setShowChangeModal(false);
      setSelectedDangKyId(null);
      setAvailableChangeClasses([]);
      setChangeEligibilityInfo(null);

      // Refresh the classes list
      fetchClasses();
    } catch (error: any) {
      console.error('Lỗi khi đổi lớp:', error);
      alert(`Lỗi khi đổi lớp: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const getRegistrationForClass = (lopId: number): DangKyLop | undefined => {
    return dangKyLops.find(dk => dk.lopID === lopId);
  };

  const getReservationForRegistration = (dangKyId: number): BaoLuu | undefined => {
    const reservations = (window as any).studentReservations as BaoLuu[];
    return reservations?.find(bl => bl.dangKyID === dangKyId);
  };

  const canContinueLearning = (lopId: number): boolean => {
    const registration = getRegistrationForClass(lopId);
    if (!registration || registration.trangThaiDangKy !== 'DaBaoLuu') {
      return false;
    }

    const reservation = getReservationForRegistration(registration.dangKyID);
    if (!reservation) {
      return false;
    }

    // Only allow continue learning if reservation is approved but not used and not expired
    const isApproved = reservation.trangThai === 'DaDuyet';
    const isNotUsed = reservation.trangThai !== 'DaSuDung';
    const isNotExpired = Boolean(reservation.hanBaoLuu && new Date(reservation.hanBaoLuu) > new Date());

    return isApproved && isNotUsed && isNotExpired;
  };

  const getReservationStatus = (lopId: number): { reservation: BaoLuu | undefined; canContinue: boolean } => {
    const registration = getRegistrationForClass(lopId);
    const reservation = registration?.dangKyID ? getReservationForRegistration(registration.dangKyID) : undefined;
    const canContinue = canContinueLearning(lopId);

    return { reservation, canContinue };
  };

  const getContinueButtonStyle = (isDisabled: boolean, status: string) => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    background: status === 'DaSuDung'
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'  // Green for used
      : isDisabled
      ? '#6b7280'  // Gray for disabled
      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Orange for available
    color: 'white'
  });

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
                  {/* Single button based on class status */}
                  {(() => {
                    const registration = getRegistrationForClass(classItem.lopID);
                    const { reservation, canContinue } = getReservationStatus(classItem.lopID);

                    // If class is reserved (DaBaoLuu), show continue learning button
                    if (registration?.trangThaiDangKy === 'DaBaoLuu' && reservation) {
                      const isDisabled = !canContinue;
                      const buttonText = reservation.trangThai === 'DaSuDung'
                        ? 'Đã đi học tiếp'
                        : canContinue
                        ? 'Đi học tiếp'
                        : 'Không khả dụng';

                      const tooltipText = !canContinue
                        ? reservation.trangThai === 'DaSuDung'
                          ? 'Bảo lưu đã được sử dụng để đi học tiếp'
                          : 'Bảo lưu không khả dụng (chưa duyệt, hết hạn, hoặc đã sử dụng)'
                        : 'Nhấn để chọn lớp học mới và tiếp tục học';

                      return (
                        <button
                          className="btn-continue"
                          onClick={() => {
                            if (canContinue && registration) {
                              handleContinueLearning(registration.dangKyID);
                            }
                          }}
                          disabled={isDisabled}
                          style={getContinueButtonStyle(isDisabled, reservation.trangThai)}
                          title={tooltipText}
                        >
                          <i className="fas fa-play-circle"></i> {buttonText}
                        </button>
                      );
                    }

                    // Check if class is cancelled (DaHuy) - show cancelled status
                    if (registration?.trangThaiDangKy === 'DaHuy') {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fecaca'
                            }}
                          >
                            <i className="fas fa-ban"></i> Đã hủy
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            {registration.lyDoHuy || 'Lớp đã được hủy'}
                          </span>
                        </div>
                      );
                    }

                    // Check if class is not started (ChuaBatDau) or in progress (DangDienRa) - show change class button
                    if ((classItem.trangThai === 'ChuaBatDau' || classItem.trangThai === 'DangDienRa') && registration) {
                      const canChange = changeEligibilityInfo?.dangKyID === registration.dangKyID ? changeEligibilityInfo?.canChange : true;
                      const isFreeRegistration = changeEligibilityInfo?.dangKyID === registration.dangKyID ? changeEligibilityInfo?.isFreeRegistration : false;

                      return (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-change"
                            onClick={() => handleChangeClass(registration.dangKyID)}
                            disabled={!canChange || isFreeRegistration}
                            style={{
                              padding: '8px 16px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: (canChange && !isFreeRegistration) ? 'pointer' : 'not-allowed',
                              opacity: (canChange && !isFreeRegistration) ? 1 : 0.6,
                              background: (canChange && !isFreeRegistration)
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : '#6b7280',
                              color: 'white'
                            }}
                            title={!canChange
                              ? (changeEligibilityInfo?.reason || 'Không đủ điều kiện đổi lớp')
                              : isFreeRegistration
                                ? 'Không thể đổi lớp từ đăng ký miễn phí (học lại/bảo lưu)'
                                : 'Đổi sang lớp khác'}
                          >
                            <i className="fas fa-exchange-alt"></i> Đổi lớp
                          </button>
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
                            <i className="fas fa-eye"></i> Chi tiết
                          </button>
                        </div>
                      );
                    }

                    // Check if class is completed (DaKetThuc) - show retake button
                    if (classItem.trangThai === 'DaKetThuc' && registration) {
                      const canRetake = eligibilityInfo?.dangKyID === registration.dangKyID ? eligibilityInfo?.canRetake : true;

                      return (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-retake"
                            onClick={() => handleRetakeClass(registration.dangKyID)}
                            disabled={!canRetake}
                            style={{
                              padding: '8px 16px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: canRetake ? 'pointer' : 'not-allowed',
                              opacity: canRetake ? 1 : 0.6,
                              background: canRetake
                                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                : '#6b7280',
                              color: 'white'
                            }}
                            title={!canRetake ? 'Không đủ điều kiện học lại' : 'Học lại lớp này'}
                          >
                            <i className="fas fa-redo"></i> Học lại
                          </button>
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
                            <i className="fas fa-eye"></i> Chi tiết
                          </button>
                        </div>
                      );
                    }

                    // Default: show view detail button for regular classes
                    return (
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
                    );
                  })()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Continue Learning Modal */}
      {showContinueModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowContinueModal(false);
                setSelectedDangKyId(null);
                setAvailableClasses([]);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                zIndex: 1001,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Đóng"
            >
              <i className="fas fa-times"></i>
            </button>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '18px' }}>
                <i className="fas fa-play-circle"></i> Chọn lớp học để tiếp tục
              </h3>
            </div>

            {availableClasses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', marginBottom: '16px', color: '#f59e0b' }}></i>
                <h3 style={{ margin: '0 0 8px 0' }}>Không có lớp học khả dụng</h3>
                <p style={{ margin: 0 }}>
                  Hiện tại không có lớp học nào cùng khóa học với lớp đã bảo lưu.
                  Vui lòng liên hệ quản trị viên để được hỗ trợ.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {availableClasses.map((classItem) => (
                  <div key={classItem.lopID} style={{
                    border: '1px solidrgb(235, 229, 229)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: '#f9fafb'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#dc2626';
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onClick={() => handleSelectClass(classItem.lopID)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>
                          Lớp ID: {classItem.lopID}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', color: '#374151', fontSize: '14px' }}>
                          <strong>Khóa học:</strong> {classItem.khoaHoc?.tenKhoaHoc || 'Chưa xác định'}
                        </p>
                        <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                          <i className="fas fa-calendar"></i> Bắt đầu: {formatDate(classItem.ngayBatDau)}
                        </p>
                        <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                          <i className="fas fa-clock"></i> {classItem.caHoc} - {classItem.thoiLuongGio} giờ
                        </p>
                        {classItem.giangVien && (
                          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                            <i className="fas fa-chalkboard-teacher"></i> {classItem.giangVien.hoTen}
                          </p>
                        )}
                        {classItem.diaDiem && (
                          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                            <i className="fas fa-map-marker-alt"></i> {classItem.diaDiem.tenCoSo}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          Còn {classItem.availableSpots} chỗ
                        </div>
                        <button
                          style={{
                            padding: '8px 16px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Chọn lớp này
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                <i className="fas fa-info-circle"></i>
                Bạn sẽ được miễn phí học phí khi đăng ký lớp học mới từ bảo lưu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retake Class Modal */}
      {showRetakeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowRetakeModal(false);
                setSelectedDangKyId(null);
                setAvailableRetakeClasses([]);
                setEligibilityInfo(null);
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6b7280',
                zIndex: 1002,
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.borderColor = '#dc2626';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Đóng"
            >
              <i className="fas fa-times"></i>
            </button>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '18px' }}>
                <i className="fas fa-redo"></i> Chọn lớp học để học lại
              </h3>
            </div>

            {/* Hiển thị thông tin điều kiện học lại */}
            {eligibilityInfo && (
              <div style={{
                background: eligibilityInfo.canRetake ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${eligibilityInfo.canRetake ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  margin: '0 0 10px 0',
                  color: eligibilityInfo.canRetake ? '#166534' : '#dc2626'
                }}>
                  <i className={`fas ${eligibilityInfo.canRetake ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                  {eligibilityInfo.canRetake ? 'Đủ điều kiện học lại' : 'Không đủ điều kiện học lại'}
                </h4>

                <div style={{ fontSize: '14px', color: eligibilityInfo.canRetake ? '#166534' : '#dc2626' }}>
                  <p style={{ margin: '5px 0' }}><strong>Kết quả học tập:</strong> {eligibilityInfo.ketQua} (Điểm TB: {eligibilityInfo.diemTrungBinh})</p>
                  <p style={{ margin: '5px 0' }}><strong>Chuyên cần:</strong> {eligibilityInfo.tiLeChuyenCan}% ({eligibilityInfo.soBuoiCoMat}/{eligibilityInfo.tongSoBuoi} buổi)</p>
                  <p style={{ margin: '5px 0' }}><strong>Lý do:</strong> {eligibilityInfo.reason}</p>
                </div>
              </div>
            )}

            {availableRetakeClasses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', marginBottom: '16px', color: '#f59e0b' }}></i>
                <h3 style={{ margin: '0 0 8px 0' }}>Không có lớp học khả dụng</h3>
                <p style={{ margin: 0 }}>
                  Hiện tại không có lớp học nào cùng khóa học để học lại.
                  Vui lòng liên hệ quản trị viên để được hỗ trợ.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {availableRetakeClasses.map((classItem) => (
                  <div key={classItem.lopID} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: classItem.isFull ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: classItem.isFull ? '#f9fafb' : '#f9fafb',
                    opacity: classItem.isFull ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!classItem.isFull) {
                      e.currentTarget.style.borderColor = '#dc2626';
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!classItem.isFull) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onClick={() => !classItem.isFull && handleSelectRetakeClass(classItem.lopID)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>
                          Lớp ID: {classItem.lopID}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', color: '#374151', fontSize: '14px' }}>
                          <strong>Khóa học:</strong> {classItem.khoaHoc?.tenKhoaHoc || 'Chưa xác định'}
                        </p>
                        <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                          <i className="fas fa-calendar"></i> Bắt đầu: {formatDate(classItem.ngayBatDau)}
                        </p>
                        <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                          <i className="fas fa-clock"></i> {classItem.caHoc} - {classItem.thoiLuongGio} giờ
                        </p>
                        {classItem.giangVien && (
                          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                            <i className="fas fa-chalkboard-teacher"></i> {classItem.giangVien.hoTen}
                          </p>
                        )}
                        {classItem.diaDiem && (
                          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                            <i className="fas fa-map-marker-alt"></i> {classItem.diaDiem.tenCoSo}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          background: classItem.isFull ? '#fee2e2' : '#dcfce7',
                          color: classItem.isFull ? '#dc2626' : '#166534',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          {classItem.isFull ? 'Đã đầy' : `Còn ${classItem.availableSpots} chỗ`}
                        </div>
                        <button
                          disabled={classItem.isFull}
                          style={{
                            padding: '8px 16px',
                            background: classItem.isFull ? '#6b7280' : '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: classItem.isFull ? 'not-allowed' : 'pointer',
                            opacity: classItem.isFull ? 0.6 : 1
                          }}
                        >
                          {classItem.isFull ? 'Không khả dụng' : 'Chọn lớp này'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                <i className="fas fa-info-circle"></i>
                Bạn sẽ được miễn phí học phí khi đăng ký học lại lớp này.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Change Class Modal */}
      {showChangeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowChangeModal(false);
                setSelectedDangKyId(null);
                setAvailableChangeClasses([]);
                setChangeEligibilityInfo(null);
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6b7280',
                zIndex: 1002,
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.borderColor = '#dc2626';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Đóng"
            >
              <i className="fas fa-times"></i>
            </button>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '18px' }}>
                <i className="fas fa-exchange-alt"></i> Chọn lớp học để đổi
              </h3>
            </div>

            {/* Hiển thị thông tin điều kiện đổi lớp */}
            {changeEligibilityInfo && (
              <div style={{
                background: changeEligibilityInfo.canChange ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${changeEligibilityInfo.canChange ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  margin: '0 0 10px 0',
                  color: changeEligibilityInfo.canChange ? '#166534' : '#dc2626'
                }}>
                  <i className={`fas ${changeEligibilityInfo.canChange ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                  {changeEligibilityInfo.canChange ? 'Đủ điều kiện đổi lớp' : 'Không đủ điều kiện đổi lớp'}
                </h4>

                <div style={{ fontSize: '14px', color: changeEligibilityInfo.canChange ? '#166534' : '#dc2626' }}>
                  <p style={{ margin: '5px 0' }}><strong>Số buổi đã học:</strong> {changeEligibilityInfo.sessionsAttended}/{changeEligibilityInfo.maxSessionsAllowed} buổi</p>
                  <p style={{ margin: '5px 0' }}><strong>Lý do:</strong> {changeEligibilityInfo.reason}</p>
                </div>
              </div>
            )}

            {availableChangeClasses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', marginBottom: '16px', color: '#f59e0b' }}></i>
                <h3 style={{ margin: '0 0 8px 0' }}>Không có lớp học khả dụng</h3>
                <p style={{ margin: 0 }}>
                  Hiện tại không có lớp học nào để đổi.
                  Vui lòng liên hệ quản trị viên để được hỗ trợ.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {availableChangeClasses.map((classItem) => {
                  const currentClass = changeEligibilityInfo?.currentClass;
                  const originalFee = currentClass?.hocPhi || 0;
                  const newFee = classItem.khoaHoc?.hocPhi || 0;
                  const feeDifference = newFee - originalFee;

                  return (
                    <div key={classItem.lopID} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: classItem.isFull ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: classItem.isFull ? '#f9fafb' : '#f9fafb',
                      opacity: classItem.isFull ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!classItem.isFull) {
                        e.currentTarget.style.borderColor = '#dc2626';
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!classItem.isFull) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onClick={() => !classItem.isFull && handleSelectChangeClass(classItem.lopID)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>
                            Lớp ID: {classItem.lopID}
                          </h4>
                          <p style={{ margin: '0 0 4px 0', color: '#374151', fontSize: '14px' }}>
                            <strong>Khóa học:</strong> {classItem.khoaHoc?.tenKhoaHoc || 'Chưa xác định'}
                          </p>
                          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                            <i className="fas fa-calendar"></i> Bắt đầu: {formatDate(classItem.ngayBatDau)}
                          </p>
                          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                            <i className="fas fa-clock"></i> {classItem.caHoc} - {classItem.thoiLuongGio} giờ
                          </p>
                          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                            <i className="fas fa-dollar-sign"></i> Học phí: {newFee.toLocaleString('vi-VN')} VNĐ
                          </p>
                          {classItem.giangVien && (
                            <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                              <i className="fas fa-chalkboard-teacher"></i> {classItem.giangVien.hoTen}
                            </p>
                          )}
                          {classItem.diaDiem && (
                            <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '13px' }}>
                              <i className="fas fa-map-marker-alt"></i> {classItem.diaDiem.tenCoSo}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            background: classItem.isFull ? '#fee2e2' : '#dcfce7',
                            color: classItem.isFull ? '#dc2626' : '#166534',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '8px'
                          }}>
                            {classItem.isFull ? 'Đã đầy' : `Còn ${classItem.availableSpots} chỗ`}
                          </div>

                          {/* Hiển thị chênh lệch học phí */}
                          {feeDifference !== 0 && (
                            <div style={{
                              background: feeDifference > 0 ? '#fef3c7' : '#dcfce7',
                              color: feeDifference > 0 ? '#92400e' : '#166534',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              marginBottom: '8px'
                            }}>
                              {feeDifference > 0 ? '+' : ''}{feeDifference.toLocaleString('vi-VN')} VNĐ
                            </div>
                          )}

                          <button
                            disabled={classItem.isFull}
                            style={{
                              padding: '8px 16px',
                              background: classItem.isFull ? '#6b7280' : '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: classItem.isFull ? 'not-allowed' : 'pointer',
                              opacity: classItem.isFull ? 0.6 : 1
                            }}
                          >
                            {classItem.isFull ? 'Không khả dụng' : 'Chọn lớp này'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                <i className="fas fa-info-circle"></i>
                Chênh lệch học phí sẽ được xử lý tự động (thanh toán thêm hoặc hoàn tiền vào ví).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMyClasses;
