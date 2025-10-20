import React, { useState, useEffect } from 'react';
import { khoaHocService, lopHocService, dangKyLopService } from '../../services/api';

interface KhoaHoc {
  khoaHocID: number;
  tenKhoaHoc: string;
  hocPhi: number;
  soBuoi: number;
  donGiaTaiLieu: number;
}

interface LopHoc {
  lopID: number;
  khoaHocID: number;
  giangVienID: number;
  diaDiemID: number | null;
  ngayBatDau: string;
  ngayKetThuc: string | null;
  caHoc: string | null;
  ngayHocTrongTuan: string | null;
  donGiaBuoiDay: number | null;
  thoiLuongGio: number;
  soLuongToiDa: number | null;
  trangThai: string | null;
}

interface DangKyLop {
  dangKyID: number;
  hocVienID: number;
  lopID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
  trangThaiThanhToan: string;
  ngayHuy?: string | null;
  lyDoHuy?: string | null;
}

const StudentCourses: React.FC = () => {
  const [khoaHocs, setKhoaHocs] = useState<KhoaHoc[]>([]);
  const [lopHocs, setLopHocs] = useState<LopHoc[]>([]);
  const [dangKyLops, setDangKyLops] = useState<DangKyLop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [khoaHocsData, lopHocsData, dangKyLopsData] = await Promise.all([
        khoaHocService.getAll(),
        lopHocService.getAll(),
        dangKyLopService.getAll()
      ]);

      setKhoaHocs(khoaHocsData);
      setLopHocs(lopHocsData);
      setDangKyLops(dangKyLopsData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLopHocsByKhoaHoc = (khoaHocId: number) => {
    return lopHocs.filter(lop => lop.khoaHocID === khoaHocId);
  };

  const getDangKyStatus = (lopId: number) => {
    const dangKy = dangKyLops.find(dk => dk.lopID === lopId);
    return dangKy ? dangKy.trangThaiDangKy : null;
  };

  const handleDangKyLop = async (lopId: number) => {
    try {
      // Lấy thông tin học viên từ localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        alert('Vui lòng đăng nhập để đăng ký khóa học');
        return;
      }

      const hocVienInfo = JSON.parse(userInfo);
      const hocVienId = hocVienInfo.hocVienID;

      if (!hocVienId) {
        alert('Không tìm thấy thông tin học viên');
        return;
      }

      const dangKyData = {
        hocVienID: hocVienId,
        lopID: lopId,
        ngayDangKy: new Date().toISOString(),
        trangThaiDangKy: 'DangKy',
        trangThaiThanhToan: 'ChuaThanhToan'
      };

      await dangKyLopService.create(dangKyData);
      alert('Đăng ký khóa học thành công!');
      loadData(); // Tải lại dữ liệu
    } catch (error) {
      console.error('Lỗi khi đăng ký khóa học:', error);
      alert('Có lỗi xảy ra khi đăng ký khóa học');
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="student-courses">
      <div className="student-page-header">
        <h1>Tất cả khóa học</h1>
        <p>Danh sách các khóa học có sẵn để đăng ký</p>
      </div>

      <div className="student-courses-container">
        {khoaHocs.map(khoaHoc => (
          <div key={khoaHoc.khoaHocID} className="student-course-card">
            <div className="student-course-header">
              <h2>{khoaHoc.tenKhoaHoc}</h2>
              <div className="student-course-price">
                <span className="price">{khoaHoc.hocPhi.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <div className="student-course-info">
              <div className="student-info-item">
                <i className="fas fa-clock"></i>
                <span>{khoaHoc.soBuoi} buổi</span>
              </div>
              <div className="student-info-item">
                <i className="fas fa-book"></i>
                <span>Tài liệu: {khoaHoc.donGiaTaiLieu.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <div className="student-course-description">
              <h3>Các lớp học có sẵn:</h3>
              <div className="student-classes-list">
                {getLopHocsByKhoaHoc(khoaHoc.khoaHocID).map(lop => (
                  <div key={lop.lopID} className="student-class-item">
                    <div className="student-class-info">
                      <div className="student-class-schedule">
                        <i className="fas fa-calendar"></i>
                        <span>
                          {new Date(lop.ngayBatDau).toLocaleDateString('vi-VN')}
                          {lop.caHoc && ` - Ca: ${lop.caHoc}`}
                        </span>
                      </div>
                      <div className="student-class-status">
                        <span className={`student-status-badge ${lop.trangThai || 'unknown'}`}>
                          {lop.trangThai || 'Chưa xác định'}
                        </span>
                      </div>
                    </div>

                    <div className="student-class-actions">
                      {getDangKyStatus(lop.lopID) === 'DangKy' ? (
                        <button className="student-btn-secondary" disabled>
                          <i className="fas fa-check"></i>
                          Đã đăng ký
                        </button>
                      ) : (
                        <button
                          className="student-btn-primary"
                          onClick={() => handleDangKyLop(lop.lopID)}
                        >
                          <i className="fas fa-plus"></i>
                          Đăng ký
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {khoaHocs.length === 0 && (
        <div className="no-data">
          <i className="fas fa-book"></i>
          <p>Chưa có khóa học nào được tạo</p>
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
