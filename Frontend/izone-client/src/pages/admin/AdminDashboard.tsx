import React, { useState, useEffect } from 'react';
import { taiKhoanService, giangVienService, hocVienService, khoaHocService, lopHocService, thanhToanService, chiPhiService, dangKyLopService, diemSoService } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import '../../styles/Management.css';

interface DashboardStats {
  totalAccounts: number;
  totalLecturers: number;
  totalStudents: number;
  totalCourses: number;
  totalClasses: number;
  revenue: number;
  cost: number;
  activeClasses: number;
  classCompletionRate: number;
  avgFillRate: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalLecturers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalClasses: 0,
    revenue: 0,
    cost: 0,
    activeClasses: 0,
    classCompletionRate: 0,
    avgFillRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Date range filter state
  const [dateRange, setDateRange] = useState<{start: Date, end: Date}>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 ngày trước mặc định
    end: new Date()
  });

  const [monthlyFinance, setMonthlyFinance] = useState<Array<{ month: string; DoanhThu: number; ChiPhi: number; LoiNhuan: number }>>([]);
  const [revenueByCourse, setRevenueByCourse] = useState<Array<{ tenKhoaHoc: string; DoanhThu: number }>>([]);
  const [costStructure, setCostStructure] = useState<Array<{ name: string; value: number }>>([]);
  const [teacherRanking, setTeacherRanking] = useState<Array<{ giangVienID: number; hoTen: string; soLopDay: number; diemTB: number; tyLeDat: number }>>([]);

  useEffect(() => {
    let intervalId: any;

    const monthKey = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthLabel = (key: string) => {
      const parts = key.split('-');
      const m = Number(parts[1] || '1');
      return `T${m}`;
    };

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [accounts, lecturers, students, courses, classes, paymentsSuccess, costs, registrations, grades] = await Promise.all([
          taiKhoanService.getAll(),
          giangVienService.getAll(),
          hocVienService.getAll(),
          khoaHocService.getAll(),
          lopHocService.getAll(),
          thanhToanService.getByStatus('Success'),
          chiPhiService.getAll(),
          dangKyLopService.getAll(),
          diemSoService.getAll()
        ]);

        // Filter data by date range
        const filteredPaymentsSuccess = paymentsSuccess.filter((p: any) => {
          const paymentDate = new Date(p.ngayThanhToan);
          return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
        });

        const filteredCosts = costs.filter((c: any) => {
          const costDate = new Date(c.ngayPhatSinh);
          return costDate >= dateRange.start && costDate <= dateRange.end;
        });

        // Use filtered data for calculations
        const totalRevenue = filteredPaymentsSuccess.reduce((s, p: any) => s + (p.soTien || 0), 0);
        const totalCost = filteredCosts.reduce((s, c: any) => s + (c.soTien || 0), 0);

        const active = classes.filter((c: any) => (c.trangThai || '').toLowerCase() === 'dangdienra').length;
        const completed = classes.filter((c: any) => (c.trangThai || '').toLowerCase() === 'daketthuc').length;
        const completionRate = classes.length > 0 ? completed / classes.length : 0;

        const validRegStatuses = new Set(['danghoc', 'dahoanthanh']);
        const totalRegistrations = registrations.filter((r: any) => validRegStatuses.has((r.trangThaiDangKy || '').toLowerCase())).length;
        const totalCapacity = classes.reduce((s: number, c: any) => s + (c.soLuongToiDa || 0), 0);
        const avgFill = totalCapacity > 0 ? totalRegistrations / totalCapacity : 0;

        const revByMonth: Record<string, number> = {};
        filteredPaymentsSuccess.forEach((p: any) => {
          const d = new Date(p.ngayThanhToan);
          const k = monthKey(d);
          revByMonth[k] = (revByMonth[k] || 0) + (p.soTien || 0);
        });
        const costByMonth: Record<string, number> = {};
        filteredCosts.forEach((c: any) => {
          const d = new Date(c.ngayPhatSinh);
          const k = monthKey(d);
          costByMonth[k] = (costByMonth[k] || 0) + (c.soTien || 0);
        });
        const allMonths = Array.from(new Set([...Object.keys(revByMonth), ...Object.keys(costByMonth)])).sort();
        const monthly = allMonths.map(k => ({
          month: monthLabel(k),
          DoanhThu: Math.round((revByMonth[k] || 0)),
          ChiPhi: Math.round((costByMonth[k] || 0)),
          LoiNhuan: Math.round((revByMonth[k] || 0) - (costByMonth[k] || 0))
        }));

        const lopById = new Map(classes.map((l: any) => [l.lopID, l] as const));
        const khoaById = new Map(courses.map((k: any) => [k.khoaHocID, k] as const));
        const regById = new Map(registrations.map((r: any) => [r.dangKyID, r] as const));
        const revCourseMap: Record<string, number> = {};
        filteredPaymentsSuccess.forEach((p: any) => {
          const reg = regById.get(p.dangKyID);
          if (!reg) return;
          const lop = lopById.get(reg.lopID);
          if (!lop) return;
          const kh = khoaById.get(lop.khoaHocID);
          const name = kh?.tenKhoaHoc || `Khóa ${lop.khoaHocID}`;
          revCourseMap[name] = (revCourseMap[name] || 0) + (p.soTien || 0);
        });
        const revenueCourseArr = Object.entries(revCourseMap)
          .map(([tenKhoaHoc, DoanhThu]) => ({ tenKhoaHoc, DoanhThu }))
          .sort((a, b) => b.DoanhThu - a.DoanhThu)
          .slice(0, 12);

        const costStructMap: Record<string, number> = {};
        filteredCosts.forEach((c: any) => {
          const key = c.loaiChiPhi || 'Khac';
          costStructMap[key] = (costStructMap[key] || 0) + (c.soTien || 0);
        });
        const costStructArr = Object.entries(costStructMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        const gvById = new Map(lecturers.map((g: any) => [g.giangVienID, g] as const));
        const classesByGV: Record<number, number> = {};
        classes.forEach((l: any) => { classesByGV[l.giangVienID] = (classesByGV[l.giangVienID] || 0) + 1; });

        const lopByIdForGrade = lopById;
        const gvMetrics: Record<number, { totalScores: number; countScores: number; passCount: number; totalCount: number }> = {};
        grades.forEach((d: any) => {
          const lop = lopByIdForGrade.get(d.lopID);
          if (!lop) return;
          const gv = lop.giangVienID;
          if (!gvMetrics[gv]) gvMetrics[gv] = { totalScores: 0, countScores: 0, passCount: 0, totalCount: 0 };
          gvMetrics[gv].totalScores += (d.diem || 0);
          gvMetrics[gv].countScores += 1;
          gvMetrics[gv].totalCount += 1;
          if ((d.ketQua || '').toLowerCase() === 'dat') gvMetrics[gv].passCount += 1;
        });

        const ranking = Object.keys(classesByGV).map(k => {
          const id = Number(k);
          const metric = gvMetrics[id] || { totalScores: 0, countScores: 0, passCount: 0, totalCount: 0 };
          const hoTen = (gvById.get(id)?.hoTen) || `GV ${id}`;
          const diemTB = metric.countScores > 0 ? metric.totalScores / metric.countScores : 0;
          const tyLeDat = metric.totalCount > 0 ? metric.passCount / metric.totalCount : 0;
          return { giangVienID: id, hoTen, soLopDay: classesByGV[id], diemTB, tyLeDat };
        })
        .sort((a, b) => (b.tyLeDat - a.tyLeDat) || (b.soLopDay - a.soLopDay) || (b.diemTB - a.diemTB))
        .slice(0, 10);

        setStats({
          totalAccounts: accounts.length,
          totalLecturers: lecturers.length,
          totalStudents: students.length,
          totalCourses: courses.length,
          totalClasses: classes.length,
          revenue: totalRevenue,
          cost: totalCost,
          activeClasses: active,
          classCompletionRate: completionRate,
          avgFillRate: avgFill
        });

        setMonthlyFinance(monthly);
        setRevenueByCourse(revenueCourseArr);
        setCostStructure(costStructArr);
        setTeacherRanking(ranking);
        setLastUpdated(new Date());
      } catch (e: any) {
        console.error('Lỗi khi tải dữ liệu Dashboard:', e);
        setError(e?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    intervalId = setInterval(fetchAll, 600000);
    return () => clearInterval(intervalId);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Tổng quan hệ thống</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Tổng quan hệ thống</h2>
      </div>
      {error && (
        <div style={{ padding: '10px 20px', color: '#b00020', background: '#fde7e9', borderRadius: 6, margin: '0 20px' }}>
          Lỗi tải dữ liệu: {error}
        </div>
      )}
      {/* Date Range Filter - Modern Design */}
      <div style={{
        margin: '10px 20px',
        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Filter Icon and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
            <span style={{ fontSize: '18px' }}>📅</span>
            <div>
              <h4 style={{
                margin: '0',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Khoảng thời gian
              </h4>
              <small style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                Lọc dữ liệu theo thời gian
              </small>
            </div>
          </div>

          {/* Date Pickers */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>Từ:</span>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                start: new Date(e.target.value)
              }))}
              style={{
                padding: '6px 8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                background: 'white',
                color: '#333',
                fontSize: '13px',
                minWidth: '130px'
              }}
            />
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>đến:</span>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                end: new Date(e.target.value)
              }))}
              style={{
                padding: '6px 8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                background: 'white',
                color: '#333',
                fontSize: '13px',
                minWidth: '130px'
              }}
            />
          </div>

          {/* Quick Date Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: '7 ngày', days: 7, color: '#007bff', icon: '📅' },
              { label: '30 ngày', days: 30, color: '#28a745', icon: '📊' },
              { label: '3 tháng', days: 90, color: '#ffc107', icon: '📈' },
              { label: 'Năm nay', days: 365, color: '#6f42c1', icon: '🌟' }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setDateRange({
                  start: preset.label === 'Năm nay'
                    ? new Date(new Date().getFullYear(), 0, 1)
                    : new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000),
                  end: new Date()
                })}
                style={{
                  padding: '6px 10px',
                  background: preset.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <span>{preset.icon}</span>
                {preset.label}
              </button>
            ))}
          </div>

          {/* Current Date Range Display */}
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '6px 12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <small style={{
              color: 'white',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              Đang xem: {dateRange.start.toLocaleDateString('vi-VN')}
              {' → '}
              {dateRange.end.toLocaleDateString('vi-VN')}
            </small>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <small style={{ color: '#666' }}>Cập nhật: {lastUpdated ? lastUpdated.toLocaleString() : '-'}</small>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer', background: '#fff' }}
        >Làm mới</button>
      </div>

      <div className="dashboard-stats" style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px', 
        padding: '20px' 
      }}>
        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: '#666' }}>Doanh thu</h4>
          <h3 style={{ color: '#007bff', margin: '10px 0 0 0' }}>{stats.revenue.toLocaleString('vi-VN')} VND</h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: '#666' }}>Chi phí</h4>
          <h3 style={{ color: '#dc3545', margin: '10px 0 0 0' }}>{stats.cost.toLocaleString('vi-VN')} VND</h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: '#666' }}>Tổng học viên</h4>
          <h3 style={{ color: '#17a2b8', margin: '10px 0 0 0' }}>{stats.totalStudents}</h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: '#666' }}>Lớp đang diễn ra</h4>
          <h3 style={{ color: '#28a745', margin: '10px 0 0 0' }}>{stats.activeClasses}</h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: '#666' }}>Tỷ lệ hoàn thành</h4>
          <h3 style={{ color: '#6f42c1', margin: '10px 0 0 0' }}>{(stats.classCompletionRate * 100).toFixed(0)}%</h3>
        </div>

        <div className="stat-card" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: '#666' }}>Tỷ lệ lấp đầy TB</h4>
          <h3 style={{ color: '#ff7f0e', margin: '10px 0 0 0' }}>{(stats.avgFillRate * 100).toFixed(0)}%</h3>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px 20px' }}>
        <h3>Doanh thu - Chi phí - Lợi nhuận theo tháng</h3>
        <div style={{ width: '100%', height: 320, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 10 }}>
          {monthlyFinance.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              Không có dữ liệu biểu đồ trong giai đoạn hiện tại
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={monthlyFinance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(Number(v)/1_000_000).toFixed(0)}tr`} />
                <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('vi-VN')} VND`} />
                <Legend />
                <Bar dataKey="DoanhThu" fill="#007bff" name="Doanh thu" />
                <Bar dataKey="ChiPhi" fill="#dc3545" name="Chi phí" />
                <Bar dataKey="LoiNhuan" fill="#28a745" name="Lợi nhuận" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, padding: '0 20px 20px 20px' }}>
        <div>
          <h3>Doanh thu theo khóa học</h3>
          <div style={{ width: '100%', height: 320, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 10 }}>
            {revenueByCourse.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                Chưa có doanh thu theo khóa học
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={revenueByCourse} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(Number(v)/1_000_000).toFixed(0)}tr`} />
                  <YAxis type="category" dataKey="tenKhoaHoc" width={160} />
                  <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('vi-VN')} VND`} />
                  <Legend />
                  <Bar dataKey="DoanhThu" fill="#6f42c1" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <h3>Cơ cấu chi phí</h3>
          <div style={{ width: '100%', height: 320, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 10 }}>
            {costStructure.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                Chưa có dữ liệu chi phí theo loại
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={costStructure} dataKey="value" nameKey="name" outerRadius={100} label>
                    {costStructure.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={["#007bff","#dc3545","#ffc107","#28a745","#6f42c1","#17a2b8","#ff7f0e","#20c997"][idx % 8]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('vi-VN')} VND`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 30px 20px' }}>
        <h3>Bảng xếp hạng giảng viên</h3>
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {teacherRanking.length === 0 ? (
            <div style={{ padding: 20, color: '#888' }}>Chưa có dữ liệu xếp hạng giảng viên</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f7f7' }}>
                  <th style={{ textAlign: 'left', padding: 12 }}>Giảng viên</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Số lớp dạy</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Điểm trung bình</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Tỷ lệ đạt</th>
                </tr>
              </thead>
              <tbody>
                {teacherRanking.map((row, idx) => (
                  <tr key={row.giangVienID} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 12 }}>
                      {idx < 3 ? <span style={{ marginRight: 8 }}>{['🥇','🥈','🥉'][idx]}</span> : null}
                      {row.hoTen}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{row.soLopDay}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{row.diemTB.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{(row.tyLeDat * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
