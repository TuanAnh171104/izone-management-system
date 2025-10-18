import React, { useState, useEffect } from 'react';
import { thongBaoService, ThongBao, lopHocService, LopHoc, hocVienService, HocVien, giangVienService, GiangVien } from '../../services/api';
import '../../styles/Management.css';

const AdminThongBaoList: React.FC = () => {
  const [thongBaoList, setThongBaoList] = useState<ThongBao[]>([]);
  const [filteredThongBaoList, setFilteredThongBaoList] = useState<ThongBao[]>([]);
  const [selectedThongBao, setSelectedThongBao] = useState<ThongBao | null>(null);

  // State cho dữ liệu liên quan
  const [lopHocList, setLopHocList] = useState<LopHoc[]>([]);
  const [hocVienList, setHocVienList] = useState<HocVien[]>([]);
  const [giangVienList, setGiangVienList] = useState<GiangVien[]>([]);

  // State cho loading và error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'send' | 'history'>('all');

  // State cho phân trang
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // State cho form gửi thông báo
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    noiDung: '',
    loaiNguoiNhan: 'ToanHeThong',
    nguoiNhanID: '',
    lopHocID: ''
  });

  // State cho modal chọn lớp học
  const [showClassModal, setShowClassModal] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [filteredClassList, setFilteredClassList] = useState<LopHoc[]>([]);

  // State cho modal chọn học viên
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [filteredStudentList, setFilteredStudentList] = useState<HocVien[]>([]);

  // State cho modal chọn giảng viên
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [lecturerSearchTerm, setLecturerSearchTerm] = useState('');
  const [filteredLecturerList, setFilteredLecturerList] = useState<GiangVien[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [thongBaoList, searchTerm, typeFilter]);

  // Hàm xử lý phân trang
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalItems / itemsPerPage)
    }));
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [thongBaoData, lopHocData, hocVienData, giangVienData] = await Promise.all([
        thongBaoService.getAll(),
        lopHocService.getAll(),
        hocVienService.getAll(),
        giangVienService.getAll()
      ]);

      setLopHocList(lopHocData);
      setHocVienList(hocVienData);
      setGiangVienList(giangVienData);
      setThongBaoList(thongBaoData);

      // Chọn thông báo đầu tiên mặc định
      if (thongBaoData.length > 0) {
        setSelectedThongBao(thongBaoData[0]);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...thongBaoList];

    // Lọc theo loại người nhận
    if (typeFilter !== 'all') {
      filtered = filtered.filter(thongBao => thongBao.loaiNguoiNhan === typeFilter);
    }

    // Lọc theo tìm kiếm
    if (searchTerm) {
      filtered = filtered.filter(thongBao =>
        thongBao.noiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thongBao.nguoiGui?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Cập nhật thông tin phân trang
    const totalFilteredItems = filtered.length;
    const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);

    setPagination(prev => ({
      ...prev,
      totalPages: totalPages,
      totalItems: totalFilteredItems,
      currentPage: totalFilteredItems === 0 ? 1 : Math.min(prev.currentPage, totalPages)
    }));

    setFilteredThongBaoList(filtered);
  };

  const handleThongBaoSelect = (thongBao: ThongBao) => {
    setSelectedThongBao(thongBao);
  };

  const getRecipientTypeBadge = (loaiNguoiNhan?: string | null) => {
    const typeConfig = {
      'ToanHeThong': { color: '#17a2b8', text: 'Toàn hệ thống', icon: '🌐' },
      'LopHoc': { color: '#ffc107', text: 'Theo lớp', icon: '📚' },
      'HocVien': { color: '#28a745', text: 'Cá nhân', icon: '👤' },
      'GiangVien': { color: '#6f42c1', text: 'Giảng viên', icon: '👨‍🏫' }
    };

    const type = loaiNguoiNhan || 'ToanHeThong';
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.ToanHeThong;

    return (
      <span style={{
        backgroundColor: config.color,
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {config.icon} {config.text}
      </span>
    );
  };

  const getRecipientName = (thongBao: ThongBao) => {
    if (thongBao.loaiNguoiNhan === 'LopHoc' && thongBao.nguoiNhanID) {
      const lopHoc = lopHocList.find(lop => lop.lopID === thongBao.nguoiNhanID);
      return `Lớp ${lopHoc?.lopID || 'Không xác định'}`;
    } else if (thongBao.loaiNguoiNhan === 'HocVien' && thongBao.nguoiNhanID) {
      const hocVien = hocVienList.find(hv => hv.hocVienID === thongBao.nguoiNhanID);
      return hocVien?.hoTen || 'Không xác định';
    } else if (thongBao.loaiNguoiNhan === 'GiangVien' && thongBao.nguoiNhanID) {
      const giangVien = giangVienList.find(gv => gv.giangVienID === thongBao.nguoiNhanID);
      return giangVien?.hoTen || 'Không xác định';
    }
    return 'Toàn hệ thống';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN') + ' ' + new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendNotification = async () => {
    if (!sendForm.noiDung.trim()) {
      alert('Vui lòng nhập nội dung thông báo!');
      return;
    }

    try {
      let createdThongBao: ThongBao;

      switch (sendForm.loaiNguoiNhan) {
        case 'ToanHeThong':
          createdThongBao = await thongBaoService.sendSystemNotification(sendForm.noiDung);
          break;
        case 'LopHoc':
          if (!sendForm.lopHocID) {
            alert('Vui lòng chọn lớp học!');
            return;
          }
          createdThongBao = await thongBaoService.sendClassNotification(parseInt(sendForm.lopHocID), sendForm.noiDung);
          break;
        case 'HocVien':
          if (!sendForm.nguoiNhanID) {
            alert('Vui lòng chọn học viên!');
            return;
          }
          createdThongBao = await thongBaoService.sendPersonalNotification(parseInt(sendForm.nguoiNhanID), sendForm.noiDung);
          break;
        case 'GiangVien':
          if (!sendForm.nguoiNhanID) {
            alert('Vui lòng chọn giảng viên!');
            return;
          }
          // Tạo thông báo với loại giảng viên
          const giangVienThongBao = {
            noiDung: sendForm.noiDung,
            loaiNguoiNhan: "GiangVien",
            nguoiNhanID: parseInt(sendForm.nguoiNhanID),
            ngayGui: new Date().toISOString()
          };
          createdThongBao = await thongBaoService.create(giangVienThongBao);
          break;
        default:
          alert('Vui lòng chọn loại người nhận!');
          return;
      }

      // Thêm thông báo mới vào danh sách
      setThongBaoList(prev => [createdThongBao, ...prev]);
      setShowSendModal(false);

      // Reset form
      setSendForm({
        noiDung: '',
        loaiNguoiNhan: 'ToanHeThong',
        nguoiNhanID: '',
        lopHocID: ''
      });

      alert('Gửi thông báo thành công!');
    } catch (error) {
      console.error('Lỗi khi gửi thông báo:', error);
      alert('Không thể gửi thông báo. Vui lòng thử lại.');
    }
  };

  const resetSendForm = () => {
    setSendForm({
      noiDung: '',
      loaiNguoiNhan: 'ToanHeThong',
      nguoiNhanID: '',
      lopHocID: ''
    });
  };

  // Hàm lọc danh sách lớp học theo từ khóa tìm kiếm
  useEffect(() => {
    if (classSearchTerm.trim() === '') {
      setFilteredClassList(lopHocList);
    } else {
      const filtered = lopHocList.filter(lop =>
        `Lớp ${lop.lopID}`.toLowerCase().includes(classSearchTerm.toLowerCase())
      );
      setFilteredClassList(filtered);
    }
  }, [classSearchTerm, lopHocList]);

  // Hàm lọc danh sách học viên theo từ khóa tìm kiếm
  useEffect(() => {
    if (studentSearchTerm.trim() === '') {
      setFilteredStudentList(hocVienList);
    } else {
      const filtered = hocVienList.filter(hv =>
        hv.hoTen.toLowerCase().includes(studentSearchTerm.toLowerCase())
      );
      setFilteredStudentList(filtered);
    }
  }, [studentSearchTerm, hocVienList]);

  // Hàm lọc danh sách giảng viên theo từ khóa tìm kiếm
  useEffect(() => {
    if (lecturerSearchTerm.trim() === '') {
      setFilteredLecturerList(giangVienList);
    } else {
      const filtered = giangVienList.filter(gv =>
        gv.hoTen.toLowerCase().includes(lecturerSearchTerm.toLowerCase())
      );
      setFilteredLecturerList(filtered);
    }
  }, [lecturerSearchTerm, giangVienList]);

  // Hàm chọn lớp học từ modal
  const handleSelectClass = (lopHoc: LopHoc) => {
    setSendForm(prev => ({ ...prev, lopHocID: lopHoc.lopID.toString() }));
    setShowClassModal(false);
    setClassSearchTerm('');
  };

  // Hàm chọn học viên từ modal
  const handleSelectStudent = (hocVien: HocVien) => {
    setSendForm(prev => ({ ...prev, nguoiNhanID: hocVien.hocVienID.toString() }));
    setShowStudentModal(false);
    setStudentSearchTerm('');
  };

  // Hàm chọn giảng viên từ modal
  const handleSelectLecturer = (giangVien: GiangVien) => {
    setSendForm(prev => ({ ...prev, nguoiNhanID: giangVien.giangVienID.toString() }));
    setShowLecturerModal(false);
    setLecturerSearchTerm('');
  };

  // Hàm mở modal chọn lớp học
  const handleOpenClassModal = () => {
    setShowClassModal(true);
    setClassSearchTerm('');
    setFilteredClassList(lopHocList);
  };

  // Hàm mở modal chọn học viên
  const handleOpenStudentModal = () => {
    setShowStudentModal(true);
    setStudentSearchTerm('');
    setFilteredStudentList(hocVienList);
  };

  // Hàm mở modal chọn giảng viên
  const handleOpenLecturerModal = () => {
    setShowLecturerModal(true);
    setLecturerSearchTerm('');
    setFilteredLecturerList(giangVienList);
  };

  // Hàm lấy tên lớp học đã chọn
  const getSelectedClassName = () => {
    if (!sendForm.lopHocID) return '';
    const lopHoc = lopHocList.find(lop => lop.lopID.toString() === sendForm.lopHocID);
    return lopHoc ? `Lớp ${lopHoc.lopID}` : '';
  };

  // Hàm lấy tên học viên đã chọn
  const getSelectedStudentName = () => {
    if (!sendForm.nguoiNhanID) return '';
    const hocVien = hocVienList.find(hv => hv.hocVienID.toString() === sendForm.nguoiNhanID);
    return hocVien ? hocVien.hoTen : '';
  };

  // Hàm lấy tên giảng viên đã chọn
  const getSelectedLecturerName = () => {
    if (!sendForm.nguoiNhanID) return '';
    const giangVien = giangVienList.find(gv => gv.giangVienID.toString() === sendForm.nguoiNhanID);
    return giangVien ? giangVien.hoTen : '';
  };

  // Logic phân trang
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedThongBaoList = filteredThongBaoList.slice(startIndex, startIndex + pagination.itemsPerPage);

  // Hàm render phân trang
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
          Hiển thị {startIndex + 1}-{Math.min(startIndex + pagination.itemsPerPage, pagination.totalItems)} của {pagination.totalItems} kết quả
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
              <button onClick={() => handlePageChange(pagination.totalPages)} className="pagination-btn">{pagination.totalPages}</button>
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
          <h2>Quản lý Thông báo</h2>
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
          <h2>Quản lý Thông báo</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchInitialData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Thông báo</h2>
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px'
          }}>
            {/* Search và Filter */}
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                <i className="fas fa-search" style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  zIndex: 2
                }}></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo nội dung hoặc người gửi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 45px',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#333',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#333',
                    minWidth: '140px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <option value="all">Tất cả loại</option>
                  <option value="ToanHeThong">Toàn hệ thống</option>
                  <option value="LopHoc">Theo lớp</option>
                  <option value="HocVien">Cá nhân</option>
                  <option value="GiangVien">Giảng viên</option>
                </select>
              </div>
            </div>

            {/* Nút gửi thông báo nổi bật */}
            <button
              onClick={() => setShowSendModal(true)}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                color: '#dc2626',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: '160px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.3)';
              }}
            >
              <i className="fas fa-paper-plane" style={{ fontSize: '16px' }}></i>
              GỬI THÔNG BÁO
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã TB</th>
              <th>Nội dung</th>
              <th>Người gửi</th>
              <th>Loại người nhận</th>
              <th>Người nhận cụ thể</th>
              <th>Thời gian gửi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedThongBaoList.map(thongBao => (
              <tr key={thongBao.tBID}>
                <td>{thongBao.tBID}</td>
                <td>
                  <div style={{
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {thongBao.noiDung}
                  </div>
                </td>
                <td>{thongBao.nguoiGui || 'Hệ thống'}</td>
                <td>{getRecipientTypeBadge(thongBao.loaiNguoiNhan)}</td>
                <td>{getRecipientName(thongBao)}</td>
                <td>{formatDate(thongBao.ngayGui)}</td>
              </tr>
             ))}
           </tbody>
        </table>

        {filteredThongBaoList.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {thongBaoList.length === 0 ? 'Chưa có thông báo nào.' : 'Không tìm thấy thông báo nào phù hợp.'}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal gửi thông báo */}
      {showSendModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              Gửi thông báo mới
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Loại người nhận: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={sendForm.loaiNguoiNhan}
                onChange={(e) => setSendForm(prev => ({ ...prev, loaiNguoiNhan: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="ToanHeThong">Toàn hệ thống</option>
                <option value="LopHoc">Theo lớp</option>
                <option value="HocVien">Cá nhân học viên</option>
                <option value="GiangVien">Cá nhân giảng viên</option>
              </select>
            </div>

            {sendForm.loaiNguoiNhan === 'LopHoc' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Chọn lớp học: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={getSelectedClassName()}
                    readOnly
                    placeholder="Nhấn nút để chọn lớp học..."
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer'
                    }}
                    onClick={handleOpenClassModal}
                  />
                  <button
                    type="button"
                    onClick={handleOpenClassModal}
                    style={{
                      padding: '12px 16px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="fas fa-search" style={{ marginRight: '5px' }}></i>
                    Chọn lớp
                  </button>
                </div>
              </div>
            )}

            {sendForm.loaiNguoiNhan === 'HocVien' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Chọn học viên: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={getSelectedStudentName()}
                    readOnly
                    placeholder="Nhấn nút để chọn học viên..."
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer'
                    }}
                    onClick={handleOpenStudentModal}
                  />
                  <button
                    type="button"
                    onClick={handleOpenStudentModal}
                    style={{
                      padding: '12px 16px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="fas fa-search" style={{ marginRight: '5px' }}></i>
                    Chọn học viên
                  </button>
                </div>
              </div>
            )}

            {sendForm.loaiNguoiNhan === 'GiangVien' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Chọn giảng viên: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={getSelectedLecturerName()}
                    readOnly
                    placeholder="Nhấn nút để chọn giảng viên..."
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer'
                    }}
                    onClick={handleOpenLecturerModal}
                  />
                  <button
                    type="button"
                    onClick={handleOpenLecturerModal}
                    style={{
                      padding: '12px 16px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="fas fa-search" style={{ marginRight: '5px' }}></i>
                    Chọn giảng viên
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Nội dung thông báo: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                placeholder="Nhập nội dung thông báo..."
                value={sendForm.noiDung}
                onChange={(e) => setSendForm(prev => ({ ...prev, noiDung: e.target.value }))}
                rows={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSendModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSendNotification}
                disabled={!sendForm.noiDung.trim() ||
                         (sendForm.loaiNguoiNhan === 'LopHoc' && !sendForm.lopHocID) ||
                         (sendForm.loaiNguoiNhan === 'HocVien' && !sendForm.nguoiNhanID) ||
                         (sendForm.loaiNguoiNhan === 'GiangVien' && !sendForm.nguoiNhanID)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: (!sendForm.noiDung.trim() ||
                               (sendForm.loaiNguoiNhan === 'LopHoc' && !sendForm.lopHocID) ||
                               (sendForm.loaiNguoiNhan === 'HocVien' && !sendForm.nguoiNhanID) ||
                               (sendForm.loaiNguoiNhan === 'GiangVien' && !sendForm.nguoiNhanID)) ? '#6c757d' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!sendForm.noiDung.trim() ||
                           (sendForm.loaiNguoiNhan === 'LopHoc' && !sendForm.lopHocID) ||
                           (sendForm.loaiNguoiNhan === 'HocVien' && !sendForm.nguoiNhanID) ||
                           (sendForm.loaiNguoiNhan === 'GiangVien' && !sendForm.nguoiNhanID)) ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="fas fa-paper-plane" style={{ marginRight: '5px' }}></i>
                Gửi thông báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn lớp học */}
      {showClassModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              Chọn lớp học
            </h3>

            {/* Thanh tìm kiếm */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '16px',
                  zIndex: 2
                }}></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã lớp (ví dụ: Lớp 1, Lớp 2...)"
                  value={classSearchTerm}
                  onChange={(e) => setClassSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 45px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Danh sách lớp học */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              maxHeight: '400px'
            }}>
              {filteredClassList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                  <p>Không tìm thấy lớp học nào phù hợp.</p>
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {filteredClassList.map(lop => (
                    <div
                      key={lop.lopID}
                      onClick={() => handleSelectClass(lop)}
                      style={{
                        padding: '12px 16px',
                        margin: '4px 0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: sendForm.lopHocID === lop.lopID.toString() ? '#ffebee' : '#f8f9fa',
                        border: sendForm.lopHocID === lop.lopID.toString() ? '2px solid #dc2626' : '1px solid #e9ecef',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        if (sendForm.lopHocID !== lop.lopID.toString()) {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (sendForm.lopHocID !== lop.lopID.toString()) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#dc2626' }}>
                        Lớp {lop.lopID}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                        Khóa học ID: {lop.khoaHocID} | Sức chứa: {lop.soLuongToiDa || 'Không giới hạn'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nút thao tác */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowClassModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              {sendForm.lopHocID && (
                <button
                  onClick={() => setShowClassModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Xác nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn học viên */}
      {showStudentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              Chọn học viên
            </h3>

            {/* Thanh tìm kiếm */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '16px',
                  zIndex: 2
                }}></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên học viên..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 45px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Danh sách học viên */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              maxHeight: '400px'
            }}>
              {filteredStudentList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                  <p>Không tìm thấy học viên nào phù hợp.</p>
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {filteredStudentList.map(hv => (
                    <div
                      key={hv.hocVienID}
                      onClick={() => handleSelectStudent(hv)}
                      style={{
                        padding: '12px 16px',
                        margin: '4px 0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: sendForm.nguoiNhanID === hv.hocVienID.toString() ? '#ffebee' : '#f8f9fa',
                        border: sendForm.nguoiNhanID === hv.hocVienID.toString() ? '2px solid #dc2626' : '1px solid #e9ecef',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        if (sendForm.nguoiNhanID !== hv.hocVienID.toString()) {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (sendForm.nguoiNhanID !== hv.hocVienID.toString()) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#dc2626' }}>
                        {hv.hoTen}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                        Mã HV: {hv.hocVienID} | Email: {hv.email || 'Chưa cập nhật'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nút thao tác */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowStudentModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              {sendForm.nguoiNhanID && (
                <button
                  onClick={() => setShowStudentModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Xác nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn giảng viên */}
      {showLecturerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              Chọn giảng viên
            </h3>

            {/* Thanh tìm kiếm */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '16px',
                  zIndex: 2
                }}></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên giảng viên..."
                  value={lecturerSearchTerm}
                  onChange={(e) => setLecturerSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 45px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Danh sách giảng viên */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              maxHeight: '400px'
            }}>
              {filteredLecturerList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  <i className="fas fa-chalkboard-teacher" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                  <p>Không tìm thấy giảng viên nào phù hợp.</p>
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {filteredLecturerList.map(gv => (
                    <div
                      key={gv.giangVienID}
                      onClick={() => handleSelectLecturer(gv)}
                      style={{
                        padding: '12px 16px',
                        margin: '4px 0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: sendForm.nguoiNhanID === gv.giangVienID.toString() ? '#ffebee' : '#f8f9fa',
                        border: sendForm.nguoiNhanID === gv.giangVienID.toString() ? '2px solid #dc2626' : '1px solid #e9ecef',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        if (sendForm.nguoiNhanID !== gv.giangVienID.toString()) {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (sendForm.nguoiNhanID !== gv.giangVienID.toString()) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#dc2626' }}>
                        {gv.hoTen}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                        Mã GV: {gv.giangVienID} | Chuyên môn: {gv.chuyenMon || 'Chưa cập nhật'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nút thao tác */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowLecturerModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              {sendForm.nguoiNhanID && (
                <button
                  onClick={() => setShowLecturerModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Xác nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThongBaoList;
