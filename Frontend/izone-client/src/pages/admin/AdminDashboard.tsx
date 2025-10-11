import React, { useState, useEffect } from 'react';
import { taiKhoanService, giangVienService, hocVienService, khoaHocService, lopHocService } from '../../services/api';
import '../../styles/Management.css';

interface DashboardStats {
  totalAccounts: number;
  totalLecturers: number;
  totalStudents: number;
  totalCourses: number;
  totalClasses: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalLecturers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalClasses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch data from all services
        const [accounts, lecturers, students, courses, classes] = await Promise.all([
          taiKhoanService.getAll(),
          giangVienService.getAll(),
          hocVienService.getAll(),
          khoaHocService.getAll(),
          lopHocService.getAll()
        ]);

        setStats({
          totalAccounts: accounts.length,
          totalLecturers: lecturers.length,
          totalStudents: students.length,
          totalCourses: courses.length,
          totalClasses: classes.length
        });
      } catch (error) {
        console.error('Lỗi khi tải thống kê:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Tổng quan hệ thống</h2>
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
        <h2>Tổng quan hệ thống</h2>
      </div>
      
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
          <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>{stats.totalAccounts}</h3>
          <p style={{ margin: 0, color: '#666' }}>Tài khoản</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>{stats.totalLecturers}</h3>
          <p style={{ margin: 0, color: '#666' }}>Giảng viên</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ffc107', margin: '0 0 10px 0' }}>{stats.totalStudents}</h3>
          <p style={{ margin: 0, color: '#666' }}>Học viên</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#17a2b8', margin: '0 0 10px 0' }}>{stats.totalCourses}</h3>
          <p style={{ margin: 0, color: '#666' }}>Khóa học</p>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#6f42c1', margin: '0 0 10px 0' }}>{stats.totalClasses}</h3>
          <p style={{ margin: 0, color: '#666' }}>Lớp học</p>
        </div>
      </div>

      <div className="quick-actions" style={{ padding: '20px' }}>
        <h3>Quản lý nhanh</h3>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap' 
        }}>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/admin/tai-khoan'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Quản lý tài khoản
          </button>
          <button 
            className="btn btn-success"
            onClick={() => window.location.href = '/admin/giang-vien'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Quản lý giảng viên
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => window.location.href = '/admin/hoc-vien'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Quản lý học viên
          </button>
          <button 
            className="btn btn-info"
            onClick={() => window.location.href = '/admin/khoa-hoc'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Quản lý khóa học
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;