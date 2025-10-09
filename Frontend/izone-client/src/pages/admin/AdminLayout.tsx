import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../../styles/Admin.css';

interface UserInfo {
  taiKhoanID: number;
  tenDangNhap: string;
  email: string;
  vaiTro: string;
}

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('userInfo');
    const role = raw ? JSON.parse(raw).vaiTro : null;
    if (role !== 'Admin') {
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
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/assets/izone-logo-color.png" alt="IZONE" />
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Tổng quan
          </NavLink>
          <NavLink to="/admin/tai-khoan" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Tài khoản
          </NavLink>
          <NavLink to="/admin/khoa-hoc" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Khóa học
          </NavLink>
          <NavLink to="/admin/lop-hoc" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Lớp học
          </NavLink>
          <NavLink to="/admin/giang-vien" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Giảng viên
          </NavLink>
          <NavLink to="/admin/hoc-vien" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Học viên
          </NavLink>
          <NavLink to="/admin/chi-phi" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Chi phí
          </NavLink>
          <NavLink to="/admin/co-so" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Cơ sở vật chất
          </NavLink>
          <NavLink to="/admin/bao-luu" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Bảo lưu
          </NavLink>
          <NavLink to="/admin/thong-bao" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Thông báo
          </NavLink>
          <NavLink to="/admin/bao-cao" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Báo cáo
          </NavLink>
          <NavLink to="/admin/du-bao" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Dự báo
          </NavLink>
        </nav>

        {/* User Info Section */}
        {userInfo && (
          <div className="admin-user-info">
            <div className="user-details">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-text">
                <div className="user-name">{userInfo.tenDangNhap}</div>
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
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;
