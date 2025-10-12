import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lopHocService, LopHoc, dangKyLopService, DangKyLop, buoiHocService, BuoiHoc, diemDanhService, DiemDanh, hocVienService } from '../../services/api';
import '../../styles/Lecturer.css';

// AttendanceTab Component
interface AttendanceTabProps {
  lopId: number;
  students: StudentWithStats[];
  buoiHocs: BuoiHoc[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ lopId, students, buoiHocs, onRefresh }) => {
  const [selectedBuoiHoc, setSelectedBuoiHoc] = useState<BuoiHoc | null>(null);
  const [attendanceData, setAttendanceData] = useState<{[hocVienId: number]: { coMat: boolean; ghiChu: string }}>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchDate, setSearchDate] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Sắp xếp buổi học: gần nhất trước
  const sortedBuoiHocs = [...buoiHocs].sort((a, b) => new Date(a.ngayHoc).getTime() - new Date(b.ngayHoc).getTime());

  // Filter buổi học theo trạng thái và ngày tìm kiếm
  const filteredBuoiHocs = sortedBuoiHocs.filter(buoiHoc => {
    const statusMatch = filterStatus === 'all' || buoiHoc.trangThai === filterStatus;
    const dateMatch = !searchDate || buoiHoc.ngayHoc.includes(searchDate);
    return statusMatch && dateMatch;
  });

      // Load attendance data for selected session
  useEffect(() => {
    if (selectedBuoiHoc) {
      loadAttendanceData();
      // Tự động set edit mode cho buổi học chưa kết thúc
      setIsEditMode(selectedBuoiHoc.trangThai !== 'DaDienRa');
    }
  }, [selectedBuoiHoc]);

  const loadAttendanceData = async () => {
    if (!selectedBuoiHoc) return;

    setLoading(true);
    try {
      // Get existing attendance records for this session
      const existingAttendance = await diemDanhService.getByBuoiHocId(selectedBuoiHoc.buoiHocID);

      // Initialize attendance data for all students
      const initialData: {[hocVienId: number]: { coMat: boolean; ghiChu: string }} = {};

      students.forEach(student => {
        const existing = existingAttendance.find(att => att.hocVienID === student.hocVienID);
        initialData[student.hocVienID] = {
          coMat: existing ? existing.coMat : false,
          ghiChu: existing ? (existing.ghiChu || '') : ''
        };
      });

      setAttendanceData(initialData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu điểm danh:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (hocVienId: number, coMat: boolean, ghiChu: string = '') => {
    setAttendanceData(prev => ({
      ...prev,
      [hocVienId]: { coMat, ghiChu }
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedBuoiHoc) return;

    setSaving(true);
    try {
      const attendanceRecords = Object.entries(attendanceData).map(([hocVienId, data]) => ({
        buoiHocID: selectedBuoiHoc.buoiHocID,
        hocVienID: parseInt(hocVienId),
        coMat: data.coMat,
        ghiChu: data.ghiChu || null
      }));

      // Use bulk create/update
      await diemDanhService.createBulk(attendanceRecords);

      alert('Đã lưu điểm danh thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu điểm danh:', error);
      alert('Có lỗi xảy ra khi lưu điểm danh!');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ChuaDienRa': return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'DangDienRa': return { backgroundColor: '#fef3c7', color: '#d97706' };
      case 'DaDienRa': return { backgroundColor: '#dcfce7', color: '#166534' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const getAttendanceStatusColor = (coMat: boolean) => {
    return coMat
      ? { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
      : { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
  };

  // Tính thống kê điểm danh
  const attendanceStats = Object.values(attendanceData);
  const presentCount = attendanceStats.filter(att => att.coMat).length;
  const absentCount = attendanceStats.filter(att => !att.coMat).length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  if (buoiHocs.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#6b7280'
      }}>
        <i className="fas fa-calendar" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
        <h3 style={{ margin: '0 0 8px 0' }}>Chưa có buổi học nào</h3>
        <p style={{ margin: 0 }}>Buổi học sẽ xuất hiện ở đây khi được tạo trong hệ thống.</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-refresh"></i> Tải lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
          {/* Dropdown chọn buổi học */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              <i className="fas fa-calendar-check"></i> Chọn buổi học:
            </label>
            <select
              value={selectedBuoiHoc?.buoiHocID || ''}
              onChange={(e) => {
                const buoiHoc = buoiHocs.find(bh => bh.buoiHocID === parseInt(e.target.value));
                setSelectedBuoiHoc(buoiHoc || null);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">-- Chọn buổi học --</option>
              {filteredBuoiHocs.map((buoiHoc) => (
                <option key={buoiHoc.buoiHocID} value={buoiHoc.buoiHocID}>
                  {formatDateOnly(buoiHoc.ngayHoc)} - {buoiHoc.thoiGianBatDau || 'Chưa có giờ'} ({buoiHoc.trangThai})
                </option>
              ))}
            </select>
          </div>

          {/* Filter trạng thái */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              <i className="fas fa-filter"></i> Lọc trạng thái:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ChuaDienRa">Chưa diễn ra</option>
              <option value="DangDienRa">Đang diễn ra</option>
              <option value="DaKetThuc">Đã kết thúc</option>
            </select>
          </div>

          {/* Tìm kiếm theo ngày */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              <i className="fas fa-search"></i> Tìm theo ngày:
            </label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            />
          </div>

          {/* Nút refresh */}
          {onRefresh && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                <i className="fas fa-sync-alt"></i> Tải lại:
              </label>
              <button
                onClick={onRefresh}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <i className="fas fa-refresh"></i> Tải lại danh sách
              </button>
            </div>
          )}
        </div>

        {/* Hiển thị số kết quả */}
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#6b7280' }}>
          Hiển thị {filteredBuoiHocs.length} / {buoiHocs.length} buổi học
        </div>
      </div>

      {/* Attendance Content */}
      {selectedBuoiHoc && (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          {/* Thông tin buổi học được chọn */}
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#1f2937' }}>
                <i className="fas fa-info-circle"></i> Thông tin buổi học đã chọn:
              </h4>
              {selectedBuoiHoc.trangThai === 'DaKetThuc' && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  style={{
                    padding: '8px 16px',
                    background: isEditMode ? '#dc2626' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <i className={`fas ${isEditMode ? 'fa-eye' : 'fa-edit'}`}></i>
                  {isEditMode ? 'Xem kết quả' : 'Chỉnh sửa'}
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>Ngày học:</strong> {formatDateOnly(selectedBuoiHoc.ngayHoc)}</div>
              <div><strong>Thời gian:</strong> {selectedBuoiHoc.thoiGianBatDau || 'Chưa xác định'} - {selectedBuoiHoc.thoiGianKetThuc || 'Chưa xác định'}</div>
              <div><strong>Trạng thái:</strong>
                <span style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  ...getStatusColor(selectedBuoiHoc.trangThai)
                }}>
                  {selectedBuoiHoc.trangThai}
                </span>
              </div>
            </div>
          </div>

          {/* Nếu buổi học đã kết thúc và không ở chế độ edit → Hiển thị kết quả */}
          {!isEditMode && selectedBuoiHoc.trangThai === 'DaKetThuc' ? (
            <div>
              {/* Thống kê tổng quan */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                  <i className="fas fa-chart-bar"></i> Thống kê điểm danh:
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
                      {presentCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Có mặt</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
                      {absentCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Vắng mặt</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#2563eb' }}>
                      {attendanceRate}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Tỷ lệ có mặt</div>
                  </div>
                </div>
              </div>

              {/* Danh sách kết quả điểm danh */}
              <h5 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                <i className="fas fa-list-check"></i> Chi tiết điểm danh:
              </h5>
              <div style={{ display: 'grid', gap: '8px' }}>
                {students.map((student, index) => {
                  const attendance = attendanceData[student.hocVienID];
                  return (
                    <div key={student.hocVienID} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: attendance?.coMat ? '#059669' : '#dc2626',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {attendance?.coMat ? '✓' : '✗'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>
                            {student.hoTen}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {student.email && `Email: ${student.email}`}
                            {student.soDienThoai && ` • SĐT: ${student.soDienThoai}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          ...getAttendanceStatusColor(attendance?.coMat || false)
                        }}>
                          {attendance?.coMat ? 'Có mặt' : 'Vắng mặt'}
                        </div>
                        {attendance?.ghiChu && (
                          <div style={{
                            padding: '4px 8px',
                            background: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {attendance.ghiChu}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Form điểm danh cho buổi học chưa kết thúc hoặc đang edit */
            <div>
              {/* Nút lưu ở đầu form */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: saving ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                  {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
                </button>
              </div>

              {/* Danh sách học viên để điểm danh */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '10px' }}></i>
                  Đang tải dữ liệu điểm danh...
                </div>
              ) : (
                <div>
                  <h5 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                    <i className="fas fa-users"></i> Danh sách học viên ({students.length} học viên):
                  </h5>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {students.map((student, index) => (
                      <div key={student.hocVienID} style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: '#dc2626',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {index + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1f2937' }}>
                              {student.hoTen}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                              {student.email && `Email: ${student.email}`}
                              {student.soDienThoai && ` • SĐT: ${student.soDienThoai}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={attendanceData[student.hocVienID]?.coMat || false}
                                onChange={(e) => handleAttendanceChange(student.hocVienID, e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                              />
                              <span style={{ fontWeight: '500' }}>Có mặt</span>
                            </label>
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Ghi chú..."
                              value={attendanceData[student.hocVienID]?.ghiChu || ''}
                              onChange={(e) => handleAttendanceChange(student.hocVienID, attendanceData[student.hocVienID]?.coMat || false, e.target.value)}
                              style={{
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '14px',
                                width: '150px'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nút lưu ở cuối form */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button
                      onClick={handleSaveAttendance}
                      disabled={saving}
                      style={{
                        padding: '12px 32px',
                        background: saving ? '#9ca3af' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                      {saving ? 'Đang lưu điểm danh...' : 'Lưu điểm danh'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Thông báo khi chưa chọn buổi học */}
      {!selectedBuoiHoc && buoiHocs.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <i className="fas fa-hand-point-up" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
          <h3 style={{ margin: '0 0 8px 0' }}>Chọn buổi học để bắt đầu điểm danh</h3>
          <p style={{ margin: 0 }}>Sử dụng dropdown ở trên để chọn buổi học cần điểm danh.</p>
        </div>
      )}
    </div>
  );
};

interface StudentWithStats extends DangKyLop {
  hoTen: string;
  email?: string;
  soDienThoai?: string;
  soBuoiDaHoc: number;
  tongSoBuoi: number;
  tiLeDiemDanh: number;
  dangKyID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
}

const LecturerClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<LopHoc | null>(null);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [buoiHocs, setBuoiHocs] = useState<BuoiHoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'grades'>('students');

  // Separate state for attendance tab
  const [buoiHocLoading, setBuoiHocLoading] = useState(false);
  const [buoiHocError, setBuoiHocError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Hiển thị 5 học viên mỗi trang

  useEffect(() => {
    if (id) {
      fetchClassDetail();
    }
  }, [id]);

  useEffect(() => {
    // Reset về trang đầu khi chuyển tab hoặc khi danh sách học viên thay đổi
    setCurrentPage(1);
  }, [activeTab, students]);

  // Load buổi học khi chuyển sang tab attendance
  useEffect(() => {
    if (activeTab === 'attendance' && classInfo) {
      loadBuoiHocs();
    }
  }, [activeTab, classInfo, refreshKey]);

  const loadBuoiHocs = async () => {
    if (!classInfo) return;

    setBuoiHocLoading(true);
    setBuoiHocError(null);

    try {
      console.log('🔄 [TAB] Đang lấy danh sách buổi học cho lớp:', classInfo.lopID);
      const buoiHocResponse = await buoiHocService.getByLopId(classInfo.lopID);
      console.log('✅ [TAB] Danh sách buổi học:', buoiHocResponse);

      if (Array.isArray(buoiHocResponse)) {
        setBuoiHocs(buoiHocResponse);
        console.log('✅ [TAB] Đã tải được', buoiHocResponse.length, 'buổi học');
      } else {
        console.warn('⚠️ [TAB] API trả về không phải array:', typeof buoiHocResponse);
        setBuoiHocs([]);
      }
      } catch (buoiHocError: any) {
        console.error('❌ [TAB] Lỗi khi lấy danh sách buổi học:', buoiHocError);

        // Thử gọi trực tiếp API nếu service không hoạt động
        try {
          console.log('🔄 [TAB] Thử gọi trực tiếp API BuoiHoc...');
          const directResponse = await fetch(`http://localhost:5080/api/BuoiHoc/lop/${classInfo.lopID}`);
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ [TAB] Gọi trực tiếp thành công:', directData);

            if (Array.isArray(directData)) {
              setBuoiHocs(directData);
              console.log('✅ [TAB] Đã tải được', directData.length, 'buổi học từ direct call');
            } else {
              console.warn('⚠️ [TAB] API trả về không phải array, set empty');
              setBuoiHocs([]);
            }
          } else {
            if (directResponse.status === 500) {
              console.warn('⚠️ [TAB] Lỗi server 500 - có thể chưa có dữ liệu buổi học');
              setBuoiHocs([]);
              setBuoiHocError('Chưa có buổi học nào được tạo cho lớp này');
            } else {
              console.warn(`⚠️ [TAB] Direct API call thất bại với status ${directResponse.status}`);
              setBuoiHocs([]);
              setBuoiHocError(`Không thể tải danh sách buổi học (${directResponse.status})`);
            }
          }
        } catch (directError) {
          console.error('❌ [TAB] Direct API call cũng thất bại:', directError);
          setBuoiHocs([]);
          setBuoiHocError('Không thể kết nối đến server');
        }
    } finally {
      setBuoiHocLoading(false);
    }
  };

  const handleRefreshBuoiHocs = () => {
    setRefreshKey(prev => prev + 1);
  };

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError('Không tìm thấy ID lớp học');
        return;
      }

      const classId = parseInt(id);
      console.log('🔄 Đang tải thông tin lớp học:', classId);

      // Lấy thông tin lớp học cơ bản trước
      const classResponse = await lopHocService.getById(classId);
      console.log('✅ Thông tin lớp học:', classResponse);
      setClassInfo(classResponse);

      // Lấy danh sách buổi học để tính tổng số buổi
      let tongSoBuoi = 0;
      try {
        console.log('🔄 Đang lấy danh sách buổi học cho lớp:', classId);
        const buoiHocResponse = await buoiHocService.getByLopId(classId);
        console.log('✅ Danh sách buổi học:', buoiHocResponse);

        if (Array.isArray(buoiHocResponse)) {
          setBuoiHocs(buoiHocResponse);
          tongSoBuoi = buoiHocResponse.length;
          console.log('✅ Đã tải được', buoiHocResponse.length, 'buổi học');
        } else {
          console.warn('⚠️ API trả về không phải array:', typeof buoiHocResponse);
          setBuoiHocs([]);
        }
      } catch (buoiHocError: any) {
        console.error('❌ Lỗi khi lấy danh sách buổi học:', buoiHocError);
        console.error('❌ Error details:', {
          message: buoiHocError.message,
          status: buoiHocError.response?.status,
          data: buoiHocError.response?.data
        });

        // Thử gọi trực tiếp API nếu service không hoạt động
        try {
          console.log('🔄 Thử gọi trực tiếp API BuoiHoc...');
          const directResponse = await fetch(`http://localhost:5080/api/BuoiHoc/lop/${classId}`);
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ Gọi trực tiếp thành công:', directData);

            if (Array.isArray(directData)) {
              setBuoiHocs(directData);
              tongSoBuoi = directData.length;
              console.log('✅ Đã tải được', directData.length, 'buổi học từ direct call');
            }
          } else {
            console.warn(`⚠️ Direct API call thất bại với status ${directResponse.status}`);
            setBuoiHocs([]);
          }
        } catch (directError) {
          console.error('❌ Direct API call cũng thất bại:', directError);
          setBuoiHocs([]);
        }
      }

      // Lấy danh sách học viên đăng ký lớp học
      let dangKyLops: DangKyLop[] = [];
      try {
        console.log('🔄 Đang lấy danh sách đăng ký lớp học qua service...');
        dangKyLops = await dangKyLopService.getByLopId(classId);
        console.log('✅ Danh sách đăng ký:', dangKyLops);
      } catch (dangKyError: any) {
        console.warn('⚠️ Không thể lấy danh sách đăng ký qua service:', dangKyError);
        console.log('🔄 Thử gọi trực tiếp API...');

        try {
          const studentsResponse = await fetch(`http://localhost:5080/api/DangKyLop/lop/${classId}`);
          if (studentsResponse.ok) {
            dangKyLops = await studentsResponse.json();
            console.log('✅ Danh sách đăng ký (direct call):', dangKyLops);
          } else {
            console.warn(`⚠️ DangKyLop API lỗi ${studentsResponse.status}, sử dụng dữ liệu mẫu`);
          }
        } catch (directCallError) {
          console.warn('⚠️ Không thể lấy danh sách đăng ký (direct call):', directCallError);
        }
      }

      // // Nếu không có dữ liệu từ API, sử dụng dữ liệu mẫu
      // if (dangKyLops.length === 0) {
      //   console.log('📝 Sử dụng dữ liệu mẫu cho học viên');
      //   dangKyLops = [
      //     {
      //       dangKyID: 1,
      //       hocVienID: 1,
      //       lopID: classId,
      //       ngayDangKy: new Date().toISOString(),
      //       trangThaiDangKy: 'DangHoc',
      //       trangThaiThanhToan: 'DaThanhToan'
      //     },
      //     {
      //       dangKyID: 2,
      //       hocVienID: 2,
      //       lopID: classId,
      //       ngayDangKy: new Date().toISOString(),
      //       trangThaiDangKy: 'DangHoc',
      //       trangThaiThanhToan: 'DaThanhToan'
      //     }
      //   ];
      // }

      // Xử lý dữ liệu học viên với thống kê
      const studentsWithStats: StudentWithStats[] = [];

      for (const dangKy of dangKyLops) {
        try {
          console.log('🔄 Đang xử lý học viên:', dangKy.hocVienID);

          // Lấy thông tin học viên
          let studentInfo: any = null;
          try {
            // Sử dụng hocVienService thay vì fetch trực tiếp
            studentInfo = await hocVienService.getById(dangKy.hocVienID);
            console.log('✅ Thông tin học viên:', studentInfo);
          } catch (error: any) {
            console.warn(`⚠️ Không tìm thấy học viên ${dangKy.hocVienID}, sử dụng dữ liệu mẫu:`, error.message);

            // Tạo dữ liệu mẫu với thông tin hợp lý
            studentInfo = {
              hoTen: `Học viên ${dangKy.hocVienID}`,
              email: `hocvien${dangKy.hocVienID}@example.com`,
              sdt: `090${dangKy.hocVienID.toString().padStart(7, '1')}`,
              ngaySinh: null,
              taiKhoanVi: 0
            };
            console.log('📝 Sử dụng dữ liệu mẫu cho học viên:', studentInfo.hoTen);
          }

          // Lấy điểm thi của học viên trong lớp này
          let diemGiuaKy = 0;
          let diemCuoiKy = 0;
          let diemTrungBinh = 0;

          try {
            // Lấy tất cả điểm của học viên trong lớp
            const diemSoResponse = await fetch(`http://localhost:5080/api/DiemSo/grades/hoc-vien/${dangKy.hocVienID}/lop/${classId}`);
            if (diemSoResponse.ok) {
              const diemSos = await diemSoResponse.json();
              console.log('✅ Điểm số học viên:', diemSos);

              // Tìm điểm giữa kỳ và cuối kỳ
              const diemGiuaKyObj = diemSos.find((d: any) => d.loaiDiem?.toLowerCase().includes('giữa kỳ') || d.loaiDiem?.toLowerCase().includes('giua ky'));
              const diemCuoiKyObj = diemSos.find((d: any) => d.loaiDiem?.toLowerCase().includes('cuối kỳ') || d.loaiDiem?.toLowerCase().includes('cuoi ky'));

              diemGiuaKy = diemGiuaKyObj ? parseFloat(diemGiuaKyObj.diem) : 0;
              diemCuoiKy = diemCuoiKyObj ? parseFloat(diemCuoiKyObj.diem) : 0;

              // Tính điểm trung bình theo công thức: (giữa kỳ + cuối kỳ * 2) / 3
              if (diemGiuaKy > 0 || diemCuoiKy > 0) {
                diemTrungBinh = (diemGiuaKy + diemCuoiKy * 2) / 3;
              }
            }
          } catch (error) {
            console.warn('Không thể lấy điểm số:', error);
          }

          // Lấy tỷ lệ điểm danh thực tế từ DiemDanh API
          let tiLeDiemDanh = 0;
          try {
            const diemDanhResponse = await fetch(`http://localhost:5080/api/DiemDanh/attendance-rate/hoc-vien/${dangKy.hocVienID}/lop/${classId}`);
            if (diemDanhResponse.ok) {
              const rawRate = await diemDanhResponse.json();
              console.log('🔍 Raw diem danh rate:', rawRate, typeof rawRate);

              // Xử lý dữ liệu từ API - có thể trả về số thập phân hoặc phần trăm
              if (typeof rawRate === 'number') {
                if (rawRate <= 1) {
                  // API trả về tỷ lệ thập phân (0.85)
                  tiLeDiemDanh = rawRate * 100;
                } else if (rawRate <= 100) {
                  // API trả về tỷ lệ phần trăm (85)
                  tiLeDiemDanh = rawRate;
                } else {
                  // API trả về dữ liệu bất thường (> 100)
                  console.warn('⚠️ API trả về tỷ lệ điểm danh bất thường:', rawRate);
                  tiLeDiemDanh = Math.min(rawRate / 100, 100); // Chia 100 và giới hạn max 100%
                }
              } else {
                console.warn('⚠️ API trả về dữ liệu không phải số:', rawRate);
                tiLeDiemDanh = 0;
              }

              console.log('✅ Tỷ lệ điểm danh sau xử lý:', tiLeDiemDanh);
            } else {
              console.warn(`⚠️ Không thể lấy tỷ lệ điểm danh cho học viên ${dangKy.hocVienID}`);
              tiLeDiemDanh = 0;
            }
          } catch (error) {
            console.warn('Không thể lấy tỷ lệ điểm danh:', error);
            tiLeDiemDanh = 0;
          }

          studentsWithStats.push({
            ...dangKy,
            hoTen: studentInfo.hoTen || 'Chưa cập nhật',
            email: studentInfo.email,
            soDienThoai: studentInfo.sdt,
            soBuoiDaHoc: diemTrungBinh >= 5 ? tongSoBuoi : 0, // Nếu điểm >= 5 thì coi như hoàn thành tất cả buổi
            tongSoBuoi: tongSoBuoi,
            tiLeDiemDanh: tiLeDiemDanh // Tỷ lệ điểm danh dựa trên điểm số
          });

          console.log('✅ Đã thêm học viên vào danh sách:', studentInfo.hoTen);
        } catch (error) {
          console.error('❌ Lỗi khi lấy thông tin học viên:', dangKy.hocVienID, error);
        }
      }

      console.log('✅ Tổng số học viên:', studentsWithStats.length);
      setStudents(studentsWithStats);

    } catch (error: any) {
      console.error('❌ Lỗi khi tải thông tin lớp học:', error);
      setError(`Không thể tải thông tin lớp học: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = students.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Pagination UI Component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            style={{
              padding: '8px 12px',
              margin: '0 2px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: currentPage === i ? '#dc2626' : 'white',
              color: currentPage === i ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {i}
          </button>
        );
      } else if (
        (i === currentPage - 2 && currentPage > 3) ||
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        pages.push(
          <span key={i} style={{ margin: '0 5px', color: '#6b7280' }}>
            ...
          </span>
        );
      }
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '20px',
        gap: '10px'
      }}>
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: currentPage === 1 ? '#f3f4f6' : 'white',
            color: currentPage === 1 ? '#9ca3af' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          <i className="fas fa-chevron-left"></i> Trước
        </button>

        {pages}

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: currentPage === totalPages ? '#f3f4f6' : 'white',
            color: currentPage === totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          Sau <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'danghoc':
      case 'đang học':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'hoanthanh':
      case 'hoàn thành':
        return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
      case 'nghi':
      case 'nghỉ':
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <button
            onClick={() => navigate('/lecturer/classes')}
            className="btn-back"
            style={{
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            <i className="fas fa-arrow-left"></i> Quay lại
          </button>
          <h2>Chi tiết lớp học</h2>
        </div>
        <div className="loading">Đang tải thông tin lớp học...</div>
      </div>
    );
  }

  if (error || !classInfo) {
    return (
      <div className="management-container">
        <div className="management-header">
          <button
            onClick={() => navigate('/lecturer/classes')}
            className="btn-back"
            style={{
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            <i className="fas fa-arrow-left"></i> Quay lại
          </button>
          <h2>Chi tiết lớp học</h2>
        </div>
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          margin: '20px',
          textAlign: 'center',
          color: '#dc2626'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
          <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>{error || 'Không tìm thấy thông tin lớp học'}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <button
          onClick={() => navigate('/lecturer/classes')}
          className="btn-back"
          style={{
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          <i className="fas fa-arrow-left"></i> Quay lại
        </button>
        <h2>Chi tiết lớp học - ID: {classInfo.lopID}</h2>
      </div>

      {/* Thông tin tổng quan lớp học */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>
          <i className="fas fa-info-circle"></i> Thông tin lớp học
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Khóa học ID:</strong> {classInfo.khoaHocID}
          </div>
          <div>
            <strong>Ngày bắt đầu:</strong> {formatDate(classInfo.ngayBatDau)}
          </div>
          {classInfo.ngayKetThuc && (
            <div>
              <strong>Ngày kết thúc:</strong> {formatDate(classInfo.ngayKetThuc)}
            </div>
          )}
          <div>
            <strong>Ca học:</strong> {classInfo.caHoc || 'Chưa xác định'}
          </div>
          <div>
            <strong>Ngày học trong tuần:</strong> {classInfo.ngayHocTrongTuan || 'Chưa xác định'}
          </div>
          <div>
            <strong>Thời lượng:</strong> {classInfo.thoiLuongGio} giờ
          </div>
          <div>
            <strong>Sức chứa tối đa:</strong> {classInfo.soLuongToiDa || 'Không giới hạn'}
          </div>
          <div>
            <strong>Trạng thái:</strong>
            <span style={{
              marginLeft: '8px',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              ...getStatusColor(classInfo.trangThai || 'unknown')
            }}>
              {classInfo.trangThai || 'Chưa xác định'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'students' ? '#dc2626' : 'transparent',
              color: activeTab === 'students' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'students' ? '3px solid #b91c1c' : 'none'
            }}
          >
            <i className="fas fa-users"></i> Danh sách học viên ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'attendance' ? '#dc2626' : 'transparent',
              color: activeTab === 'attendance' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'attendance' ? '3px solid #b91c1c' : 'none'
            }}
          >
            <i className="fas fa-calendar-check"></i> Điểm danh
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'grades' ? '#dc2626' : 'transparent',
              color: activeTab === 'grades' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'grades' ? '3px solid #b91c1c' : 'none'
            }}
          >
            <i className="fas fa-graduation-cap"></i> Điểm số
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'students' && (
            <div>
              <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <strong>Tổng số học viên: {students.length}</strong>
              </div>

              {students.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <h3 style={{ margin: '0 0 8px 0' }}>Chưa có học viên nào đăng ký</h3>
                  <p style={{ margin: 0 }}>Học viên sẽ xuất hiện ở đây khi đăng ký vào lớp học này.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {currentStudents.map((student) => (
                      <div key={student.dangKyID} style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '15px',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '15px',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '5px' }}>
                            {student.hoTen}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                            {student.email && `Email: ${student.email}`}
                            {student.soDienThoai && ` • SĐT: ${student.soDienThoai}`}
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            <strong>Ngày đăng ký:</strong> {formatDate(student.ngayDangKy)}
                            <span style={{ marginLeft: '15px' }}>
                              <strong>Trạng thái đăng ký:</strong>
                              <span style={{
                                marginLeft: '5px',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                ...getStatusColor(student.trangThaiDangKy || 'unknown')
                              }}>
                                {student.trangThaiDangKy || 'Chưa xác định'}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
                              {((student.tiLeDiemDanh / 20)).toFixed(1)}/10
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Điểm</div>
                          </div>
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: student.tiLeDiemDanh >= 80 ? '#059669' : student.tiLeDiemDanh >= 60 ? '#d97706' : '#dc2626'
                            }}>
                              {student.tiLeDiemDanh}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Tỷ lệ điểm danh</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination UI */}
                  {renderPagination()}
                </>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              {/* Header với nút refresh */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#dc2626' }}>
                  <i className="fas fa-calendar-check"></i> Điểm danh
                </h3>
                <button
                  onClick={handleRefreshBuoiHocs}
                  disabled={buoiHocLoading}
                  style={{
                    padding: '8px 16px',
                    background: buoiHocLoading ? '#9ca3af' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: buoiHocLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className={`fas ${buoiHocLoading ? 'fa-spinner fa-spin' : 'fa-refresh'}`}></i>
                  {buoiHocLoading ? 'Đang tải...' : 'Tải lại'}
                </button>
              </div>

              {/* Hiển thị lỗi nếu có */}
              {buoiHocError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{buoiHocError}</span>
                </div>
              )}

              {/* Loading state */}
              {buoiHocLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '16px' }}></i>
                  <h3 style={{ margin: '0 0 8px 0' }}>Đang tải danh sách buổi học...</h3>
                  <p style={{ margin: 0 }}>Vui lòng đợi trong giây lát.</p>
                </div>
              ) : (
                /* AttendanceTab Component */
                <AttendanceTab
                  lopId={classInfo.lopID}
                  students={students}
                  buoiHocs={buoiHocs}
                  loading={buoiHocLoading}
                  error={buoiHocError}
                  onRefresh={handleRefreshBuoiHocs}
                />
              )}
            </div>
          )}

          {activeTab === 'grades' && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              <i className="fas fa-graduation-cap" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <h3 style={{ margin: '0 0 8px 0' }}>Tab điểm số</h3>
              <p style={{ margin: 0 }}>Chức năng điểm số sẽ được triển khai ở giai đoạn tiếp theo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerClassDetail;
