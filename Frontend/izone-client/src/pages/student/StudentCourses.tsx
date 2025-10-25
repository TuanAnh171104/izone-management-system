import React, { useState, useEffect } from 'react';
import { khoaHocService, lopHocService, dangKyLopService } from '../../services/api';
import {
  FaBaby,
  FaKeyboard,
  FaBrain,
  FaBook,
  FaMedal,
  FaChevronRight,
} from "react-icons/fa";
import ClassSelectionModal from '../../components/ClassSelectionModal';
import '../../styles/Management.css';

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
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKhoaHocId, setSelectedKhoaHocId] = useState<number>(0);
  const [selectedKhoaHocName, setSelectedKhoaHocName] = useState<string>('');

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

  // Cải thiện logic tìm kiếm khóa học để matching chính xác hơn
  const findRelatedCourse = (level: any) => {
    if (!khoaHocs.length) return null;

    // Tìm theo range điểm trước (ưu tiên cao nhất)
    const rangeMatch = level.range; // "0 - 3.0 IELTS"
    for (const course of khoaHocs) {
      if (course.tenKhoaHoc.toLowerCase().includes(rangeMatch.toLowerCase())) {
        return course;
      }
    }

    // Tìm theo từ khóa chính (ưu tiên thứ 2)
    const keywords = {
      'SƠ SINH': ['sơ sinh', 'so sinh'],
      'VỠ LÒNG': ['vỡ lòng', 'vo long'],
      'PRE IELTS': ['pre ielts', 'pre'],
      'CHIẾN LƯỢC': ['chiến lược', 'chien luoc'],
      'CHUYÊN SÂU': ['chuyên sâu', 'chuyen sau']
    };

    const levelKeywords = keywords[level.name as keyof typeof keywords];
    if (levelKeywords) {
      for (const course of khoaHocs) {
        for (const keyword of levelKeywords) {
          if (course.tenKhoaHoc.toLowerCase().includes(keyword.toLowerCase())) {
            return course;
          }
        }
      }
    }

    // Tìm theo điểm số trong range (fallback)
    const rangeNumbers = level.range.split(' - ');
    if (rangeNumbers.length >= 2) {
      const startScore = rangeNumbers[0].trim();
      for (const course of khoaHocs) {
        if (course.tenKhoaHoc.toLowerCase().includes(startScore.toLowerCase())) {
          return course;
        }
      }
    }

    return null;
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

  const handleOpenModal = (khoaHocId: number, khoaHocName: string) => {
    setSelectedKhoaHocId(khoaHocId);
    setSelectedKhoaHocName(khoaHocName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedKhoaHocId(0);
    setSelectedKhoaHocName('');
  };

  const handleRegistrationSuccess = () => {
    loadData(); // Tải lại dữ liệu sau khi đăng ký thành công
  };

  const getHocVienId = (): number => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const hocVienInfo = JSON.parse(userInfo);
      return hocVienInfo.hocVienID || 0;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Lộ trình học chi tiết từ MẤT GỐC đến 7.0+ IELTS</h2>
        </div>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  // Dữ liệu lộ trình học IELTS theo thiết kế ảnh
  const ieltsRoadmap = [
    {
      level: 1,
      name: "SƠ SINH",
      range: "0 - 3.0 IELTS",
      icon: FaBaby,
      color: "#4F46E5",
      bgColor: "#DBEAFE",
      iconColor: "#4F46E5",
      requirements: [
        "Ngữ pháp: hổng nhiều kiến thức căn bản (chưa chia được động từ, chưa biết cách hình thành câu...)",
        "Từ vựng: vốn từ vựng rất hạn chế, cản trở quá trình tiếp thu tiếng Anh"
      ],
      outcomes: [
        "Tương đương 3.0 IELTS",
        "Nắm được 12 quy tắc ngữ pháp cơ bản",
        "Mở rộng vốn từ vựng với 500 từ mới",
        "Có thể xây dựng 1 câu tiếng Anh có bản (nói & viết), ứng dụng được ngay từ vựng ngữ pháp trong buổi học"
      ],
      duration: "20 buổi",
      price: "3.000.000 VNĐ"
    },
    {
      level: 2,
      name: "VỠ LÒNG",
      range: "3.0 - 4.0 IELTS",
      icon: FaKeyboard,
      color: "#7C3AED",
      bgColor: "#EDE9FE",
      iconColor: "#7C3AED",
      requirements: [
        "Ngữ pháp: hiểu mơ hồ về các quy tắc ngữ pháp",
        "Từ vựng: vốn từ vựng hạn chế, ảnh hưởng đến độ hiểu và khả năng nói/viết",
        "Phát âm: không nắm rõ phiên âm và thường xuyên phát âm sai",
        "Chưa có kỹ năng làm bài IELTS"
      ],
      outcomes: [
        "Tối thiểu 4.0 IELTS",
        "Nắm được 36 quy tắc ngữ pháp cơ bản, áp dụng vào nói/viết",
        "Mở rộng vốn từ với 1250 từ mới",
        "Nắm được cách phát âm chuẩn ở cấp độ từ",
        "Có nền tảng kỹ năng nghe - nói - đọc - viết vững chắc, chuẩn bị cho đề thi IELTS"
      ],
      duration: "20 buổi",
      price: "3.500.000 VNĐ"
    },
    {
      level: 3,
      name: "PRE IELTS",
      range: "4.0 - 5.0 IELTS",
      icon: FaBrain,
      color: "#EC4899",
      bgColor: "#FCE7F3",
      iconColor: "#EC4899",
      requirements: [
        "Ngữ pháp: biết một số quy tắc cơ bản (thì, câu bị động, câu điều kiện...), nhưng chưa áp dụng nhuần nhuyễn trong nói/viết",
        "Từ vựng: đủ để hiểu các chủ đề phổ biến, nhưng chưa sử dụng thuần thục",
        "Phát âm: chịu ảnh hưởng của tiếng mẹ đẻ, chưa tự nhiên",
        "Chưa quen thuộc với đề thi IELTS"
      ],
      outcomes: [
        "Tối thiểu 5.0 IELTS",
        "Hiểu biết sâu sắc về 24 hiện tượng ngữ pháp cốt lõi, áp dụng hiệu quả vào cuộc sống và bài thi IELTS",
        "Có vốn từ vựng rộng: 1500 từ vựng bao gồm từ vựng chủ đề IELTS và từ vựng học thuật",
        "Nắm được cách phát âm chuẩn ở cấp độ câu và hội thoại",
        "Nắm được cấu trúc đề IELTS, điểm cốt lõi để làm tốt các dạng bài"
      ],
      duration: "24 buổi",
      price: "4.000.000 VNĐ"
    },
    {
      level: 4,
      name: "CHIẾN LƯỢC",
      range: "5.0 - 6.0 IELTS",
      icon: FaBook,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      iconColor: "#F59E0B",
      requirements: [
        "Ngữ pháp: nắm chắc quy tắc ngữ pháp, nhưng còn mắc lỗi khi thực hành nói/viết",
        "Từ vựng: nắm được các chủ đề phố biến nhất của IELTS (cả từ vựng chủ để IELTS và từ vựng học thuật), nhưng chưa bật được ra khi cần",
        "Có hiểu biết sơ lược về đề thi IELTS và các dạng bài"
      ],
      outcomes: [
        "Tối thiểu 6.0 IELTS",
        "Ngữ pháp: đảm bảo độ chính xác cao trong nói/viết",
        "Từ vựng: sử dụng thoải mái linh hoạt trong các chủ đề IELTS phổ biến",
        "Nắm chắc các chiến thuật làm bài tối ưu trong cả 4 kỹ năng IELTS"
      ],
      duration: "24 buổi",
      price: "4.500.000 VNĐ"
    },
    {
      level: 5,
      name: "CHUYÊN SÂU",
      range: "6.0 - 7.0 IELTS",
      icon: FaMedal,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      iconColor: "#EF4444",
      requirements: [
        "Có nền tảng tiếng Anh (từ vựng - ngữ pháp - phát âm) vững chắc",
        "Có kỹ năng làm bài thi IELTS",
        "Muốn đạt điểm IELTS 7.0 trở lên",
        "Muốn phát triển năng lực ngôn ngữ tiếng Anh ở mức độ chuyên sâu"
      ],
      outcomes: [
        "Tối thiểu 7.0 IELTS",
        "Thành thạo các khía cạnh ngôn ngữ (từ vựng phong phú, ứng dụng từ vựng ở mọi cấp độ vào đa dạng chủ đề, kiểm soát ngữ pháp tốt, nói viết trôi chảy mượt mà...)",
        "Thành thạo kỹ năng làm bài IELTS ở mức độ cao: tốc độ làm bài nhanh, kiểm soát chi tiết các bước làm, thực sự hiểu nội dung bài thi chứ không chỉ phụ thuộc kỹ năng.",
        "Thành thạo tư duy phản biện, kỹ năng tranh luận nhờ quá trình tìm hiểu sâu về cách làm bài."
      ],
      duration: "30 buổi",
      price: "5.000.000 VNĐ"
    }
  ];

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Lộ trình học chi tiết từ MẤT GỐC đến 7.0+ IELTS</h2>
      </div>

      {/* Interactive Roadmap */}
      <div className="ielts-roadmap">
        <div className="roadmap-container">
          {/* SVG Connecting Lines */}
          <svg className="roadmap-svg" viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8"/>
              </linearGradient>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="1"/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="1"/>
              </linearGradient>
              <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
                <polygon points="0 0, 12 4, 0 8" fill="url(#pathGradient)"/>
              </marker>
              <marker id="arrowhead-active" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
                <polygon points="0 0, 12 4, 0 8" fill="url(#flowGradient)"/>
              </marker>
            </defs>

            {/* Connection paths between nodes */}
            <path
              d="M 100 100 Q 200 50 300 100 Q 400 150 500 100 Q 600 50 700 100 Q 800 150 900 100"
              stroke="url(#pathGradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray="none"
              markerEnd="url(#arrowhead)"
              opacity="0.7"
              className="connection-path"
              filter="drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))"
            />

            {/* Animated flow path */}
            <path
              d="M 100 100 Q 200 50 300 100 Q 400 150 500 100 Q 600 50 700 100 Q 800 150 900 100"
              stroke="url(#flowGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="12,6"
              markerEnd="url(#arrowhead-active)"
              opacity="0"
              className="flow-path"
              filter="drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))"
            />
          </svg>

          {/* Roadmap Nodes */}
          <div className="roadmap-path">
            {ieltsRoadmap.map((level, index) => {
              const relatedCourse = findRelatedCourse(level);

              return (
                <div
                  key={level.level}
                  className={`path-node ${activeTab === index ? 'active' : ''} ${index % 2 === 0 ? 'left' : 'right'} ${relatedCourse ? 'clickable' : ''}`}
                  style={{
                    '--node-color': level.color,
                    '--node-bg': level.bgColor
                  } as React.CSSProperties & { '--node-color': string; '--node-bg': string }}
                  onClick={() => relatedCourse && setActiveTab(index)}
                >
                  <div className="node-number">
                    <span style={{ backgroundColor: level.color }}>
                      {String(level.level).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="node-content" style={{ backgroundColor: level.bgColor, borderColor: level.color }}>
                    <div className="node-icon" style={{ color: level.iconColor }}>
                      <level.icon />
                    </div>
                    <div className="node-info">
                      <h4>{level.name}</h4>
                      <p className="node-range">{level.range}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {(() => {
            const currentLevel = ieltsRoadmap[activeTab];
            const relatedCourse = findRelatedCourse(currentLevel);

            return (
              <div className="tab-pane active">
                <div className="tab-header">
                  <div className="tab-title">
                    <h3>{currentLevel.name}</h3>
                    <span className="tab-subtitle">{currentLevel.range}</span>
                  </div>
                  <div className="tab-icon-large" style={{ backgroundColor: currentLevel.color }}>
                    <currentLevel.icon />
                  </div>
                </div>

                {/* Thông tin chi tiết của tab hiện tại */}
                <div className="level-details">
                  <div className="details-container">
                    <div className="requirements-section">
                      <h4>Đối tượng</h4>
                      <ul>
                        {currentLevel.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="outcomes-section">
                      <h4>Kết quả đầu ra</h4>
                      <ul>
                        {currentLevel.outcomes.map((outcome, idx) => (
                          <li key={idx}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="course-info-bottom">
                    <div className="info-left">
                      <div className="info-item">
                        <strong>Thời lượng:</strong> {relatedCourse ? `${relatedCourse.soBuoi} buổi` : currentLevel.duration}
                      </div>
                      <div className="info-item">
                        <strong>Học phí:</strong> {relatedCourse ? `${relatedCourse.hocPhi.toLocaleString()} VNĐ` : currentLevel.price}
                      </div>
                    </div>

                    <div className="info-right">
                      <button
                        className="btn-register"
                        onClick={() => relatedCourse && handleOpenModal(relatedCourse.khoaHocID, relatedCourse.tenKhoaHoc)}
                        disabled={!relatedCourse}
                      >
                        Đăng ký khóa học
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {khoaHocs.length === 0 && (
        <div className="no-data">
          <i className="fas fa-book"></i>
          <h3>Chưa có khóa học nào được tạo</h3>
          <p>Vui lòng liên hệ quản trị viên để thêm khóa học</p>
        </div>
      )}

      {/* Class Selection Modal */}
      <ClassSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        khoaHocId={selectedKhoaHocId}
        khoaHocName={selectedKhoaHocName}
        hocVienId={getHocVienId()}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </div>
  );
};

export default StudentCourses;
