import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Student.css';

interface UserInfo {
  taiKhoanID: number;
  tenDangNhap: string;
  email: string;
  vaiTro: string;
  hoTen?: string;
  hocVienID?: number;
  ngaySinh?: string;
  sdt?: string;
  taiKhoanVi?: number;
}

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('userInfo');
    const role = raw ? JSON.parse(raw).vaiTro : null;
    if (role !== 'HocVien') {
      navigate('/login');
      return;
    }

    if (raw) {
      try {
        setUserInfo(JSON.parse(raw));
      } catch (error) {
        console.error('Error parsing user info:', error);
        handleLogout();
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    navigate('/');
  };

  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <div className="student-brand">
          <img src="/assets/izone-logo-color.png" alt="IZONE" />
        </div>
        <nav className="student-nav">
          <NavLink
            to="/student/courses"
            className={() => (location.pathname === '/student' || location.pathname === '/student/courses') ? 'nav-item active' : 'nav-item'}
          >
            Tất cả khóa học
          </NavLink>
          <NavLink to="/student/my-classes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Lớp học của tôi
          </NavLink>
          <NavLink to="/student/notifications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Thông báo
          </NavLink>
        </nav>

        {/* User Info Section */}
        {userInfo && (
          <div className="student-user-info">
            <div className="user-details">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-text">
                <button
                  className="user-name clickable"
                  onClick={() => navigate('/student/profile')}
                  title="Xem thông tin cá nhân"
                >
                  {userInfo.hoTen || userInfo.tenDangNhap}
                </button>
                <div className="user-role">{userInfo.vaiTro}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="student-btn-logout-sidebar" title="Đăng xuất">
              <i className="fas fa-sign-out-alt"></i>
              Đăng xuất
            </button>
          </div>
        )}
      </aside>
      <section className="student-content">
        <Outlet />
      </section>
    </div>
  );
};

export default StudentLayout;
