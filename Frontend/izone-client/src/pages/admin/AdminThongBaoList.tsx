import React, { useState, useEffect } from 'react';
import { thongBaoService, ThongBao, lopHocService, LopHoc, hocVienService, HocVien } from '../../services/api';
import '../../styles/Management.css';

const AdminThongBaoList: React.FC = () => {
  const [thongBaoList, setThongBaoList] = useState<ThongBao[]>([]);
  const [filteredThongBaoList, setFilteredThongBaoList] = useState<ThongBao[]>([]);
  const [selectedThongBao, setSelectedThongBao] = useState<ThongBao | null>(null);

  // State cho dữ liệu liên quan
  const [lopHocList, setLopHocList] = useState<LopHoc[]>([]);
  const [hocVienList, setHocVienList] = useState<HocVien[]>([]);

  // State cho loading và error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'send' | 'history'>('all');

  // State cho form gửi thông báo
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    noiDung: '',
    loaiNguoiNhan: 'ToanHeThong',
    nguoiNhanID: '',
    lopHocID: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [thongBaoList, searchTerm, typeFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [thongBaoData, lopHocData, hocVienData] = await Promise.all([
        thongBaoService.getAll(),
        lopHocService.getAll(),
        hocVienService.getAll()
      ]);

      setLopHocList(lopHocData);
      setHocVienList(hocVienData);
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

    setFilteredThongBaoList(filtered);
  };

  const handleThongBaoSelect = (thongBao: ThongBao) => {
    setSelectedThongBao(thongBao);
  };

  const getRecipientTypeBadge = (loaiNguoiNhan?: string | null) => {
    const typeConfig = {
      'TatCa': { color: '#17a2b8', text: 'Toàn hệ thống', icon: '🌐' },
      'LopHoc': { color: '#ffc107', text: 'Theo lớp', icon: '📚' },
      'HocVien': { color: '#28a745', text: 'Cá nhân', icon: '👤' },
      'GiangVien': { color: '#6f42c1', text: 'Giảng viên', icon: '👨‍🏫' }
    };

    const type = loaiNguoiNhan || 'TatCa';
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.TatCa;

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
                  <option value="TatCa">Toàn hệ thống</option>
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
            {filteredThongBaoList.map(thongBao => (
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
                <option value="LopHoc">Theo lớp học</option>
                <option value="HocVien">Cá nhân học viên</option>
              </select>
            </div>

            {sendForm.loaiNguoiNhan === 'LopHoc' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Chọn lớp học: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={sendForm.lopHocID}
                  onChange={(e) => setSendForm(prev => ({ ...prev, lopHocID: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Chọn lớp học...</option>
                  {lopHocList.map(lop => (
                    <option key={lop.lopID} value={lop.lopID}>
                      Lớp {lop.lopID}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sendForm.loaiNguoiNhan === 'HocVien' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Chọn học viên: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={sendForm.nguoiNhanID}
                  onChange={(e) => setSendForm(prev => ({ ...prev, nguoiNhanID: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Chọn học viên...</option>
                  {hocVienList.map(hv => (
                    <option key={hv.hocVienID} value={hv.hocVienID}>
                      {hv.hoTen}
                    </option>
                  ))}
                </select>
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
                         (sendForm.loaiNguoiNhan === 'HocVien' && !sendForm.nguoiNhanID)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: (!sendForm.noiDung.trim() ||
                               (sendForm.loaiNguoiNhan === 'LopHoc' && !sendForm.lopHocID) ||
                               (sendForm.loaiNguoiNhan === 'HocVien' && !sendForm.nguoiNhanID)) ? '#6c757d' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!sendForm.noiDung.trim() ||
                           (sendForm.loaiNguoiNhan === 'LopHoc' && !sendForm.lopHocID) ||
                           (sendForm.loaiNguoiNhan === 'HocVien' && !sendForm.nguoiNhanID)) ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="fas fa-paper-plane" style={{ marginRight: '5px' }}></i>
                Gửi thông báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThongBaoList;
