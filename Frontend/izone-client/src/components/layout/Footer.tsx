import React from 'react';
import '../../styles/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section about">
            <h2>IZONE</h2>
            <p>Hệ thống quản lý trung tâm đào tạo hiện đại, giúp tối ưu hóa quy trình và nâng cao chất lượng đào tạo.</p>
            <div className="contact">
              <span><i className="fas fa-phone"></i> &nbsp; 1900 63 66 82</span>
              <span><i className="fas fa-envelope"></i> &nbsp; doingoai@izone.edu.vn</span>
            </div>
          </div>
          {/* Liên kết nhanh bị ẩn do yêu cầu đăng nhập trước khi truy cập */}
          <div className="footer-section contact-form">
            <h2>Liên hệ với chúng tôi</h2>
            <form>
              <input type="email" name="email" className="text-input contact-input" placeholder="Email của bạn..." />
              <textarea name="message" className="text-input contact-input" placeholder="Tin nhắn của bạn..."></textarea>
              <button type="submit" className="btn btn-primary">Gửi</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} IZONE | Thiết kế bởi Tuan Anh
        </div>
      </div>
    </footer>
  );
};

export default Footer;