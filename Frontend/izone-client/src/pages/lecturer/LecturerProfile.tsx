import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Management.css';

interface LecturerProfile {
  giangVienID: number;
  hoTen: string;
  chuyenMon: string;
  email: string;
  taiKhoanID: number;
}

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const LecturerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    hoTen: '',
    chuyenMon: '',
    email: ''
  });

  const [passwordForm, setPasswordForm] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userInfo);
      if (user.vaiTro !== 'GiangVien') {
        navigate('/login');
        return;
      }

      // Get current profile information
      const response = await fetch(`http://localhost:5080/api/GiangVien/${user.giangVienID}`);
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const profileData = await response.json();
      setProfile(profileData);

      // Debug: Log profile data to check email field
      console.log('Profile data received:', profileData);
      console.log('User info from localStorage:', user);

      // Handle email field - try multiple sources
      let emailValue = '';
      if (profileData.email) {
        emailValue = profileData.email;
      } else if (user.email) {
        emailValue = user.email;
      } else if (profileData.taiKhoanID && user.taiKhoanID) {
        // If we have taiKhoanID, email might be available through account endpoint
        emailValue = ''; // Will be filled by user or remain empty for manual input
      }

      console.log('Final email value:', emailValue);

      setProfileForm({
        hoTen: profileData.hoTen || '',
        chuyenMon: profileData.chuyenMon || '',
        email: emailValue
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Không thể tải thông tin cá nhân' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:5080/api/GiangVien/${profile.giangVienID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          giangVienID: profile.giangVienID,
          taiKhoanID: profile.taiKhoanID,
          hoTen: profileForm.hoTen,
          chuyenMon: profileForm.chuyenMon
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update local storage with new information
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      userInfo.hoTen = profileForm.hoTen;
      userInfo.chuyenMon = profileForm.chuyenMon;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      loadProfile(); // Reload profile data
    } catch (error) {
      console.error('Error updating profile:', error);
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

    try {
      setChangingPassword(true);

      // Get user info from localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        throw new Error('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
      }

      const user = JSON.parse(userInfo);
      console.log('User info for password change:', user);

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
            email: user.email,
            taiKhoanID: user.taiKhoanID,
            vaiTro: user.vaiTro
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
        <div className="loading">Đang tải thông tin cá nhân...</div>
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
                  Chuyên môn:
                </label>
                <input
                  type="text"
                  value={profileForm.chuyenMon}
                  onChange={(e) => handleInputChange('chuyenMon', e.target.value)}
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
                  Email:
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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

export default LecturerProfile;
