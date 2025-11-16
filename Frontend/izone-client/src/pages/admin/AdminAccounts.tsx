import React, { useState, useEffect } from 'react';
import { taiKhoanService, TaiKhoan } from '../../services/api';
import { Edit, DeleteForever } from '@mui/icons-material';
import '../../styles/Management.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const AdminAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<TaiKhoan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TaiKhoan | null>(null);
  const [editFormData, setEditFormData] = useState({
    email: '',
    vaiTro: ''
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taiKhoanService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách tài khoản:', error);
      setError('Không thể tải danh sách tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (taiKhoanID: number) => {
    try {
      // Since trangThai doesn't exist in new schema, we'll just show a message
      alert('Chức năng thay đổi trạng thái sẽ được phát triển trong phiên bản tiếp theo.');
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái tài khoản:', error);
      alert('Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.');
    }
  };

  const handleDeleteAccount = async (taiKhoanID: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      return;
    }

    try {
      await taiKhoanService.delete(taiKhoanID);
      await fetchAccounts();
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản:', error);
      alert('Không thể xóa tài khoản. Vui lòng thử lại.');
    }
  };

  const handleEditAccount = (account: TaiKhoan) => {
    setEditingAccount(account);
    setEditFormData({
      email: account.email,
      vaiTro: account.vaiTro
    });
    setShowEditModal(true);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;

    try {
      const updatedAccount = {
        ...editingAccount,
        email: editFormData.email,
        vaiTro: editFormData.vaiTro
      };

      await taiKhoanService.update(editingAccount.taiKhoanID, updatedAccount);

      // Cập nhật state
      const updatedAccounts = accounts.map(acc =>
        acc.taiKhoanID === editingAccount.taiKhoanID ? updatedAccount : acc
      );
      setAccounts(updatedAccounts);

      setShowEditModal(false);
      setEditingAccount(null);
      alert('Cập nhật tài khoản thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật tài khoản:', error);
      alert('Không thể cập nhật tài khoản. Vui lòng thử lại.');
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Pagination logic
  const filtered = accounts.filter(tk => {
    const email = tk.email || '';
    const vaiTro = tk.vaiTro || '';

    return email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vaiTro.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tk.taiKhoanID.toString().includes(searchTerm);
  });

  // Calculate pagination
  const totalFilteredItems = filtered.length;
  const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedAccounts = filtered.slice(startIndex, startIndex + pagination.itemsPerPage);

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
          <h2>Quản lý Tài khoản</h2>
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
          <h2>Quản lý Tài khoản</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchAccounts} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Tài khoản</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm theo email, vai trò hoặc mã tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '300px'
            }}
          />
        </div>
      </div>
      
      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã TK</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAccounts.map(tk => (
              <tr key={tk.taiKhoanID}>
                <td>{tk.taiKhoanID}</td>
                <td>{tk.email}</td>
                <td>
                  <span className={`role-badge ${tk.vaiTro?.toLowerCase()}`}>
                    {tk.vaiTro}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditAccount(tk)}
                      title="Chỉnh sửa"
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <Edit fontSize="small" color="action" />
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteAccount(tk.taiKhoanID)}
                      title="Xóa"
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <DeleteForever fontSize="small" color="error" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {searchTerm ? 'Không tìm thấy tài khoản nào phù hợp.' : 'Chưa có tài khoản nào.'}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal chỉnh sửa tài khoản */}
      {showEditModal && editingAccount && (
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
              Chỉnh sửa tài khoản
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Email: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => handleEditFormChange('email', e.target.value)}
                placeholder="Nhập email"
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
                Vai trò: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={editFormData.vaiTro}
                onChange={(e) => handleEditFormChange('vaiTro', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Chọn vai trò</option>
                <option value="Admin">Admin</option>
                <option value="GiangVien">GiangVien</option>
                <option value="HocVien">HocVien</option>
                <option value="NhanVien">NhanVien</option>
              </select>
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
                onClick={handleUpdateAccount}
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

export default AdminAccounts;
