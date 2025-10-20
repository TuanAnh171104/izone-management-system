import React, { useState, useEffect } from 'react';
import { hocVienService, taiKhoanService, lopHocService, khoaHocService } from '../../services/api';
import '../../styles/Student.css';

interface HocVien {
  hocVienID: number;
  taiKhoanID?: number | null;
  hoTen: string;
  ngaySinh: string | null;
  email: string | null;
  sdt: string | null;
  taiKhoanVi: number;
}

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

interface LopHoc {
  lopHocID: number;
  tenLopHoc: string;
  khoaHocID: number;
  tenKhoaHoc?: string;
  giangVienID?: number;
  tenGiangVien?: string;
}

interface KhoaHoc {
  khoaHocID: number;
  tenKhoaHoc: string;
  moTa: string;
  hocPhi: number;
}

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const StudentProfile: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [hocVienInfo, setHocVienInfo] = useState<HocVien | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Form states
  const [profileForm, setProfileForm] = useState({
    hoTen: '',
    ngaySinh: '',
    sdt: ''
  });

  const [passwordForm, setPasswordForm] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Lấy thông tin từ localStorage
      const raw = localStorage.getItem('userInfo');
      if (raw) {
        const user = JSON.parse(raw);
        setUserInfo(user);

        // Nếu có hocVienID, lấy thông tin chi tiết từ API
        if (user.hocVienID) {
          try {
            const hocVien = await hocVienService.getById(user.hocVienID);
            setHocVienInfo(hocVien);

            // Initialize profile form
            setProfileForm({
              hoTen: hocVien.hoTen || '',
              ngaySinh: hocVien.ngaySinh ? hocVien.ngaySinh.split('T')[0] : '',
              sdt: hocVien.sdt || ''
            });
          } catch (error) {
            console.error('Lỗi khi lấy thông tin học viên:', error);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin cá nhân:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hocVienInfo) return;

    try {
      setSaving(true);

      const updatedHocVien: HocVien = {
        ...hocVienInfo,
        hoTen: profileForm.hoTen,
        ngaySinh: profileForm.ngaySinh || null,
        sdt: profileForm.sdt || null
      };

      await hocVienService.update(hocVienInfo.hocVienID, updatedHocVien);
      setHocVienInfo(updatedHocVien);

      // Update localStorage
      if (userInfo) {
        userInfo.hoTen = profileForm.hoTen;
        userInfo.ngaySinh = profileForm.ngaySinh;
        userInfo.sdt = profileForm.sdt;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      setMessage({ type: 'error', text: 'Không thể cập nhật thông tin cá nhân' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    if (!passwordForm.currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' });
      return;
    }

    if (!userInfo) {
      setMessage({ type: 'error', text: 'Không tìm thấy thông tin người dùng' });
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch('http://localhost:5080/api/TaiKhoan/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          userInfo: {
            email: userInfo.email,
            taiKhoanID: userInfo.taiKhoanID,
            vaiTro: userInfo.vaiTro
          }
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Không thể đổi mật khẩu';

        try {
          const errorData = await response.text();
          console.log('Error response text:', errorData);

          if (errorData) {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.message || errorMessage;
          }
        } catch (parseError) {
          console.log('Could not parse error response as JSON:', parseError);
          if (response.status === 405) {
            errorMessage = 'Phương thức không được phép. Vui lòng liên hệ quản trị viên.';
          } else if (response.status === 401) {
            errorMessage = 'Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.';
          } else if (response.status === 404) {
            errorMessage = 'Không tìm thấy API endpoint. Vui lòng liên hệ quản trị viên.';
          } else if (response.status >= 500) {
            errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
          }
        }

        throw new Error(errorMessage);
      }

      // Try to parse success response
      let successMessage = 'Đổi mật khẩu thành công!';
      try {
        const successData = await response.text();
        if (successData) {
          const parsedSuccess = JSON.parse(successData);
          successMessage = parsedSuccess.message || successMessage;
        }
      } catch (parseError) {
        console.log('Could not parse success response, using default message');
      }

      setMessage({ type: 'success', text: successMessage });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: keyof PasswordChangeRequest, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Thông tin cá nhân</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p>Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Thông tin cá nhân</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p>Không tìm thấy thông tin người dùng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Thông tin cá nhân</h2>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '8px',
          padding: '16px',
          margin: '20px',
          color: message.type === 'success' ? '#166534' : '#dc2626'
        }}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}
             style={{ marginRight: '8px' }}></i>
          {message.text}
        </div>
      )}



      {/* Tab Navigation */}
      <div className="profile-tabs" style={{
        display: 'flex',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        margin: '0 20px',
        borderRadius: '8px 8px 0 0'
      }}>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{
            flex: 1,
            padding: '16px 24px',
            background: activeTab === 'profile' ? '#dc2626' : 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            color: activeTab === 'profile' ? 'white' : '#6b7280',
            cursor: 'pointer',
            borderBottom: activeTab === 'profile' ? '2px solid #dc2626' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <i className="fas fa-user-edit" style={{ marginRight: '8px' }}></i>
          Thông tin cá nhân
        </button>
        <button
          className={`tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
          style={{
            flex: 1,
            padding: '16px 24px',
            background: activeTab === 'password' ? '#dc2626' : 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            color: activeTab === 'password' ? 'white' : '#6b7280',
            cursor: 'pointer',
            borderBottom: activeTab === 'password' ? '2px solid #dc2626' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <i className="fas fa-key" style={{ marginRight: '8px' }}></i>
          Đổi mật khẩu
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 8px 8px',
        margin: '0 20px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        borderTop: 'none'
      }}>
        {activeTab === 'profile' && (
          <div style={{ padding: '32px' }}>
            <form onSubmit={handleProfileSubmit}>
              {/* Thông tin chỉ đọc */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Mã học viên:
                </label>
                <input
                  type="text"
                  value={`HV-${hocVienInfo?.hocVienID?.toString().padStart(4, '0') || 'N/A'}`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Email:
                </label>
                <input
                  type="email"
                  value={userInfo?.email || 'Chưa cập nhật'}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Số dư tài khoản ví:
                </label>
                <input
                  type="text"
                  value={`${hocVienInfo?.taiKhoanVi?.toLocaleString('vi-VN') || 0} VND`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#f0fdf4',
                    color: '#059669'
                  }}
                />
              </div>

              {/* Thông tin có thể sửa */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Họ và tên:
                </label>
                <input
                  type="text"
                  value={profileForm.hoTen}
                  onChange={(e) => handleInputChange('hoTen', e.target.value)}
                  required
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Ngày sinh:
                </label>
                <input
                  type="date"
                  value={profileForm.ngaySinh}
                  onChange={(e) => handleInputChange('ngaySinh', e.target.value)}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Số điện thoại:
                </label>
                <input
                  type="tel"
                  value={profileForm.sdt}
                  onChange={(e) => handleInputChange('sdt', e.target.value)}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: saving ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div style={{ padding: '32px' }}>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Mật khẩu hiện tại:
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  required
                  disabled={changingPassword}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Mật khẩu mới:
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  required
                  disabled={changingPassword}
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Xác nhận mật khẩu mới:
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  required
                  disabled={changingPassword}
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  disabled={changingPassword}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: changingPassword ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: changingPassword ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {changingPassword ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      Đang đổi mật khẩu...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-key" style={{ marginRight: '8px' }}></i>
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
