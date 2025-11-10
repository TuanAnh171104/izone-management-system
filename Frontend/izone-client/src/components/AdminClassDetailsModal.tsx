import React, { useState, useEffect } from 'react';
import { dangKyLopService, DangKyLop, hocVienService, HocVien, lopHocService, LopHoc } from '../services/api';

interface StudentWithStats {
  dangKyID: number;
  hocVienID: number;
  lopID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
  trangThaiThanhToan: string;
  hoTen: string;
  email?: string | null;
  soDienThoai?: string | null;
  tiLeDiemDanh: number;
  diemTrungBinh: number;
}

interface AdminClassDetailsModalProps {
  lopHoc: LopHoc | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdminClassDetailsModal: React.FC<AdminClassDetailsModalProps> = ({
  lopHoc,
  isOpen,
  onClose
}) => {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lopHoc) {
      loadClassDetails();
    }
  }, [isOpen, lopHoc]);

  const loadClassDetails = async () => {
    if (!lopHoc) return;

    setLoading(true);
    setError(null);

    try {
      // Lấy danh sách đăng ký lớp
      const dangKyLops = await dangKyLopService.getByLopId(lopHoc!.lopID);

      // Lấy thông tin chi tiết cho từng học viên
      const studentsWithStats: StudentWithStats[] = [];

      for (const dangKy of dangKyLops) {
        try {
          // Lấy thông tin học viên
          const hocVien = await hocVienService.getById(dangKy.hocVienID);

          // Tính tỷ lệ điểm danh
          let tiLeDiemDanh = 0;
          try {
            const response = await fetch(`http://localhost:5080/api/DiemDanh/attendance-rate/hoc-vien/${dangKy.hocVienID}/lop/${lopHoc.lopID}`);
            if (response.ok) {
              tiLeDiemDanh = await response.json();
            }
          } catch (error) {
            console.warn('Không thể lấy tỷ lệ điểm danh:', error);
          }

          // Tính điểm trung bình
          let diemTrungBinh = 0;
          try {
            const response = await fetch(`http://localhost:5080/api/DiemSo/diem-trung-binh/hoc-vien/${dangKy.hocVienID}/lop/${lopHoc.lopID}`);
            if (response.ok) {
              diemTrungBinh = await response.json();
            }
          } catch (error) {
            console.warn('Không thể lấy điểm trung bình:', error);
          }

          studentsWithStats.push({
            dangKyID: dangKy.dangKyID,
            hocVienID: dangKy.hocVienID,
            lopID: dangKy.lopID,
            ngayDangKy: dangKy.ngayDangKy,
            trangThaiDangKy: dangKy.trangThaiDangKy,
            trangThaiThanhToan: dangKy.trangThaiThanhToan,
            hoTen: hocVien.hoTen || 'Chưa cập nhật',
            email: hocVien.email,
            soDienThoai: hocVien.sdt,
            tiLeDiemDanh: tiLeDiemDanh,
            diemTrungBinh: diemTrungBinh
          });
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin học viên ${dangKy.hocVienID}:`, error);
        }
      }

      setStudents(studentsWithStats);
    } catch (error: any) {
      console.error('Lỗi khi tải chi tiết lớp học:', error);
      setError('Không thể tải thông tin chi tiết lớp học');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'danghoc':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'hoanthanh':
      case 'daketthuc':
        return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
      case 'nghi':
      case 'dahuy':
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'dathanhtoan':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'chuathanhtoan':
        return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  if (!isOpen || !lopHoc) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          background: '#dc2626',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            <i className="fas fa-info-circle"></i> Chi tiết lớp học - ID: {lopHoc.lopID}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            title="Đóng modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxHeight: 'calc(90vh - 80px)', overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '16px' }}></i>
              <h3 style={{ margin: '0 0 8px 0' }}>Đang tải dữ liệu...</h3>
              <p style={{ margin: 0 }}>Vui lòng đợi trong giây lát.</p>
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              color: '#dc2626',
              textAlign: 'center'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
              <h3 style={{ margin: '0 0 8px 0' }}>Lỗi tải dữ liệu</h3>
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          ) : (
            <>
              {/* Thông tin lớp học */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '18px' }}>
                  <i className="fas fa-school"></i> Thông tin lớp học
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div><strong>Mã lớp:</strong> {lopHoc.lopID}</div>
                  <div><strong>Ngày bắt đầu:</strong> {formatDate(lopHoc.ngayBatDau)}</div>
                  {lopHoc.ngayKetThuc && (
                    <div><strong>Ngày kết thúc:</strong> {formatDate(lopHoc.ngayKetThuc)}</div>
                  )}
                  <div><strong>Ca học:</strong> {lopHoc.caHoc || 'Chưa xác định'}</div>
                  <div><strong>Ngày học trong tuần:</strong> {lopHoc.ngayHocTrongTuan || 'Chưa xác định'}</div>
                  <div><strong>Số lượng tối đa:</strong> {lopHoc.soLuongToiDa || 'Không giới hạn'}</div>
                  <div><strong>Trạng thái:</strong>
                    <span style={{
                      marginLeft: '8px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      ...getStatusColor(lopHoc.trangThai || 'unknown')
                    }}>
                      {lopHoc.trangThai || 'Chưa xác định'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thống kê tổng quan */}
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                  <i className="fas fa-chart-bar"></i> Thống kê lớp học
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-users"></i> Tổng học viên
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.filter(s => s.diemTrungBinh >= 5.5).length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-trophy"></i> Đạt yêu cầu
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.tiLeDiemDanh, 0) / students.length) : 0}%
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-calendar-check"></i> Tỷ lệ chuyên cần TB
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.length > 0 ? (students.reduce((sum, s) => sum + s.diemTrungBinh, 0) / students.length).toFixed(1) : '0.0'}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-graduation-cap"></i> Điểm TB toàn lớp
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách học viên */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '18px' }}>
                  <i className="fas fa-users"></i> Danh sách học viên ({students.length} học viên)
                </h3>

                {students.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                    <h4 style={{ margin: '0 0 8px 0' }}>Chưa có học viên nào đăng ký</h4>
                    <p style={{ margin: 0 }}>Lớp học này chưa có học viên đăng ký.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {students.map((student, index) => (
                      <div key={student.dangKyID} style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto auto',
                        gap: '16px',
                        alignItems: 'center'
                      }}>
                        {/* STT và Avatar */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#dc2626',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {index + 1}
                        </div>

                        {/* Thông tin học viên */}
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                            {student.hoTen}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {student.email && `Email: ${student.email}`}
                            {student.soDienThoai && ` • SĐT: ${student.soDienThoai}`}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            Đăng ký: {formatDate(student.ngayDangKy)}
                          </div>
                        </div>

                        {/* Trạng thái đăng ký */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            ...getStatusColor(student.trangThaiDangKy)
                          }}>
                            {student.trangThaiDangKy}
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            ...getPaymentStatusColor(student.trangThaiThanhToan)
                          }}>
                            {student.trangThaiThanhToan}
                          </div>
                        </div>

                        {/* Thống kê */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              color: student.diemTrungBinh >= 5.5 ? '#059669' : '#dc2626'
                            }}>
                              {student.diemTrungBinh > 0 ? student.diemTrungBinh.toFixed(1) : 'Chưa có'}/10
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Điểm số</div>
                          </div>
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: student.tiLeDiemDanh >= 80 ? '#059669' : student.tiLeDiemDanh >= 60 ? '#d97706' : '#dc2626'
                            }}>
                              {student.tiLeDiemDanh.toFixed(0)}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Chuyên cần</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-times"></i> Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminClassDetailsModal;
