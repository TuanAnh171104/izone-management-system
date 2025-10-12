import React, { useState, useEffect } from 'react';
import { lopHocService, giangVienService } from '../../services/api';
import '../../styles/Management.css';

interface LecturerStats {
  totalClasses: number;
  totalStudents: number;
  upcomingClasses: number;
  completedClasses: number;
}

interface LecturerInfo {
  giangVienID: number;
  hoTen: string;
  email: string;
  soDienThoai?: string;
  chuyenNganh?: string;
}

const LecturerDashboard: React.FC = () => {
  const [stats, setStats] = useState<LecturerStats>({
    totalClasses: 0,
    totalStudents: 0,
    upcomingClasses: 0,
    completedClasses: 0
  });
  const [lecturerInfo, setLecturerInfo] = useState<LecturerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get user info from localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          setLecturerInfo({
            giangVienID: user.giangVienID,
            hoTen: user.hoTen || user.tenDangNhap,
            email: user.email,
            soDienThoai: user.soDienThoai,
            chuyenNganh: user.chuyenNganh
          });
        }

        // Fetch lecturer's classes
        const classes = await lopHocService.getAll();

        // Filter classes taught by current lecturer
        const userInfoData = JSON.parse(userInfo || '{}');
        const lecturerClasses = classes.filter((classItem: any) =>
          classItem.giangVienID === userInfoData.giangVienID
        );

        // Calculate stats
        const now = new Date();
        let totalStudents = 0;
        let upcomingClasses = 0;
        let completedClasses = 0;

        lecturerClasses.forEach((classItem: any) => {
          // Count students in each class
          totalStudents += classItem.soHocVien || 0;

          // Check if class is upcoming or completed
          const classDate = new Date(classItem.ngayBatDau || classItem.ngayTao);
          if (classDate > now) {
            upcomingClasses++;
          } else {
            completedClasses++;
          }
        });

        setStats({
          totalClasses: lecturerClasses.length,
          totalStudents,
          upcomingClasses,
          completedClasses
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
          <h2>Tổng quan giảng viên</h2>
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
        <h2>Tổng quan giảng viên</h2>
      </div>

      {/* Lecturer Info Section */}
      {lecturerInfo && (
        <div className="lecturer-info-card" style={{
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
              <strong>Họ tên:</strong> {lecturerInfo.hoTen}
            </div>
            <div>
              <strong>Email:</strong> {lecturerInfo.email}
            </div>
            {lecturerInfo.soDienThoai && (
              <div>
                <strong>Số điện thoại:</strong> {lecturerInfo.soDienThoai}
              </div>
            )}
            {lecturerInfo.chuyenNganh && (
              <div>
                <strong>Chuyên ngành:</strong> {lecturerInfo.chuyenNganh}
              </div>
            )}
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
          <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>{stats.totalClasses}</h3>
          <p style={{ margin: 0, color: '#666' }}>Lớp đang dạy</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>{stats.totalStudents}</h3>
          <p style={{ margin: 0, color: '#666' }}>Tổng học viên</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ffc107', margin: '0 0 10px 0' }}>{stats.upcomingClasses}</h3>
          <p style={{ margin: 0, color: '#666' }}>Lớp sắp tới</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#17a2b8', margin: '0 0 10px 0' }}>{stats.completedClasses}</h3>
          <p style={{ margin: 0, color: '#666' }}>Lớp đã hoàn thành</p>
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
            onClick={() => window.location.href = '/lecturer/classes'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Xem danh sách lớp học
          </button>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
