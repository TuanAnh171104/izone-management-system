import React, { useState, useEffect } from 'react';
import { khoaHocService, KhoaHoc } from '../../services/api';
import '../../styles/Management.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const AdminKhoaHocList: React.FC = () => {
  const [khoaHocs, setKhoaHocs] = useState<KhoaHoc[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKhoaHoc, setEditingKhoaHoc] = useState<KhoaHoc | null>(null);
  const [editFormData, setEditFormData] = useState({
    tenKhoaHoc: '',
    hocPhi: 0,
    soBuoi: 0,
    donGiaTaiLieu: 0
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKhoaHoc, setNewKhoaHoc] = useState({
    tenKhoaHoc: '',
    hocPhi: 0,
    soBuoi: 0,
    donGiaTaiLieu: 0
  });

  useEffect(() => {
    fetchKhoaHocs();
  }, []);

  const fetchKhoaHocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await khoaHocService.getAll();
      setKhoaHocs(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách khóa học:', err);
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
      try {
        await khoaHocService.delete(id);
        setKhoaHocs(khoaHocs.filter(k => k.khoaHocID !== id));
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Có lỗi xảy ra khi xóa khóa học');
      }
    }
  };

  const handleAddNew = async () => {
    if (!newKhoaHoc.tenKhoaHoc.trim()) {
      alert('Vui lòng nhập tên khóa học');
      return;
    }
    if (newKhoaHoc.hocPhi <= 0 || newKhoaHoc.soBuoi <= 0) {
      alert('Học phí và số buổi phải lớn hơn 0');
      return;
    }

    try {
      const createdKhoaHoc = await khoaHocService.create(newKhoaHoc);
      setKhoaHocs([...khoaHocs, createdKhoaHoc]);
      setNewKhoaHoc({
        tenKhoaHoc: '',
        hocPhi: 0,
        soBuoi: 0,
        donGiaTaiLieu: 0
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating course:', error);
      setError('Có lỗi xảy ra khi tạo khóa học mới');
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewKhoaHoc({
      tenKhoaHoc: '',
      hocPhi: 0,
      soBuoi: 0,
      donGiaTaiLieu: 0
    });
  };

  const handleEditKhoaHoc = (khoaHoc: KhoaHoc) => {
    setEditingKhoaHoc(khoaHoc);
    setEditFormData({
      tenKhoaHoc: khoaHoc.tenKhoaHoc || '',
      hocPhi: khoaHoc.hocPhi || 0,
      soBuoi: khoaHoc.soBuoi || 0,
      donGiaTaiLieu: khoaHoc.donGiaTaiLieu || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateKhoaHoc = async () => {
    if (!editingKhoaHoc) return;

    // Validation
    if (!editFormData.tenKhoaHoc.trim()) {
      alert('Vui lòng nhập tên khóa học');
      return;
    }
    if (editFormData.hocPhi <= 0 || editFormData.soBuoi <= 0) {
      alert('Học phí và số buổi phải lớn hơn 0');
      return;
    }

    try {
      const updatedKhoaHoc = {
        ...editingKhoaHoc,
        tenKhoaHoc: editFormData.tenKhoaHoc,
        hocPhi: editFormData.hocPhi,
        soBuoi: editFormData.soBuoi,
        donGiaTaiLieu: editFormData.donGiaTaiLieu
      };

      await khoaHocService.update(editingKhoaHoc.khoaHocID, updatedKhoaHoc);

      // Cập nhật state
      const updatedKhoaHocs = khoaHocs.map(kh =>
        kh.khoaHocID === editingKhoaHoc.khoaHocID ? updatedKhoaHoc : kh
      );
      setKhoaHocs(updatedKhoaHocs);

      setShowEditModal(false);
      setEditingKhoaHoc(null);
      alert('Cập nhật khóa học thành công!');
    } catch (error: any) {
      console.error('Lỗi khi cập nhật khóa học:', error);

      // Handle specific error types
      if (error.response?.status === 409) {
        alert('Dữ liệu đã được thay đổi bởi người dùng khác. Vui lòng tải lại trang và thử lại.');
      } else if (error.response?.status === 404) {
        alert('Không tìm thấy khóa học để cập nhật. Có thể đã bị xóa.');
        // Refresh the list
        fetchKhoaHocs();
        setShowEditModal(false);
        setEditingKhoaHoc(null);
      } else {
        alert('Không thể cập nhật khóa học. Vui lòng thử lại.');
      }
    }
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Pagination logic
  const filteredKhoaHocs = khoaHocs.filter(khoaHoc => {
    if (!khoaHoc) return false;

    return (khoaHoc.tenKhoaHoc && khoaHoc.tenKhoaHoc.toLowerCase().includes(searchTerm.toLowerCase())) ||
           ((khoaHoc.khoaHocID || '').toString().includes(searchTerm));
  });

  // Calculate pagination
  const totalFilteredItems = filteredKhoaHocs.length;
  const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedKhoaHocs = filteredKhoaHocs.slice(startIndex, startIndex + pagination.itemsPerPage);

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
          <h2>Quản lý Khóa học</h2>
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
          <h2>Quản lý Khóa học</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchKhoaHocs} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Khóa học</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'red',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Thêm khóa học mới
            </button>
          )}
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khóa học hoặc mã khóa học..."
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
          <h3>Thêm khóa học mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Tên khóa học:
              </label>
              <input
                type="text"
                value={newKhoaHoc.tenKhoaHoc}
                onChange={(e) => setNewKhoaHoc({...newKhoaHoc, tenKhoaHoc: e.target.value})}
                placeholder="Nhập tên khóa học"
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
                Học phí (VNĐ):
              </label>
              <input
                type="number"
                value={newKhoaHoc.hocPhi}
                onChange={(e) => setNewKhoaHoc({...newKhoaHoc, hocPhi: Number(e.target.value)})}
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
                Số buổi:
              </label>
              <input
                type="number"
                value={newKhoaHoc.soBuoi}
                onChange={(e) => setNewKhoaHoc({...newKhoaHoc, soBuoi: Number(e.target.value)})}
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
                Đơn giá tài liệu (VNĐ):
              </label>
              <input
                type="number"
                value={newKhoaHoc.donGiaTaiLieu}
                onChange={(e) => setNewKhoaHoc({...newKhoaHoc, donGiaTaiLieu: Number(e.target.value)})}
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
              <th>Mã KH</th>
              <th>Tên khóa học</th>
              <th>Học phí</th>
              <th>Số buổi</th>
              <th>Đơn giá tài liệu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedKhoaHocs.map(khoaHoc => (
              <tr key={khoaHoc.khoaHocID}>
                <td>{khoaHoc.khoaHocID || 'Chưa có mã'}</td>
                <td>{khoaHoc.tenKhoaHoc}</td>
                <td>{khoaHoc.hocPhi.toLocaleString('vi-VN')} VNĐ</td>
                <td>{khoaHoc.soBuoi}</td>
                <td>{khoaHoc.donGiaTaiLieu.toLocaleString('vi-VN')} VNĐ</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditKhoaHoc(khoaHoc)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(khoaHoc.khoaHocID)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredKhoaHocs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  {searchTerm ? 'Không tìm thấy khóa học nào phù hợp.' : 'Chưa có khóa học nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal chỉnh sửa khóa học */}
      {showEditModal && editingKhoaHoc && (
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
              Chỉnh sửa khóa học
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Tên khóa học: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                value={editFormData.tenKhoaHoc}
                onChange={(e) => handleEditFormChange('tenKhoaHoc', e.target.value)}
                placeholder="Nhập tên khóa học"
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
                Học phí (VNĐ): <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="number"
                value={editFormData.hocPhi}
                onChange={(e) => handleEditFormChange('hocPhi', Number(e.target.value))}
                placeholder="Nhập học phí"
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Số buổi: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="number"
                value={editFormData.soBuoi}
                onChange={(e) => handleEditFormChange('soBuoi', Number(e.target.value))}
                placeholder="Nhập số buổi"
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

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Đơn giá tài liệu (VNĐ):
              </label>
              <input
                type="number"
                value={editFormData.donGiaTaiLieu}
                onChange={(e) => handleEditFormChange('donGiaTaiLieu', Number(e.target.value))}
                placeholder="Nhập đơn giá tài liệu"
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
                onClick={handleUpdateKhoaHoc}
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

export default AdminKhoaHocList;
