import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taiKhoanService, LoginRequest } from '../services/api';
import '../styles/Auth.css';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Bắt đầu đăng nhập với:', formData);
      const response = await taiKhoanService.login(formData);
      console.log('✅ Đăng nhập thành công:', response);

      // Store token and user info
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userInfo', JSON.stringify(response.user));

      console.log('💾 Đã lưu thông tin user vào localStorage:', response.user);

      // Redirect based on user role with page reload
      switch (response.user.vaiTro) {
        case 'Admin':
          console.log('🔄 Chuyển hướng đến trang admin');
          window.location.href = '/admin';
          break;
        case 'GiangVien':
          console.log('🔄 Chuyển hướng đến trang giảng viên, thông tin user:', response.user);
          window.location.href = '/lecturer';
          break;
        case 'HocVien':
          window.location.href = '/student';
          break;
        default:
          window.location.href = '/';
      }
    } catch (err: any) {
      console.error('❌ Lỗi đăng nhập:', err);
      console.error('❌ Chi tiết lỗi:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';

      if (err.response?.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Đăng nhập</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-links">
          <p>Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
