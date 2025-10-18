import React, { useState, useEffect } from 'react';
import { giangVienService, GiangVienWithEmailDto } from '../../services/api';
import '../../styles/Management.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const AdminLecturers: React.FC = () => {
  const [lecturers, setLecturers] = useState<GiangVienWithEmailDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<GiangVienWithEmailDto | null>(null);
  const [editFormData, setEditFormData] = useState({
    hoTen: '',
    chuyenMon: '',
    taiKhoanID: 0
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLecturer, setNewLecturer] = useState({
    // Thông tin tài khoản
    email: '',
    matKhau: '',
    // Thông tin giáo viên
    hoTen: '',
    chuyenMon: ''
  });

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await giangVienService.getAll();
      setLecturers(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách giảng viên:', error);
      setError('Không thể tải danh sách giảng viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLecturer = async (giangVienID: number) => {
    const lecturer = lecturers.find(gv => gv.giangVienID === giangVienID);
    const hasAccount = lecturer?.taiKhoanID && lecturer?.email;

    const confirmMessage = hasAccount
      ? `Bạn có chắc chắn muốn xóa giảng viên này?\n\n⚠️ Thao tác này sẽ xóa cả:\n• Thông tin giảng viên\n• Tài khoản liên kết (${lecturer?.email})\n\nHành động này không thể hoàn tác!`
      : 'Bạn có chắc chắn muốn xóa giảng viên này?\n\nHành động này không thể hoàn tác!';

    if (window.confirm(confirmMessage)) {
      try {
        await giangVienService.delete(giangVienID);
        setLecturers(lecturers.filter(gv => gv.giangVienID !== giangVienID));
        alert('Xóa giảng viên thành công!');
      } catch (error) {
        console.error('Lỗi khi xóa giảng viên:', error);
        setError('Có lỗi xảy ra khi xóa giảng viên');
      }
    }
  };

  const handleEditLecturer = (lecturer: GiangVienWithEmailDto) => {
    setEditingLecturer(lecturer);
    setEditFormData({
      hoTen: lecturer.hoTen || '',
      chuyenMon: lecturer.chuyenMon || '',
      taiKhoanID: lecturer.taiKhoanID || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateLecturer = async () => {
    if (!editingLecturer) return;

    try {
      const updatedLecturer = {
        ...editingLecturer,
        hoTen: editFormData.hoTen,
        chuyenMon: editFormData.chuyenMon,
        taiKhoanID: editFormData.taiKhoanID
      };

      await giangVienService.update(editingLecturer.giangVienID, updatedLecturer);

      // Cập nhật state
      const updatedLecturers = lecturers.map(gv =>
        gv.giangVienID === editingLecturer.giangVienID ? updatedLecturer : gv
      );
      setLecturers(updatedLecturers);

      setShowEditModal(false);
      setEditingLecturer(null);
      alert('Cập nhật giảng viên thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật giảng viên:', error);
      alert('Không thể cập nhật giảng viên. Vui lòng thử lại.');
    }
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Pagination logic
  const filteredLecturers = lecturers.filter(lecturer => {
    if (!lecturer) return false;

    const hoTen = lecturer.hoTen || '';
    const chuyenMon = lecturer.chuyenMon || '';
    const taiKhoanID = lecturer.taiKhoanID?.toString() || '';
    const email = lecturer.email || '';

    return hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
           chuyenMon.toLowerCase().includes(searchTerm.toLowerCase()) ||
           taiKhoanID.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ((lecturer.giangVienID || '').toString().includes(searchTerm));
  });

  // Calculate pagination
  const totalFilteredItems = filteredLecturers.length;
  const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedLecturers = filteredLecturers.slice(startIndex, startIndex + pagination.itemsPerPage);

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
          <h2>Quản lý Giảng viên</h2>
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
          <h2>Quản lý Giảng viên</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchLecturers} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const handleAddNew = async () => {
    // Validation
    if (!newLecturer.email.trim()) {
      alert('Vui lòng nhập email');
      return;
    }
    if (!newLecturer.matKhau.trim()) {
      alert('Vui lòng nhập mật khẩu');
      return;
    }
    if (!newLecturer.hoTen.trim()) {
      alert('Vui lòng nhập họ tên');
      return;
    }

    try {
      // Tạo tài khoản trước
      const taiKhoanData = {
        email: newLecturer.email,
        matKhau: newLecturer.matKhau,
        vaiTro: 'GiangVien'
      };

      // Sau đó tạo giáo viên với TaiKhoanID từ tài khoản vừa tạo
      const giangVienData = {
        hoTen: newLecturer.hoTen,
        chuyenMon: newLecturer.chuyenMon,
        taiKhoanID: 0 // Sẽ được cập nhật sau khi tạo tài khoản
      };

      // Gọi API tạo giáo viên (bao gồm tạo tài khoản)
      const createdLecturer = await giangVienService.createWithAccount(taiKhoanData, giangVienData);
      setLecturers([...lecturers, createdLecturer]);

      // Reset form
      setNewLecturer({
        email: '',
        matKhau: '',
        hoTen: '',
        chuyenMon: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating lecturer:', error);
      setError('Có lỗi xảy ra khi tạo giáo viên mới');
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewLecturer({
      email: '',
      matKhau: '',
      hoTen: '',
      chuyenMon: ''
    });
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Giảng viên</h2>
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
              <span>Thêm giáo viên mới</span>
            </button>
          )}
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, chuyên môn, email, tài khoản ID hoặc mã giảng viên..."
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
          <h3>Thêm giáo viên mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {/* Thông tin tài khoản */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                value={newLecturer.email}
                onChange={(e) => setNewLecturer({...newLecturer, email: e.target.value})}
                placeholder="Nhập email"
                autoComplete="off"
                data-form-type="new-lecturer"
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
                Mật khẩu: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="password"
                value={newLecturer.matKhau}
                onChange={(e) => setNewLecturer({...newLecturer, matKhau: e.target.value})}
                placeholder="Nhập mật khẩu"
                autoComplete="new-password"
                data-form-type="new-lecturer"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            {/* Thông tin giáo viên */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Họ tên: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={newLecturer.hoTen}
                onChange={(e) => setNewLecturer({...newLecturer, hoTen: e.target.value})}
                placeholder="Nhập họ tên"
                autoComplete="off"
                data-form-type="new-lecturer"
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
                Chuyên môn:
              </label>
              <input
                type="text"
                value={newLecturer.chuyenMon}
                onChange={(e) => setNewLecturer({...newLecturer, chuyenMon: e.target.value})}
                placeholder="Nhập chuyên môn"
                autoComplete="off"
                data-form-type="new-lecturer"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <button
              onClick={handleCancelAdd}
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
              onClick={handleAddNew}
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
              <th>Mã GV</th>
              <th>Họ tên</th>
              <th>Chuyên môn</th>
              <th>Email</th>
              <th>Tài khoản ID</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLecturers.map(gv => (
              <tr key={gv.giangVienID}>
                <td>{gv.giangVienID || 'Chưa có mã'}</td>
                <td>{gv.hoTen}</td>
                <td>{gv.chuyenMon || 'Chưa cập nhật'}</td>
                <td>{gv.email || 'Chưa có email'}</td>
                <td>{gv.taiKhoanID || 'Chưa liên kết'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditLecturer(gv)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteLecturer(gv.giangVienID)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLecturers.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {searchTerm ? 'Không tìm thấy giảng viên nào phù hợp.' : 'Chưa có giảng viên nào.'}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal chỉnh sửa giảng viên */}
      {showEditModal && editingLecturer && (
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
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              Chỉnh sửa giảng viên
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Họ tên: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                value={editFormData.hoTen}
                onChange={(e) => handleEditFormChange('hoTen', e.target.value)}
                placeholder="Nhập họ tên"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Chuyên môn:
              </label>
              <input
                type="text"
                value={editFormData.chuyenMon}
                onChange={(e) => handleEditFormChange('chuyenMon', e.target.value)}
                placeholder="Nhập chuyên môn"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Tài khoản ID:
              </label>
              <input
                type="number"
                value={editFormData.taiKhoanID}
                onChange={(e) => handleEditFormChange('taiKhoanID', Number(e.target.value))}
                placeholder="Nhập tài khoản ID"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#6c757d', fontSize: '12px' }}>
                Nhập 0 hoặc để trống nếu không muốn liên kết tài khoản
              </small>
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
                onClick={handleUpdateLecturer}
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

export default AdminLecturers;
