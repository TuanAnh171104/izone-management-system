import React from 'react';
import { BuoiHoc, DiaDiem } from '../services/api';

interface SessionDetailModalProps {
  session: BuoiHoc | null;
  diaDiem?: DiaDiem | null;
  isOpen: boolean;
  onClose: () => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  diaDiem,
  isOpen,
  onClose
}) => {
  if (!isOpen || !session) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'dadiendra':
      case 'đã diễn ra':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'sapdienra':
      case 'sắp diễn ra':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      case 'dangdienra':
      case 'đang diễn ra':
        return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
      case 'dahuy':
      case 'đã hủy':
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header Modal */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          color: 'white',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            <i className="fas fa-calendar-alt" style={{ marginRight: '10px' }}></i>
            Chi tiết buổi học
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Nội dung Modal */}
        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
          {/* Thông tin cơ bản buổi học */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>
                Buổi học #{session.buoiHocID}
              </h4>
              <span style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                ...getStatusColor(session.trangThai)
              }}>
                {session.trangThai || 'Chưa xác định'}
              </span>
            </div>

            {/* Ngày học */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                <i className="fas fa-calendar" style={{ marginRight: '8px', color: '#dc2626' }}></i>
                Ngày học:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                {formatDate(session.ngayHoc)}
              </div>
            </div>

            {/* Thời gian */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                <i className="fas fa-clock" style={{ marginRight: '8px', color: '#dc2626' }}></i>
                Thời gian:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                {session.thoiGianBatDau && session.thoiGianKetThuc
                  ? `${session.thoiGianBatDau} - ${session.thoiGianKetThuc}`
                  : 'Chưa xác định'
                }
              </div>
            </div>

            {/* Địa điểm */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: '#dc2626' }}></i>
                Địa điểm:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                {diaDiem?.tenCoSo && diaDiem?.diaChi
                  ? `${diaDiem.tenCoSo} - ${diaDiem.diaChi}`
                  : 'Chưa xác định'
                }
              </div>
            </div>

            {/* Lớp học ID */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                <i className="fas fa-hashtag" style={{ marginRight: '8px', color: '#dc2626' }}></i>
                Mã lớp học:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                #{session.lopID}
              </div>
            </div>
          </div>

          {/* Thông tin địa điểm chi tiết */}
          {diaDiem && (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>
                <i className="fas fa-building" style={{ marginRight: '8px', color: '#dc2626' }}></i>
                Thông tin địa điểm
              </h5>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div>
                  <strong style={{ color: '#4b5563' }}>Tên cơ sở:</strong> {diaDiem.tenCoSo}
                </div>
                <div>
                  <strong style={{ color: '#4b5563' }}>Địa chỉ:</strong> {diaDiem.diaChi}
                </div>
                {diaDiem.sucChua && (
                  <div>
                    <strong style={{ color: '#4b5563' }}>Sức chứa:</strong> {diaDiem.sucChua}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thông tin bổ sung */}
          <div style={{
            background: '#fef7ff',
            border: '1px solid #fce7f3',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#dc2626' }}></i>
              Thông tin bổ sung
            </h5>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
              <div>• Nhấn vào nút X để đóng cửa sổ</div>
              <div>• Thông tin buổi học có thể thay đổi theo cập nhật từ giảng viên</div>
              <div>• Vui lòng đến đúng giờ để không bỏ lỡ buổi học</div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div style={{
          padding: '15px 20px',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'right'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
