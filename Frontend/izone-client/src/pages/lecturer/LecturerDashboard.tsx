import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { giangVienService } from '../../services/api';
import apiClient from '../../services/api';
import '../../styles/Management.css';

interface KPI {
  totalClasses: number;
  upcomingClasses: number;
  completedClasses: number;
  totalStudents: number;
}

interface TodaySession {
  BuoiHocID: number;
  NgayHoc: string;
  ThoiGianBatDau?: string;
  ThoiGianKetThuc?: string;
  TrangThai?: string;
  LopID?: number;
  TenLop?: string;
  TenKhoaHoc?: string;
  DiaDiem?: string | null;
  SoHocVienDangKy?: number;
}

const LecturerDashboard: React.FC = () => {
  const [kpi, setKpi] = useState<KPI>({ totalClasses: 0, upcomingClasses: 0, completedClasses: 0, totalStudents: 0 });
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [attendanceWeekly, setAttendanceWeekly] = useState<Array<{ Label: string; AttendanceRate: number }>>([]);
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [pendingClasses, setPendingClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lecturerName, setLecturerName] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // useEffect riêng cho việc fetch sessions theo ngày - tối ưu để tránh reload toàn trang
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const todayResp = await giangVienService.getSessionsByDate(selectedDate);
        setTodaySessions(todayResp?.sessions || []);
      } catch (err: any) {
        console.error('Lỗi khi lấy sessions theo ngày:', err);
        setError('Không thể tải dữ liệu lịch dạy');
      }
    };

    fetchSessions();
  }, [selectedDate]);

  // useEffect chính cho data không thay đổi theo ngày
  useEffect(() => {
    let intervalId: any;

    const fetchMainData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy thông tin người dùng từ localStorage (nếu có) để hiển thị tên
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const u = JSON.parse(userInfo);
          setLecturerName(u.hoTen || u.tenDangNhap || null);
        }

        const [attendanceResp, pendingResp, lopResp] = await Promise.all([
          giangVienService.getWeeklyAttendance(4), // Hiển thị dữ liệu 4 tuần gần đây
          giangVienService.getPendingTasks(),
          // Use authenticated API call to /api/giangvien/lop-hoc
          apiClient.get('/giangvien/lop-hoc').then(res => res.data)
        ]);

        // KPI tính nhanh từ lop-hoc + pendingResp/upcoming
        const lopList = Array.isArray(lopResp) ? lopResp : (lopResp?.lopHocs || []);

        const totalClasses = lopList.filter((l: any) => (l.trangThai || '').toLowerCase() === 'dangdienra').length;
        const upcomingClasses = lopList.filter((l: any) => (l.trangThai || '').toLowerCase() === 'chuabatdau').length;
        const completedClasses = lopList.filter((l: any) => (l.trangThai || '').toLowerCase() === 'daketthuc').length;

        // Chỉ tính tổng học viên của các lớp đang diễn ra
        const activeClasses = lopList.filter((l: any) => (l.trangThai || '').toLowerCase() === 'dangdienra');
        const totalStudents = activeClasses.reduce((s: number, l: any) => s + (l.soHocVien || 0), 0);

        setKpi({
          totalClasses,
          upcomingClasses,
          completedClasses,
          totalStudents
        });

        // Attendance weekly
        const attendanceWeeksData = Array.isArray(attendanceResp) ? attendanceResp : [];
        setAttendanceWeekly(attendanceWeeksData.map((w: any) => ({
          Label: w.Week?.toString() || w.Label?.toString() || `Tuần ${w.Week || 1}`,
          AttendanceRate: Number(w.AttendanceRate) || 0
        })));

        // Pending tasks
        setPendingSessions(pendingResp?.overdueSessions || []);
        setPendingClasses(pendingResp?.classesMissingFinal || []);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error('Lỗi dashboard giảng viên:', err);
        setError(err?.message ?? 'Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchMainData();
    intervalId = setInterval(fetchMainData, 600000); // Refresh every 10 minutes
    return () => clearInterval(intervalId);
  }, []); // Không có dependency để tránh reload không cần thiết

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header"><h2>Tổng quan giảng viên</h2></div>
        <div className="table-container" style={{ padding: 20 }}><p>Đang tải dữ liệu...</p></div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Tổng quan giảng viên {lecturerName ? `— ${lecturerName}` : ''}</h2>
      </div>

      {error && (
        <div style={{
          padding: '10px 20px',
          color: '#b00020',
          background: '#fde7e9',
          borderRadius: 6,
          margin: '0 20px',
          border: '1px solid #fecaca'
        }}>
          Lỗi tải dữ liệu: {error}
        </div>
      )}



      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <small style={{ color: '#666' }}>
          📊 Cập nhật lần cuối: {lastUpdated ? new Date(lastUpdated).toLocaleString('vi-VN') : 'Chưa cập nhật'}
        </small>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #ddd',
            cursor: 'pointer',
            background: '#fff',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🔄 Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}>
        <div className="stat-card" style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #f3f4f6',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #007bff, #0056b3)'
          }}></div>
          <h4 style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            📚 Lớp đang dạy
          </h4>
          <h3 style={{ color: '#007bff', margin: '0', fontSize: '32px', fontWeight: '700' }}>
            {kpi.totalClasses}
          </h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #f3f4f6',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #17a2b8, #0f7c7f)'
          }}></div>
          <h4 style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            👥 Tổng học viên
          </h4>
          <h3 style={{ color: '#17a2b8', margin: '0', fontSize: '32px', fontWeight: '700' }}>
            {kpi.totalStudents}
          </h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #f3f4f6',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #ffc107, #e0a800)'
          }}></div>
          <h4 style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            📅 Lớp sắp tới
          </h4>
          <h3 style={{ color: '#ffc107', margin: '0', fontSize: '32px', fontWeight: '700' }}>
            {kpi.upcomingClasses}
          </h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #f3f4f6',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #28a745, #1e7e34)'
          }}></div>
          <h4 style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            ✅ Lớp đã hoàn thành
          </h4>
          <h3 style={{ color: '#28a745', margin: '0', fontSize: '32px', fontWeight: '700' }}>
            {kpi.completedClasses}
          </h3>
        </div>
      </div>

      {/* Lịch dạy */}
      <div style={{ padding: '0 20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <h3 style={{ color: '#333', margin: '0', fontSize: '20px', fontWeight: '600' }}>
            📆 Lịch dạy ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Chọn ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: '#fff',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                minWidth: '160px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            />
          </div>
        </div>
        <div style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6',
          overflow: 'hidden'
        }}>
          {todaySessions.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              color: '#6b7280',
              textAlign: 'center',
              fontSize: '16px'
            }}>
              ✨ Không có buổi dạy hôm nay
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Giờ bắt đầu
                    </th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Lớp học
                    </th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Khóa học
                    </th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Địa điểm
                    </th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Học viên
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todaySessions.map((s: any, index) => (
                    <tr key={s.buoiHocID || s.BuoiHocID} style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'all 0.2s ease',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef3c7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                    }}>
                      <td style={{ padding: '14px 12px', color: '#374151', fontWeight: '500' }}>
                        {s.thoiGianBatDau ? s.thoiGianBatDau.substring(0, 5) :
                         s.ThoiGianBatDau ? new Date(s.ThoiGianBatDau).toLocaleTimeString('vi-VN', {
                           hour: '2-digit',
                           minute: '2-digit'
                         }) : 'Chưa xác định'}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#374151', fontWeight: '600' }}>
                        {s.lopID ? `Lớp ${s.lopID}` : (s.LopID ? `Lớp ${s.LopID}` : s.TenLop || '-')}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#374151' }}>
                        <div style={{
                          background: '#e0f2fe',
                          color: '#0277bd',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {s.tenKhoaHoc || s.TenKhoaHoc || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', color: '#374151' }}>
                        {s.diaDiem || s.DiaDiem || 'Chưa xác định'}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', color: '#374151', fontWeight: '600' }}>
                        {s.soHocVienDangKy ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Nhiệm vụ chờ xử lý */}
      <div style={{ padding: '0 20px 40px 20px' }}>
        <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '20px', fontWeight: '600' }}>
          ⚡ Nhiệm vụ chờ xử lý
        </h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid #f3f4f6'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#dc2626',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📝</span>
              Buổi học chưa điểm danh
            </h4>
            {pendingSessions.length === 0 ? (
              <div style={{
                padding: '20px',
                color: '#6b7280',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '8px',
                fontStyle: 'italic'
              }}>
                ✨ Không có buổi học cần điểm danh
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                      borderBottom: '2px solid #fecaca'
                    }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#dc2626',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Ngày học
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#dc2626',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Lớp học
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#dc2626',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Khóa học
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSessions.map((p: any, index) => (
                      <tr key={p.buoiHocID} style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'all 0.2s ease',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                      }}>
                        <td style={{ padding: '12px', color: '#374151', fontWeight: '500' }}>
                          {p.ngayHoc ? new Date(p.ngayHoc).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td style={{ padding: '12px', color: '#374151', fontWeight: '600' }}>
                          {p.tenLop}
                        </td>
                        <td style={{ padding: '12px', color: '#374151' }}>
                          {p.tenKhoaHoc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid #f3f4f6'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#f59e0b',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📝</span>
              Lớp chưa nhập điểm Cuối Kỳ
            </h4>
            {pendingClasses.length === 0 ? (
              <div style={{
                padding: '20px',
                color: '#6b7280',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '8px',
                fontStyle: 'italic'
              }}>
                ✨ Không có lớp thiếu điểm cuối kỳ
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      borderBottom: '2px solid #f59e0b'
                    }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#d97706',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Lớp học
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#d97706',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Tổng Học viên
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#d97706',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Đã nhập
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#d97706',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Còn thiếu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClasses.map((c: any, index) => (
                      <tr key={c.lopID} style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'all 0.2s ease',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef3c7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                      }}>
                        <td style={{ padding: '12px', color: '#374151', fontWeight: '600' }}>
                          {c.tenLop}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>
                          {c.soDangKy}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>
                          {c.soDiemDaNhap}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>
                          {c.missingCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
