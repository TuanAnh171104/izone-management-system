import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminLecturers from './pages/admin/AdminLecturers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminKhoaHocList from './pages/admin/AdminKhoaHocList';
import AdminLopHocList from './pages/admin/AdminLopHocList';
import AdminChiPhiList from './pages/admin/AdminChiPhiList';
import AdminDiaDiemList from './pages/admin/AdminDiaDiemList';
import AdminBaoLuuList from './pages/admin/AdminBaoLuuList';
import AdminThongBaoList from './pages/admin/AdminThongBaoList';
import AdminReports from './pages/admin/AdminReports';


// Tạo các component tạm thời cho các trang
const KhoaHoc = () => <div className="container page-container"><h1>Danh sách khóa học</h1></div>;
const LopHoc = () => <div className="container page-container"><h1>Danh sách lớp học</h1></div>;
const GiangVien = () => <div className="container page-container"><h1>Danh sách giảng viên</h1></div>;
const HocVien = () => <div className="container page-container"><h1>Danh sách học viên</h1></div>;
// Trang đăng ký thật sự từ pages/Register

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userInfo = localStorage.getItem('userInfo');
      setIsLoggedIn(!!(token && userInfo));
    };

    checkAuthStatus();
    
    // Listen for storage changes to update auth status
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Check if current route is admin or user dashboard
  const isInDashboard = location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/giang-vien') || 
                       location.pathname.startsWith('/hoc-vien');

  // Show header/footer only on public pages or when not logged in
  const showHeaderFooter = !isLoggedIn || !isInDashboard;

  return (
    <div className="app">
      {showHeaderFooter && <Header />}
      <main className={showHeaderFooter ? "main-content" : "main-content-full"}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/khoa-hoc" element={<KhoaHoc />} />
          <Route path="/lop-hoc" element={<LopHoc />} />
          <Route path="/giang-vien" element={<GiangVien />} />
          <Route path="/hoc-vien" element={<HocVien />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Admin routes */}
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tai-khoan" element={<AdminAccounts />} />
            <Route path="khoa-hoc" element={<AdminKhoaHocList />} />
            <Route path="lop-hoc" element={<AdminLopHocList />} />
            <Route path="giang-vien" element={<AdminLecturers />} />
            <Route path="hoc-vien" element={<AdminStudents />} />
            <Route path="chi-phi" element={<AdminChiPhiList />} />
            <Route path="co-so" element={<AdminDiaDiemList />} />
            <Route path="bao-luu" element={<AdminBaoLuuList />} />
            <Route path="thong-bao" element={<AdminThongBaoList />} />
            <Route path="bao-cao" element={<AdminReports />} />
          </Route>
        </Routes>
      </main>
      {showHeaderFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
