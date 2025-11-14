import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  lopHocService,
  LopHoc,
  dangKyLopService,
  DangKyLop,
  buoiHocService,
  BuoiHoc,
  diemDanhService,
  DiemDanh,
  diemSoService,
  DiemSo,
  baoLuuService,
  BaoLuu,
  khoaHocService,
  KhoaHoc,
  giangVienService,
  GiangVien,
  diaDiemService,
  DiaDiem
} from '../../services/api';
import { mapLopHocStatus, mapTrangThaiDangKy, mapTrangThaiThanhToan, mapBaoLuuStatus } from '../../utils/statusMapping';
import MonthlyCalendar from '../../components/MonthlyCalendar';
import SessionDetailModal from '../../components/SessionDetailModal';
import '../../styles/Management.css';

interface StudentStats {
  attendanceRate: number;
  averageGrade: number;
  totalSessions: number;
  attendedSessions: number;
  totalGrades: number;
  passedGrades: number;
}

const StudentClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<LopHoc | null>(null);
  const [khoaHoc, setKhoaHoc] = useState<KhoaHoc | null>(null);
  const [giangVien, setGiangVien] = useState<GiangVien | null>(null);
  const [diaDiem, setDiaDiem] = useState<DiaDiem | null>(null);
  const [dangKyLop, setDangKyLop] = useState<DangKyLop | null>(null);
  const [buoiHocs, setBuoiHocs] = useState<BuoiHoc[]>([]);
  const [baoLuuList, setBaoLuuList] = useState<BaoLuu[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats>({
    attendanceRate: 0,
    averageGrade: 0,
    totalSessions: 0,
    attendedSessions: 0,
    totalGrades: 0,
    passedGrades: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'baoluu'>('overview');

  // State cho modal chi tiết buổi học
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<BuoiHoc | null>(null);

  // Hàm xử lý click vào buổi học
  const handleSessionClick = (buoiHoc: BuoiHoc) => {
    setSelectedSession(buoiHoc);
    setIsModalOpen(true);
  };

  // Hàm đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // Hàm xử lý gửi yêu cầu bảo lưu
  const handleSubmitBaoLuu = async () => {
    try {
      // Kiểm tra thông tin cần thiết
      if (!dangKyLop) {
        alert('Không tìm thấy thông tin đăng ký lớp học');
        return;
      }

      // Lấy lý do bảo lưu từ textarea
      const lyDoElement = document.querySelector('textarea[placeholder*="Nhập lý do bảo lưu"]') as HTMLTextAreaElement;
      const lyDo = lyDoElement?.value?.trim();

      if (!lyDo) {
        alert('Vui lòng nhập lý do bảo lưu');
        lyDoElement?.focus();
        return;
      }

      // Lấy thông tin học viên từ localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        alert('Không tìm thấy thông tin đăng nhập');
        return;
      }

      const user = JSON.parse(userInfo);
      if (!user.hocVienID) {
        alert('Không tìm thấy thông tin học viên');
        return;
      }

      // Kiểm tra số buổi còn lại thực tế
      console.log('🔍 Kiểm tra số buổi còn lại...');

      // Lấy danh sách buổi học của lớp
      const buoiHocResponse = await buoiHocService.getByLopId(dangKyLop.lopID);

      if (Array.isArray(buoiHocResponse)) {
        const totalSessions = buoiHocResponse.length;
        const completedSessions = buoiHocResponse.filter(session => session.trangThai === 'DaDienRa').length;
        const soBuoiConLai = totalSessions - completedSessions;

        console.log(`📊 Số buổi còn lại: ${soBuoiConLai} buổi (${completedSessions}/${totalSessions} buổi đã diễn ra)`);

        // Kiểm tra điều kiện bảo lưu
        if (soBuoiConLai < 5) {
          alert(`Không thể gửi yêu cầu bảo lưu! Số buổi còn lại của bạn chỉ có ${soBuoiConLai} buổi. Yêu cầu bảo lưu cần tối thiểu 5 buổi còn lại.`);
          return;
        }

        // Tạo dữ liệu bảo lưu
        const baoLuuData = {
          dangKyID: dangKyLop.dangKyID,
          ngayBaoLuu: new Date().toISOString(),
          soBuoiConLai: soBuoiConLai, // Sử dụng số buổi thực tế đã tính
          hanBaoLuu: null, // Backend sẽ tự tính (1 năm sau)
          trangThai: 'DangChoDuyet',
          nguoiDuyet: null,
          lyDo: lyDo
        };

        console.log('🚀 Gửi yêu cầu bảo lưu:', baoLuuData);

        // Gọi API tạo bảo lưu
        const response = await baoLuuService.create(baoLuuData);
        console.log('✅ Tạo bảo lưu thành công:', response);

        // Hiển thị thông báo thành công
        alert(`Yêu cầu bảo lưu đã được gửi thành công! Bạn còn ${soBuoiConLai} buổi để bảo lưu trong vòng 1 năm.`);

        // Refresh lại danh sách bảo lưu
        await fetchClassDetail();

        // Reset form
        if (lyDoElement) {
          lyDoElement.value = '';
        }

      } else {
        alert('Không thể lấy thông tin buổi học để kiểm tra số buổi còn lại');
        return;
      }

    } catch (error: any) {
      console.error('❌ Lỗi khi gửi yêu cầu bảo lưu:', error);
      alert(`Lỗi khi gửi yêu cầu bảo lưu: ${error.message || 'Có lỗi xảy ra'}`);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClassDetail();
    }
  }, [id]);

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

      // Lấy thông tin lớp học cơ bản
      const classResponse = await lopHocService.getById(classId);
      console.log('✅ Thông tin lớp học:', classResponse);
      setClassInfo(classResponse);

      // Lấy thông tin khóa học
      if (classResponse.khoaHocID) {
        try {
          const khoaHocResponse = await khoaHocService.getById(classResponse.khoaHocID);
          setKhoaHoc(khoaHocResponse);
        } catch (error) {
          console.warn('Không thể lấy thông tin khóa học:', error);
        }
      }

      // Lấy thông tin giảng viên
      if (classResponse.giangVienID) {
        try {
          const giangVienResponse = await giangVienService.getById(classResponse.giangVienID);
          setGiangVien(giangVienResponse);
        } catch (error) {
          console.warn('Không thể lấy thông tin giảng viên:', error);
        }
      }

      // Lấy thông tin địa điểm
      if (classResponse.diaDiemID) {
        try {
          const diaDiemResponse = await diaDiemService.getById(classResponse.diaDiemID);
          setDiaDiem(diaDiemResponse);
        } catch (error) {
          console.warn('Không thể lấy thông tin địa điểm:', error);
        }
      }

      // Lấy thông tin đăng ký của học viên hiện tại
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.hocVienID) {
          try {
            const dangKyResponse = await dangKyLopService.getByHocVienAndLop(user.hocVienID, classId);
            setDangKyLop(dangKyResponse);
          } catch (error) {
            console.warn('Không thể lấy thông tin đăng ký:', error);
          }
        }
      }

      // Lấy danh sách buổi học
      try {
        const buoiHocResponse = await buoiHocService.getByLopId(classId);
        if (Array.isArray(buoiHocResponse)) {
          setBuoiHocs(buoiHocResponse);
        }
      } catch (error) {
        console.warn('Không thể lấy danh sách buổi học:', error);
      }

      // Lấy thông tin bảo lưu của học viên
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.hocVienID && dangKyLop) {
          try {
            const baoLuuResponse = await baoLuuService.getByDangKyId(dangKyLop.dangKyID);
            if (Array.isArray(baoLuuResponse)) {
              setBaoLuuList(baoLuuResponse);
            }
          } catch (error) {
            console.warn('Không thể lấy thông tin bảo lưu:', error);
          }
        }
      }

      // Tính toán thống kê học viên
      await calculateStudentStats(classId);

    } catch (error: any) {
      console.error('❌ Lỗi khi tải thông tin lớp học:', error);
      setError(`Không thể tải thông tin lớp học: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentStats = async (classId: number) => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) return;

      const user = JSON.parse(userInfo);
      if (!user.hocVienID) return;

      // Lấy điểm danh của học viên với error handling
      let attendanceRecords: DiemDanh[] = [];
      let totalSessions = 0;
      let attendedSessions = 0;

      try {
        // Use optimized method to get attendance for specific class only
        const attendanceResponse = await diemDanhService.getByHocVienAndLopId(user.hocVienID, classId);
        if (Array.isArray(attendanceResponse)) {
          attendanceRecords = attendanceResponse;
          totalSessions = attendanceRecords.length;
          attendedSessions = attendanceRecords.filter(record => record.coMat).length;
        } else {
          console.warn('API điểm danh không trả về mảng:', attendanceResponse);
        }
      } catch (error) {
        console.warn('Không thể lấy dữ liệu điểm danh:', error);
      }

      const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

      // Lấy điểm số của học viên với error handling
      let grades: DiemSo[] = [];
      let classGrades: DiemSo[] = [];
      let averageGrade = 0;
      let passedGrades = 0;

      try {
        const gradesResponse = await diemSoService.getByHocVienId(user.hocVienID);
        if (Array.isArray(gradesResponse)) {
          grades = gradesResponse;
          classGrades = grades.filter(grade => grade.lopID === classId);
          averageGrade = classGrades.length > 0
            ? classGrades.reduce((sum, grade) => sum + grade.diem, 0) / classGrades.length
            : 0;
          passedGrades = classGrades.filter(grade => grade.diem >= 5).length;
        } else {
          console.warn('API điểm số không trả về mảng:', gradesResponse);
        }
      } catch (error) {
        console.warn('Không thể lấy dữ liệu điểm số:', error);
      }

      setStudentStats({
        attendanceRate,
        averageGrade,
        totalSessions,
        attendedSessions,
        totalGrades: classGrades.length,
        passedGrades
      });

    } catch (error) {
      console.error('Lỗi khi tính toán thống kê học viên:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'danghoc':
      case 'đang học':
      case 'active':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'hoanthanh':
      case 'hoàn thành':
      case 'completed':
        return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
      case 'upcoming':
      case 'sắp tới':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      default:
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
    }
  };

  const getBaoLuuStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'daduyet':
      case 'đã duyệt':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'dangchoduyet':
      case 'đang chờ duyệt':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'dasudung':
      case 'đã sử dụng':
        return { backgroundColor: '#e0e7ff', color: '#3730a3' };
      case 'tuchoi':
      case 'từ chối':
        return { backgroundColor: '#fee2e2', color: '#dc2626' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const isReservationExpired = (baoLuu: BaoLuu): boolean => {
    return baoLuu.hanBaoLuu ? new Date(baoLuu.hanBaoLuu) < new Date() : false;
  };

  const getDaysUntilExpiration = (baoLuu: BaoLuu): number => {
    if (!baoLuu.hanBaoLuu) return 0;
    const expirationDate = new Date(baoLuu.hanBaoLuu);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
            <strong>Khóa học:</strong> {khoaHoc?.tenKhoaHoc || `ID: ${classInfo.khoaHocID}`}
          </div>
          <div>
            <strong>Giảng viên:</strong> {giangVien?.hoTen || `ID: ${classInfo.giangVienID}`}
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
            <strong>Địa điểm:</strong> {diaDiem?.tenCoSo ? `${diaDiem.tenCoSo} - ${diaDiem.diaChi}` : 'Chưa xác định'}
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
              {mapLopHocStatus(classInfo.trangThai)}
            </span>
          </div>
          {dangKyLop && (
            <>
              <div>
                <strong>Ngày đăng ký:</strong> {formatDate(dangKyLop.ngayDangKy)}
              </div>
              <div>
                <strong>Trạng thái đăng ký:</strong>
                <span style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  ...getStatusColor(dangKyLop.trangThaiDangKy || 'unknown')
                }}>
                  {mapTrangThaiDangKy(dangKyLop.trangThaiDangKy)}
                </span>
              </div>
              <div>
                <strong>Trạng thái thanh toán:</strong>
                <span style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: dangKyLop.trangThaiThanhToan === 'DaThanhToan' ? '#dcfce7' : '#fef3c7',
                  color: dangKyLop.trangThaiThanhToan === 'DaThanhToan' ? '#166534' : '#92400e'
                }}>
                  {mapTrangThaiThanhToan(dangKyLop.trangThaiThanhToan)}
                </span>
              </div>
            </>
          )}
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
            onClick={() => setActiveTab('overview')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'overview' ? '#dc2626' : 'transparent',
              color: activeTab === 'overview' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '3px solid #b91c1c' : 'none'
            }}
          >
            <i className="fas fa-chart-line"></i> Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'schedule' ? '#dc2626' : 'transparent',
              color: activeTab === 'schedule' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'schedule' ? '3px solid #b91c1c' : 'none'
            }}
          >
            <i className="fas fa-calendar-alt"></i> Thời khóa biểu
          </button>
          <button
            onClick={() => setActiveTab('baoluu')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'baoluu' ? '#dc2626' : 'transparent',
              color: activeTab === 'baoluu' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'baoluu' ? '3px solid #b91c1c' : 'none'
            }}
          >
            <i className="fas fa-pause-circle"></i> Bảo lưu ({baoLuuList.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'overview' && (
            <div>
              {/* Thống kê tổng quan của học viên */}
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                  <i className="fas fa-user-graduate"></i> Tình hình học tập của bạn
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {/* Tỷ lệ điểm danh */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {studentStats.attendanceRate.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-calendar-check"></i> Tỷ lệ điểm danh
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                      {studentStats.attendedSessions}/{studentStats.totalSessions} buổi
                    </div>
                  </div>

                  {/* Điểm trung bình */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: studentStats.averageGrade >= 8 ? '#34d399' : studentStats.averageGrade >= 6 ? '#fbbf24' : '#f87171'
                    }}>
                      {studentStats.averageGrade.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-graduation-cap"></i> Điểm trung bình
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                      {studentStats.passedGrades}/{studentStats.totalGrades} môn đạt
                    </div>
                  </div>

                  {/* Tổng số buổi học */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {buoiHocs.length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-clock"></i> Tổng số buổi học
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                      {buoiHocs.filter(b => b.trangThai === 'DaDienRa').length} buổi đã diễn ra
                    </div>
                  </div>

                  {/* Số bảo lưu */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {baoLuuList.length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      <i className="fas fa-pause"></i> Lần bảo lưu
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                      {baoLuuList.filter(b => b.trangThai === 'Active').length} đang áp dụng
                    </div>
                  </div>

                  {/* Kết quả học tập */}
                  {(() => {
                    const ketQua = studentStats.averageGrade >= 5.5 ? 'Đạt' : 'Chưa đạt';
                    const mauSac = studentStats.averageGrade >= 5.5 ? '#059669' : '#dc2626';
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: '700',
                          marginBottom: '5px',
                          color: mauSac
                        }}>
                          {ketQua}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          <i className={`fas ${studentStats.averageGrade >= 5.5 ? 'fa-trophy' : 'fa-exclamation-triangle'}`}></i> Kết quả
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                          {studentStats.averageGrade >= 5.5 ? 'Điểm TB ≥ 5.5' : 'Điểm TB < 5.5'}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Thông tin chi tiết khóa học */}
              {khoaHoc && (
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                    <i className="fas fa-book"></i> Thông tin khóa học
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div><strong>Tên khóa học:</strong> {khoaHoc.tenKhoaHoc}</div>
                    <div><strong>Học phí:</strong> {khoaHoc.hocPhi.toLocaleString('vi-VN')} VNĐ</div>
                    <div><strong>Số buổi:</strong> {khoaHoc.soBuoi} buổi</div>
                    <div><strong>Đơn giá tài liệu:</strong> {khoaHoc.donGiaTaiLieu.toLocaleString('vi-VN')} VNĐ</div>
                  </div>
                </div>
              )}

              {/* Thông tin giảng viên */}
              {giangVien && (
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                    <i className="fas fa-chalkboard-teacher"></i> Thông tin giảng viên
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div><strong>Họ tên:</strong> {giangVien.hoTen}</div>
                    <div><strong>Chuyên môn:</strong> {giangVien.chuyenMon || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              )}

              {/* Thông tin địa điểm */}
              {diaDiem && (
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                    <i className="fas fa-map-marker-alt"></i> Thông tin địa điểm
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div><strong>Tên cơ sở:</strong> {diaDiem.tenCoSo}</div>
                    <div><strong>Địa chỉ:</strong> {diaDiem.diaChi}</div>
                    <div><strong>Sức chứa:</strong> {diaDiem.sucChua || 'Không giới hạn'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#dc2626' }}>
                  <i className="fas fa-calendar-alt"></i> Thời khóa biểu
                </h3>
                <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                </p>
              </div>

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
                  <p style={{ margin: 0 }}>Buổi học sẽ xuất hiện trên lịch khi được tạo trong hệ thống.</p>
                </div>
              ) : (
                <MonthlyCalendar
                  buoiHocs={buoiHocs}
                  diaDiem={diaDiem}
                  onSessionClick={handleSessionClick}
                />
              )}
            </div>
          )}

          {activeTab === 'baoluu' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#dc2626' }}>
                  <i className="fas fa-pause-circle"></i> Thông tin bảo lưu
                </h3>
                <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                  Lịch sử bảo lưu và yêu cầu bảo lưu mới
                </p>
              </div>

              {/* Form yêu cầu bảo lưu mới */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                  <i className="fas fa-plus-circle"></i> Yêu cầu bảo lưu mới
                </h4>

                {/* Thông báo hướng dẫn */}
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  color: '#1e40af'
                }}>
                  <i className="fas fa-info-circle"></i>
                  <strong> Lưu ý:</strong> Bảo lưu sẽ tạm nghỉ học trong 1 năm. Hệ thống sẽ tự động tính số buổi còn lại và hạn bảo lưu.
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
                    Ngày bắt đầu bảo lưu:
                  </label>
                  <input
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    <i className="fas fa-info-circle"></i> Tự động lấy ngày hiện tại khi gửi yêu cầu
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
                    Lý do bảo lưu: <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    placeholder="Nhập lý do bảo lưu (ví dụ: vấn đề sức khỏe, công việc bận rộn, lý do cá nhân...)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    maxLength={255}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    <i className="fas fa-info-circle"></i> Tối đa 255 ký tự
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={handleSubmitBaoLuu}
                    style={{
                      padding: '10px 20px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    <i className="fas fa-paper-plane"></i> Gửi yêu cầu bảo lưu
                  </button>
                </div>
              </div>

              {/* Lịch sử bảo lưu */}
              <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>
                <i className="fas fa-history"></i> Lịch sử bảo lưu ({baoLuuList.length} lần)
              </h4>

              {baoLuuList.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '30px',
                  color: '#6b7280',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <i className="fas fa-pause" style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}></i>
                  <h3 style={{ margin: '0 0 8px 0' }}>Chưa có lịch sử bảo lưu</h3>
                  <p style={{ margin: 0 }}>Bạn chưa từng bảo lưu lớp học này.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {baoLuuList.map((baoLuu) => (
                    <div key={baoLuu.baoLuuID} style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '15px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '15px',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>
                            <i className="fas fa-calendar-times"></i> Bảo lưu {baoLuu.soBuoiConLai} buổi
                          </div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            ...getBaoLuuStatusColor(baoLuu.trangThai)
                          }}>
                            {mapBaoLuuStatus(baoLuu.trangThai)}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                          <strong>Ngày bảo lưu:</strong> {formatDate(baoLuu.ngayBaoLuu)}
                        </div>
                        {baoLuu.hanBaoLuu && (
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                            <strong>Hạn bảo lưu:</strong> {formatDate(baoLuu.hanBaoLuu)}
                          </div>
                        )}
                        {baoLuu.lyDo && (
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            <strong>Lý do:</strong> {baoLuu.lyDo}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          ID: #{baoLuu.baoLuuID}
                        </div>
                        {baoLuu.nguoiDuyet && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Duyệt bởi: {baoLuu.nguoiDuyet}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal chi tiết buổi học */}
      <SessionDetailModal
        session={selectedSession}
        diaDiem={diaDiem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default StudentClassDetail;
