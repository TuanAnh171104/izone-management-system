import React, { useState, useEffect } from 'react';
import { thanhToanService } from '../services/api';
import '../styles/PaymentModal.css';
import {
  Close,
  QrCode,
  CreditCard,
  CheckCircle,
  Warning,
  PhoneAndroid,
  Schedule,
  ContentCopy,
  AccountBalance,
  Loop
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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lopHoc: LopHoc;
  hocVienId: number;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, lopHoc, hocVienId, onPaymentSuccess
}) => {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | 'expired' | 'cancelled'>('pending');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Reset state when payment method changes
  const resetPaymentState = () => {
    setPaymentData(null);
    setPaymentStatus('pending');
    setStatusMessage('');
    setTimeLeft(300); // Reset countdown
  };

  useEffect(() => {
    if (isOpen && lopHoc) {
      resetPaymentState();
      createPayment();
      startCountdown();
    }

    return () => {
      setPaymentStatus('pending');
      setStatusMessage('');
    };
  }, [isOpen, lopHoc]);

  const createPayment = async () => {
    try {
      setLoading(true);
      setStatusMessage('Đang tạo thanh toán...');

      const response = await thanhToanService.createPayment({
        hocVienID: hocVienId,
        lopID: lopHoc.lopID,
        soTien: lopHoc.khoaHoc?.hocPhi || 0
      });
      setPaymentData(response);

      // VietQR tạo payment thành công, hiển thị QR code và nút confirm
      setStatusMessage('✅ Đã tạo mã QR thanh toán. Click "Thanh toán ngay" để xác nhận.');
    } catch (error) {
      console.error('Lỗi tạo thanh toán:', error);
      setStatusMessage('❌ Có lỗi xảy ra khi tạo thanh toán');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('expired');
          setStatusMessage('⏰ Mã QR đã hết hạn. Vui lòng tạo lại.');

          // Auto cancel payment when timeout
          if (paymentData && paymentStatus === 'pending') {
            handleAutoCancel();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleAutoCancel = async () => {
    if (!paymentData) return;

    try {
      setStatusMessage('⏰ Đã hết thời gian thanh toán. Đang hủy...');
      await thanhToanService.cancelPayment(paymentData.transactionRef);
      setStatusMessage('⏰ Đã hủy thanh toán do hết thời gian.');
    } catch (error) {
      console.error('Lỗi auto cancel payment:', error);
    }
  };

  const startStatusPolling = () => {
    const pollInterval = setInterval(async () => {
      if (paymentData && paymentStatus === 'pending') {
        try {
          // Kiểm tra trạng thái thanh toán từ backend
          const response = await thanhToanService.getPaymentStatus(paymentData.transactionRef);
          if (response.status === 'Completed') {
            setPaymentStatus('completed');
            setStatusMessage('✅ Thanh toán thành công! Đang xử lý đăng ký...');
            clearInterval(pollInterval);

            // Delay để hiển thị success message trước khi đóng
            setTimeout(() => {
              onPaymentSuccess();
              onClose();
            }, 2000);
          }
        } catch (error) {
          console.error('Lỗi kiểm tra trạng thái thanh toán:', error);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage('📋 Đã sao chép vào clipboard');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleCancelPayment = async () => {
    if (!paymentData || !window.confirm('Bạn có chắc chắn muốn hủy thanh toán?')) {
      return;
    }

    try {
      setIsCancelling(true);
      setStatusMessage('Đang hủy thanh toán...');

      await thanhToanService.cancelPayment(paymentData.transactionRef);

      setPaymentStatus('cancelled');
      setStatusMessage('✅ Đã hủy thanh toán thành công. Bản ghi đăng ký đã được xóa.');

      // Đóng modal sau 2 giây
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Lỗi hủy thanh toán:', error);
      setStatusMessage('❌ Có lỗi xảy ra khi hủy thanh toán');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData || !window.confirm('Bạn có chắc chắn muốn xác nhận thanh toán?')) {
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Đang xác nhận thanh toán...');

      // NEW FLOW: Call confirmPaymentSuccess with all required data
      const response = await thanhToanService.confirmPaymentSuccess({
        hocVienID: hocVienId,
        lopID: lopHoc.lopID,
        soTien: paymentData.soTien,
        transactionRef: paymentData.transactionRef,
        phuongThuc: 'VietQR',
        provider: 'VietQR'
      });

      if (response.success) {
        setPaymentStatus('completed');
        setStatusMessage('✅ Thanh toán thành công! Đã đăng ký khóa học.');

        // Delay để hiển thị success message trước khi đóng
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Lỗi xác nhận thanh toán:', error);
      setStatusMessage('❌ Có lỗi xảy ra khi xác nhận thanh toán');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle />;
      case 'failed':
        return <Warning />;
      case 'expired':
        return <Schedule />;
      default:
        return <Loop />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Thanh toán thành công!';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'expired':
        return 'Mã QR đã hết hạn';
      default:
        return 'Chờ thanh toán...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <CreditCard />
            Thanh toán khóa học
          </h3>
          <div className="countdown">
            <Schedule />
            {formatTime(timeLeft)}
          </div>
          <button className="close-button" onClick={onClose}>
            <Close />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{statusMessage}</p>
            </div>
          ) : paymentData ? (
            <div className="payment-content">
              {/* Course Info */}
              <div className="course-info">
                <h4>{lopHoc.khoaHoc?.tenKhoaHoc}</h4>
                <div className="course-details">
                  <div className="detail-row">
                    <span>Giảng viên:</span>
                    <strong>{lopHoc.giangVien?.hoTen || 'Chưa xác định'}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Lịch học:</span>
                    <strong>{lopHoc.caHoc || 'Chưa xác định'} ({lopHoc.ngayHocTrongTuan || 'Chưa xác định'})</strong>
                  </div>
                  <div className="detail-row">
                    <span>Thời gian:</span>
                    <strong>{lopHoc.thoiLuongGio}h/buổi</strong>
                  </div>
                  <div className="detail-row amount">
                    <span>Học phí:</span>
                    <strong className="price">{formatCurrency(paymentData.soTien)}</strong>
                  </div>
                </div>
              </div>



              {/* Payment Status */}
              <div className={`payment-status ${paymentStatus}`}>
                <div className="status-indicator">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
                <p className="status-message">{statusMessage}</p>
              </div>

              {/* QR Code Section for VietQR */}
              {paymentStatus === 'pending' && paymentData && (
                <div className="qr-section">
                  <div className="qr-code-container">
                    <div className="qr-code">
                      <img
                        src={paymentData.vietQRUrl}
                        alt="VietQR Code"
                        style={{
                          width: '200px',
                          height: '200px',
                          border: '2px solid #28a745',
                          borderRadius: '8px',
                          backgroundColor: 'white'
                        }}
                        onError={(e) => {
                          console.error('Error loading VietQR image:', e);
                          // Show error message if no fallback available
                          e.currentTarget.style.display = 'none';
                          const errorDiv = document.createElement('div');
                          errorDiv.innerHTML = `
                            <div style="width: 200px; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #dc3545; border-radius: 8px; background: #f8d7da; color: #721c24;">
                              <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                              <div style="font-size: 14px; text-align: center; padding: 10px;">Không thể tải QR code</div>
                              <div style="font-size: 12px; text-align: center; padding: 5px;">Vui lòng thử lại</div>
                            </div>
                          `;
                          e.currentTarget.parentNode?.appendChild(errorDiv);
                        }}
                        onLoad={(e) => {
                          console.log('VietQR code loaded successfully');
                          // Ensure QR code is visible and scannable
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.filter = 'none';
                        }}
                      />
                    </div>
                    <div className="qr-overlay">
                      <QrCode />
                    </div>
                  </div>

                  <div className="payment-info">
                    {/* QR Code Actions */}
                    <div className="qr-actions" style={{textAlign: 'center', marginBottom: '15px'}}>
                      <button
                        onClick={createPayment}
                        className="btn-refresh-qr"
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginRight: '10px'
                        }}
                        disabled={loading}
                      >
                        🔄 Tạo lại QR
                      </button>
                      <span style={{fontSize: '12px', color: '#666'}}>
                        💡 QR code sẽ hết hạn sau {formatTime(timeLeft)}
                      </span>
                    </div>

                    <div className="bank-details">
                      <div className="detail-item">
                        <strong>🏦 Ngân hàng:</strong>
                        <span>{paymentData.bankInfo?.bankName || 'VietinBank'}</span>
                      </div>
                      <div className="detail-item">
                        <strong>💳 Số tài khoản:</strong>
                        <span>{paymentData.bankInfo?.accountNumber || '107876493622'}</span>
                        <button
                          className="copy-btn"
                          onClick={() => copyToClipboard(paymentData.bankInfo?.accountNumber || '107876493622')}
                        >
                          <ContentCopy />
                        </button>
                      </div>
                      <div className="detail-item">
                        <strong>👤 Tên tài khoản:</strong>
                        <span>{paymentData.bankInfo?.accountName || 'IZONE EDUCATION'}</span>
                      </div>
                      <div className="detail-item">
                        <strong>💰 Số tiền:</strong>
                        <span className="amount">{formatCurrency(paymentData.soTien)}</span>
                      </div>
                      <div className="detail-item">
                        <strong>📝 Nội dung:</strong>
                        <span className="content">{paymentData.transactionRef || 'IZONE Payment'}</span>
                        <button
                          className="copy-btn"
                          onClick={() => copyToClipboard(paymentData.transactionRef || 'IZONE Payment')}
                        >
                          <ContentCopy />
                        </button>
                      </div>
                      
                    </div>

                    {/* VietQR Payment Info */}
                    <div className="payment-method-info" style={{marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '6px'}}>
                      <div>
                        <strong>📱 VietQR:</strong>
                        <p style={{fontSize: '12px', margin: '5px 0', color: '#666'}}>
                          Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử (MoMo, ViettelPay, ZaloPay, etc.)
                        </p>
                        {/* Confirm Payment Button for VietQR */}
                        <div style={{marginTop: '10px', textAlign: 'center'}}>
                          <button
                            onClick={handleConfirmPayment}
                            disabled={loading}
                            style={{
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '10px 20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.6 : 1
                            }}
                          >
                            {loading ? 'Đang xử lý...' : '💳 Thanh toán ngay'}
                          </button>
                          <p style={{fontSize: '11px', margin: '5px 0 0 0', color: '#666'}}>
                            Click để xác nhận thanh toán và đăng ký khóa học
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Success Message */}
              {paymentStatus === 'completed' && (
                <div className="success-section">
                  <div className="success-animation">
                    <CheckCircle />
                  </div>
                  <h4>🎉 Thanh toán thành công!</h4>
                  <p>Đã đăng ký khóa học thành công. Bạn sẽ nhận được thông báo xác nhận qua email.</p>
                </div>
              )}

              {/* Error/Expired Message */}
              {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
                <div className="error-section">
                  <div className="error-content">
                    <Warning />
                    <h4>{paymentStatus === 'failed' ? 'Thanh toán thất bại' : 'Mã QR đã hết hạn'}</h4>
                    <p>{statusMessage}</p>
                    <button onClick={createPayment} className="btn-retry">
                      Tạo lại mã QR
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="payment-actions">
                {paymentStatus === 'pending' && (
                  <button
                    className="btn-cancel-payment"
                    onClick={handleCancelPayment}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Đang hủy...' : '❌ Hủy thanh toán'}
                  </button>
                )}
                <button
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={paymentStatus === 'completed' || isCancelling}
                >
                  {paymentStatus === 'completed' ? 'Đang xử lý...' : 'Đóng'}
                </button>
              </div>
            </div>
          ) : (
            <div className="error-container">
              <Warning />
              <h4>Không thể tạo thanh toán</h4>
              <p>Có lỗi xảy ra khi tạo mã QR thanh toán.</p>
              <button onClick={createPayment} className="btn-retry">
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
