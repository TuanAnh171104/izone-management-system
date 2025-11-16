import React, { useState, useEffect } from 'react';
import { lopHocService, dangKyLopService, giangVienService, diaDiemService, thanhToanService } from '../services/api';
import PaymentModal from './PaymentModal';
import {
  Close,
  Group,
  LocationOn,
  CalendarToday,
  Schedule,
  School,
  CheckCircle,
  Warning
} from '@mui/icons-material';

interface LopHoc {
  lopID: number;
  khoaHocID: number;
  giangVienID: number;
  diaDiemID: number | null;
  ngayBatDau: string;
  ngayKetThuc: string | null;
  caHoc: string | null;
  ngayHocTrongTuan: string | null;
  donGiaBuoiDay: number | null;
  thoiLuongGio: number;
  soLuongToiDa: number | null;
  trangThai: string | null;
  khoaHoc?: {
    khoaHocID: number;
    tenKhoaHoc: string;
    soBuoi: number;
    hocPhi: number;
    donGiaTaiLieu: number;
  };
  giangVien?: {
    giangVienID: number;
    hoTen: string;
    chuyenMon: string | null;
  };
  diaDiem?: {
    diaDiemID: number;
    tenCoSo: string;
    diaChi: string;
    sucChua: number | null;
  };
}

interface DangKyLop {
  dangKyID: number;
  hocVienID: number;
  lopID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
  trangThaiThanhToan: string;
}

interface ClassSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  khoaHocId: number;
  khoaHocName: string;
  hocVienId: number;
  onRegistrationSuccess: () => void;
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({
  isOpen,
  onClose,
  khoaHocId,
  khoaHocName,
  hocVienId,
  onRegistrationSuccess
}) => {
  const [lopHocs, setLopHocs] = useState<LopHoc[]>([]);
  const [dangKyLops, setDangKyLops] = useState<DangKyLop[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLopId, setSelectedLopId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && khoaHocId) {
      loadClasses();
    }
  }, [isOpen, khoaHocId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const [lopHocsData, dangKyLopsData] = await Promise.all([
        lopHocService.getForRegistration(),
        dangKyLopService.getAll()
      ]);

      // Lọc lớp học theo khóa học và trạng thái chưa bắt đầu
      const filteredClasses = lopHocsData.filter(lop =>
        lop.khoaHocID === khoaHocId &&
        lop.trangThai === 'ChuaBatDau' &&
        lop.ngayBatDau >= new Date().toISOString().split('T')[0]
      );

      setLopHocs(filteredClasses);
      setDangKyLops(dangKyLopsData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lớp học:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRegisteredCount = (lopId: number) => {
    return dangKyLops.filter(dk =>
      dk.lopID === lopId &&
      dk.trangThaiDangKy === 'DangHoc'
    ).length;
  };

  const isClassFull = (lop: LopHoc) => {
    if (!lop.soLuongToiDa) return false;
    return getRegisteredCount(lop.lopID) >= lop.soLuongToiDa;
  };

  const isAlreadyRegistered = (lopId: number) => {
    return dangKyLops.some(dk =>
      dk.lopID === lopId &&
      dk.hocVienID === hocVienId &&
      dk.trangThaiDangKy === 'DangHoc'
    );
  };

  const handleRegister = (lopId: number) => {
    if (isAlreadyRegistered(lopId)) {
      alert('Bạn đã đăng ký lớp học này rồi!');
      return;
    }

    // Thay vì đăng ký ngay, mở payment modal
    setSelectedLopId(lopId);
    setShowPaymentModal(true);
  };

  const handleVNPayPayment = async (lopId: number) => {
    if (isAlreadyRegistered(lopId)) {
      alert('Bạn đã đăng ký lớp học này rồi!');
      return;
    }

    try {
      setRegistering(lopId);
      const lopHoc = lopHocs.find(l => l.lopID === lopId);
      if (!lopHoc) return;

      // Gọi API tạo VNPay payment
      const response = await thanhToanService.createVNPayPayment({
        hocVienID: hocVienId,
        lopID: lopId,
        soTien: lopHoc.khoaHoc?.hocPhi || 0
      });

      if (response.vnpayUrl) {
        // Redirect trực tiếp đến VNPay
        window.location.href = response.vnpayUrl;
      } else {
        alert('Không thể tạo thanh toán VNPay. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi tạo thanh toán VNPay:', error);
      alert('Có lỗi xảy ra khi tạo thanh toán VNPay. Vui lòng thử lại.');
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content class-selection-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Đăng ký khóa học: {khoaHocName}</h3>
          <button className="close-button" onClick={onClose}>
            <Close />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách lớp học...</p>
            </div>
          ) : lopHocs.length === 0 ? (
            <div className="no-classes">
              <span className="no-classes-icon"><Warning /></span>
              <h4>Không có lớp học nào khả dụng</h4>
              <p>Hiện tại không có lớp học nào cho khóa học này. Vui lòng liên hệ quản trị viên để biết thêm thông tin.</p>
            </div>
          ) : (
            <div className="classes-grid">
              {lopHocs.map((lop) => {
                const registeredCount = getRegisteredCount(lop.lopID);
                const isFull = isClassFull(lop);
                const alreadyRegistered = isAlreadyRegistered(lop.lopID);

                return (
                  <div key={lop.lopID} className={`class-card ${isFull ? 'full' : ''} ${alreadyRegistered ? 'registered' : ''}`}>
                    <div className="class-header">
                      <div className="class-status">
                        {alreadyRegistered && (
                          <div className="status-registered">
                            <CheckCircle />
                            <span>Đã đăng ký</span>
                          </div>
                        )}
                        {isFull && !alreadyRegistered && (
                          <div className="status-full">
                            <Group />
                            <span>Đã đầy</span>
                          </div>
                        )}
                      </div>
                      <div className="class-info">
                        <h4>{lop.khoaHoc?.tenKhoaHoc}</h4>
                        <div className="class-details">
                          <div className="detail-item">
                            <CalendarToday />
                            <span>{formatDate(lop.ngayBatDau)} - {lop.ngayKetThuc ? formatDate(lop.ngayKetThuc) : 'Chưa xác định'}</span>
                          </div>
                          <div className="detail-item">
                            <Schedule />
                            <span>{lop.caHoc || 'Chưa xác định'} ({lop.ngayHocTrongTuan || 'Chưa xác định'})</span>
                          </div>
                          <div className="detail-item">
                            <Group />
                            <span>{registeredCount}/{lop.soLuongToiDa || 'Không giới hạn'} học viên</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="class-body">
                      <div className="lecturer-info">
                        <School />
                        <div>
                          <strong>Giảng viên:</strong> {lop.giangVien?.hoTen || 'Chưa xác định'}
                          {lop.giangVien?.chuyenMon && (
                            <div className="specialty">Chuyên môn: {lop.giangVien.chuyenMon}</div>
                          )}
                        </div>
                      </div>

                      {lop.diaDiem && (
                        <div className="location-info">
                          <LocationOn />
                          <div>
                            <strong>Địa điểm:</strong> {lop.diaDiem.tenCoSo}
                            <div className="address">{lop.diaDiem.diaChi}</div>
                          </div>
                        </div>
                      )}

                      <div className="class-stats">
                        <div className="stat-item">
                          <span>Thời lượng:</span>
                          <strong>{lop.thoiLuongGio}h/buổi</strong>
                        </div>
                        <div className="stat-item">
                          <span>Số buổi:</span>
                          <strong>{lop.khoaHoc?.soBuoi || 'Chưa xác định'}</strong>
                        </div>
                        <div className="stat-item">
                          <span>Học phí:</span>
                          <strong>{formatCurrency(lop.khoaHoc?.hocPhi || 0)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="class-footer">
                      <div className="payment-buttons" style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '15px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          className={`register-btn ${isFull || alreadyRegistered ? 'disabled' : ''}`}
                          onClick={() => handleRegister(lop.lopID)}
                          disabled={isFull || alreadyRegistered || registering === lop.lopID}
                          style={{
                            background: 'linear-gradient(135deg, #28a745, #20c997)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: (isFull || alreadyRegistered || registering === lop.lopID) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center',
                            minWidth: '180px',
                            opacity: (isFull || alreadyRegistered || registering === lop.lopID) ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!isFull && !alreadyRegistered && registering !== lop.lopID) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isFull && !alreadyRegistered && registering !== lop.lopID) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                            }
                          }}
                        >
                          {registering === lop.lopID ? (
                            <span>Đang xử lý...</span>
                          ) : alreadyRegistered ? (
                            <span>Đã đăng ký</span>
                          ) : isFull ? (
                            <span>Đã đầy</span>
                          ) : (
                            <span>📱 Thanh toán với VietQR</span>
                          )}
                        </button>

                        {!isFull && !alreadyRegistered && (
                        <button
                          className="vnpay-btn"
                          onClick={() => handleVNPayPayment(lop.lopID)}
                          disabled={registering === lop.lopID}
                          style={{
                            background: 'linear-gradient(135deg, #dc3545, #c82333)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: registering === lop.lopID ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center',
                            minWidth: '180px',
                            opacity: registering === lop.lopID ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (registering !== lop.lopID) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (registering !== lop.lopID) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                            }
                          }}
                        >
                          {registering === lop.lopID ? (
                            <span>Đang xử lý...</span>
                          ) : (
                            <span>💳 Thanh toán với VNPay</span>
                          )}
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        lopHoc={lopHocs.find(l => l.lopID === selectedLopId)!}
        hocVienId={hocVienId}
        onPaymentSuccess={() => {
          alert('Thanh toán thành công! Đã đăng ký khóa học.');
          loadClasses(); // Reload data
          onRegistrationSuccess();
          setShowPaymentModal(false);
        }}
      />
    </div>
  );
};

export default ClassSelectionModal;
