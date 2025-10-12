import React, { useState, useEffect } from 'react';
import { lopHocService, LopHoc, khoaHocService, KhoaHoc, giangVienService, GiangVien, diaDiemService, DiaDiem } from '../../services/api';
import '../../styles/Management.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const AdminLopHocList: React.FC = () => {
  const [lopHocs, setLopHocs] = useState<LopHoc[]>([]);
  const [khoaHocs, setKhoaHocs] = useState<KhoaHoc[]>([]);
  const [giangViens, setGiangViens] = useState<GiangVien[]>([]);
  const [diaDiems, setDiaDiems] = useState<DiaDiem[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLopHoc, setEditingLopHoc] = useState<LopHoc | null>(null);
  const [editFormData, setEditFormData] = useState({
    khoaHocID: 0,
    giangVienID: 0,
    diaDiemID: 0,
    ngayBatDau: '',
    ngayKetThuc: '',
    caHoc: '',
    ngayHocTrongTuan: '',
    donGiaBuoiDay: 0,
    thoiLuongGio: 1.5,
    soLuongToiDa: 0,
    trangThai: 'ChuaBatDau'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLopHoc, setNewLopHoc] = useState({
    khoaHocID: 0,
    giangVienID: 0,
    diaDiemID: 0,
    ngayBatDau: '',
    ngayKetThuc: '', // Sẽ được tính tự động
    caHoc: '',
    ngayHocTrongTuan: '',
    donGiaBuoiDay: 0,
    thoiLuongGio: 1.5,
    soLuongToiDa: 0,
    trangThai: 'ChuaBatDau'
  });
  const [calculatedEndDate, setCalculatedEndDate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  // Tính toán ngày kết thúc tự động khi các thông tin liên quan thay đổi
  useEffect(() => {
    if (newLopHoc.ngayBatDau && newLopHoc.khoaHocID > 0 && newLopHoc.ngayHocTrongTuan) {
      const khoaHoc = khoaHocs.find(k => k.khoaHocID === newLopHoc.khoaHocID);
      if (khoaHoc) {
        // Tính số buổi học trong tuần
        const soBuoiTrongTuan = newLopHoc.ngayHocTrongTuan.split(',')
          .filter(s => s.trim()).length;

        if (soBuoiTrongTuan > 0) {
          // Tính tổng số tuần (làm tròn lên)
          const tongSoTuan = Math.ceil(khoaHoc.soBuoi / soBuoiTrongTuan);

          // Tính ngày kết thúc
          const startDate = new Date(newLopHoc.ngayBatDau);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + (tongSoTuan * 7) - 1);

          setCalculatedEndDate(endDate.toLocaleDateString('vi-VN'));
        }
      }
    } else {
      setCalculatedEndDate('');
    }
  }, [newLopHoc.ngayBatDau, newLopHoc.khoaHocID, newLopHoc.ngayHocTrongTuan, khoaHocs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [lopHocData, khoaHocData, giangVienData, diaDiemData] = await Promise.all([
        lopHocService.getAll(),
        khoaHocService.getAll(),
        giangVienService.getAll(),
        diaDiemService.getAll()
      ]);

      setLopHocs(lopHocData);
      setKhoaHocs(khoaHocData);
      setGiangViens(giangVienData);
      setDiaDiems(diaDiemData);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách lớp học:', err);
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      try {
        await lopHocService.delete(id);
        setLopHocs(lopHocs.filter(l => l.lopID !== id));
      } catch (error) {
        console.error('Error deleting class:', error);
        setError('Có lỗi xảy ra khi xóa lớp học');
      }
    }
  };

  const handleAddNewClass = async () => {
    if (newLopHoc.khoaHocID === 0) {
      alert('Vui lòng chọn khóa học');
      return;
    }
    if (newLopHoc.giangVienID === 0) {
      alert('Vui lòng chọn giảng viên');
      return;
    }
    if (!newLopHoc.ngayBatDau) {
      alert('Vui lòng nhập ngày bắt đầu');
      return;
    }
    if (!newLopHoc.ngayHocTrongTuan) {
      alert('Vui lòng nhập ngày học trong tuần');
      return;
    }
    if (newLopHoc.donGiaBuoiDay <= 0) {
      alert('Đơn giá buổi dạy phải lớn hơn 0');
      return;
    }

    try {
      // Tạo object để gửi lên server (không bao gồm ngày kết thúc vì sẽ được tính tự động)
      const lopHocToCreate = {
        khoaHocID: newLopHoc.khoaHocID,
        giangVienID: newLopHoc.giangVienID,
        diaDiemID: newLopHoc.diaDiemID || null,
        ngayBatDau: newLopHoc.ngayBatDau, // Đã là string từ input type="date"
        ngayKetThuc: null, // Để backend tự động tính
        caHoc: newLopHoc.caHoc || null,
        ngayHocTrongTuan: newLopHoc.ngayHocTrongTuan || null,
        donGiaBuoiDay: newLopHoc.donGiaBuoiDay || null,
        thoiLuongGio: newLopHoc.thoiLuongGio,
        soLuongToiDa: newLopHoc.soLuongToiDa || null,
        trangThai: newLopHoc.trangThai
      };

      console.log('Creating class with data:', lopHocToCreate);
      console.log('Data types:', {
        khoaHocID: typeof lopHocToCreate.khoaHocID,
        giangVienID: typeof lopHocToCreate.giangVienID,
        ngayBatDau: typeof lopHocToCreate.ngayBatDau,
        donGiaBuoiDay: typeof lopHocToCreate.donGiaBuoiDay,
        thoiLuongGio: typeof lopHocToCreate.thoiLuongGio
      });

      const createdLopHoc = await lopHocService.create(lopHocToCreate);
      console.log('Created class:', createdLopHoc);

      setLopHocs([...lopHocs, createdLopHoc]);

      // Hiển thị thông báo thành công
      alert('Lớp học đã được tạo thành công!');
      setNewLopHoc({
        khoaHocID: 0,
        giangVienID: 0,
        diaDiemID: 0,
        ngayBatDau: '',
        ngayKetThuc: '',
        caHoc: '',
        ngayHocTrongTuan: '',
        donGiaBuoiDay: 0,
        thoiLuongGio: 1.5,
        soLuongToiDa: 0,
        trangThai: 'ChuaBatDau'
      });
      setCalculatedEndDate('');
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error creating class:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo lớp học mới';
      setError('Có lỗi xảy ra khi tạo lớp học mới: ' + errorMessage);
    }
  };

  const handleCancelAddClass = () => {
    setShowAddForm(false);
    setNewLopHoc({
      khoaHocID: 0,
      giangVienID: 0,
      diaDiemID: 0,
      ngayBatDau: '',
      ngayKetThuc: '',
      caHoc: '',
      ngayHocTrongTuan: '',
      donGiaBuoiDay: 0,
      thoiLuongGio: 1.5,
      soLuongToiDa: 0,
      trangThai: 'ChuaBatDau'
    });
  };

  const getKhoaHocName = (khoaHocID: number): string => {
    if (!khoaHocID || khoaHocID === 0) return 'Chưa xác định';
    const khoaHoc = khoaHocs.find(k => k.khoaHocID === khoaHocID);
    return khoaHoc ? khoaHoc.tenKhoaHoc : `Khóa học ${khoaHocID}`;
  };

  const getGiangVienName = (giangVienID: number): string => {
    if (!giangVienID || giangVienID === 0) return 'Chưa xác định';
    const giangVien = giangViens.find(g => g.giangVienID === giangVienID);
    return giangVien ? giangVien.hoTen : `Giảng viên ${giangVienID}`;
  };

  const getDiaDiemName = (diaDiemID: number | null): string => {
    if (!diaDiemID || diaDiemID === 0) return 'Chưa xác định';
    const diaDiem = diaDiems.find((d: DiaDiem) => d.diaDiemID === diaDiemID);
    return diaDiem ? diaDiem.tenCoSo : `Địa điểm ${diaDiemID}`;
  };

  const getDiaDiemCapacity = (diaDiemID: number | null): number => {
    if (!diaDiemID || diaDiemID === 0) return 0;
    const diaDiem = diaDiems.find((d: DiaDiem) => d.diaDiemID === diaDiemID);
    return diaDiem ? diaDiem.sucChua || 0 : 0;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleEditLopHoc = (lopHoc: LopHoc) => {
    setEditingLopHoc(lopHoc);
    setEditFormData({
      khoaHocID: lopHoc.khoaHocID || 0,
      giangVienID: lopHoc.giangVienID || 0,
      diaDiemID: lopHoc.diaDiemID || 0,
      ngayBatDau: lopHoc.ngayBatDau || '',
      ngayKetThuc: lopHoc.ngayKetThuc || '',
      caHoc: lopHoc.caHoc || '',
      ngayHocTrongTuan: lopHoc.ngayHocTrongTuan || '',
      donGiaBuoiDay: lopHoc.donGiaBuoiDay || 0,
      thoiLuongGio: lopHoc.thoiLuongGio || 1.5,
      soLuongToiDa: lopHoc.soLuongToiDa || 0,
      trangThai: lopHoc.trangThai || 'ChuaBatDau'
    });
    setShowEditModal(true);
  };

  const handleUpdateLopHoc = async () => {
    if (!editingLopHoc) return;

    try {
      // Tạo dữ liệu để gửi lên server theo định dạng backend mong đợi
      // ID lớp học phải luôn là ID gốc, không được thay đổi
      const updateData = {
        lopID: editingLopHoc.lopID, // Luôn dùng ID gốc từ editingLopHoc
        khoaHocID: editFormData.khoaHocID,
        giangVienID: editFormData.giangVienID,
        diaDiemID: editFormData.diaDiemID,
        ngayBatDau: editFormData.ngayBatDau,
        ngayKetThuc: editFormData.ngayKetThuc,
        caHoc: editFormData.caHoc,
        ngayHocTrongTuan: editFormData.ngayHocTrongTuan,
        donGiaBuoiDay: editFormData.donGiaBuoiDay,
        thoiLuongGio: editFormData.thoiLuongGio,
        soLuongToiDa: editFormData.soLuongToiDa,
        trangThai: editFormData.trangThai
      };

      console.log('📤 Gửi dữ liệu cập nhật:', updateData);
      console.log('🔍 Editing LopHoc ID:', editingLopHoc.lopID);
      console.log('📋 Form data:', editFormData);

      // Đảm bảo ID không phải null/undefined trước khi gửi
      if (!editingLopHoc.lopID) {
        alert('Lỗi: Không tìm thấy ID lớp học để cập nhật');
        return;
      }

      await lopHocService.update(editingLopHoc.lopID, updateData);

      // Cập nhật state với dữ liệu mới
      const updatedLopHoc = {
        ...editingLopHoc,
        khoaHocID: editFormData.khoaHocID,
        giangVienID: editFormData.giangVienID,
        diaDiemID: editFormData.diaDiemID,
        ngayBatDau: editFormData.ngayBatDau,
        ngayKetThuc: editFormData.ngayKetThuc,
        caHoc: editFormData.caHoc,
        ngayHocTrongTuan: editFormData.ngayHocTrongTuan,
        donGiaBuoiDay: editFormData.donGiaBuoiDay,
        thoiLuongGio: editFormData.thoiLuongGio,
        soLuongToiDa: editFormData.soLuongToiDa,
        trangThai: editFormData.trangThai
      };

      // Cập nhật state
      const updatedLopHocs = lopHocs.map(lh =>
        lh.lopID === editingLopHoc.lopID ? updatedLopHoc : lh
      );
      setLopHocs(updatedLopHocs);

      setShowEditModal(false);
      setEditingLopHoc(null);
      alert('Cập nhật lớp học thành công!');
    } catch (error: any) {
      console.error('Lỗi khi cập nhật lớp học:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật lớp học';
      alert('Không thể cập nhật lớp học: ' + errorMessage);
    }
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Pagination logic
  const filteredLopHocs = lopHocs.filter(lopHoc => {
    // Add null checks for lopHoc properties
    if (!lopHoc) return false;

    const khoaHocName = getKhoaHocName(lopHoc.khoaHocID || 0);
    const giangVienName = getGiangVienName(lopHoc.giangVienID || 0);
    const diaDiemName = getDiaDiemName(lopHoc.diaDiemID);
    const ngayHocTrongTuan = (lopHoc.ngayHocTrongTuan || '').toString();
    const caHoc = (lopHoc.caHoc || '').toString();
    const diaDiem = (lopHoc.diaDiemID || '').toString();
    const donGiaBuoiDay = (lopHoc.donGiaBuoiDay || '').toString();

    return (lopHoc.lopID || '').toString().includes(searchTerm) ||
           (khoaHocName && khoaHocName.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (giangVienName && giangVienName.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (diaDiemName && diaDiemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
           ngayHocTrongTuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
           caHoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
           diaDiem.includes(searchTerm) ||
           donGiaBuoiDay.includes(searchTerm);
  });

  // Calculate pagination
  const totalFilteredItems = filteredLopHocs.length;
  const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedLopHocs = filteredLopHocs.slice(startIndex, startIndex + pagination.itemsPerPage);

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
          <h2>Quản lý Lớp học</h2>
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
          <h2>Quản lý Lớp học</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Lớp học</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                background: 'white',
                color: '#dc2626',
                border: '2px solid #dc2626',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                minWidth: '120px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.2)';
              }}
            >
              <i className="fas fa-plus"></i>
              <span>Thêm lớp học mới</span>
            </button>
          )}
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo khóa học, giảng viên hoặc mã lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '350px'
              }}
            />
          </div>
        </div>
      </div>

      {showAddForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3>Thêm lớp học mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Khóa học:
              </label>
              <select
                value={newLopHoc.khoaHocID}
                onChange={(e) => setNewLopHoc({...newLopHoc, khoaHocID: Number(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value={0}>Chọn khóa học</option>
                {khoaHocs.map(khoaHoc => (
                  <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>
                    {khoaHoc.tenKhoaHoc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Giảng viên:
              </label>
              <select
                value={newLopHoc.giangVienID}
                onChange={(e) => setNewLopHoc({...newLopHoc, giangVienID: Number(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value={0}>Chọn giảng viên</option>
                {giangViens.map(giangVien => (
                  <option key={giangVien.giangVienID} value={giangVien.giangVienID}>
                    {giangVien.hoTen}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Ngày bắt đầu:
              </label>
              <input
                type="date"
                value={newLopHoc.ngayBatDau}
                onChange={(e) => setNewLopHoc({...newLopHoc, ngayBatDau: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Ngày kết thúc: <span style={{ fontWeight: 'normal', color: '#666' }}>(Tự động tính)</span>
              </label>
              <div style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                color: '#495057',
                fontWeight: '500'
              }}>
                {calculatedEndDate || 'Chọn ngày bắt đầu và khóa học để xem ngày kết thúc'}
              </div>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Ngày kết thúc được tính tự động dựa trên: Ngày bắt đầu + (Số buổi học ÷ Số buổi học trong tuần) tuần
              </small>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Ngày học trong tuần:
              </label>
              <input
                type="text"
                value={newLopHoc.ngayHocTrongTuan}
                onChange={(e) => setNewLopHoc({...newLopHoc, ngayHocTrongTuan: e.target.value})}
                placeholder="VD: 2,4,6"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Ca học:
              </label>
              <input
                type="text"
                value={newLopHoc.caHoc}
                onChange={(e) => setNewLopHoc({...newLopHoc, caHoc: e.target.value})}
                placeholder="VD: 19:45-21:15"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Đơn giá buổi dạy (VNĐ):
              </label>
              <input
                type="number"
                value={newLopHoc.donGiaBuoiDay}
                onChange={(e) => setNewLopHoc({...newLopHoc, donGiaBuoiDay: Number(e.target.value)})}
                placeholder="0"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Thời lượng (giờ):
              </label>
              <input
                type="number"
                value={newLopHoc.thoiLuongGio}
                onChange={(e) => setNewLopHoc({...newLopHoc, thoiLuongGio: Number(e.target.value)})}
                placeholder="1.5"
                min="0"
                step="0.5"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Địa điểm:
              </label>
              <select
                value={newLopHoc.diaDiemID}
                onChange={(e) => {
                  const diaDiemID = Number(e.target.value);
                  const capacity = getDiaDiemCapacity(diaDiemID);
                  setNewLopHoc({
                    ...newLopHoc,
                    diaDiemID: diaDiemID,
                    soLuongToiDa: capacity // Auto-set max capacity based on location
                  });
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value={0}>Chọn địa điểm</option>
                {diaDiems.map((diaDiem: DiaDiem) => (
                  <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>
                    {diaDiem.tenCoSo} (Sức chứa: {diaDiem.sucChua || 'Không giới hạn'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Số lượng tối đa:
              </label>
              <input
                type="number"
                value={newLopHoc.soLuongToiDa}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const maxCapacity = getDiaDiemCapacity(newLopHoc.diaDiemID);
                  if (maxCapacity > 0 && value > maxCapacity) {
                    alert(`Số lượng tối đa không được vượt quá sức chứa của địa điểm (${maxCapacity})`);
                    return;
                  }
                  setNewLopHoc({...newLopHoc, soLuongToiDa: value});
                }}
                placeholder="0"
                min="0"
                max={getDiaDiemCapacity(newLopHoc.diaDiemID)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              {newLopHoc.diaDiemID > 0 && (
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Tối đa: {getDiaDiemCapacity(newLopHoc.diaDiemID)} (theo sức chứa địa điểm)
                </small>
              )}
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <button
              onClick={handleCancelAddClass}
              style={{
                padding: '8px 16px',
                marginRight: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleAddNewClass}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Thêm mới
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã lớp</th>
              <th>Khóa học</th>
              <th>Giảng viên</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Ngày học trong tuần</th>
              <th>Ca học</th>
              <th>Địa điểm</th>
              <th>Đơn giá buổi dạy</th>
              <th>Thời lượng (giờ)</th>
              <th>Số lượng tối đa</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLopHocs.map(lopHoc => (
              <tr key={lopHoc.lopID}>
                <td>{lopHoc.lopID || 'Chưa có mã'}</td>
                <td>{getKhoaHocName(lopHoc.khoaHocID)}</td>
                <td>{getGiangVienName(lopHoc.giangVienID)}</td>
                <td>{formatDate(lopHoc.ngayBatDau)}</td>
                <td>{lopHoc.ngayKetThuc ? formatDate(lopHoc.ngayKetThuc) : 'Chưa xác định'}</td>
                <td>{lopHoc.ngayHocTrongTuan || 'Chưa xác định'}</td>
                <td>{lopHoc.caHoc || 'Chưa xác định'}</td>
                <td>{getDiaDiemName(lopHoc.diaDiemID)}</td>
                <td>{lopHoc.donGiaBuoiDay ? lopHoc.donGiaBuoiDay.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa xác định'}</td>
                <td>{lopHoc.thoiLuongGio}</td>
                <td>{lopHoc.soLuongToiDa || 'Không giới hạn'}</td>
                <td>
                  <span className="status-badge">
                    {lopHoc.trangThai || 'Đã kết thúc'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditLopHoc(lopHoc)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(lopHoc.lopID)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredLopHocs.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  {searchTerm ? 'Không tìm thấy lớp học nào phù hợp.' : 'Chưa có lớp học nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal chỉnh sửa lớp học */}
      {showEditModal && editingLopHoc && (
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
              Chỉnh sửa lớp học
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Khóa học: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={editFormData.khoaHocID}
                  onChange={(e) => handleEditFormChange('khoaHocID', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Chọn khóa học</option>
                  {khoaHocs.map(khoaHoc => (
                    <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>
                      {khoaHoc.tenKhoaHoc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Giảng viên: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={editFormData.giangVienID}
                  onChange={(e) => handleEditFormChange('giangVienID', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Chọn giảng viên</option>
                  {giangViens.map(giangVien => (
                    <option key={giangVien.giangVienID} value={giangVien.giangVienID}>
                      {giangVien.hoTen}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ngày bắt đầu: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.ngayBatDau}
                  onChange={(e) => handleEditFormChange('ngayBatDau', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ngày kết thúc:
                </label>
                <input
                  type="date"
                  value={editFormData.ngayKetThuc}
                  onChange={(e) => handleEditFormChange('ngayKetThuc', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ngày học trong tuần:
                </label>
                <input
                  type="text"
                  value={editFormData.ngayHocTrongTuan}
                  onChange={(e) => handleEditFormChange('ngayHocTrongTuan', e.target.value)}
                  placeholder="VD: 2,4,6"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ca học:
                </label>
                <input
                  type="text"
                  value={editFormData.caHoc}
                  onChange={(e) => handleEditFormChange('caHoc', e.target.value)}
                  placeholder="VD: 19:45-21:15"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Đơn giá buổi dạy (VNĐ): <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  value={editFormData.donGiaBuoiDay}
                  onChange={(e) => handleEditFormChange('donGiaBuoiDay', Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Thời lượng (giờ):
                </label>
                <input
                  type="number"
                  value={editFormData.thoiLuongGio}
                  onChange={(e) => handleEditFormChange('thoiLuongGio', Number(e.target.value))}
                  placeholder="1.5"
                  min="0"
                  step="0.5"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Địa điểm:
                </label>
                <select
                  value={editFormData.diaDiemID}
                  onChange={(e) => {
                    const diaDiemID = Number(e.target.value);
                    const capacity = getDiaDiemCapacity(diaDiemID);
                    handleEditFormChange('diaDiemID', diaDiemID);
                    handleEditFormChange('soLuongToiDa', capacity);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Chọn địa điểm</option>
                  {diaDiems.map((diaDiem: DiaDiem) => (
                    <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>
                      {diaDiem.tenCoSo} (Sức chứa: {diaDiem.sucChua || 'Không giới hạn'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Số lượng tối đa:
                </label>
                <input
                  type="number"
                  value={editFormData.soLuongToiDa}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const maxCapacity = getDiaDiemCapacity(editFormData.diaDiemID);
                    if (maxCapacity > 0 && value > maxCapacity) {
                      alert(`Số lượng tối đa không được vượt quá sức chứa của địa điểm (${maxCapacity})`);
                      return;
                    }
                    handleEditFormChange('soLuongToiDa', value);
                  }}
                  placeholder="0"
                  min="0"
                  max={getDiaDiemCapacity(editFormData.diaDiemID)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {editFormData.diaDiemID > 0 && (
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Tối đa: {getDiaDiemCapacity(editFormData.diaDiemID)} (theo sức chứa địa điểm)
                  </small>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowEditModal(false)}
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
                onClick={handleUpdateLopHoc}
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
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLopHocList;
