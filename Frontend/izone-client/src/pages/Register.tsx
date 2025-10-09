import React, { useState } from 'react';
import { taiKhoanService, RegisterHocVienRequest } from '../services/api';
import '../styles/Auth.css';

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterHocVienRequest>({
    password: '',
    email: '',
    hoTen: '',
    gioiTinh: 'Nam',
    ngaySinh: '',
    diaChi: '',
    soDienThoai: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: RegisterHocVienRequest = {
        ...form,
        ngaySinh: form.ngaySinh ? new Date(form.ngaySinh).toISOString() : ''
      };
      await taiKhoanService.registerHocVien(payload);
      setSuccess('Đăng ký tài khoản học viên thành công. Vui lòng đăng nhập.');
      setForm({
        password: '',
        email: '',
        hoTen: '',
        gioiTinh: 'Nam',
        ngaySinh: '',
        diaChi: '',
        soDienThoai: ''
      });
    } catch (err: any) {
      const message = err?.response?.data || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(typeof message === 'string' ? message : 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản học viên</h2>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {/* Đưa email lên đầu form */}
        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Mật khẩu</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Họ và tên</label>
          <input name="hoTen" value={form.hoTen || ''} onChange={handleChange} />
        </div>

        {/* Đưa ngày sinh xuống dưới giới tính */}
        <div className="form-group">
          <label>Giới tính</label>
          <select name="gioiTinh" value={form.gioiTinh || 'Nam'} onChange={handleChange} className="wide-select">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div className="form-group">
          <label>Ngày sinh</label>
          <input name="ngaySinh" type="date" value={form.ngaySinh || ''} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <input name="diaChi" value={form.diaChi || ''} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Số điện thoại</label>
          <input name="soDienThoai" value={form.soDienThoai || ''} onChange={handleChange} />
        </div>

        {/* Ghi chú đã được loại bỏ theo yêu cầu */}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
    </div>
  );
};

export default Register;