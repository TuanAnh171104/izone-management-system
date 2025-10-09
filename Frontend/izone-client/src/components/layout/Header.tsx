import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Header.css';

const Header: React.FC = () => {

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <img src="/assets/izone-logo-color.png" alt="IZONE" className="logo-img" />
        </div>
        <div className="auth-buttons">
          <Link to="/login" className="btn btn-login">Đăng nhập</Link>
          <Link to="/register" className="btn btn-register">Đăng ký</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
