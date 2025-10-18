import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../../styles/Lecturer.css';

interface UserInfo {
  taiKhoanID: number;
  tenDangNhap: string;
  email: string;
  vaiTro: string;
  hoTen?: string;
  giangVienID?: number;
  chuyenMon?: string;
}

const LecturerLayout: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('userInfo');
    const role = raw ? JSON.parse(raw).vaiTro : null;
    if (role !== 'GiangVien') {
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
    <div className="lecturer-layout">
      <aside className="lecturer-sidebar">
        <div className="lecturer-brand">
          <img src="/assets/izone-logo-color.png" alt="IZONE" />
        </div>
        <nav className="lecturer-nav">
          <NavLink to="/lecturer" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Tổng quan
          </NavLink>
          <NavLink to="/lecturer/classes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Lớp học
          </NavLink>
          <NavLink to="/lecturer/notifications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Thông báo
          </NavLink>
        </nav>

        {/* User Info Section */}
        {userInfo && (
          <div className="lecturer-user-info">
            <div className="user-details">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-text">
                <button
                  className="user-name clickable"
                  onClick={() => navigate('/lecturer/profile')}
                  title="Xem thông tin cá nhân"
                >
                  {userInfo.hoTen || userInfo.tenDangNhap}
                </button>
                <div className="user-role">{userInfo.vaiTro}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout-sidebar" title="Đăng xuất">
              <i className="fas fa-sign-out-alt"></i>
              Đăng xuất
            </button>
          </div>
        )}
      </aside>
      <section className="lecturer-content">
        <Outlet />
      </section>
    </div>
  );
};

export default LecturerLayout;
