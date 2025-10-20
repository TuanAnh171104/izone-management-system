import React, { useState, useEffect } from 'react';
import { dangKyLopService, thongBaoService, diemSoService } from '../../services/api';
import '../../styles/Management.css';

interface StudentStats {
  totalCourses: number;
  upcomingClasses: number;
  completedClasses: number;
  averageGrade: number;
  totalNotifications: number;
}

interface StudentInfo {
  hocVienID: number;
  hoTen: string;
  email: string;
  ngaySinh?: string;
  sdt?: string;
  taiKhoanVi: number;
}

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<StudentStats>({
    totalCourses: 0,
    upcomingClasses: 0,
    completedClasses: 0,
    averageGrade: 0,
    totalNotifications: 0
  });
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get user info from localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          setStudentInfo({
            hocVienID: user.hocVienID,
            hoTen: user.hoTen || user.tenDangNhap,
            email: user.email,
            ngaySinh: user.ngaySinh,
            sdt: user.sdt,
            taiKhoanVi: user.taiKhoanVi || 0
          });
        }

        // Wait for studentInfo to be available before fetching data
        if (!studentInfo?.hocVienID) {
          return;
        }

        // Fetch student's enrolled classes
        const enrolledClasses = await dangKyLopService.getByHocVienId(studentInfo.hocVienID);

        // Calculate stats
        const now = new Date();
        let upcomingClasses = 0;
        let completedClasses = 0;

        enrolledClasses.forEach((classItem: any) => {
          const classDate = new Date(classItem.ngayBatDau || classItem.ngayTao);
          if (classDate > now) {
            upcomingClasses++;
          } else {
            completedClasses++;
          }
        });

        // Fetch notifications count
        const notifications = await thongBaoService.getAll();
        const studentNotifications = notifications.filter((notification: any) =>
          notification.loaiNguoiNhan === 'HocVien' ||
          (notification.nguoiNhanID === studentInfo.hocVienID) ||
          (notification.loaiNguoiNhan === 'All' && !notification.nguoiNhanID)
        );

        // Fetch grades if available
        let averageGrade = 0;
        try {
          const grades = await diemSoService.getByHocVienId(studentInfo.hocVienID);
          if (grades.length > 0) {
            const total = grades.reduce((sum: number, grade: any) => sum + (grade.diem || 0), 0);
            averageGrade = total / grades.length;
          }
        } catch (error) {
          console.log('Không thể tải điểm số:', error);
        }

        setStats({
          totalCourses: enrolledClasses.length,
          upcomingClasses,
          completedClasses,
          averageGrade: Math.round(averageGrade * 100) / 100,
          totalNotifications: studentNotifications.length
        });
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Tổng quan học viên</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Tổng quan học viên</h2>
      </div>

      {/* Student Info Section */}
      {studentInfo && (
        <div className="student-info-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>Thông tin cá nhân</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Họ tên:</strong> {studentInfo.hoTen}
            </div>
            <div>
              <strong>Email:</strong> {studentInfo.email}
            </div>
            {studentInfo.sdt && (
              <div>
                <strong>Số điện thoại:</strong> {studentInfo.sdt}
              </div>
            )}
            <div>
              <strong>Số dư ví:</strong>
              <span style={{ color: '#059669', fontWeight: '600', marginLeft: '8px' }}>
                {studentInfo.taiKhoanVi.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}>
        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>{stats.totalCourses}</h3>
          <p style={{ margin: 0, color: '#666' }}>Khóa học đang học</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>{stats.upcomingClasses}</h3>
          <p style={{ margin: 0, color: '#666' }}>Lớp học sắp tới</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ffc107', margin: '0 0 10px 0' }}>{stats.totalNotifications}</h3>
          <p style={{ margin: 0, color: '#666' }}>Thông báo mới</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#17a2b8', margin: '0 0 10px 0' }}>
            {stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : '-'}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Điểm trung bình</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{ padding: '20px' }}>
        <h3>Quản lý nhanh</h3>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/student/courses'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Tìm khóa học
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.href = '/student/my-classes'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Lớp học của tôi
          </button>
          <button
            className="btn btn-info"
            onClick={() => window.location.href = '/student/notifications'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Thông báo ({stats.totalNotifications})
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
