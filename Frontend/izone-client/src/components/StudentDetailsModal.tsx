import React, { useState, useEffect } from 'react';
import { dangKyLopService, DangKyLop, HocVien } from '../services/api';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: HocVien | null;
}

interface ExtendedDangKyLop extends DangKyLop {
  lopHoc?: {
    khoaHoc?: {
      tenKhoaHoc: string;
      hocPhi: number;
    };
    giangVien?: {
      hoTen: string;
    };
    diaDiem?: {
      tenCoSo: string;
    };
    ngayBatDau: string;
    ngayKetThuc?: string;
    caHoc?: string;
    ngayHocTrongTuan?: string;
    trangThai: string;
  };
  loaiDangKy?: string;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  onClose,
  student
}) => {
  const [registrations, setRegistrations] = useState<ExtendedDangKyLop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      fetchStudentRegistrations();
    }
  }, [isOpen, student]);

  const fetchStudentRegistrations = async () => {
    if (!student) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch registrations with class details
      const data = await dangKyLopService.getByHocVienIdWithDetails(student.hocVienID);
      setRegistrations(data as ExtendedDangKyLop[]);
    } catch (error) {
      console.error('Lỗi khi tải lịch sử đăng ký:', error);
      setError('Không thể tải lịch sử đăng ký lớp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DangHoc': return '#28a745';
      case 'DaKetThuc': return '#6c757d';
      case 'DaHuy': return '#dc3545';
      case 'DaBaoLuu': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DangHoc': return 'Đang học';
      case 'DaKetThuc': return 'Đã kết thúc';
      case 'DaHuy': return 'Đã hủy';
      case 'DaBaoLuu': return 'Đã bảo lưu';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'DaThanhToan': return '#28a745';
      case 'ChuaThanhToan': return '#dc3545';
      case 'DangXuLy': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'DaThanhToan': return 'Đã thanh toán';
      case 'ChuaThanhToan': return 'Chưa thanh toán';
      case 'DangXuLy': return 'Đang xử lý';
      default: return status;
    }
  };

  const getRegistrationTypeColor = (type: string) => {
    switch (type) {
      case 'BinhThuong': return '#17a2b8'; // Blue
      case 'HocTiep': return '#28a745'; // Green
      case 'HocLai': return '#ffc107'; // Yellow
      default: return '#6c757d'; // Gray
    }
  };

  const getRegistrationTypeText = (type: string) => {
    switch (type) {
      case 'BinhThuong': return 'Đăng ký bình thường';
      case 'HocTiep': return 'Đi học tiếp sau bảo lưu';
      case 'HocLai': return 'Học lại';
      default: return 'Không xác định';
    }
  };

  if (!isOpen) return null;

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
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid #e9ecef',
          background: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{
                margin: '0 0 8px 0',
                color: '#dc2626',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Chi tiết học viên
              </h2>
              {student && (
                <div style={{ fontSize: '16px', color: '#495057' }}>
                  <strong>{student.hoTen}</strong>
                  {student.email && <span> • {student.email}</span>}
                  {student.sdt && <span> • {student.sdt}</span>}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
              {error}
            </div>
          ) : (
            <div>
              {/* Summary */}
              <div style={{
                padding: '20px 30px',
                background: '#f8f9fa',
                borderBottom: '1px solid #e9ecef'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>
                  Tổng quan đăng ký
                </h3>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                      {registrations.length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>Tổng lớp đã đăng ký</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                      {registrations.filter(r => r.trangThaiDangKy === 'DangHoc').length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>Đang học</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>
                      {registrations.filter(r => r.trangThaiDangKy === 'DaHoanThanh').length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>Đã hoàn thành</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                      {registrations.filter(r => r.trangThaiDangKy === 'DaHuy').length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>Đã hủy</div>
                  </div>
                </div>
              </div>

              {/* Registration History */}
              <div style={{ padding: '20px 30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>
                  Lịch sử đăng ký lớp
                </h3>

                {registrations.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6c757d',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    Học viên chưa đăng ký lớp nào.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {registrations
                      .sort((a, b) => new Date(b.ngayDangKy).getTime() - new Date(a.ngayDangKy).getTime())
                      .map((registration, index) => (
                      <div key={registration.dangKyID || index} style={{
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        padding: '20px',
                        background: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{
                              margin: '0 0 8px 0',
                              color: '#dc2626',
                              fontSize: '18px',
                              fontWeight: '600'
                            }}>
                              {registration.lopHoc?.khoaHoc?.tenKhoaHoc || 'Tên khóa học không có'}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: '#6c757d' }}>
                              <span>📚 Mã lớp: {registration.lopID}</span>
                              <span>👨‍🏫 {registration.lopHoc?.giangVien?.hoTen || 'Chưa có giảng viên'}</span>
                              <span>📍 {registration.lopHoc?.diaDiem?.tenCoSo || 'Chưa có địa điểm'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'white',
                              background: getStatusColor(registration.trangThaiDangKy)
                            }}>
                              {getStatusText(registration.trangThaiDangKy)}
                            </span>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'white',
                              background: getPaymentStatusColor(registration.trangThaiThanhToan)
                            }}>
                              {getPaymentStatusText(registration.trangThaiThanhToan)}
                            </span>
                            {registration.loaiDangKy && (
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'white',
                                background: getRegistrationTypeColor(registration.loaiDangKy)
                              }}>
                                {getRegistrationTypeText(registration.loaiDangKy)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>NGÀY ĐĂNG KÝ</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {new Date(registration.ngayDangKy).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>NGÀY BẮT ĐẦU</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {registration.lopHoc?.ngayBatDau ? new Date(registration.lopHoc.ngayBatDau).toLocaleDateString('vi-VN') : 'Chưa có'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>NGÀY KẾT THÚC</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {registration.lopHoc?.ngayKetThuc ? new Date(registration.lopHoc.ngayKetThuc).toLocaleDateString('vi-VN') : 'Chưa có'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>HỌC PHÍ</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {registration.lopHoc?.khoaHoc?.hocPhi ? registration.lopHoc.khoaHoc.hocPhi.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa có'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>CA HỌC</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {registration.lopHoc?.caHoc || 'Chưa có'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>NGÀY HỌC</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {registration.lopHoc?.ngayHocTrongTuan || 'Chưa có'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>TRẠNG THÁI LỚP</div>
                            <div style={{ fontWeight: '600', color: '#495057' }}>
                              {registration.lopHoc?.trangThai === 'DangDienRa' ? 'Đang diễn ra' :
                               registration.lopHoc?.trangThai === 'ChuaBatDau' ? 'Chưa bắt đầu' :
                               registration.lopHoc?.trangThai === 'DaKetThuc' ? 'Đã kết thúc' :
                               registration.lopHoc?.trangThai || 'Chưa có'}
                            </div>
                          </div>
                          {registration.ngayHuy && (
                            <div>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>NGÀY HỦY</div>
                              <div style={{ fontWeight: '600', color: '#dc3545' }}>
                                {new Date(registration.ngayHuy).toLocaleDateString('vi-VN')}
                                {registration.lyDoHuy && <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                  Lý do: {registration.lyDoHuy}
                                </div>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 30px',
          borderTop: '1px solid #e9ecef',
          background: '#f8f9fa',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
