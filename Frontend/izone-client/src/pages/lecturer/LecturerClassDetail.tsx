import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lopHocService, LopHoc, dangKyLopService, DangKyLop, buoiHocService, BuoiHoc, diemDanhService, DiemDanh, hocVienService, diaDiemService, DiaDiem, thongBaoService } from '../../services/api';
import GradesTab from './GradesTab';
import '../../styles/Lecturer.css';

// AttendanceTab Component
interface AttendanceTabProps {
  lopId: number;
  students: StudentWithStats[];
  buoiHocs: BuoiHoc[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  selectedBuoiHoc?: BuoiHoc | null;
  attendanceData?: {[hocVienId: number]: { coMat: boolean; ghiChu: string }};
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ lopId, students, buoiHocs, onRefresh }) => {
  const [selectedBuoiHoc, setSelectedBuoiHoc] = useState<BuoiHoc | null>(null);
  const [attendanceData, setAttendanceData] = useState<{[hocVienId: number]: { coMat: boolean; ghiChu: string }}>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Sắp xếp buổi học: gần nhất trước
  const sortedBuoiHocs = [...buoiHocs].sort((a, b) => new Date(a.ngayHoc).getTime() - new Date(b.ngayHoc).getTime());

  // Filter buổi học theo trạng thái
  const filteredBuoiHocs = sortedBuoiHocs.filter(buoiHoc => {
    return filterStatus === 'all' || buoiHoc.trangThai === filterStatus;
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
              <option value="DaDienRa">Đã diễn ra</option>
            </select>
          </div>

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

            {/* Thống kê điểm danh cho buổi học được chọn */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '15px',
              marginTop: '15px'
            }}>
              <h5 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '14px' }}>
                <i className="fas fa-chart-bar"></i> Thống kê điểm danh buổi học:
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                {/* Tổng học viên */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                    {students.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng học viên</div>
                </div>

                {/* Học viên có mặt */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#059669' }}>
                    {presentCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Có mặt</div>
                </div>

                {/* Tỷ lệ có mặt */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: attendanceRate >= 80 ? '#059669' : attendanceRate >= 60 ? '#d97706' : '#dc2626'
                  }}>
                    {attendanceRate}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tỷ lệ có mặt</div>
                </div>
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
  diemTrungBinh: number;
  dangKyID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
}

// ScheduleChangeTab Component
interface ScheduleChangeTabProps {
  lopId: number;
  classInfo: LopHoc;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
}

const ScheduleChangeTab: React.FC<ScheduleChangeTabProps> = ({ lopId, classInfo, onRefresh, loading, error }) => {
  const [buoiHocs, setBuoiHocs] = useState<BuoiHoc[]>([]);
  const [locations, setLocations] = useState<DiaDiem[]>([]);
  const [selectedBuoiHoc, setSelectedBuoiHoc] = useState<BuoiHoc | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState<{
    ngayHoc: string;
    thoiGianBatDau: string;
    thoiGianKetThuc: string;
    diaDiemID: number | null;
    lyDo: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflictCheck, setConflictCheck] = useState<{
    hasConflict: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);

  // Load danh sách buổi học và địa điểm
  useEffect(() => {
    loadBuoiHocs();
    loadLocations();
  }, [lopId]);

  const loadBuoiHocs = async () => {
    try {
      console.log('🔄 Đang lấy danh sách buổi học cho lớp:', lopId);
      const response = await buoiHocService.getByLopId(lopId);
      console.log('✅ Danh sách buổi học:', response);

      if (Array.isArray(response)) {
        setBuoiHocs(response);
        console.log('✅ Đã tải được', response.length, 'buổi học');
      } else {
        console.warn('⚠️ API trả về không phải array:', typeof response);
        setBuoiHocs([]);
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy danh sách buổi học:', error);
      setBuoiHocs([]);
    }
  };

  const loadLocations = async () => {
    try {
      console.log('🔄 Đang lấy danh sách địa điểm...');
      const response = await diaDiemService.getAll();
      console.log('✅ Danh sách địa điểm:', response);

      if (Array.isArray(response)) {
        setLocations(response);
        console.log('✅ Đã tải được', response.length, 'địa điểm');
      } else {
        console.warn('⚠️ API địa điểm trả về không phải array:', typeof response);
        setLocations([]);
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy danh sách địa điểm:', error);
      setLocations([]);
    }
  };

  const handleEditBuoiHoc = (buoiHoc: BuoiHoc) => {
    setSelectedBuoiHoc(buoiHoc);
    setEditForm({
      ngayHoc: buoiHoc.ngayHoc.split('T')[0], // Chỉ lấy phần ngày
      thoiGianBatDau: buoiHoc.thoiGianBatDau ? buoiHoc.thoiGianBatDau.toString().substring(0, 5) : '08:00',
      thoiGianKetThuc: buoiHoc.thoiGianKetThuc ? buoiHoc.thoiGianKetThuc.toString().substring(0, 5) : '10:00',
      diaDiemID: buoiHoc.diaDiemID ?? null,
      lyDo: ''
    });
    setConflictCheck(null);
    setShowModal(true); // Mở modal khi chọn buổi học để chỉnh sửa
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBuoiHoc(null);
    setEditForm(null);
    setConflictCheck(null);
  };

  const handleFormChange = (field: string, value: string | number | null) => {
    if (editForm) {
      setEditForm(prev => ({
        ...prev!,
        [field]: value
      }));
      // Reset conflict check khi form thay đổi
      if (conflictCheck) {
        setConflictCheck(null);
      }
    }
  };

  const checkScheduleConflict = async () => {
    if (!editForm || !selectedBuoiHoc) return;

    try {
      // Tạo object buổi học mới để kiểm tra
      const newBuoiHoc: BuoiHoc = {
        ...selectedBuoiHoc,
        ngayHoc: new Date(editForm.ngayHoc).toISOString(),
        thoiGianBatDau: editForm.thoiGianBatDau ? new Date(`1970-01-01T${editForm.thoiGianBatDau}:00`) as any : null,
        thoiGianKetThuc: editForm.thoiGianKetThuc ? new Date(`1970-01-01T${editForm.thoiGianKetThuc}:00`) as any : null,
        diaDiemID: editForm.diaDiemID
      };

      // Sử dụng kiểm tra cơ bản (chỉ kiểm tra ngày trùng trong lớp)
      const conflictResult = await checkBasicConflict(newBuoiHoc);

      if (conflictResult.hasConflict) {
        setConflictCheck({
          hasConflict: true,
          message: conflictResult.message,
          type: 'warning'
        });
      } else {
        setConflictCheck({
          hasConflict: false,
          message: conflictResult.message,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi kiểm tra xung đột:', error);
      setConflictCheck({
        hasConflict: true,
        message: 'Không thể kiểm tra xung đột lịch trình',
        type: 'error'
      });
    }
  };

  const checkBasicConflict = async (newBuoiHoc: BuoiHoc): Promise<{hasConflict: boolean, message: string}> => {
    // Kiểm tra các buổi học khác trong lớp
    for (const buoiHoc of buoiHocs) {
      if (buoiHoc.buoiHocID === newBuoiHoc.buoiHocID) continue;

      // Kiểm tra ngày trùng
      if (buoiHoc.ngayHoc.split('T')[0] === newBuoiHoc.ngayHoc.split('T')[0]) {
        return {
          hasConflict: true,
          message: `Đã có buổi học khác vào ngày ${new Date(newBuoiHoc.ngayHoc).toLocaleDateString('vi-VN')}`
        };
      }
    }

    return { hasConflict: false, message: '' };
  };



  const handleSaveChanges = async () => {
    if (!editForm || !selectedBuoiHoc) return;

    // Validate lý do bắt buộc
    if (!editForm.lyDo.trim()) {
      alert('Vui lòng nhập lý do thay đổi lịch học');
      return;
    }

    // Kiểm tra xung đột trước khi lưu
    if (conflictCheck?.hasConflict) {
      const confirmSave = window.confirm('Có xung đột lịch trình. Bạn có chắc chắn muốn lưu thay đổi?');
      if (!confirmSave) return;
    }

    setSaving(true);
    try {
      // Tạo object buổi học mới với thông tin LopHoc đầy đủ
      const updatedBuoiHoc = {
        buoiHocID: selectedBuoiHoc.buoiHocID,
        lopID: selectedBuoiHoc.lopID,
        ngayHoc: new Date(editForm.ngayHoc).toISOString(),
        thoiGianBatDau: editForm.thoiGianBatDau || null,
        thoiGianKetThuc: editForm.thoiGianKetThuc || null,
        giangVienThayTheID: selectedBuoiHoc.giangVienThayTheID,
        diaDiemID: editForm.diaDiemID,
        trangThai: selectedBuoiHoc.trangThai,
        // Thêm thông tin LopHoc đầy đủ để tránh lỗi validation
        LopHoc: {
          lopID: selectedBuoiHoc.lopID,
          trangThai: 'DangHoc',
          ngayHocTrongTuan: classInfo.ngayHocTrongTuan || 'Thứ 2',
          khoaHocID: classInfo.khoaHocID,
          giangVienID: classInfo.giangVienID,
          // Thêm thông tin KhoaHoc cần thiết
          KhoaHoc: {
            khoaHocID: classInfo.khoaHocID,
            tenKhoaHoc: 'Khóa học', // Thông tin mặc định
            hocPhi: 0,
            soBuoi: 0
          },
          // Thêm thông tin GiangVien cần thiết
          GiangVien: {
            giangVienID: classInfo.giangVienID,
            hoTen: 'Giảng viên',
            chuyenMon: 'Chuyên môn'
          }
        }
      };

      console.log('🔄 Đang cập nhật buổi học:', updatedBuoiHoc);

      // Sử dụng service thay vì gọi trực tiếp để đảm bảo định dạng đúng
      await buoiHocService.update(selectedBuoiHoc.buoiHocID, updatedBuoiHoc);
      console.log('✅ Cập nhật buổi học thành công');

      // Refresh danh sách buổi học
      await loadBuoiHocs();

      // Reset form và đóng modal
      handleCloseModal();

      alert('Đã lưu thay đổi lịch học thành công!');

      // Gửi thông báo cho học viên (nếu cần)
      await sendNotificationToStudents();

    } catch (error: any) {
      console.error('❌ Lỗi khi lưu thay đổi buổi học:', error);

      // Hiển thị thông báo lỗi chi tiết hơn
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat();
        alert(`Có lỗi xảy ra khi lưu thay đổi:\n${errorMessages.join('\n')}`);
      } else {
        alert(`Có lỗi xảy ra khi lưu thay đổi: ${error.message || 'Lỗi không xác định'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const sendNotificationToStudents = async () => {
    try {
      console.log('📢 Bắt đầu gửi thông báo cho học viên về việc đổi lịch...');

      // 1. Lấy danh sách đăng ký lớp (đơn giản hơn, tránh lỗi 500)
      const dangKyLops = await dangKyLopService.getByLopId(classInfo.lopID);

      if (dangKyLops.length === 0) {
        console.log('⚠️ Không có học viên nào trong lớp để gửi thông báo');
        return;
      }

      // 2. Lấy thông tin học viên từ danh sách đăng ký
      const students = await Promise.all(
        dangKyLops.map(async (dangKy) => {
          try {
            const hocVien = await hocVienService.getById(dangKy.hocVienID);
            return {
              hocVienID: hocVien.hocVienID,
              hoTen: hocVien.hoTen,
              email: hocVien.email,
              soDienThoai: hocVien.sdt
            };
          } catch (error) {
            console.warn(`⚠️ Không thể lấy thông tin học viên ${dangKy.hocVienID}:`, error);
            return {
              hocVienID: dangKy.hocVienID,
              hoTen: `Học viên ${dangKy.hocVienID}`,
              email: null,
              soDienThoai: null
            };
          }
        })
      );

      // 2. Tạo nội dung thông báo chi tiết
      const oldBuoiHoc = selectedBuoiHoc;
      const newDate = new Date(editForm!.ngayHoc).toLocaleDateString('vi-VN');
      const newStartTime = editForm!.thoiGianBatDau;
      const newEndTime = editForm!.thoiGianKetThuc;
      const newLocation = locations.find(loc => loc.diaDiemID === editForm!.diaDiemID);

      const notificationContent = `📅 THÔNG BÁO ĐỔI LỊCH HỌC

🏫 Lớp học: ${`Lớp ID: ${classInfo.lopID}`}
📚 Khóa học: ${classInfo.khoaHocID}

📋 THAY ĐỔI LỊCH HỌC:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Buổi học cũ: ${new Date(oldBuoiHoc!.ngayHoc).toLocaleDateString('vi-VN')}
🕐 Thời gian cũ: ${oldBuoiHoc!.thoiGianBatDau || 'Chưa xác định'} - ${oldBuoiHoc!.thoiGianKetThuc || 'Chưa xác định'}
📍 Địa điểm cũ: ${getLocationName(oldBuoiHoc!.diaDiemID)}

📅 Buổi học mới: ${newDate}
🕐 Thời gian mới: ${newStartTime} - ${newEndTime}
📍 Địa điểm mới: ${newLocation ? `${newLocation.tenCoSo} - ${newLocation.diaChi}` : 'Chưa xác định'}

📝 Lý do thay đổi: ${editForm!.lyDo}

⚠️ Lưu ý quan trọng:
• Vui lòng cập nhật lịch học cá nhân
• Đến đúng giờ và địa điểm mới
• Liên hệ giáo viên nếu có thắc mắc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Thông báo lúc: ${new Date().toLocaleString('vi-VN')}
👨‍🏫 Người thực hiện: Giáo viên lớp học

Cảm ơn sự hợp tác của quý học viên!`;

      // 3. Gửi thông báo cho từng học viên
      let successCount = 0;
      let failCount = 0;

      for (const student of students) {
        try {
          await thongBaoService.sendPersonalNotification(student.hocVienID, notificationContent);
          successCount++;
          console.log(`✅ Đã gửi thông báo cho học viên: ${student.hoTen} (ID: ${student.hocVienID})`);
        } catch (error) {
          failCount++;
          console.error(`❌ Lỗi gửi thông báo cho học viên ${student.hoTen}:`, error);
        }
      }

      // // 4. Gửi thông báo tổng hợp cho cả lớp (backup)
      // try {
      //   await thongBaoService.sendClassNotification(classInfo.lopID, notificationContent);
      //   console.log('✅ Đã gửi thông báo tổng hợp cho cả lớp');
      // } catch (error) {
      //   console.error('❌ Lỗi gửi thông báo tổng hợp:', error);
      // }

      // 5. Thông báo kết quả
      if (successCount > 0) {
        alert(`✅ Đã gửi thông báo đổi lịch học thành công!\n• Gửi thành công: ${successCount} học viên\n• Gửi thất bại: ${failCount} học viên`);
      } else {
        alert('⚠️ Có lỗi xảy ra khi gửi thông báo. Vui lòng thử lại hoặc liên hệ admin.');
      }

      console.log(`📊 Kết quả gửi thông báo: ${successCount} thành công, ${failCount} thất bại`);

    } catch (error) {
      console.error('❌ Lỗi khi gửi thông báo:', error);
      alert('❌ Có lỗi xảy ra khi gửi thông báo cho học viên!');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTimeOnly = (timeString: string) => {
    return timeString ? timeString.substring(0, 5) : '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ChuaDienRa': return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'DangDienRa': return { backgroundColor: '#fef3c7', color: '#d97706' };
      case 'DaDienRa': return { backgroundColor: '#dcfce7', color: '#166534' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const getLocationName = (diaDiemID: number | null | undefined) => {
    if (!diaDiemID) return 'Chưa xác định';
    const location = locations.find(loc => loc.diaDiemID === diaDiemID);
    return location ? `${location.tenCoSo} - ${location.diaChi}` : `ID: ${diaDiemID}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '16px' }}></i>
        <h3 style={{ margin: '0 0 8px 0' }}>Đang tải dữ liệu đổi lịch học...</h3>
        <p style={{ margin: 0 }}>Vui lòng đợi trong giây lát.</p>
      </div>
    );
  }

  if (error) {
    return (
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
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#dc2626' }}>
          <i className="fas fa-calendar-alt"></i> Đổi lịch buổi học
        </h3>
        <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          Chọn buổi học cần đổi lịch và thực hiện các thay đổi cần thiết
        </p>
      </div>

      {/* Modal đổi lịch học */}
      {showModal && selectedBuoiHoc && editForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Header Modal */}
            <div style={{
              background: '#dc2626',
              color: 'white',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <i className="fas fa-edit"></i> Đổi lịch buổi học
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Nội dung Modal */}
            <div style={{ padding: '24px', maxHeight: 'calc(90vh - 80px)', overflow: 'auto' }}>
              {/* Thông tin buổi học hiện tại */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px' }}>
                  <i className="fas fa-info-circle"></i> Thông tin buổi học hiện tại:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div><strong>Ngày học:</strong> {formatDateOnly(selectedBuoiHoc.ngayHoc)}</div>
                  <div><strong>Thời gian:</strong> {formatTimeOnly(selectedBuoiHoc.thoiGianBatDau || '')} - {formatTimeOnly(selectedBuoiHoc.thoiGianKetThuc || '')}</div>
                  <div><strong>Địa điểm:</strong> {getLocationName(selectedBuoiHoc.diaDiemID)}</div>
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

              {/* Form chỉnh sửa */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px' }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#374151', fontSize: '16px' }}>
                  <i className="fas fa-calendar-plus"></i> Thông tin lịch học mới:
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {/* Ngày học */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Ngày học mới: <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={editForm.ngayHoc}
                      onChange={(e) => handleFormChange('ngayHoc', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    />
                  </div>

                  {/* Thời gian bắt đầu */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Thời gian bắt đầu: <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={editForm.thoiGianBatDau}
                      onChange={(e) => handleFormChange('thoiGianBatDau', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    />
                  </div>

                  {/* Thời gian kết thúc */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Thời gian kết thúc: <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={editForm.thoiGianKetThuc}
                      onChange={(e) => handleFormChange('thoiGianKetThuc', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    />
                  </div>

                  {/* Địa điểm */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Địa điểm mới: <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      value={editForm.diaDiemID || ''}
                      onChange={(e) => handleFormChange('diaDiemID', e.target.value ? parseInt(e.target.value) : null)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="">-- Chọn địa điểm --</option>
                      {locations.map((location) => (
                        <option key={location.diaDiemID} value={location.diaDiemID}>
                          {location.tenCoSo} - {location.diaChi}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lý do thay đổi */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Lý do thay đổi: <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    value={editForm.lyDo}
                    onChange={(e) => handleFormChange('lyDo', e.target.value)}
                    placeholder="Nhập lý do thay đổi lịch học..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Thông báo kiểm tra xung đột chi tiết */}
                {conflictCheck && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    backgroundColor: conflictCheck.type === 'success' ? '#dcfce7' : conflictCheck.type === 'warning' ? '#fef3c7' : '#fee2e2',
                    border: `1px solid ${conflictCheck.type === 'success' ? '#bbf7d0' : conflictCheck.type === 'warning' ? '#fde68a' : '#fecaca'}`,
                    color: conflictCheck.type === 'success' ? '#166534' : conflictCheck.type === 'warning' ? '#92400e' : '#dc2626'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <i className={`fas ${conflictCheck.type === 'success' ? 'fa-check-circle' : conflictCheck.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}`}
                         style={{ marginTop: '2px' }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                          {conflictCheck.message}
                        </div>

                        {/* Hiển thị chi tiết các loại xung đột nếu có */}
                        {conflictCheck.type === 'warning' && (
                          <div style={{ fontSize: '14px' }}>
                            <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                              <i className="fas fa-list-ul"></i> Chi tiết xung đột:
                            </div>
                            <div style={{ display: 'grid', gap: '6px' }}>
                              {/* Thông báo sẽ được cập nhật khi có dữ liệu xung đột chi tiết */}
                              <div style={{
                                padding: '8px 12px',
                                background: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '6px',
                                borderLeft: '3px solid #f59e0b',
                                fontSize: '13px'
                              }}>
                                <i className="fas fa-clock"></i> Kiểm tra thời gian, địa điểm và giảng viên trùng lịch
                              </div>
                            </div>
                          </div>
                        )}

                        {conflictCheck.type === 'success' && (
                          <div style={{ fontSize: '14px', color: '#059669' }}>
                            <i className="fas fa-shield-alt"></i> Lịch học mới không xung đột với lịch trình hiện tại
                          </div>
                        )}

                        {conflictCheck.type === 'error' && (
                          <div style={{ fontSize: '14px', color: '#dc2626' }}>
                            <i className="fas fa-exclamation-circle"></i> Không thể kiểm tra xung đột do lỗi hệ thống
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nút thao tác */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={checkScheduleConflict}
                    style={{
                      padding: '12px 24px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-search"></i> Kiểm tra xung đột
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleCloseModal}
                      style={{
                        padding: '12px 24px',
                        background: '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-times"></i> Hủy
                    </button>

                    <button
                      onClick={handleSaveChanges}
                      disabled={saving || !editForm.lyDo.trim()}
                      style={{
                        padding: '12px 24px',
                        background: (saving || !editForm.lyDo.trim()) ? '#9ca3af' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (saving || !editForm.lyDo.trim()) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách buổi học */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
          <i className="fas fa-list"></i> Danh sách buổi học ({buoiHocs.length} buổi):
        </h4>

        {buoiHocs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <i className="fas fa-calendar" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <h3 style={{ margin: '0 0 8px 0' }}>Chưa có buổi học nào</h3>
            <p style={{ margin: 0 }}>Buổi học sẽ xuất hiện ở đây khi được tạo trong hệ thống.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {buoiHocs.map((buoiHoc) => (
              <div key={buoiHoc.buoiHocID} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#dc2626',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {new Date(buoiHoc.ngayHoc).getDate()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      📅 {formatDateOnly(buoiHoc.ngayHoc)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      🕐 {formatTimeOnly(buoiHoc.thoiGianBatDau || '')} - {formatTimeOnly(buoiHoc.thoiGianKetThuc || '')}
                      {' • '}
                      📍 {getLocationName(buoiHoc.diaDiemID)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {buoiHoc.trangThai}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Trạng thái
                    </div>
                  </div>

                  {buoiHoc.trangThai === 'ChuaDienRa' && (
                    <button
                      onClick={() => handleEditBuoiHoc(buoiHoc)}
                      style={{
                        padding: '8px 16px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fas fa-edit"></i> Đổi lịch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};

const LecturerClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<LopHoc | null>(null);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [buoiHocs, setBuoiHocs] = useState<BuoiHoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'grades' | 'schedule-change'>('students');

  // Separate state for attendance tab
  const [buoiHocLoading, setBuoiHocLoading] = useState(false);
  const [buoiHocError, setBuoiHocError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // State for attendance data synchronization
  const [selectedBuoiHoc, setSelectedBuoiHoc] = useState<BuoiHoc | null>(null);
  const [attendanceData, setAttendanceData] = useState<{[hocVienId: number]: { coMat: boolean; ghiChu: string }}>({});

  // State for grades tab
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState<string | null>(null);

  // State for schedule-change tab
  const [scheduleRequests, setScheduleRequests] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // State for students tab refresh
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

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

  // Load dữ liệu cho grades tab - hiển thị trạng thái phát triển sau
  useEffect(() => {
    if (activeTab === 'grades' && classInfo) {
      setGradesLoading(true);
      setGradesError(null);
      // Giả lập thời gian tải
      setTimeout(() => {
        setGradesLoading(false);
      }, 500);
    }
  }, [activeTab, classInfo]);

  // Load dữ liệu cho students tab - reload khi chuyển vào tab
  useEffect(() => {
    if (activeTab === 'students' && classInfo) {
      loadStudentsData();
    }
  }, [activeTab, classInfo]);

  // Load dữ liệu cho grades tab - hiển thị trạng thái phát triển sau
  useEffect(() => {
    if (activeTab === 'grades' && classInfo) {
      setGradesLoading(true);
      setGradesError(null);
      // Giả lập thời gian tải
      setTimeout(() => {
        setGradesLoading(false);
      }, 500);
    }
  }, [activeTab, classInfo]);

  // Load dữ liệu cho schedule-change tab - hiển thị trạng thái phát triển sau
  useEffect(() => {
    if (activeTab === 'schedule-change' && classInfo) {
      setScheduleLoading(true);
      setScheduleError(null);
      // Giả lập thời gian tải
      setTimeout(() => {
        setScheduleLoading(false);
      }, 500);
    }
  }, [activeTab, classInfo]);

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

  const loadStudentsData = async () => {
    if (!classInfo) return;

    setStudentsLoading(true);
    setStudentsError(null);

    try {
      const classId = classInfo.lopID;
      console.log('🔄 [TAB] Đang reload dữ liệu học viên cho lớp:', classId);

      // Sử dụng API endpoint tổng hợp mới để lấy toàn bộ dữ liệu học viên với thống kê
      try {
        console.log('🚀 Đang sử dụng API endpoint tổng hợp để lấy dữ liệu học viên...');
        const studentsData = await lopHocService.getStudentsWithStats(classId);
        console.log('✅ Dữ liệu học viên từ API tổng hợp:', studentsData);

        // Map dữ liệu từ API tổng hợp sang định dạng StudentWithStats
        const studentsWithStats: StudentWithStats[] = studentsData.students.map(student => ({
          dangKyID: student.dangKyID,
          hocVienID: student.hocVienID,
          lopID: student.lopID,
          ngayDangKy: student.ngayDangKy,
          trangThaiDangKy: student.trangThaiDangKy,
          trangThaiThanhToan: student.trangThaiThanhToan,
          hoTen: student.hoTen,
          email: student.email,
          soDienThoai: student.soDienThoai,
          soBuoiDaHoc: student.soBuoiDaHoc,
          tongSoBuoi: student.tongSoBuoi,
          tiLeDiemDanh: student.tiLeDiemDanh,
          diemTrungBinh: student.diemTrungBinh
        }));

        console.log('✅ Đã xử lý xong dữ liệu học viên:', studentsWithStats.length, 'học viên');
        setStudents(studentsWithStats);

      } catch (error: any) {
        console.error('❌ Lỗi khi sử dụng API tổng hợp:', error);

        // Fallback: sử dụng cách cũ nếu API mới không hoạt động
        console.log('🔄 Thử sử dụng cách cũ để lấy dữ liệu học viên...');

        let dangKyLops: DangKyLop[] = [];
        try {
          dangKyLops = await dangKyLopService.getByLopId(classId);
          console.log('✅ Danh sách đăng ký (fallback):', dangKyLops);
        } catch (dangKyError: any) {
          console.warn('⚠️ Không thể lấy danh sách đăng ký (fallback):', dangKyError);
          dangKyLops = [];
        }

        // Xử lý dữ liệu học viên với thống kê (cách cũ)
        const studentsWithStats: StudentWithStats[] = [];

        for (const dangKy of dangKyLops) {
          try {
            console.log('🔄 Đang xử lý học viên (fallback):', dangKy.hocVienID);

            // Lấy thông tin học viên
            let studentInfo: any = null;
            try {
              studentInfo = await hocVienService.getById(dangKy.hocVienID);
              console.log('✅ Thông tin học viên (fallback):', studentInfo);
            } catch (error: any) {
              console.warn(`⚠️ Không tìm thấy học viên ${dangKy.hocVienID}, sử dụng dữ liệu mẫu:`, error.message);
              studentInfo = {
                hoTen: `Học viên ${dangKy.hocVienID}`,
                email: `hocvien${dangKy.hocVienID}@example.com`,
                sdt: `090${dangKy.hocVienID.toString().padStart(7, '1')}`,
                ngaySinh: null,
                taiKhoanVi: 0
              };
            }

            // Lấy điểm số và tỷ lệ điểm danh (đơn giản hóa)
            let diemTrungBinh = 0;
            let tiLeDiemDanh = 0;

            try {
              // Lấy điểm trung bình đã tính theo công thức từ API mới
              const diemTrungBinhResponse = await fetch(`http://localhost:5080/api/DiemSo/diem-trung-binh/hoc-vien/${dangKy.hocVienID}/lop/${classId}`);
              diemTrungBinh = await diemTrungBinhResponse.json() || 0;
              
            } catch (error) {
              console.warn('Không thể lấy điểm số (fallback):', error);
            }

            try {
              const diemDanhResponse = await fetch(`http://localhost:5080/api/DiemDanh/attendance-rate/hoc-vien/${dangKy.hocVienID}/lop/${classId}`);
              if (diemDanhResponse.ok) {
                tiLeDiemDanh = await diemDanhResponse.json() || 0;
              }
            } catch (error) {
              console.warn('Không thể lấy tỷ lệ điểm danh (fallback):', error);
            }

            studentsWithStats.push({
              ...dangKy,
              hoTen: studentInfo.hoTen || 'Chưa cập nhật',
              email: studentInfo.email,
              soDienThoai: studentInfo.sdt,
              soBuoiDaHoc: diemTrungBinh >= 5 ? classInfo.lopID : 0,
              tongSoBuoi: classInfo.lopID,
              tiLeDiemDanh: tiLeDiemDanh,
              diemTrungBinh: diemTrungBinh
            });

            console.log('✅ Đã thêm học viên vào danh sách (fallback):', studentInfo.hoTen);
          } catch (error) {
            console.error('❌ Lỗi khi lấy thông tin học viên (fallback):', dangKy.hocVienID, error);
          }
        }

        console.log('✅ Tổng số học viên (fallback):', studentsWithStats.length);
        setStudents(studentsWithStats);
      }

    } catch (error: any) {
      console.error('❌ Lỗi khi reload dữ liệu học viên:', error);
      setStudentsError(`Không thể tải dữ liệu học viên: ${error.message}`);
    } finally {
      setStudentsLoading(false);
    }
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

      // Sử dụng API endpoint tổng hợp mới để lấy toàn bộ dữ liệu học viên với thống kê
      try {
        console.log('🚀 Đang sử dụng API endpoint tổng hợp để lấy dữ liệu học viên...');
        const studentsData = await lopHocService.getStudentsWithStats(classId);
        console.log('✅ Dữ liệu học viên từ API tổng hợp:', studentsData);

        // Map dữ liệu từ API tổng hợp sang định dạng StudentWithStats
        const studentsWithStats: StudentWithStats[] = studentsData.students.map(student => ({
          dangKyID: student.dangKyID,
          hocVienID: student.hocVienID,
          lopID: student.lopID,
          ngayDangKy: student.ngayDangKy,
          trangThaiDangKy: student.trangThaiDangKy,
          trangThaiThanhToan: student.trangThaiThanhToan,
          hoTen: student.hoTen,
          email: student.email,
          soDienThoai: student.soDienThoai,
          soBuoiDaHoc: student.soBuoiDaHoc,
          tongSoBuoi: student.tongSoBuoi,
          tiLeDiemDanh: student.tiLeDiemDanh,
          diemTrungBinh: student.diemTrungBinh
        }));

        console.log('✅ Đã xử lý xong dữ liệu học viên:', studentsWithStats.length, 'học viên');
        setStudents(studentsWithStats);

      } catch (error: any) {
        console.error('❌ Lỗi khi sử dụng API tổng hợp:', error);

        // Fallback: sử dụng cách cũ nếu API mới không hoạt động
        console.log('🔄 Thử sử dụng cách cũ để lấy dữ liệu học viên...');

        let dangKyLops: DangKyLop[] = [];
        try {
          dangKyLops = await dangKyLopService.getByLopId(classId);
          console.log('✅ Danh sách đăng ký (fallback):', dangKyLops);
        } catch (dangKyError: any) {
          console.warn('⚠️ Không thể lấy danh sách đăng ký (fallback):', dangKyError);
          dangKyLops = [];
        }

        // Xử lý dữ liệu học viên với thống kê (cách cũ)
        const studentsWithStats: StudentWithStats[] = [];

        for (const dangKy of dangKyLops) {
          try {
            console.log('🔄 Đang xử lý học viên (fallback):', dangKy.hocVienID);

            // Lấy thông tin học viên
            let studentInfo: any = null;
            try {
              studentInfo = await hocVienService.getById(dangKy.hocVienID);
              console.log('✅ Thông tin học viên (fallback):', studentInfo);
            } catch (error: any) {
              console.warn(`⚠️ Không tìm thấy học viên ${dangKy.hocVienID}, sử dụng dữ liệu mẫu:`, error.message);
              studentInfo = {
                hoTen: `Học viên ${dangKy.hocVienID}`,
                email: `hocvien${dangKy.hocVienID}@example.com`,
                sdt: `090${dangKy.hocVienID.toString().padStart(7, '1')}`,
                ngaySinh: null,
                taiKhoanVi: 0
              };
            }

            // Lấy điểm số và tỷ lệ điểm danh (đơn giản hóa)
            let diemTrungBinh = 0;
            let tiLeDiemDanh = 0;

            try {
              // Chỉ sử dụng API diem-trung-binh để lấy điểm tổng hợp theo công thức
              const diemTrungBinhResponse = await fetch(`http://localhost:5080/api/DiemSo/diem-trung-binh/hoc-vien/${dangKy.hocVienID}/lop/${classId}`);
              diemTrungBinh = await diemTrungBinhResponse.json() || 0;
            } catch (error) {
              console.warn('Không thể lấy điểm số (fallback):', error);
            }

            try {
              const diemDanhResponse = await fetch(`http://localhost:5080/api/DiemDanh/attendance-rate/hoc-vien/${dangKy.hocVienID}/lop/${classId}`);
              if (diemDanhResponse.ok) {
                tiLeDiemDanh = await diemDanhResponse.json() || 0;
              }
            } catch (error) {
              console.warn('Không thể lấy tỷ lệ điểm danh (fallback):', error);
            }

            studentsWithStats.push({
              ...dangKy,
              hoTen: studentInfo.hoTen || 'Chưa cập nhật',
              email: studentInfo.email,
              soDienThoai: studentInfo.sdt,
              soBuoiDaHoc: diemTrungBinh >= 5 ? tongSoBuoi : 0,
              tongSoBuoi: tongSoBuoi,
              tiLeDiemDanh: tiLeDiemDanh,
              diemTrungBinh: diemTrungBinh
            });

            console.log('✅ Đã thêm học viên vào danh sách (fallback):', studentInfo.hoTen);
          } catch (error) {
            console.error('❌ Lỗi khi lấy thông tin học viên (fallback):', dangKy.hocVienID, error);
          }
        }

        console.log('✅ Tổng số học viên (fallback):', studentsWithStats.length);
        setStudents(studentsWithStats);
      }

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
          <button
            onClick={() => setActiveTab('schedule-change')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'schedule-change' ? '#dc2626' : 'transparent',
              color: activeTab === 'schedule-change' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'schedule-change' ? '3px solid #b91c1c' : 'none'
            }}
          >
            <i className="fas fa-calendar-alt"></i> Đổi lịch học
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'students' && (
            <div>
              {/* Thống kê tổng quan */}
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {/* Tổng số học viên */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-users"></i> Tổng số học viên
                    </div>
                  </div>

                  {/* Số người đạt */}
                  {(() => {
                    const soNguoiDat = students.filter(student => student.diemTrungBinh > 5.5).length;
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                          {soNguoiDat}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className="fas fa-trophy"></i> Số người đạt
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tỷ lệ đạt */}
                  {(() => {
                    const soNguoiDat = students.filter(student => student.diemTrungBinh > 5.5).length;
                    const tyLeDat = students.length > 0 ? Math.round((soNguoiDat / students.length) * 100) : 0;
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                          {tyLeDat}%
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className="fas fa-percentage"></i> Tỷ lệ đạt
                        </div>
                      </div>
                    );
                  })()}

                  {/* Điểm trung bình toàn lớp */}
                  {(() => {
                    const diemTrungBinh = students.length > 0
                      ? (students.reduce((sum, student) => sum + (student.diemTrungBinh || 0), 0) / students.length).toFixed(1)
                      : '0.0';
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                          {diemTrungBinh}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className="fas fa-chart-line"></i> Điểm TB toàn lớp
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Thông tin chi tiết */}
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
                              {student.diemTrungBinh > 0 ? student.diemTrungBinh.toFixed(1) : 'Chưa có'}/10
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Điểm số</div>
                          </div>
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: student.tiLeDiemDanh >= 80 ? '#059669' : student.tiLeDiemDanh >= 60 ? '#d97706' : '#dc2626'
                            }}>
                              {student.tiLeDiemDanh.toFixed(0)}%
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
              {/* Header */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#dc2626' }}>
                  <i className="fas fa-calendar-check"></i> Điểm danh
                </h3>
              </div>

              {/* Thống kê tổng quan điểm danh */}
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {/* Tổng số buổi học */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {buoiHocs.length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-calendar-alt"></i> Tổng số buổi học
                    </div>
                  </div>

                  {/* Buổi học đã diễn ra */}
                  {(() => {
                    const buoiDaDienRa = buoiHocs.filter(buoi => buoi.trangThai === 'DaDienRa').length;
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                          {buoiDaDienRa}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className="fas fa-check-circle"></i> Đã diễn ra
                        </div>
                      </div>
                    );
                  })()}

                  {/* Buổi học đang diễn ra */}
                  {(() => {
                    const buoiDangDienRa = buoiHocs.filter(buoi => buoi.trangThai === 'DangDienRa').length;
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                          {buoiDangDienRa}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className="fas fa-play-circle"></i> Đang diễn ra
                        </div>
                      </div>
                    );
                  })()}

                  {/* Buổi học chưa diễn ra */}
                  {(() => {
                    const buoiChuaDienRa = buoiHocs.filter(buoi => buoi.trangThai === 'ChuaDienRa').length;
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                          {buoiChuaDienRa}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className="fas fa-clock"></i> Chưa diễn ra
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tỷ lệ chuyên cần trung bình */}
                  {(() => {
                    const avgAttendanceRate = students.length > 0
                      ? Math.round(students.reduce((sum, student) => sum + (student.tiLeDiemDanh || 0), 0) / students.length)
                      : 0;
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                          {avgAttendanceRate}%
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className="fas fa-percentage"></i> Tỷ lệ chuyên cần TB
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Thống kê chi tiết khi chọn buổi học cụ thể */}
                {(() => {
                  const attendanceStats = Object.values(attendanceData);
                  const presentCount = attendanceStats.filter(att => att.coMat).length;
                  const absentCount = attendanceStats.filter(att => !att.coMat).length;
                  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

                  if (selectedBuoiHoc) {
                    return (
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>
                          <i className="fas fa-chart-line"></i> Thống kê buổi học: {new Date(selectedBuoiHoc.ngayHoc).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '600', color: '#34d399' }}>
                              {presentCount}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>Có mặt</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '600', color: '#f87171' }}>
                              {absentCount}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>Vắng mặt</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '600', color: '#fbbf24' }}>
                              {attendanceRate}%
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>Tỷ lệ có mặt</div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}
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
                  selectedBuoiHoc={selectedBuoiHoc}
                  attendanceData={attendanceData}
                />
              )}
            </div>
          )}

          {activeTab === 'grades' && (
            <GradesTab
              lopId={classInfo.lopID}
              students={students}
              classStatus={classInfo.trangThai || 'ChuaBatDau'}
              onRefresh={() => {
                setGradesLoading(true);
                setGradesError(null);
                setTimeout(() => {
                  setGradesLoading(false);
                }, 500);
              }}
              loading={gradesLoading}
              error={gradesError}
            />
          )}

          {activeTab === 'schedule-change' && (
            <ScheduleChangeTab
              lopId={classInfo.lopID}
              classInfo={classInfo}
              onRefresh={() => {
                setScheduleLoading(true);
                setScheduleError(null);
                setTimeout(() => {
                  setScheduleLoading(false);
                }, 500);
              }}
              loading={scheduleLoading}
              error={scheduleError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerClassDetail;
