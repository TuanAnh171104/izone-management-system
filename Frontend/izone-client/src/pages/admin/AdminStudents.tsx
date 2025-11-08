import React, { useState, useEffect } from 'react';
import { hocVienService, HocVien } from '../../services/api';
import StudentDetailsModal from '../../components/StudentDetailsModal';
import '../../styles/Management.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<HocVien[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<HocVien | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<HocVien | null>(null);
  const [editFormData, setEditFormData] = useState({
    hoTen: '',
    email: '',
    ngaySinh: '',
    sdt: '',
    taiKhoanVi: 0
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hocVienService.getAll();
      setStudents(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách học viên:', error);
      setError('Không thể tải danh sách học viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (hocVienID: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học viên này?\n\n⚠️ Lưu ý: Việc xóa học viên cũng sẽ xóa tài khoản liên quan (nếu có)!')) {
      try {
        await hocVienService.delete(hocVienID);
        setStudents(students.filter(hv => hv.hocVienID !== hocVienID));
        alert('Xóa học viên và tài khoản liên quan thành công!');
      } catch (error) {
        console.error('Lỗi khi xóa học viên:', error);
        setError('Có lỗi xảy ra khi xóa học viên');
      }
    }
  };

  const handleEditStudent = (student: HocVien) => {
    setEditingStudent(student);
    setEditFormData({
      hoTen: student.hoTen || '',
      email: student.email || '',
      ngaySinh: student.ngaySinh ? new Date(student.ngaySinh).toISOString().split('T')[0] : '',
      sdt: student.sdt || '',
      taiKhoanVi: student.taiKhoanVi || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      const updatedStudent = {
        ...editingStudent,
        hoTen: editFormData.hoTen,
        email: editFormData.email,
        ngaySinh: editFormData.ngaySinh,
        sdt: editFormData.sdt,
        taiKhoanVi: editFormData.taiKhoanVi
      };

      await hocVienService.update(editingStudent.hocVienID, updatedStudent);

      // Cập nhật state
      const updatedStudents = students.map(hv =>
        hv.hocVienID === editingStudent.hocVienID ? updatedStudent : hv
      );
      setStudents(updatedStudents);

      setShowEditModal(false);
      setEditingStudent(null);
      alert('Cập nhật học viên thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật học viên:', error);
      alert('Không thể cập nhật học viên. Vui lòng thử lại.');
    }
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewStudentDetails = (student: HocVien) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };



  // Pagination logic
  const filteredStudents = students.filter(student => {
    if (!student) return false;

    return student.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (student.sdt && student.sdt.includes(searchTerm)) ||
           ((student.hocVienID || '').toString().includes(searchTerm));
  });

  // Calculate pagination
  const totalFilteredItems = filteredStudents.length;
  const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pagination.itemsPerPage);

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
          <h2>Quản lý Học viên</h2>
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
          <h2>Quản lý Học viên</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchStudents} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Học viên</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc mã học viên..."
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
      
      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã HV</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Ngày sinh</th>
              <th>Số điện thoại</th>
              <th>Tài khoản ví</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map(hv => (
              <tr key={hv.hocVienID}>
                <td>{hv.hocVienID || 'Chưa có mã'}</td>
                <td>{hv.hoTen}</td>
                <td>{hv.email || 'Chưa cập nhật'}</td>
                <td>{hv.ngaySinh ? new Date(hv.ngaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</td>
                <td>{hv.sdt || 'Chưa cập nhật'}</td>
                <td>{hv.taiKhoanVi.toLocaleString('vi-VN')} VNĐ</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-view"
                      onClick={() => handleViewStudentDetails(hv)}
                      title="Xem chi tiết"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => handleEditStudent(hv)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteStudent(hv.hocVienID)}
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

        {filteredStudents.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {searchTerm ? 'Không tìm thấy học viên nào phù hợp.' : 'Chưa có học viên nào.'}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal chỉnh sửa học viên */}
      {showEditModal && editingStudent && (
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
              Chỉnh sửa học viên
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
                Email:
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Ngày sinh:
              </label>
              <input
                type="date"
                value={editFormData.ngaySinh}
                onChange={(e) => handleEditFormChange('ngaySinh', e.target.value)}
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
                Số điện thoại:
              </label>
              <input
                type="tel"
                value={editFormData.sdt}
                onChange={(e) => handleEditFormChange('sdt', e.target.value)}
                placeholder="Nhập số điện thoại"
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
                Tài khoản ví (VNĐ):
              </label>
              <input
                type="number"
                value={editFormData.taiKhoanVi}
                onChange={(e) => handleEditFormChange('taiKhoanVi', Number(e.target.value))}
                placeholder="Nhập số dư ví"
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
                onClick={handleUpdateStudent}
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

      {/* Modal chi tiết học viên */}
      <StudentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        student={selectedStudent}
      />

    </div>
  );
};

export default AdminStudents;
