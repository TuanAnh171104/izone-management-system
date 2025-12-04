import React, { useState, useEffect, useMemo } from 'react';
import { dangKyLopService, DangKyLop, hocVienService, HocVien, lopHocService, LopHoc, khoaHocService, KhoaHoc } from '../services/api';
import { mapLopHocStatus, mapTrangThaiDangKy, mapTrangThaiThanhToan } from '../utils/statusMapping';

// Modal thêm học viên vào lớp
interface AdminAddStudentModalProps {
  lopHoc: LopHoc;
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
}

const AdminAddStudentModal: React.FC<AdminAddStudentModalProps> = ({
  lopHoc,
  isOpen,
  onClose,
  onStudentAdded
}) => {
  const [allStudents, setAllStudents] = useState<HocVien[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<HocVien[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<HocVien[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [courseInfo, setCourseInfo] = useState<KhoaHoc | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAllStudents();
      loadCourseInfo();
    }
  }, [isOpen]);

  const loadCourseInfo = async () => {
    try {
      const course = await khoaHocService.getById(lopHoc.khoaHocID);
      setCourseInfo(course);
    } catch (error) {
      console.error('Lỗi khi tải thông tin khóa học:', error);
    }
  };

  useEffect(() => {
    // Lọc học viên theo từ khóa tìm kiếm
    const filtered = allStudents.filter(student =>
      student.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.sdt && student.sdt.includes(searchTerm))
    );
    setFilteredStudents(filtered);
  }, [allStudents, searchTerm]);

  const loadAllStudents = async () => {
    setLoading(true);
    try {
      const students = await hocVienService.getAll();
      setAllStudents(students);
      setFilteredStudents(students);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách học viên:', error);
      alert('Không thể tải danh sách học viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (student: HocVien) => {
    setSelectedStudents(prev => {
      const isSelected = prev.some(s => s.hocVienID === student.hocVienID);
      if (isSelected) {
        return prev.filter(s => s.hocVienID !== student.hocVienID);
      } else {
        return [...prev, student];
      }
    });
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) return;

    setAddingStudents(true);
    let successCount = 0;
    let errorMessages: string[] = [];

    try {
      // Thêm từng học viên một cách tuần tự
      for (const student of selectedStudents) {
        try {
          await dangKyLopService.adminRegisterStudent({
            hocVienID: student.hocVienID,
            lopID: lopHoc.lopID
          });
          successCount++;
        } catch (error: any) {
          console.error(`Lỗi khi thêm học viên ${student.hoTen}:`, error);
          errorMessages.push(`${student.hoTen}: ${error.response?.data?.message || error.message}`);
        }
      }

      // Hiển thị kết quả
      if (successCount > 0) {
        alert(`Đã thêm thành công ${successCount}/${selectedStudents.length} học viên vào lớp!`);
        onStudentAdded(); // Refresh danh sách học viên
        onClose(); // Đóng modal
      } else {
        alert('Không thể thêm học viên nào vào lớp. Vui lòng thử lại.');
      }

      // Hiển thị lỗi nếu có
      if (errorMessages.length > 0) {
        console.error('Các lỗi khi thêm học viên:', errorMessages);
      }

    } catch (error: any) {
      console.error('Lỗi tổng quát khi thêm học viên:', error);
      alert(`Lỗi khi thêm học viên: ${error.message}`);
    } finally {
      setAddingStudents(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          background: '#dc2626',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            <i className="fas fa-user-plus"></i> Thêm học viên vào lớp
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          maxHeight: '70vh',
          overflow: 'auto'
        }}>
          {/* Thông tin lớp */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'black' }}>
              <i className="fas fa-school"></i> Lớp học: ID {lopHoc.lopID}
            </h4>
            <p style={{ margin: 0, color: 'black', fontSize: '14px' }}>
              Học phí: {courseInfo?.hocPhi?.toLocaleString('vi-VN') || 'Chưa xác định'} VND
            </p>
          </div>

          {/* Tìm kiếm */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              <i className="fas fa-search"></i> Tìm kiếm học viên:
            </label>
            <input
              type="text"
              placeholder="Nhập tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Danh sách học viên với checkbox */}
          <div style={{
            maxHeight: '300px',
            overflow: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '12px' }}></i>
                <p>Đang tải danh sách học viên...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <i className="fas fa-users" style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}></i>
                <p>Không tìm thấy học viên nào</p>
              </div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = selectedStudents.some(s => s.hocVienID === student.hocVienID);
                return (
                  <div
                    key={student.hocVienID}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#dbeafe' : 'white',
                      transition: 'background-color 0.2s ease'
                    }}
                    onClick={() => handleToggleStudent(student)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleStudent(student)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#dc2626'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Thông tin học viên */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          {student.hoTen}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {student.email && `Email: ${student.email}`}
                          {student.sdt && ` • SĐT: ${student.sdt}`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          Tài khoản ví: {student.taiKhoanVi.toLocaleString('vi-VN')} VND
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Học viên được chọn */}
          {selectedStudents.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              maxHeight: '150px',
              overflow: 'auto'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0c4a6e' }}>
                <i className="fas fa-check-circle"></i> Học viên được chọn ({selectedStudents.length}):
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedStudents.map(student => (
                  <div
                    key={student.hocVienID}
                    style={{
                      background: '#0ea5e9',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {student.hoTen}
                    <button
                      onClick={() => handleToggleStudent(student)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        width: '14px',
                        height: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                      }}
                      title="Bỏ chọn học viên"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút thêm học viên */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            borderRadius: '0 0 12px 12px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
              disabled={addingStudents}
            >
              <i className="fas fa-times"></i> Hủy
            </button>

            <button
              onClick={handleAddStudents}
              disabled={selectedStudents.length === 0 || addingStudents}
              style={{
                padding: '10px 20px',
                background: selectedStudents.length > 0 && !addingStudents ? '#dc2626' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedStudents.length > 0 && !addingStudents ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {addingStudents ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Đang thêm...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> Thêm {selectedStudents.length} học viên
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StudentWithStats {
  dangKyID: number;
  hocVienID: number;
  lopID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
  trangThaiThanhToan: string;
  hoTen: string;
  email?: string | null;
  soDienThoai?: string | null;
  tiLeDiemDanh: number;
  diemTrungBinh: number;
}

// Modal hủy đăng ký học viên
interface AdminCancelRegistrationModalProps {
  student: StudentWithStats;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (dangKyID: number, lyDoHuy: string) => void;
}

const AdminCancelRegistrationModal: React.FC<AdminCancelRegistrationModalProps> = ({
  student,
  isOpen,
  onClose,
  onConfirmCancel
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const cancellationReasons = [
    'Bỏ học',
    'Học viên xin nghỉ học',
    'Học viên không đủ điều kiện tham gia',
    'Học viên vi phạm quy định lớp học',
    'Học viên có vấn đề sức khỏe',
    'Học viên thay đổi kế hoạch học tập',
    'Lý do khác...'
  ];

  const handleConfirmCancel = async () => {
    const finalReason = selectedReason === 'Lý do khác...' ? customReason.trim() : selectedReason;

    if (!finalReason) {
      alert('Vui lòng chọn hoặc nhập lý do hủy đăng ký');
      return;
    }

    setIsCancelling(true);
    try {
      await onConfirmCancel(student.dangKyID, finalReason);
      onClose();
    } catch (error) {
      console.error('Lỗi khi hủy đăng ký:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReasonChange = (reason: string) => {
    setSelectedReason(reason);
    if (reason !== 'Lý do khác...') {
      setCustomReason('');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          background: '#dc2626',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            <i className="fas fa-user-times"></i> Hủy đăng ký học viên
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Thông tin học viên */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              <i className="fas fa-user"></i> Học viên: {student.hoTen}
            </h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              ID đăng ký: {student.dangKyID}
            </p>
          </div>

          {/* Lý do hủy */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              <i className="fas fa-question-circle"></i> Lý do hủy đăng ký:
            </label>
            <select
              value={selectedReason}
              onChange={(e) => handleReasonChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                marginBottom: '12px'
              }}
            >
              <option value="">-- Chọn lý do --</option>
              {cancellationReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>

            {selectedReason === 'Lý do khác...' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do hủy đăng ký..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            )}
          </div>

          {/* Cảnh báo */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#d97706',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              <i className="fas fa-exclamation-triangle"></i>
              Cảnh báo
            </div>
            <p style={{ margin: 0, color: '#d97706', fontSize: '14px' }}>
              Hành động này sẽ hủy đăng ký của học viên khỏi lớp học. Học viên sẽ không thể tham gia các buổi học tiếp theo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
            disabled={isCancelling}
          >
            <i className="fas fa-times"></i> Hủy
          </button>

          <button
            onClick={handleConfirmCancel}
            disabled={!selectedReason || (selectedReason === 'Lý do khác...' && !customReason.trim()) || isCancelling}
            style={{
              padding: '10px 20px',
              background: !selectedReason || (selectedReason === 'Lý do khác...' && !customReason.trim()) || isCancelling ? '#9ca3af' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: !selectedReason || (selectedReason === 'Lý do khác...' && !customReason.trim()) || isCancelling ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isCancelling ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-user-times"></i> Xác nhận hủy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AdminClassDetailsModalProps {
  lopHoc: LopHoc | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdminClassDetailsModal: React.FC<AdminClassDetailsModalProps> = ({
  lopHoc,
  isOpen,
  onClose
}) => {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showCancelRegistrationModal, setShowCancelRegistrationModal] = useState(false);
  const [selectedStudentForCancel, setSelectedStudentForCancel] = useState<StudentWithStats | null>(null);

  // Lọc danh sách học viên theo tiêu chí đạt
  const filteredStudents = useMemo(() => {
    if (achievementFilter === 'all') {
      return students;
    } else if (achievementFilter === 'pass') {
      return students.filter(student => student.diemTrungBinh >= 5.5);
    } else if (achievementFilter === 'fail') {
      return students.filter(student => student.diemTrungBinh < 5.5);
    }
    return students;
  }, [students, achievementFilter]);

  useEffect(() => {
    if (isOpen && lopHoc) {
      loadClassDetails();
    }
  }, [isOpen, lopHoc]);

  const loadClassDetails = async () => {
    if (!lopHoc) return;

    setLoading(true);
    setError(null);

    try {
      // Lấy danh sách đăng ký lớp
      const dangKyLops = await dangKyLopService.getByLopId(lopHoc!.lopID);

      // Lấy thông tin chi tiết cho từng học viên
      const studentsWithStats: StudentWithStats[] = [];

      for (const dangKy of dangKyLops) {
        try {
          // Lấy thông tin học viên
          const hocVien = await hocVienService.getById(dangKy.hocVienID);

          // Tính tỷ lệ điểm danh
          let tiLeDiemDanh = 0;
          try {
            const response = await fetch(`http://localhost:5080/api/DiemDanh/attendance-rate/hoc-vien/${dangKy.hocVienID}/lop/${lopHoc.lopID}`);
            if (response.ok) {
              tiLeDiemDanh = await response.json();
            }
          } catch (error) {
            console.warn('Không thể lấy tỷ lệ điểm danh:', error);
          }

          // Tính điểm trung bình
          let diemTrungBinh = 0;
          try {
            const response = await fetch(`http://localhost:5080/api/DiemSo/diem-trung-binh/hoc-vien/${dangKy.hocVienID}/lop/${lopHoc.lopID}`);
            if (response.ok) {
              diemTrungBinh = await response.json();
            }
          } catch (error) {
            console.warn('Không thể lấy điểm trung bình:', error);
          }

          studentsWithStats.push({
            dangKyID: dangKy.dangKyID,
            hocVienID: dangKy.hocVienID,
            lopID: dangKy.lopID,
            ngayDangKy: dangKy.ngayDangKy,
            trangThaiDangKy: dangKy.trangThaiDangKy,
            trangThaiThanhToan: dangKy.trangThaiThanhToan,
            hoTen: hocVien.hoTen || 'Chưa cập nhật',
            email: hocVien.email,
            soDienThoai: hocVien.sdt,
            tiLeDiemDanh: tiLeDiemDanh,
            diemTrungBinh: diemTrungBinh
          });
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin học viên ${dangKy.hocVienID}:`, error);
        }
      }

      setStudents(studentsWithStats);
    } catch (error: any) {
      console.error('Lỗi khi tải chi tiết lớp học:', error);
      setError('Không thể tải thông tin chi tiết lớp học');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'danghoc':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'hoanthanh':
      case 'daketthuc':
        return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
      case 'nghi':
      case 'dahuy':
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'dathanhtoan':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'chuathanhtoan':
        return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const handleCancelRegistration = async (dangKyID: number, lyDoHuy: string) => {
    try {
      // Tìm thông tin đăng ký hiện tại để lấy dữ liệu đầy đủ
      const currentStudent = students.find(s => s.dangKyID === dangKyID);
      if (!currentStudent) {
        throw new Error('Không tìm thấy thông tin đăng ký học viên');
      }

      // Tạo object cập nhật với dữ liệu đầy đủ
      const updateData: DangKyLop = {
        dangKyID: dangKyID,
        hocVienID: currentStudent.hocVienID,
        lopID: currentStudent.lopID,
        ngayDangKy: currentStudent.ngayDangKy,
        trangThaiDangKy: 'DaHuy',
        trangThaiThanhToan: currentStudent.trangThaiThanhToan, // Giữ nguyên trạng thái thanh toán
        ngayHuy: new Date().toISOString(),
        lyDoHuy: lyDoHuy
      };

      await dangKyLopService.update(dangKyID, updateData);

      // Refresh danh sách học viên
      await loadClassDetails();

      alert('Đã hủy đăng ký học viên thành công!');
    } catch (error: any) {
      console.error('Lỗi khi hủy đăng ký:', error);
      alert(`Lỗi khi hủy đăng ký: ${error.response?.data?.message || error.message}`);
      throw error; // Re-throw để modal xử lý
    }
  };

  const handleOpenCancelModal = (student: StudentWithStats) => {
    setSelectedStudentForCancel(student);
    setShowCancelRegistrationModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelRegistrationModal(false);
    setSelectedStudentForCancel(null);
  };

  if (!isOpen || !lopHoc) return null;

  return (
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
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          background: '#dc2626',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            <i className="fas fa-info-circle"></i> Chi tiết lớp học - ID: {lopHoc.lopID}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            title="Đóng modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxHeight: 'calc(90vh - 80px)', overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '16px' }}></i>
              <h3 style={{ margin: '0 0 8px 0' }}>Đang tải dữ liệu...</h3>
              <p style={{ margin: 0 }}>Vui lòng đợi trong giây lát.</p>
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              color: '#dc2626',
              textAlign: 'center'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
              <h3 style={{ margin: '0 0 8px 0' }}>Lỗi tải dữ liệu</h3>
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          ) : (
            <>
              {/* Thông tin lớp học */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '18px' }}>
                  <i className="fas fa-school"></i> Thông tin lớp học
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div><strong>Mã lớp:</strong> {lopHoc.lopID}</div>
                  <div><strong>Ngày bắt đầu:</strong> {formatDate(lopHoc.ngayBatDau)}</div>
                  {lopHoc.ngayKetThuc && (
                    <div><strong>Ngày kết thúc:</strong> {formatDate(lopHoc.ngayKetThuc)}</div>
                  )}
                  <div><strong>Ca học:</strong> {lopHoc.caHoc || 'Chưa xác định'}</div>
                  <div><strong>Ngày học trong tuần:</strong> {lopHoc.ngayHocTrongTuan || 'Chưa xác định'}</div>
                  <div><strong>Số lượng tối đa:</strong> {lopHoc.soLuongToiDa || 'Không giới hạn'}</div>
                  <div><strong>Trạng thái:</strong>
                    <span style={{
                      marginLeft: '8px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      ...getStatusColor(lopHoc.trangThai || 'unknown')
                    }}>
                      {mapLopHocStatus(lopHoc.trangThai)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thống kê tổng quan */}
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                  <i className="fas fa-chart-bar"></i> Thống kê lớp học
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-users"></i> Tổng học viên
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.filter(s => s.diemTrungBinh >= 5.5).length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-trophy"></i> Đạt yêu cầu
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.tiLeDiemDanh, 0) / students.length) : 0}%
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-calendar-check"></i> Tỷ lệ chuyên cần TB
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {students.length > 0 ? (students.reduce((sum, s) => sum + s.diemTrungBinh, 0) / students.length).toFixed(1) : '0.0'}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-graduation-cap"></i> Điểm TB toàn lớp
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách học viên */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: '#374151', fontSize: '18px' }}>
                    <i className="fas fa-users"></i> Danh sách học viên ({filteredStudents.length} học viên)
                  </h3>

                  {/* Bộ lọc theo tiêu chí đạt và nút thêm học viên */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      <i className="fas fa-filter"></i> Lọc theo trạng thái:
                    </label>
                    <select
                      value={achievementFilter}
                      onChange={(e) => setAchievementFilter(e.target.value as 'all' | 'pass' | 'fail')}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#374151',
                        fontSize: '14px',
                        cursor: 'pointer',
                        minWidth: '140px'
                      }}
                    >
                      <option value="all">Tất cả học viên</option>
                      <option value="pass">Đã đạt yêu cầu</option>
                      <option value="fail">Chưa đạt yêu cầu</option>
                    </select>

                    {/* Chỉ hiển thị nút thêm học viên cho lớp chưa bắt đầu */}
                    {lopHoc.trangThai === "ChuaBatDau" && (
                      <button
                        onClick={() => setShowAddStudentModal(true)}
                        style={{
                          background: '#dc2626',
                          border: '1px solid #b91c1c',
                          color: 'white',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#b91c1c';
                          e.currentTarget.style.borderColor = '#991b1b';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.borderColor = '#b91c1c';
                        }}
                        title="Thêm học viên vào lớp"
                      >
                        <i className="fas fa-user-plus"></i> Thêm học viên
                      </button>
                    )}

                    {/* Thông báo cho lớp không thể thêm học viên */}
                    {(lopHoc.trangThai === "DangDienRa" || lopHoc.trangThai === "DaKetThuc") && (
                      <div style={{
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        color: '#d97706',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <i className="fas fa-info-circle"></i>
                        {lopHoc.trangThai === "DangDienRa"
                          ? "Không thể thêm học viên vào lớp đang diễn ra"
                          : "Không thể thêm học viên vào lớp đã kết thúc"
                        }
                      </div>
                    )}
                  </div>
                </div>

                {students.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                    <h4 style={{ margin: '0 0 8px 0' }}>Chưa có học viên nào đăng ký</h4>
                    <p style={{ margin: 0 }}>Lớp học này chưa có học viên đăng ký.</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <i className="fas fa-filter" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                    <h4 style={{ margin: '0 0 8px 0' }}>Không tìm thấy học viên</h4>
                    <p style={{ margin: 0 }}>
                      Không có học viên nào {achievementFilter === 'pass' ? 'đạt yêu cầu' : 'chưa đạt yêu cầu'} trong lớp này.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {filteredStudents.map((student, index) => (
                      <div key={student.dangKyID} style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto auto auto',
                        gap: '16px',
                        alignItems: 'center'
                      }}>
                        {/* STT và Avatar */}
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
                          fontSize: '16px'
                        }}>
                          {index + 1}
                        </div>

                        {/* Thông tin học viên */}
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                            {student.hoTen}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {student.email && `Email: ${student.email}`}
                            {student.soDienThoai && ` • SĐT: ${student.soDienThoai}`}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            Đăng ký: {formatDate(student.ngayDangKy)}
                          </div>
                        </div>

                        {/* Trạng thái đăng ký */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            ...getStatusColor(student.trangThaiDangKy)
                          }}>
                            {mapTrangThaiDangKy(student.trangThaiDangKy)}
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            ...getPaymentStatusColor(student.trangThaiThanhToan)
                          }}>
                            {mapTrangThaiThanhToan(student.trangThaiThanhToan)}
                          </div>
                        </div>

                        {/* Thống kê */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              color: student.diemTrungBinh >= 5.5 ? '#059669' : '#dc2626'
                            }}>
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
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Chuyên cần</div>
                          </div>
                        </div>

                        {/* Nút hủy đăng ký */}
                        <div style={{ textAlign: 'center' }}>
                          {(lopHoc.trangThai === "ChuaBatDau" || lopHoc.trangThai === "DangDienRa") ? (
                            <button
                              onClick={() => handleOpenCancelModal(student)}
                              disabled={student.trangThaiDangKy === 'DaHuy'}
                              style={{
                                padding: '6px 12px',
                                background: student.trangThaiDangKy === 'DaHuy' ? '#9ca3af' : '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: student.trangThaiDangKy === 'DaHuy' ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (student.trangThaiDangKy !== 'DaHuy') {
                                  e.currentTarget.style.background = '#b91c1c';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (student.trangThaiDangKy !== 'DaHuy') {
                                  e.currentTarget.style.background = '#dc2626';
                                }
                              }}
                              title={student.trangThaiDangKy === 'DaHuy' ? 'Đăng ký đã bị hủy' : 'Hủy đăng ký học viên'}
                            >
                              <i className="fas fa-user-times"></i>
                              {student.trangThaiDangKy === 'DaHuy' ? 'Đã hủy' : 'Hủy'}
                            </button>
                          ) : (
                            <div style={{
                              padding: '6px 12px',
                              background: '#f3f4f6',
                              color: '#9ca3af',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fas fa-lock"></i>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-times"></i> Đóng
          </button>
        </div>
      </div>

      {/* Modal thêm học viên */}
      {lopHoc && (
        <AdminAddStudentModal
          lopHoc={lopHoc}
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onStudentAdded={() => {
            loadClassDetails(); // Refresh danh sách học viên
            setShowAddStudentModal(false);
          }}
        />
      )}

      {/* Modal hủy đăng ký học viên */}
      {selectedStudentForCancel && (
        <AdminCancelRegistrationModal
          student={selectedStudentForCancel}
          isOpen={showCancelRegistrationModal}
          onClose={handleCloseCancelModal}
          onConfirmCancel={handleCancelRegistration}
        />
      )}
    </div>
  );
};

export default AdminClassDetailsModal;
