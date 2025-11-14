import React, { useState, useEffect } from 'react';
import { baoLuuService, BaoLuu, lopHocService, LopHoc, hocVienService, HocVien, dangKyLopService, DangKyLop } from '../../services/api';
import { mapBaoLuuStatus } from '../../utils/statusMapping';
import '../../styles/Management.css';

interface BaoLuuWithDetails extends BaoLuu {
  lopHoc?: LopHoc;
  hocVien?: HocVien;
}

const AdminBaoLuuList: React.FC = () => {
  const [baoLuuList, setBaoLuuList] = useState<BaoLuuWithDetails[]>([]);
  const [filteredBaoLuuList, setFilteredBaoLuuList] = useState<BaoLuuWithDetails[]>([]);
  const [selectedBaoLuu, setSelectedBaoLuu] = useState<BaoLuuWithDetails | null>(null);

  // State cho dữ liệu liên quan
  const [lopHocList, setLopHocList] = useState<LopHoc[]>([]);
  const [hocVienList, setHocVienList] = useState<HocVien[]>([]);

  // State cho loading và error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // State cho modal phê duyệt/từ chối
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalForm, setApprovalForm] = useState({
    nguoiDuyet: '',
    lyDo: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [baoLuuList, searchTerm, statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [baoLuuData, lopHocData, hocVienData] = await Promise.all([
        baoLuuService.getAll(),
        lopHocService.getAll(),
        hocVienService.getAll()
      ]);

      setLopHocList(lopHocData);
      setHocVienList(hocVienData);

      // Kết hợp dữ liệu bảo lưu với thông tin lớp học và học viên
      const baoLuuWithDetails = await Promise.all(
        baoLuuData.map(async (baoLuu) => {
          try {
            // Lấy thông tin đăng ký lớp học từ dangKyID
            const dangKyLop = await dangKyLopService.getById(baoLuu.dangKyID);

            // Tìm thông tin học viên và lớp học từ DangKyLop
            const hocVien = hocVienData.find(hv => hv.hocVienID === dangKyLop.hocVienID);
            const lopHoc = lopHocData.find(lop => lop.lopID === dangKyLop.lopID);

            return {
              ...baoLuu,
              lopHoc,
              hocVien
            };
          } catch (error) {
            console.error('Lỗi khi lấy thông tin chi tiết bảo lưu:', error);
            return {
              ...baoLuu,
              lopHoc: undefined,
              hocVien: undefined
            };
          }
        })
      );

      setBaoLuuList(baoLuuWithDetails);

      // Chọn bảo lưu đầu tiên mặc định
      if (baoLuuWithDetails.length > 0) {
        setSelectedBaoLuu(baoLuuWithDetails[0]);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...baoLuuList];

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.ngayBaoLuu).getTime() - new Date(a.ngayBaoLuu).getTime());

    // Lọc theo trạng thái
    if (statusFilter !== 'all') {
      filtered = filtered.filter(baoLuu => baoLuu.trangThai === statusFilter);
    }

    // Lọc theo tìm kiếm
    if (searchTerm) {
      filtered = filtered.filter(baoLuu =>
        baoLuu.hocVien?.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        baoLuu.lopHoc?.lopID?.toString().includes(searchTerm.toLowerCase()) ||
        baoLuu.lyDo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBaoLuuList(filtered);
  };

  const handleBaoLuuSelect = (baoLuu: BaoLuuWithDetails) => {
    setSelectedBaoLuu(baoLuu);
  };

  const getStatusBadge = (trangThai: string) => {
    const statusConfig = {
      'DangChoDuyet': { color: '#ffc107', icon: '⏳' },
      'DaDuyet': { color: '#28a745', icon: '✅' },
      'DaSuDung': { color: '#007bff', icon: '📚' },
      'TuChoi': { color: '#dc3545', icon: '❌' },
      'HetHan': { color: '#6c757d', icon: '⏰' }
    };

    const config = statusConfig[trangThai as keyof typeof statusConfig] || statusConfig.DangChoDuyet;

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
        {config.icon} {mapBaoLuuStatus(trangThai)}
      </span>
    );
  };

  const isExpired = (hanBaoLuu?: string | null) => {
    if (!hanBaoLuu) return false;
    return new Date(hanBaoLuu) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleApproval = (baoLuu: BaoLuuWithDetails, action: 'approve' | 'reject') => {
    setSelectedBaoLuu(baoLuu);
    setApprovalAction(action);
    setApprovalForm({
      nguoiDuyet: '',
      lyDo: ''
    });
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedBaoLuu) return;

    try {
      if (approvalAction === 'approve') {
        await baoLuuService.approve(selectedBaoLuu.baoLuuID, approvalForm.nguoiDuyet);
        // Cập nhật trạng thái trong danh sách
        const updatedList = baoLuuList.map(bl =>
          bl.baoLuuID === selectedBaoLuu.baoLuuID
            ? { ...bl, trangThai: 'DaDuyet', nguoiDuyet: approvalForm.nguoiDuyet }
            : bl
        );
        setBaoLuuList(updatedList);
        setSelectedBaoLuu({ ...selectedBaoLuu, trangThai: 'DaDuyet', nguoiDuyet: approvalForm.nguoiDuyet });
      } else {
        await baoLuuService.reject(selectedBaoLuu.baoLuuID, approvalForm.lyDo);
        // Cập nhật trạng thái trong danh sách
        const updatedList = baoLuuList.map(bl =>
          bl.baoLuuID === selectedBaoLuu.baoLuuID
            ? { ...bl, trangThai: 'TuChoi', lyDo: approvalForm.lyDo }
            : bl
        );
        setBaoLuuList(updatedList);
        setSelectedBaoLuu({ ...selectedBaoLuu, trangThai: 'TuChoi', lyDo: approvalForm.lyDo });
      }

      setShowApprovalModal(false);
      alert(`Đã ${approvalAction === 'approve' ? 'duyệt' : 'từ chối'} bảo lưu thành công!`);
    } catch (error) {
      console.error('Lỗi khi xử lý bảo lưu:', error);
      alert(`Không thể ${approvalAction === 'approve' ? 'duyệt' : 'từ chối'} bảo lưu. Vui lòng thử lại.`);
    }
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Quản lý Bảo lưu</h2>
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
          <h2>Quản lý Bảo lưu</h2>
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
        <h2>Quản lý Bảo lưu</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên học viên, lớp học hoặc lý do..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginLeft: '10px'
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="DangChoDuyet">Đang chờ duyệt</option>
            <option value="DaDuyet">Đã duyệt</option>
            <option value="DaSuDung">Đã sử dụng</option>
            <option value="TuChoi">Từ chối</option>
            <option value="HetHan">Hết hạn</option>
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
        alignItems: 'center'
      }}>
        <div>
          <strong>Tổng đơn bảo lưu:</strong> {filteredBaoLuuList.length}
        </div>
        <div>
          <strong>Đang chờ duyệt:</strong> {filteredBaoLuuList.filter(baol => baol.trangThai === 'DangChoDuyet').length}
        </div>
        <div>
          <strong>Đã duyệt:</strong> {filteredBaoLuuList.filter(baol => baol.trangThai === 'DaDuyet').length}
        </div>
        <div>
          <strong>Từ chối:</strong> {filteredBaoLuuList.filter(baol => baol.trangThai === 'TuChoi').length}
        </div>
        <div>
          <strong>Hết hạn:</strong> {filteredBaoLuuList.filter(baol => baol.trangThai === 'HetHan').length}
        </div>
      </div>

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã BL</th>
              <th>Học viên</th>
              <th>Lớp học</th>
              <th>Ngày bảo lưu</th>
              <th>Số buổi còn lại</th>
              <th>Hạn bảo lưu</th>
              <th>Trạng thái</th>
              <th>Lý do</th>
              <th>Người duyệt</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredBaoLuuList.map(baoLuu => (
              <tr key={baoLuu.baoLuuID}>
                <td>{baoLuu.baoLuuID}</td>
                <td>{baoLuu.hocVien?.hoTen || 'Không xác định'}</td>
                <td>{`Lớp ${baoLuu.lopHoc?.lopID || 'Không xác định'}`}</td>
                <td>{formatDate(baoLuu.ngayBaoLuu)}</td>
                <td>{baoLuu.soBuoiConLai}</td>
                <td>
                  {baoLuu.hanBaoLuu ? (
                    <span style={{ color: isExpired(baoLuu.hanBaoLuu) ? '#dc3545' : 'inherit' }}>
                      {formatDate(baoLuu.hanBaoLuu)}
                      {isExpired(baoLuu.hanBaoLuu) && ' (Hết hạn)'}
                    </span>
                  ) : 'Không giới hạn'}
                </td>
                <td>{getStatusBadge(baoLuu.trangThai)}</td>
                <td>{baoLuu.lyDo || 'Không có'}</td>
                <td>{baoLuu.nguoiDuyet || 'Chưa duyệt'}</td>
                <td>
                  <div className="action-buttons">
                    {baoLuu.trangThai === 'DangChoDuyet' && (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => handleApproval(baoLuu, 'approve')}
                          title="Duyệt bảo lưu"
                        >
                          ✅ Duyệt
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleApproval(baoLuu, 'reject')}
                          title="Từ chối bảo lưu"
                        >
                          ❌ Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
             ))}
           </tbody>
        </table>

        {filteredBaoLuuList.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {baoLuuList.length === 0 ? 'Chưa có yêu cầu bảo lưu nào.' : 'Không tìm thấy bảo lưu nào phù hợp.'}
          </div>
        )}
      </div>

      {/* Modal phê duyệt/từ chối */}
      {showApprovalModal && (
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
              {approvalAction === 'approve' ? 'Duyệt bảo lưu' : 'Từ chối bảo lưu'}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Học viên: <span style={{ fontWeight: 'normal', color: '#dc2626' }}>{selectedBaoLuu?.hocVien?.hoTen}</span>
              </label>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Lớp học: <span style={{ fontWeight: 'normal', color: '#dc2626' }}>{`Lớp ${selectedBaoLuu?.lopHoc?.lopID}`}</span>
              </label>
            </div>

            {approvalAction === 'approve' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Người duyệt: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên người duyệt"
                  value={approvalForm.nguoiDuyet}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, nguoiDuyet: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Lý do từ chối: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <textarea
                  placeholder="Nhập lý do từ chối bảo lưu"
                  value={approvalForm.lyDo}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, lyDo: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowApprovalModal(false)}
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
                onClick={handleApprovalSubmit}
                disabled={
                  approvalAction === 'approve'
                    ? !approvalForm.nguoiDuyet.trim()
                    : !approvalForm.lyDo.trim()
                }
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: (approvalAction === 'approve'
                    ? !approvalForm.nguoiDuyet.trim()
                    : !approvalForm.lyDo.trim()) ? '#6c757d' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (approvalAction === 'approve'
                    ? !approvalForm.nguoiDuyet.trim()
                    : !approvalForm.lyDo.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBaoLuuList;
