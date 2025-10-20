import React, { useState, useEffect } from 'react';
import { dangKyLopService, lopHocService, diemDanhService, diemSoService } from '../../services/api';

interface DangKyLop {
  dangKyID: number;
  hocVienID: number;
  lopID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
  trangThaiThanhToan: string;
  ngayHuy?: string | null;
  lyDoHuy?: string | null;
}

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
}

interface DiemDanh {
  diemDanhID: number;
  buoiHocID: number;
  hocVienID: number;
  coMat: boolean;
  ghiChu?: string | null;
}

interface DiemSo {
  diemID: number;
  hocVienID: number;
  lopID: number;
  loaiDiem: string;
  diem: number;
  ketQua: string;
  ghiChu?: string | null;
}

interface ClassWithStats {
  lopHoc: LopHoc;
  dangKyLop: DangKyLop;
  attendanceRate: number;
  averageGrade: number;
  totalSessions: number;
  attendedSessions: number;
}

const StudentMyClasses: React.FC = () => {
  const [myClasses, setMyClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  useEffect(() => {
    loadMyClasses();
  }, []);

  const loadMyClasses = async () => {
    try {
      setLoading(true);

      // Lấy thông tin học viên từ localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        console.error('Không tìm thấy thông tin học viên');
        return;
      }

      const hocVienInfo = JSON.parse(userInfo);
      const hocVienId = hocVienInfo.hocVienID;

      if (!hocVienId) {
        console.error('Không tìm thấy hocVienID');
        return;
      }

      // Lấy các đăng ký lớp của học viên
      const dangKyLops = await dangKyLopService.getByHocVienId(hocVienId);

      // Lấy thông tin chi tiết của các lớp đã đăng ký
      const classPromises = dangKyLops.map(async (dangKy) => {
        try {
          const lopHoc = await lopHocService.getById(dangKy.lopID);

          // Lấy thống kê điểm danh
          const attendanceRecords = await diemDanhService.getByHocVienId(hocVienId);
          const classAttendance = attendanceRecords.filter(record =>
            record.coMat // Chỉ tính buổi có mặt
          );
          const attendanceRate = attendanceRecords.length > 0
            ? (classAttendance.length / attendanceRecords.length) * 100
            : 0;

          // Lấy điểm trung bình
          const grades = await diemSoService.getByHocVienId(hocVienId);
          const classGrades = grades.filter(grade => grade.lopID === dangKy.lopID);
          const averageGrade = classGrades.length > 0
            ? classGrades.reduce((sum, grade) => sum + grade.diem, 0) / classGrades.length
            : 0;

          return {
            lopHoc,
            dangKyLop: dangKy,
            attendanceRate,
            averageGrade,
            totalSessions: attendanceRecords.length,
            attendedSessions: classAttendance.length
          };
        } catch (error) {
          console.error(`Lỗi khi tải thông tin lớp ${dangKy.lopID}:`, error);
          return null;
        }
      });

      const classesWithStats = (await Promise.all(classPromises)).filter(Boolean) as ClassWithStats[];
      setMyClasses(classesWithStats);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lớp học:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'dangky': return 'status-active';
      case 'hoanthanh': return 'status-completed';
      case 'huy': return 'status-cancelled';
      default: return 'status-unknown';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'dangky': return 'Đang học';
      case 'hoanthanh': return 'Hoàn thành';
      case 'huy': return 'Đã hủy';
      default: return 'Chưa xác định';
    }
  };

  if (loading) {
    return <div className="student-loading">Đang tải danh sách lớp học...</div>;
  }

  return (
    <div className="student-my-classes">
      <div className="student-page-header">
        <h1>Lớp học của tôi</h1>
        <p>Quản lý và theo dõi các lớp học đã đăng ký</p>
      </div>

      <div className="student-classes-container">
        {myClasses.length > 0 ? (
          myClasses.map(({ lopHoc, dangKyLop, attendanceRate, averageGrade, totalSessions, attendedSessions }) => (
            <div key={lopHoc.lopID} className="student-class-card">
              <div className="student-class-header">
                <div className="student-class-info">
                  <h3>Lớp #{lopHoc.lopID}</h3>
                  <div className="student-class-status">
                    <span className={`student-status-badge ${getStatusBadgeClass(dangKyLop.trangThaiDangKy)}`}>
                      {getStatusText(dangKyLop.trangThaiDangKy)}
                    </span>
                  </div>
                </div>
                <div className="student-class-date">
                  <i className="fas fa-calendar"></i>
                  <span>{new Date(lopHoc.ngayBatDau).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="student-class-details">
                <div className="student-detail-row">
                  <div className="student-detail-item">
                    <i className="fas fa-clock"></i>
                    <div>
                      <label>Ca học:</label>
                      <span>{lopHoc.caHoc || 'Chưa xác định'}</span>
                    </div>
                  </div>
                  <div className="student-detail-item">
                    <i className="fas fa-hourglass-half"></i>
                    <div>
                      <label>Thời lượng:</label>
                      <span>{lopHoc.thoiLuongGio} giờ/buổi</span>
                    </div>
                  </div>
                </div>

                <div className="student-detail-row">
                  <div className="student-detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <div>
                      <label>Địa điểm:</label>
                      <span>{lopHoc.diaDiemID ? `Cơ sở ${lopHoc.diaDiemID}` : 'Chưa xác định'}</span>
                    </div>
                  </div>
                  <div className="student-detail-item">
                    <i className="fas fa-money-bill-wave"></i>
                    <div>
                      <label>Trạng thái thanh toán:</label>
                      <span className={`student-payment-status ${dangKyLop.trangThaiThanhToan.toLowerCase()}`}>
                        {dangKyLop.trangThaiThanhToan === 'DaThanhToan' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="student-class-stats">
                <div className="student-stat-item">
                  <div className="student-stat-value">{attendedSessions}/{totalSessions}</div>
                  <div className="student-stat-label">Buổi đã học</div>
                </div>
                <div className="student-stat-item">
                  <div className="student-stat-value">{attendanceRate.toFixed(1)}%</div>
                  <div className="student-stat-label">Tỷ lệ có mặt</div>
                </div>
                <div className="student-stat-item">
                  <div className="student-stat-value">{averageGrade.toFixed(1)}</div>
                  <div className="student-stat-label">Điểm trung bình</div>
                </div>
              </div>

              <div className="student-class-actions">
                <button
                  className="student-btn-secondary"
                  onClick={() => setSelectedClass(selectedClass === lopHoc.lopID ? null : lopHoc.lopID)}
                >
                  <i className="fas fa-eye"></i>
                  {selectedClass === lopHoc.lopID ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                </button>
                {dangKyLop.trangThaiDangKy === 'DangKy' && (
                  <button className="student-btn-primary">
                    <i className="fas fa-exchange-alt"></i>
                    Đổi lớp
                  </button>
                )}
              </div>

              {selectedClass === lopHoc.lopID && (
                <div className="student-class-detail-expanded">
                  <div className="student-detail-section">
                    <h4>Thông tin chi tiết</h4>
                    <div className="student-detail-grid">
                      <div className="student-detail-field">
                        <label>Ngày đăng ký:</label>
                        <span>{new Date(dangKyLop.ngayDangKy).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="student-detail-field">
                        <label>Ngày bắt đầu:</label>
                        <span>{new Date(lopHoc.ngayBatDau).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {lopHoc.ngayKetThuc && (
                        <div className="student-detail-field">
                          <label>Ngày kết thúc:</label>
                          <span>{new Date(lopHoc.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                      <div className="student-detail-field">
                        <label>Ngày học trong tuần:</label>
                        <span>{lopHoc.ngayHocTrongTuan || 'Chưa xác định'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="student-no-data">
            <i className="fas fa-graduation-cap"></i>
            <h3>Chưa có lớp học nào</h3>
            <p>Bạn chưa đăng ký lớp học nào. Hãy đăng ký khóa học để bắt đầu học tập!</p>
            <button className="student-btn-primary">Đăng ký khóa học</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMyClasses;
