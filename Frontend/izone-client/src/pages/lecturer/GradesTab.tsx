import React, { useState, useEffect } from 'react';
import { diemSoService } from '../../services/api';

interface StudentWithStats {
  hocVienID: number;
  hoTen: string;
  email?: string;
  soDienThoai?: string;
  diemTrungBinh: number;
  dangKyID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
}

interface GradesTabProps {
  lopId: number;
  students: StudentWithStats[];
  classStatus: string; // Trạng thái lớp học: "DangHoc", "DaKetThuc", "ChuaBatDau"
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
}

interface GradeData {
  diemID: number;
  hocVienID: number;
  lopID: number;
  loaiDiem: string;
  diem: number;
  ketQua: string;
  hoTen: string;
}

type GradeType = 'GiuaKy' | 'CuoiKy';

const GradesTab: React.FC<GradesTabProps> = ({ lopId, students, classStatus, onRefresh, loading, error }) => {
  const [activeGradeType, setActiveGradeType] = useState<GradeType>('GiuaKy');
  const [gradesData, setGradesData] = useState<{[hocVienId: number]: { diem: number; diemID?: number }}>({});
  const [saving, setSaving] = useState(false);
  const [gradeStats, setGradeStats] = useState({
    totalStudents: 0,
    studentsWithGrades: 0,
    averageScore: 0,
    excellentCount: 0,
    goodCount: 0,
    averageCount: 0,
    belowAverageCount: 0
  });

  // Load điểm số hiện tại khi chuyển loại điểm
  useEffect(() => {
    loadCurrentGrades();
  }, [activeGradeType, lopId]);

  // Tính thống kê điểm số
  useEffect(() => {
    calculateStats();
  }, [gradesData, students]);

  const loadCurrentGrades = async () => {
    try {
      console.log('🔄 [GradesTab] Đang tải điểm số cho lớp:', lopId, 'loại điểm:', activeGradeType);

      // Lấy điểm số hiện tại từ API sử dụng service
      const diemSos = await diemSoService.getByLopId(lopId);
      console.log('✅ [GradesTab] Dữ liệu điểm số nhận được:', diemSos);

      // Lọc theo loại điểm đang chọn
      const filteredGrades = diemSos.filter((diem) => diem.loaiDiem === activeGradeType);
      console.log('🔍 [GradesTab] Điểm số sau khi lọc theo loại:', activeGradeType, ':', filteredGrades);

      // Chuyển đổi thành định dạng phù hợp với state
      const gradesMap: {[hocVienId: number]: { diem: number; diemID?: number }} = {};
      filteredGrades.forEach((grade) => {
        gradesMap[grade.hocVienID] = {
          diem: grade.diem,
          diemID: grade.diemID
        };
      });

      console.log('✅ [GradesTab] GradesMap sau khi xử lý:', gradesMap);
      setGradesData(gradesMap);

      if (Object.keys(gradesMap).length === 0) {
        console.warn('⚠️ [GradesTab] Không có điểm số nào cho loại điểm:', activeGradeType);
      }
    } catch (error) {
      console.error('❌ [GradesTab] Lỗi khi tải điểm số:', error);
      setGradesData({});
    }
  };

  const calculateStats = () => {
    const totalStudents = students.length;
    const studentsWithGrades = Object.keys(gradesData).length;
    const scores = Object.values(gradesData).map(g => g.diem).filter(d => d > 0);

    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    const excellentCount = scores.filter(score => score >= 8).length;
    const goodCount = scores.filter(score => score >= 6.5 && score < 8).length;
    const averageCount = scores.filter(score => score >= 5 && score < 6.5).length;
    const belowAverageCount = scores.filter(score => score < 5).length;

    setGradeStats({
      totalStudents,
      studentsWithGrades,
      averageScore: Math.round(averageScore * 100) / 100,
      excellentCount,
      goodCount,
      averageCount,
      belowAverageCount
    });
  };

  const handleGradeChange = (hocVienId: number, diem: number) => {
    setGradesData(prev => ({
      ...prev,
      [hocVienId]: { ...prev[hocVienId], diem: diem }
    }));
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const gradesToSave = Object.entries(gradesData).map(([hocVienId, data]) => ({
        diemID: data.diemID || 0,
        hocVienID: parseInt(hocVienId),
        lopID: lopId,
        loaiDiem: activeGradeType,
        diem: data.diem,
        ketQua: data.diem >= 5 ? 'Dat' : 'KhongDat'
      }));

      // Gửi yêu cầu lưu điểm số
      const response = await fetch('http://localhost:5080/api/DiemSo/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradesToSave)
      });

      if (response.ok) {
        alert('Đã lưu điểm số thành công!');
        await loadCurrentGrades(); // Tải lại dữ liệu sau khi lưu
      } else {
        throw new Error('Không thể lưu điểm số');
      }
    } catch (error) {
      console.error('Lỗi khi lưu điểm số:', error);
      alert('Có lỗi xảy ra khi lưu điểm số!');
    } finally {
      setSaving(false);
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 8) return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
    if (score >= 6.5) return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
    if (score >= 5) return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
    if (score > 0) return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
    return { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' };
  };

  const getGradeLabel = (score: number) => {
    if (score >= 8) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    if (score >= 5) return 'Trung bình';
    if (score > 0) return 'Yếu';
    return 'Chưa nhập';
  };

  // Hàm chuyển đổi tên hiển thị từ giá trị database sang tiếng Việt đúng chính tả
  const getDisplayName = (type: string) => {
    switch (type) {
      case 'GiuaKy':
        return 'Giữa kỳ';
      case 'CuoiKy':
        return 'Cuối kỳ';
      default:
        return type;
    }
  };

  // Xác định chế độ hiển thị dựa trên trạng thái lớp học
  const isReadOnly = classStatus === 'DaKetThuc';

  if (students.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#6b7280'
      }}>
        <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
        <h3 style={{ margin: '0 0 8px 0' }}>Chưa có học viên nào</h3>
        <p style={{ margin: 0 }}>Học viên sẽ xuất hiện ở đây khi đăng ký vào lớp học này.</p>
      </div>
    );
  }



  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#dc2626' }}>
          <i className="fas fa-graduation-cap"></i> Điểm số
        </h3>
        <div style={{ fontSize: '12px', color: isReadOnly ? '#dc2626' : '#6b7280', marginTop: '4px' }}>
          <i className={`fas ${isReadOnly ? 'fa-lock' : 'fa-info-circle'}`}></i>
          {isReadOnly
            ? `Trạng thái lớp: ${classStatus} - Chỉ xem kết quả điểm số`
            : `Trạng thái lớp: ${classStatus} - Cho phép nhập điểm`
          }
        </div>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
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
      )}

      {/* Chọn loại điểm */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <label style={{ fontWeight: '600', color: '#374151' }}>
            <i className="fas fa-filter"></i> Loại điểm:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['GiuaKy', 'CuoiKy'] as GradeType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveGradeType(type)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: activeGradeType === type ? '#dc2626' : 'white',
                  color: activeGradeType === type ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {getDisplayName(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thống kê tổng quan điểm số */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
          <i className="fas fa-chart-bar"></i> Thống kê điểm số ({activeGradeType}):
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
              {gradeStats.studentsWithGrades}/{gradeStats.totalStudents}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Đã nhập điểm</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#2563eb' }}>
              {gradeStats.averageScore.toFixed(1)}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Điểm trung bình</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
              {gradeStats.excellentCount}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Giỏi (≥8)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
              {gradeStats.goodCount}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Khá (6.5-7.9)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#3730a3' }}>
              {gradeStats.averageCount}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Trung bình (5-6.4)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
              {gradeStats.belowAverageCount}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Yếu ({'<'}5)
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '16px' }}></i>
          <h3 style={{ margin: '0 0 8px 0' }}>Đang tải dữ liệu điểm số...</h3>
          <p style={{ margin: 0 }}>Vui lòng đợi trong giây lát.</p>
        </div>
      ) : Object.keys(gradesData).length === 0 && !isReadOnly ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <i className="fas fa-graduation-cap" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
          <h3 style={{ margin: '0 0 8px 0' }}>Chưa có điểm số nào được nhập</h3>
          <p style={{ margin: 0, marginBottom: '20px' }}>
            {isReadOnly
              ? 'Lớp đã kết thúc nhưng chưa có điểm số nào được nhập vào hệ thống.'
              : 'Bạn có thể bắt đầu nhập điểm số cho học viên trong lớp học này.'
            }
          </p>
          {!isReadOnly && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '15px',
              color: '#856404',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <i className="fas fa-info-circle" style={{ fontSize: '20px', marginBottom: '10px' }}></i>
              <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>Hướng dẫn nhập điểm</h5>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Nhập điểm số (0-10) cho từng học viên và nhấn "Lưu tất cả điểm số" để lưu vào hệ thống.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Danh sách học viên với form nhập điểm */
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
            <i className={`fas ${isReadOnly ? 'fa-eye' : 'fa-edit'}`}></i>
            {isReadOnly ? `Xem kết quả điểm số (${activeGradeType})` : `Nhập điểm số (${activeGradeType})`}
          </h4>

          <div style={{ display: 'grid', gap: '10px' }}>
            {students.map((student, index) => {
              const currentGrade = gradesData[student.hocVienID]?.diem || 0;

              return (
                <div key={student.hocVienID} style={{
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
                      width: '35px',
                      height: '35px',
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
                    {/* Ô nhập điểm hoặc hiển thị điểm số */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isReadOnly ? (
                        // Khi lớp đã kết thúc - hiển thị điểm số read-only
                        <div style={{
                          width: '100px',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          textAlign: 'center',
                          backgroundColor: '#f9fafb',
                          color: currentGrade > 0 ? '#1f2937' : '#6b7280',
                          fontWeight: '600'
                        }}>
                          {currentGrade > 0 ? currentGrade.toFixed(1) : 'Chưa có'}
                        </div>
                      ) : (
                        // Khi lớp đang học - cho phép nhập điểm
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={currentGrade || ''}
                          onChange={(e) => handleGradeChange(student.hocVienID, parseFloat(e.target.value) || 0)}
                          placeholder="Nhập điểm..."
                          style={{
                            width: '100px',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'center',
                            backgroundColor: 'white',
                            color: 'inherit'
                          }}
                        />
                      )}
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>/10</span>
                    </div>

                    {/* Tạm ẩn trạng thái điểm vì chỉ xem kết quả */}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút lưu điểm - chỉ hiển thị khi không ở chế độ read-only */}
          {!isReadOnly && (
            <button
              onClick={handleSaveGrades}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: saving ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
              {saving ? 'Đang lưu...' : 'Lưu tất cả điểm số'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GradesTab;
