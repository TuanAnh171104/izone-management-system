import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:5080/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10s to 30s to handle large datasets
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    taiKhoanID: number;
    email: string;
    vaiTro: string;
    // Các trường bổ sung cho giảng viên
    giangVienID?: number;
    hoTen?: string;
    chuyenMon?: string;
    // Các trường bổ sung cho học viên
    hocVienID?: number;
    ngaySinh?: string;
    sdt?: string;
    taiKhoanVi?: number;
  };
}

export interface TaiKhoan {
  taiKhoanID: number;
  email: string;
  matKhau: string;
  vaiTro: string;
}

export interface RegisterHocVienRequest {
  username?: string;
  password: string;
  email: string;
  hoTen?: string;
  gioiTinh?: string;
  ngaySinh?: string; // ISO string
  diaChi?: string;
  soDienThoai?: string;
  ghiChu?: string;
}

export interface KhoaHoc {
  khoaHocID: number;
  tenKhoaHoc: string;
  hocPhi: number;
  soBuoi: number;
  donGiaTaiLieu: number;
}

// Backend response mapping interface
interface KhoaHocResponse {
  maKH: number;
  tenKhoaHoc: string;
  hocPhi: number;
  soBuoi: number;
  donGiaTaiLieu: number;
}

export interface LopHoc {
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

export interface DiaDiem {
  diaDiemID: number;
  tenCoSo: string;
  diaChi: string;
  sucChua: number | null;
}

export interface ThueMatBang {
  thueID: number;
  diaDiemID: number;
  giaThueThang: number;
  ngayApDung: string;
  hanHopDong?: string | null;
  ghiChu?: string | null;
}

// DiaDiem Service
export const diaDiemService = {
  // Get all locations
  getAll: async (): Promise<DiaDiem[]> => {
    const response = await apiClient.get<DiaDiem[]>('/DiaDiem');
    return response.data;
  },

  // Get location by ID
  getById: async (id: number): Promise<DiaDiem> => {
    const response = await apiClient.get<DiaDiem>(`/DiaDiem/${id}`);
    return response.data;
  },

  // Get locations by facility name
  getByTenCoSo: async (tenCoSo: string): Promise<DiaDiem[]> => {
    const response = await apiClient.get<DiaDiem[]>(`/DiaDiem/ten-co-so/${tenCoSo}`);
    return response.data;
  },

  // Get available locations
  getAvailable: async (minCapacity?: number): Promise<DiaDiem[]> => {
    const response = await apiClient.get<DiaDiem[]>('/DiaDiem/available', {
      params: { minCapacity }
    });
    return response.data;
  },

  // Create location
  create: async (diaDiem: Omit<DiaDiem, 'diaDiemID'>): Promise<DiaDiem> => {
    const response = await apiClient.post<DiaDiem>('/DiaDiem', diaDiem);
    return response.data;
  },

  // Update location
  update: async (id: number, diaDiem: DiaDiem): Promise<void> => {
    await apiClient.put(`/DiaDiem/${id}`, diaDiem);
  },

  // Delete location
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/DiaDiem/${id}`);
  },
};

// Backend response mapping interface
interface LopHocResponse {
  maLop: number;
  maKH: number;
  maGV: number;
  maDiaDiem: number | null;
  ngayBatDau: string;
  ngayKetThuc: string | null;
  caHoc: string | null;
  ngayHocTrongTuan: string | null;
  donGiaBuoiDay: number | null;
  thoiLuongGio: number;
  sucChua: number | null;
  trangThai: string | null;
}

export interface GiangVien {
  giangVienID: number;
  taiKhoanID?: number | null; // Optional vì có thể không có trong schema
  hoTen: string;
  chuyenMon: string | null;
  // Thông tin tài khoản liên kết
  taiKhoan?: {
    taiKhoanID: number;
    email: string;
    vaiTro: string;
  } | null;
  // Xóa soDienThoai vì không có trong schema mới
}

// DTO để tránh vòng lặp serialization
export interface GiangVienWithEmailDto {
  giangVienID: number;
  taiKhoanID?: number | null;
  hoTen: string;
  chuyenMon: string | null;
  email?: string | null;
}

// Backend response mapping interface
interface GiangVienResponse {
  maGV: number;
  maTK?: number | null;
  hoTen: string;
  chuyenMon: string | null;
}

export interface HocVien {
  hocVienID: number;
  taiKhoanID?: number | null; // Optional vì có thể không có trong schema
  hoTen: string;
  ngaySinh: string | null;
  email: string | null;
  sdt: string | null; // Đổi từ soDienThoai thành sdt theo schema
  taiKhoanVi: number;
}

export interface ChiPhi {
  chiPhiID: number;
  khoaHocID?: number | null;
  lopID?: number | null;
  diaDiemID?: number | null;
  loaiChiPhi: string;
  subLoai?: string | null;
  soTien: number;
  ngayPhatSinh: string;
  nguoiNhap?: string | null;
  recurring: boolean;
  nguonChiPhi?: string | null;
  thoiGianKy?: string | null;
  nguonGoc: string;
  allocationMethod: string;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface ChiPhiImportResult {
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: ChiPhiImportError[];
  isSuccess: boolean;
}

export interface ChiPhiImportError {
  rowNumber: number;
  field: string;
  errorMessage: string;
  rowData?: { [key: string]: string };
}

export interface BaoLuu {
  baoLuuID: number;
  dangKyID: number;
  ngayBaoLuu: string;
  soBuoiConLai: number;
  hanBaoLuu?: string | null;
  trangThai: string;
  nguoiDuyet?: string | null;
  lyDo?: string | null;
}

export interface DangKyLop {
  dangKyID: number;
  hocVienID: number;
  lopID: number;
  ngayDangKy: string;
  trangThaiDangKy: string;
  trangThaiThanhToan: string;
  ngayHuy?: string | null;
  lyDoHuy?: string | null;
}

export interface BuoiHoc {
  buoiHocID: number;
  lopID: number;
  ngayHoc: string;
  thoiGianBatDau?: string | null;
  thoiGianKetThuc?: string | null;
  giangVienThayTheID?: number | null;
  diaDiemID?: number | null;
  trangThai: string;
}

export interface DiemDanh {
  diemDanhID: number;
  buoiHocID: number;
  hocVienID: number;
  coMat: boolean;
  ghiChu?: string | null;
}

export interface DiemSo {
  diemID: number;
  hocVienID: number;
  lopID: number;
  loaiDiem: string;
  diem: number;
  ketQua: string;
  ghiChu?: string | null;
}

// DiemDanh Service
export const diemDanhService = {
  // Get all attendance records
  getAll: async (): Promise<DiemDanh[]> => {
    const response = await apiClient.get<DiemDanh[]>('/DiemDanh');
    return response.data;
  },

  // Get attendance by ID
  getById: async (id: number): Promise<DiemDanh> => {
    const response = await apiClient.get<DiemDanh>(`/DiemDanh/${id}`);
    return response.data;
  },

  // Get attendance by session ID
  getByBuoiHocId: async (buoiHocId: number): Promise<DiemDanh[]> => {
    const response = await apiClient.get<DiemDanh[]>(`/DiemDanh/buoi-hoc/${buoiHocId}`);
    return response.data;
  },

  // Get attendance by student ID
  getByHocVienId: async (hocVienId: number): Promise<DiemDanh[]> => {
    const response = await apiClient.get<DiemDanh[]>(`/DiemDanh/hoc-vien/${hocVienId}`);
    return response.data;
  },

  // Get attendance by student ID and class ID (optimized for student class detail)
  getByHocVienAndLopId: async (hocVienId: number, lopId: number): Promise<DiemDanh[]> => {
    const response = await apiClient.get<DiemDanh[]>(`/DiemDanh/hoc-vien/${hocVienId}/lop/${lopId}`);
    return response.data;
  },

  // Get attendance by session and student
  getByBuoiHocAndHocVien: async (buoiHocId: number, hocVienId: number): Promise<DiemDanh> => {
    const response = await apiClient.get<DiemDanh>(`/DiemDanh/buoi-hoc/${buoiHocId}/hoc-vien/${hocVienId}`);
    return response.data;
  },

  // Get attendance by class ID
  getAttendanceByLopId: async (lopId: number): Promise<DiemDanh[]> => {
    const response = await apiClient.get<DiemDanh[]>(`/DiemDanh/attendance/lop/${lopId}`);
    return response.data;
  },

  // Get attendance rate by student and class
  getAttendanceRateByHocVien: async (hocVienId: number, lopId: number): Promise<number> => {
    const response = await apiClient.get<number>(`/DiemDanh/attendance-rate/hoc-vien/${hocVienId}/lop/${lopId}`);
    return response.data;
  },

  // Create attendance record
  create: async (diemDanh: Omit<DiemDanh, 'diemDanhID'>): Promise<DiemDanh> => {
    const response = await apiClient.post<DiemDanh>('/DiemDanh', diemDanh);
    return response.data;
  },

  // Create multiple attendance records (bulk create)
  createBulk: async (diemDanhList: Omit<DiemDanh, 'diemDanhID'>[]): Promise<DiemDanh[]> => {
    const response = await apiClient.post<DiemDanh[]>('/DiemDanh/bulk', diemDanhList);
    return response.data;
  },

  // Update attendance record
  update: async (id: number, diemDanh: DiemDanh): Promise<void> => {
    await apiClient.put(`/DiemDanh/${id}`, diemDanh);
  },

  // Delete attendance record
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/DiemDanh/${id}`);
  },
};

// DiemSo Service
export const diemSoService = {
  // Get all grades
  getAll: async (): Promise<DiemSo[]> => {
    const response = await apiClient.get<DiemSo[]>('/DiemSo');
    return response.data;
  },

  // Get grade by ID
  getById: async (id: number): Promise<DiemSo> => {
    const response = await apiClient.get<DiemSo>(`/DiemSo/${id}`);
    return response.data;
  },

  // Get grades by student ID
  getByHocVienId: async (hocVienId: number): Promise<DiemSo[]> => {
    const response = await apiClient.get<DiemSo[]>(`/DiemSo/hoc-vien/${hocVienId}`);
    return response.data;
  },

  // Get grades by class ID
  getByLopId: async (lopId: number): Promise<DiemSo[]> => {
    const response = await apiClient.get<DiemSo[]>(`/DiemSo/lop/${lopId}`);
    return response.data;
  },

  // Get grades by grade type
  getByLoaiDiem: async (loaiDiem: string): Promise<DiemSo[]> => {
    const response = await apiClient.get<DiemSo[]>(`/DiemSo/loai-diem/${loaiDiem}`);
    return response.data;
  },

  // Get grades by result
  getByKetQua: async (ketQua: string): Promise<DiemSo[]> => {
    const response = await apiClient.get<DiemSo[]>(`/DiemSo/ket-qua/${ketQua}`);
    return response.data;
  },

  // Get grade by student, class and grade type
  getByHocVienAndLopAndLoaiDiem: async (hocVienId: number, lopId: number, loaiDiem: string): Promise<DiemSo> => {
    const response = await apiClient.get<DiemSo>(`/DiemSo/hoc-vien/${hocVienId}/lop/${lopId}/loai-diem/${loaiDiem}`);
    return response.data;
  },

  // Get grades by student and class
  getGradesByHocVienAndLop: async (hocVienId: number, lopId: number): Promise<DiemSo[]> => {
    const response = await apiClient.get<DiemSo[]>(`/DiemSo/grades/hoc-vien/${hocVienId}/lop/${lopId}`);
    return response.data;
  },

  // Create grade
  create: async (diemSo: Omit<DiemSo, 'diemID'>): Promise<DiemSo> => {
    const response = await apiClient.post<DiemSo>('/DiemSo', diemSo);
    return response.data;
  },

  // Update grade
  update: async (id: number, diemSo: DiemSo): Promise<void> => {
    await apiClient.put(`/DiemSo/${id}`, diemSo);
  },

  // Delete grade
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/DiemSo/${id}`);
  },

  // Bulk create/update grades
  createBulk: async (diemSos: Omit<DiemSo, 'diemID'>[]): Promise<DiemSo[]> => {
    const response = await apiClient.post<DiemSo[]>('/DiemSo/bulk', diemSos);
    return response.data;
  },
};

// DangKyLop Service
export const dangKyLopService = {
  // Get all registrations
  getAll: async (): Promise<DangKyLop[]> => {
    const response = await apiClient.get<DangKyLop[]>('/DangKyLop');
    return response.data;
  },

  // Get registration by ID
  getById: async (id: number): Promise<DangKyLop> => {
    const response = await apiClient.get<DangKyLop>(`/DangKyLop/${id}`);
    return response.data;
  },

  // Get registrations by student ID
  getByHocVienId: async (hocVienId: number): Promise<DangKyLop[]> => {
    const response = await apiClient.get<DangKyLop[]>(`/DangKyLop/hoc-vien/${hocVienId}`);
    return response.data;
  },

  // Get registrations by class ID
  getByLopId: async (lopId: number): Promise<DangKyLop[]> => {
    const response = await apiClient.get<DangKyLop[]>(`/DangKyLop/lop/${lopId}`);
    return response.data;
  },

  // Get registrations by status
  getByTrangThai: async (trangThai: string): Promise<DangKyLop[]> => {
    const response = await apiClient.get<DangKyLop[]>(`/DangKyLop/trang-thai/${trangThai}`);
    return response.data;
  },

  // Get registrations by payment status
  getByTrangThaiThanhToan: async (trangThaiThanhToan: string): Promise<DangKyLop[]> => {
    const response = await apiClient.get<DangKyLop[]>(`/DangKyLop/trang-thai-thanh-toan/${trangThaiThanhToan}`);
    return response.data;
  },

  // Get registration by student and class
  getByHocVienAndLop: async (hocVienId: number, lopId: number): Promise<DangKyLop> => {
    const response = await apiClient.get<DangKyLop>(`/DangKyLop/hoc-vien/${hocVienId}/lop/${lopId}`);
    return response.data;
  },

  // Create registration
  create: async (dangKyLop: Omit<DangKyLop, 'dangKyID'>): Promise<DangKyLop> => {
    const response = await apiClient.post<DangKyLop>('/DangKyLop', dangKyLop);
    return response.data;
  },

  // Update registration
  update: async (id: number, dangKyLop: DangKyLop): Promise<void> => {
    await apiClient.put(`/DangKyLop/${id}`, dangKyLop);
  },

  // Delete registration
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/DangKyLop/${id}`);
  },
};

export interface ThongBao {
  tBID: number;
  nguoiGui?: string | null;
  nguoiNhanID?: number | null;
  loaiNguoiNhan?: string | null;
  noiDung: string;
  ngayGui: string;
}

// Backend response mapping interface
interface HocVienResponse {
  maHV: number;
  maTK?: number | null;
  hoTen: string;
  ngaySinh: string | null;
  email: string | null;
  sdt: string | null;
  taiKhoanVi: number;
}

// TaiKhoan Service
export const taiKhoanService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('🔐 Login request:', credentials);
    try {
      const response = await apiClient.post<any>('/TaiKhoan/login', credentials);
      console.log('✅ Login response:', response.data);
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', response.headers);

      const raw = response.data;
      console.log('🔍 Raw response data:', raw);

      // Chuẩn hóa dữ liệu trả về thành LoginResponse
      const mapped: LoginResponse = {
        token: 'mock-token',
        user: {
          taiKhoanID: raw.taiKhoanID || raw.TaiKhoanID,
          email: raw.email || raw.Email,
          vaiTro: raw.vaiTro || raw.VaiTro,
          // Thêm các trường bổ sung nếu có
          ...(raw.giangVienID && { giangVienID: raw.giangVienID }),
          ...(raw.hocVienID && { hocVienID: raw.hocVienID }),
          ...(raw.hoTen && { hoTen: raw.hoTen }),
          ...(raw.chuyenMon && { chuyenMon: raw.chuyenMon }),
        },
      };
      console.log('🎯 Mapped response:', mapped);
      return mapped;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },

  // Get all accounts
  getAll: async (): Promise<TaiKhoan[]> => {
    const response = await apiClient.get<TaiKhoan[]>('/TaiKhoan');
    return response.data;
  },

  // Get account by ID
  getById: async (id: number): Promise<TaiKhoan> => {
    const response = await apiClient.get<TaiKhoan>(`/TaiKhoan/${id}`);
    return response.data;
  },

  // Create account
  create: async (taiKhoan: Omit<TaiKhoan, 'taiKhoanID'>): Promise<TaiKhoan> => {
    const response = await apiClient.post<TaiKhoan>('/TaiKhoan', taiKhoan);
    return response.data;
  },

  // Register student account only
  registerHocVien: async (data: RegisterHocVienRequest): Promise<{ taiKhoan: TaiKhoan; hocVien: HocVien; }> => {
    const response = await apiClient.post<{ taiKhoan: TaiKhoan; hocVien: HocVien; }>(
      '/TaiKhoan/register/hocvien',
      {
        ...data,
        username: data.username ?? data.email,
        vaiTro: 'HocVien'
      }
    );
    return response.data;
  },

  // Update account
  update: async (id: number, taiKhoan: TaiKhoan): Promise<void> => {
    await apiClient.put(`/TaiKhoan/${id}`, taiKhoan);
  },

  // Delete account
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/TaiKhoan/${id}`);
  },
};

// KhoaHoc Service
export const khoaHocService = {
  // Get all courses
  getAll: async (): Promise<KhoaHoc[]> => {
    const response = await apiClient.get<KhoaHoc[]>('/KhoaHoc');
    return response.data;
  },

  // Get active courses
  getActive: async (): Promise<KhoaHoc[]> => {
    const response = await apiClient.get<KhoaHoc[]>('/KhoaHoc/active');
    return response.data;
  },

  // Get course by ID
  getById: async (id: number): Promise<KhoaHoc> => {
    const response = await apiClient.get<KhoaHoc>(`/KhoaHoc/${id}`);
    return response.data;
  },

  // Get classes by course
  getClasses: async (id: number): Promise<LopHoc[]> => {
    const response = await apiClient.get<LopHoc[]>(`/KhoaHoc/${id}/lophoc`);
    return response.data;
  },

  // Create course
  create: async (khoaHoc: Omit<KhoaHoc, 'khoaHocID'>): Promise<KhoaHoc> => {
    const response = await apiClient.post<KhoaHoc>('/KhoaHoc', khoaHoc);
    return response.data;
  },

  // Update course
  update: async (id: number, khoaHoc: KhoaHoc): Promise<void> => {
    await apiClient.put(`/KhoaHoc/${id}`, khoaHoc);
  },

  // Delete course
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/KhoaHoc/${id}`);
  },
};

// BuoiHoc Service
export const buoiHocService = {
  // Get all sessions
  getAll: async (): Promise<BuoiHoc[]> => {
    const response = await apiClient.get<BuoiHoc[]>('/BuoiHoc');
    return response.data;
  },

  // Get session by ID
  getById: async (id: number): Promise<BuoiHoc> => {
    const response = await apiClient.get<BuoiHoc>(`/BuoiHoc/${id}`);
    return response.data;
  },

  // Get sessions by class ID
  getByLopId: async (lopId: number): Promise<BuoiHoc[]> => {
    const response = await apiClient.get<BuoiHoc[]>(`/BuoiHoc/lop/${lopId}`);
    return response.data;
  },

  // Get sessions by date
  getByNgayHoc: async (ngayHoc: string): Promise<BuoiHoc[]> => {
    const response = await apiClient.get<BuoiHoc[]>('/BuoiHoc/ngay-hoc/' + ngayHoc);
    return response.data;
  },

  // Get sessions by status
  getByTrangThai: async (trangThai: string): Promise<BuoiHoc[]> => {
    const response = await apiClient.get<BuoiHoc[]>(`/BuoiHoc/trang-thai/${trangThai}`);
    return response.data;
  },

  // Get sessions by substitute lecturer
  getByGiangVienThayTheId: async (giangVienId: number): Promise<BuoiHoc[]> => {
    const response = await apiClient.get<BuoiHoc[]>(`/BuoiHoc/giang-vien-thay-the/${giangVienId}`);
    return response.data;
  },

  // Get sessions by location
  getByDiaDiemId: async (diaDiemId: number): Promise<BuoiHoc[]> => {
    const response = await apiClient.get<BuoiHoc[]>(`/BuoiHoc/dia-diem/${diaDiemId}`);
    return response.data;
  },

  // Get schedule by date range
  getScheduleByDateRange: async (startDate: string, endDate: string): Promise<BuoiHoc[]> => {
    const response = await apiClient.get<BuoiHoc[]>('/BuoiHoc/schedule', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Create session
  create: async (buoiHoc: Omit<BuoiHoc, 'buoiHocID'>): Promise<BuoiHoc> => {
    const response = await apiClient.post<BuoiHoc>('/BuoiHoc', buoiHoc);
    return response.data;
  },

  // Update session
  update: async (id: number, buoiHoc: BuoiHoc): Promise<void> => {
    await apiClient.put(`/BuoiHoc/${id}`, buoiHoc);
  },

  // Delete session
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/BuoiHoc/${id}`);
  },
};

// LopHoc Service
export const lopHocService = {
  // Get all classes
  getAll: async (): Promise<LopHoc[]> => {
    try {
      console.log('🔄 Đang gọi API LopHoc...');
      const response = await apiClient.get<any[]>('/LopHoc');
      console.log('📚 API Response for LopHoc:', response.data);

      if (!response.data) {
        console.warn('⚠️ API trả về null hoặc undefined');
        return [];
      }

      if (!Array.isArray(response.data)) {
        console.warn('⚠️ API trả về không phải array:', typeof response.data);
        return [];
      }

      if (response.data.length === 0) {
        console.log('📭 Không có lớp học nào trong database');
        return [];
      }

      // Map API response to LopHoc interface với error handling tốt hơn
      const mappedLopHocs: LopHoc[] = response.data
        .filter(item => item && typeof item === 'object')
        .map((item, index) => {
          try {
            return {
              lopID: item.lopID || item.maLop || index + 1,
              khoaHocID: item.khoaHocID || item.maKH || 0,
              giangVienID: item.giangVienID || item.maGV || 0,
              diaDiemID: item.diaDiemID || item.maDiaDiem || null,
              ngayBatDau: item.ngayBatDau || new Date().toISOString().split('T')[0],
              ngayKetThuc: item.ngayKetThuc || null,
              caHoc: item.caHoc || null,
              ngayHocTrongTuan: item.ngayHocTrongTuan || null,
              donGiaBuoiDay: item.donGiaBuoiDay || null,
              thoiLuongGio: item.thoiLuongGio || 1.5,
              soLuongToiDa: item.soLuongToiDa || item.sucChua || null,
              trangThai: item.trangThai || 'ChuaBatDau'
            };
          } catch (mapError) {
            console.error(`❌ Lỗi khi map item ${index}:`, mapError);
            return null;
          }
        })
        .filter(item => item !== null) as LopHoc[];

      console.log('✅ Mapped LopHoc data:', mappedLopHocs);
      return mappedLopHocs;
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy danh sách lớp học:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });

      // Nếu lỗi 401, thử gọi lại mà không cần token
      if (error.response?.status === 401) {
        console.log('🔄 Thử gọi lại API mà không cần authentication...');
        try {
          const directResponse = await axios.get<any[]>(`${API_BASE_URL}/LopHoc`, {
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('✅ Gọi trực tiếp thành công:', directResponse.data);
          return directResponse.data || [];
        } catch (directError) {
          console.error('❌ Gọi trực tiếp cũng thất bại:', directError);
        }
      }

      throw error;
    }
  },

  // Get active classes
  getActive: async (): Promise<LopHoc[]> => {
    const response = await apiClient.get<LopHoc[]>('/LopHoc/active');
    return response.data;
  },

  // Get class by ID
  getById: async (id: number): Promise<LopHoc> => {
    const response = await apiClient.get<LopHoc>(`/LopHoc/${id}`);
    return response.data;
  },

  // Get students by class
  getStudents: async (id: number): Promise<HocVien[]> => {
    const response = await apiClient.get<HocVien[]>(`/LopHoc/${id}/hocvien`);
    return response.data;
  },

  // Get student count by class
  getStudentCount: async (id: number): Promise<number> => {
    const response = await apiClient.get<number>(`/LopHoc/${id}/soluonghocvien`);
    return response.data;
  },

  // Create class
  create: async (lopHoc: Omit<LopHoc, 'lopID'>): Promise<LopHoc> => {
    console.log('🚀 Tạo lớp học mới:', lopHoc);
    try {
      const response = await apiClient.post<LopHoc>('/LopHoc', lopHoc);
      console.log('✅ Tạo lớp học thành công:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Lỗi khi tạo lớp học:', error);
      throw error;
    }
  },

  // Update class
  update: async (id: number, lopHoc: LopHoc): Promise<void> => {
    console.log('🔄 Cập nhật lớp học:', id, lopHoc);
    try {
      // Gửi trực tiếp object LopHoc (backend sẽ tự set lopID từ URL)
      console.log('📤 Gửi dữ liệu cập nhật:', lopHoc);
      await apiClient.put(`/LopHoc/${id}`, lopHoc);
      console.log('✅ Cập nhật lớp học thành công');
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật lớp học:', error);
      throw error;
    }
  },

  // Delete class
  delete: async (id: number): Promise<void> => {
    console.log('🗑️ Xóa lớp học:', id);
    try {
      await apiClient.delete(`/LopHoc/${id}`);
      console.log('✅ Xóa lớp học thành công');
    } catch (error) {
      console.error('❌ Lỗi khi xóa lớp học:', error);
      throw error;
    }
  },

  // Get paginated classes by lecturer with filters
  getPaginatedByLecturer: async (
    giangVienID: number,
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = "",
    statusFilter: string = "all"
  ): Promise<{ data: LopHoc[]; pagination: any }> => {
    try {
      console.log('🔄 Đang gọi API phân trang cho giảng viên:', { giangVienID, page, pageSize, searchTerm, statusFilter });

      const response = await apiClient.get(`/LopHoc/lecturer/${giangVienID}/paginated`, {
        params: {
          page,
          pageSize,
          searchTerm,
          statusFilter
        }
      });

      console.log('📚 API Response for paginated lecturer classes:', response.data);

      const { data, pagination } = response.data;

      // Map API response to LopHoc interface
      const mappedLopHocs: LopHoc[] = data.map((item: any) => ({
        lopID: item.lopID,
        khoaHocID: item.khoaHocID,
        giangVienID: item.giangVienID,
        diaDiemID: item.diaDiemID,
        ngayBatDau: item.ngayBatDau,
        ngayKetThuc: item.ngayKetThuc || null,
        caHoc: item.caHoc || null,
        ngayHocTrongTuan: item.ngayHocTrongTuan || null,
        donGiaBuoiDay: item.donGiaBuoiDay,
        thoiLuongGio: item.thoiLuongGio,
        soLuongToiDa: item.soLuongToiDa,
        trangThai: item.trangThai
      }));

      console.log('✅ Mapped paginated LopHoc data:', mappedLopHocs);

      return {
        data: mappedLopHocs,
        pagination: pagination
      };
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy danh sách lớp học phân trang:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },

  // Get paginated classes by student with filters
  getPaginatedByStudent: async (
    hocVienID: number,
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = "",
    statusFilter: string = "all"
  ): Promise<{ data: LopHoc[]; pagination: any }> => {
    try {
      console.log('🔄 Đang gọi API phân trang cho học viên:', { hocVienID, page, pageSize, searchTerm, statusFilter });

      const response = await apiClient.get(`/LopHoc/student/${hocVienID}/paginated`, {
        params: {
          page,
          pageSize,
          searchTerm,
          statusFilter
        }
      });

      console.log('📚 API Response for paginated student classes:', response.data);

      const { data, pagination } = response.data;

      // Map API response to LopHoc interface
      const mappedLopHocs: LopHoc[] = data.map((item: any) => ({
        lopID: item.lopID,
        khoaHocID: item.khoaHocID,
        giangVienID: item.giangVienID,
        diaDiemID: item.diaDiemID,
        ngayBatDau: item.ngayBatDau,
        ngayKetThuc: item.ngayKetThuc || null,
        caHoc: item.caHoc || null,
        ngayHocTrongTuan: item.ngayHocTrongTuan || null,
        donGiaBuoiDay: item.donGiaBuoiDay,
        thoiLuongGio: item.thoiLuongGio,
        soLuongToiDa: item.soLuongToiDa,
        trangThai: item.trangThai
      }));

      console.log('✅ Mapped paginated LopHoc data for student:', mappedLopHocs);

      return {
        data: mappedLopHocs,
        pagination: pagination
      };
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy danh sách lớp học phân trang cho học viên:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },

  // Get students with stats for a class (optimized endpoint)
  getStudentsWithStats: async (lopId: number): Promise<{
    lopId: number;
    tenKhoaHoc: string;
    tongSoBuoi: number;
    students: Array<{
      dangKyID: number;
      hocVienID: number;
      lopID: number;
      ngayDangKy: string;
      trangThaiDangKy: string;
      trangThaiThanhToan: string;
      hoTen: string;
      email?: string;
      soDienThoai?: string;
      diemTrungBinh: number;
      tiLeDiemDanh: number;
      soBuoiDaHoc: number;
      tongSoBuoi: number;
    }>;
    summary: {
      totalStudents: number;
      averageAttendanceRate: number;
      averageGrade: number;
    };
  }> => {
    try {
      console.log('🔄 Đang gọi API lấy học viên với thống kê cho lớp:', lopId);

      const response = await apiClient.get(`/LopHoc/${lopId}/students-with-stats`);
      const data = response.data;

      console.log('✅ API Response for students with stats:', data);

      return data;
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy dữ liệu học viên với thống kê:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },
};

// GiangVien Service
export const giangVienService = {
  // Get all lecturers
  getAll: async (): Promise<GiangVienWithEmailDto[]> => {
    const response = await apiClient.get<GiangVienWithEmailDto[]>('/GiangVien');
    return response.data;
  },

  // Get lecturer by ID
  getById: async (id: number): Promise<GiangVien> => {
    const response = await apiClient.get<GiangVien>(`/GiangVien/${id}`);
    return response.data;
  },

  // Get lecturer by email
  getByEmail: async (email: string): Promise<GiangVien> => {
    const response = await apiClient.get<GiangVien>(`/GiangVien/email/${email}`);
    return response.data;
  },

  // Get lecturers by specialty
  getBySpecialty: async (chuyenMon: string): Promise<GiangVien[]> => {
    const response = await apiClient.get<GiangVien[]>(`/GiangVien/chuyenmon/${chuyenMon}`);
    return response.data;
  },

  // Get classes by lecturer
  getClasses: async (id: number): Promise<LopHoc[]> => {
    const response = await apiClient.get<LopHoc[]>(`/GiangVien/${id}/lophoc`);
    return response.data;
  },

  // Create lecturer
  create: async (giangVien: Omit<GiangVien, 'giangVienID'>): Promise<GiangVien> => {
    const response = await apiClient.post<GiangVien>('/GiangVien', giangVien);
    return response.data;
  },

  // Update lecturer
  update: async (id: number, giangVien: GiangVien): Promise<void> => {
    await apiClient.put(`/GiangVien/${id}`, giangVien);
  },

  // Delete lecturer
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/GiangVien/${id}`);
  },

  // Create lecturer with account
  createWithAccount: async (taiKhoanData: { email: string; matKhau: string; vaiTro: string }, giangVienData: { hoTen: string; chuyenMon: string; taiKhoanID: number }): Promise<GiangVienWithEmailDto> => {
    const response = await apiClient.post<GiangVienWithEmailDto>('/GiangVien/with-account', {
      email: taiKhoanData.email,
      matKhau: taiKhoanData.matKhau,
      hoTen: giangVienData.hoTen,
      chuyenMon: giangVienData.chuyenMon
    });
    return response.data;
  },
};

// HocVien Service
export const hocVienService = {
  // Get all students
  getAll: async (): Promise<HocVien[]> => {
    const response = await apiClient.get<HocVien[]>('/HocVien');
    return response.data;
  },

  // Get student by ID
  getById: async (id: number): Promise<HocVien> => {
    const response = await apiClient.get<HocVien>(`/HocVien/${id}`);
    return response.data;
  },

  // Get student by email
  getByEmail: async (email: string): Promise<HocVien> => {
    const response = await apiClient.get<HocVien>(`/HocVien/email/${email}`);
    return response.data;
  },

  // Create student
  create: async (hocVien: Omit<HocVien, 'hocVienID'>): Promise<HocVien> => {
    const response = await apiClient.post<HocVien>('/HocVien', hocVien);
    return response.data;
  },

  // Update student
  update: async (id: number, hocVien: HocVien): Promise<void> => {
    await apiClient.put(`/HocVien/${id}`, hocVien);
  },

  // Delete student
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/HocVien/${id}`);
  },
};

// ChiPhi Service
export const chiPhiService = {
  // Get all costs
  getAll: async (): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>('/ChiPhi');
    return response.data;
  },

  // Get cost by ID
  getById: async (id: number): Promise<ChiPhi> => {
    const response = await apiClient.get<ChiPhi>(`/ChiPhi/${id}`);
    return response.data;
  },

  // Get costs by class ID
  getByLopId: async (lopId: number): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>(`/ChiPhi/lop/${lopId}`);
    return response.data;
  },

  // Get costs by course ID
  getByKhoaHocId: async (khoaHocId: number): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>(`/ChiPhi/khoa-hoc/${khoaHocId}`);
    return response.data;
  },

  // Get costs by location ID
  getByDiaDiemId: async (diaDiemId: number): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>(`/ChiPhi/dia-diem/${diaDiemId}`);
    return response.data;
  },

  // Get costs by type
  getByLoai: async (loai: string): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>(`/ChiPhi/loai/${loai}`);
    return response.data;
  },

  // Get costs by sub type
  getBySubLoai: async (subLoai: string): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>(`/ChiPhi/sub-loai/${subLoai}`);
    return response.data;
  },

  // Get costs by allocation method
  getByAllocationMethod: async (allocationMethod: string): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>(`/ChiPhi/allocation-method/${allocationMethod}`);
    return response.data;
  },

  // Get costs by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>('/ChiPhi/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get total cost by class ID
  getTotalCostByLopId: async (lopId: number): Promise<number> => {
    const response = await apiClient.get<number>(`/ChiPhi/total-cost/lop/${lopId}`);
    return response.data;
  },

  // Get total cost by course ID
  getTotalCostByKhoaHocId: async (khoaHocId: number): Promise<number> => {
    const response = await apiClient.get<number>(`/ChiPhi/total-cost/khoa-hoc/${khoaHocId}`);
    return response.data;
  },

  // Get recurring costs
  getRecurringCosts: async (): Promise<ChiPhi[]> => {
    const response = await apiClient.get<ChiPhi[]>('/ChiPhi/recurring');
    return response.data;
  },

  // Create cost
  create: async (chiPhi: Omit<ChiPhi, 'chiPhiID'>): Promise<ChiPhi> => {
    const response = await apiClient.post<ChiPhi>('/ChiPhi', chiPhi);
    return response.data;
  },

  // Update cost
  update: async (id: number, chiPhi: ChiPhi): Promise<void> => {
    await apiClient.put(`/ChiPhi/${id}`, chiPhi);
  },

  // Delete cost
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ChiPhi/${id}`);
  },

  // Import costs from file
  importFromFile: async (file: File): Promise<ChiPhiImportResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ChiPhiImportResult>('/ChiPhi/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Preview import data from file
  previewImportFromFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<any>('/ChiPhi/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ThueMatBang Service
export const thueMatBangService = {
  // Get all rental contracts
  getAll: async (): Promise<ThueMatBang[]> => {
    const response = await apiClient.get<ThueMatBang[]>('/ThueMatBang');
    return response.data;
  },

  // Get rental contract by ID
  getById: async (id: number): Promise<ThueMatBang> => {
    const response = await apiClient.get<ThueMatBang>(`/ThueMatBang/${id}`);
    return response.data;
  },

  // Get rental contracts by location ID
  getByDiaDiemId: async (diaDiemId: number): Promise<ThueMatBang[]> => {
    const response = await apiClient.get<ThueMatBang[]>(`/ThueMatBang/dia-diem/${diaDiemId}`);
    return response.data;
  },

  // Get active contracts
  getActiveContracts: async (): Promise<ThueMatBang[]> => {
    const response = await apiClient.get<ThueMatBang[]>('/ThueMatBang/active-contracts');
    return response.data;
  },

  // Get expiring contracts
  getExpiringContracts: async (beforeDate: string): Promise<ThueMatBang[]> => {
    const response = await apiClient.get<ThueMatBang[]>('/ThueMatBang/expiring-contracts', {
      params: { beforeDate }
    });
    return response.data;
  },

  // Get total rent by location ID
  getTotalRentByDiaDiem: async (diaDiemId: number): Promise<number> => {
    const response = await apiClient.get<number>(`/ThueMatBang/total-rent/dia-diem/${diaDiemId}`);
    return response.data;
  },

  // Get contracts by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<ThueMatBang[]> => {
    const response = await apiClient.get<ThueMatBang[]>('/ThueMatBang/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Create rental contract
  create: async (thueMatBang: Omit<ThueMatBang, 'thueID'>): Promise<ThueMatBang> => {
    const response = await apiClient.post<ThueMatBang>('/ThueMatBang', thueMatBang);
    return response.data;
  },

  // Update rental contract
  update: async (id: number, thueMatBang: ThueMatBang): Promise<void> => {
    await apiClient.put(`/ThueMatBang/${id}`, thueMatBang);
  },

  // Delete rental contract
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ThueMatBang/${id}`);
  },
};

// BaoLuu Service
export const baoLuuService = {
  // Get all reservations
  getAll: async (): Promise<BaoLuu[]> => {
    const response = await apiClient.get<BaoLuu[]>('/BaoLuu');
    return response.data;
  },

  // Get reservation by ID
  getById: async (id: number): Promise<BaoLuu> => {
    const response = await apiClient.get<BaoLuu>(`/BaoLuu/${id}`);
    return response.data;
  },

  // Get reservations by registration ID
  getByDangKyId: async (dangKyId: number): Promise<BaoLuu[]> => {
    const response = await apiClient.get<BaoLuu[]>(`/BaoLuu/dang-ky/${dangKyId}`);
    return response.data;
  },

  // Get reservations by status
  getByTrangThai: async (trangThai: string): Promise<BaoLuu[]> => {
    const response = await apiClient.get<BaoLuu[]>(`/BaoLuu/trang-thai/${trangThai}`);
    return response.data;
  },

  // Get expired reservations
  getExpiredBaoLuu: async (): Promise<BaoLuu[]> => {
    const response = await apiClient.get<BaoLuu[]>('/BaoLuu/expired');
    return response.data;
  },

  // Get pending approval reservations
  getPendingApproval: async (): Promise<BaoLuu[]> => {
    const response = await apiClient.get<BaoLuu[]>('/BaoLuu/pending-approval');
    return response.data;
  },

  // Get active reservation by registration ID
  getActiveBaoLuuByDangKyId: async (dangKyId: number): Promise<BaoLuu> => {
    const response = await apiClient.get<BaoLuu>(`/BaoLuu/active/dang-ky/${dangKyId}`);
    return response.data;
  },

  // Create reservation
  create: async (baoLuu: Omit<BaoLuu, 'baoLuuID'>): Promise<BaoLuu> => {
    const response = await apiClient.post<BaoLuu>('/BaoLuu', baoLuu);
    return response.data;
  },

  // Update reservation
  update: async (id: number, baoLuu: BaoLuu): Promise<void> => {
    await apiClient.put(`/BaoLuu/${id}`, baoLuu);
  },

  // Delete reservation
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/BaoLuu/${id}`);
  },

  // Approve reservation
  approve: async (id: number, nguoiDuyet: string): Promise<void> => {
    await apiClient.put(`/BaoLuu/${id}/approve`, { nguoiDuyet });
  },

  // Reject reservation
  reject: async (id: number, lyDo: string): Promise<void> => {
    await apiClient.put(`/BaoLuu/${id}/reject`, { lyDo });
  },
};

// BaoCao Service
export const baoCaoService = {
  // Tạo báo cáo mới
  taoBaoCao: async (requestData: any): Promise<any> => {
    console.log('🚀 Gửi request tạo báo cáo:', requestData);
    try {
      const response = await apiClient.post<any>('/BaoCao/tao-bao-cao', requestData);
      console.log('✅ Nhận response báo cáo:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Lỗi tạo báo cáo:', error);
      throw error;
    }
  },

  // Lấy báo cáo theo ID
  layBaoCao: async (baoCaoId: number): Promise<any> => {
    const response = await apiClient.get<any>(`/BaoCao/${baoCaoId}`);
    return response.data;
  },

  // Lấy danh sách báo cáo
  layDanhSachBaoCao: async (page: number = 1, pageSize: number = 20): Promise<any> => {
    const response = await apiClient.get<any>('/BaoCao/danh-sach', {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Lấy báo cáo theo loại
  layBaoCaoTheoLoai: async (loaiBaoCao: string, page: number = 1, pageSize: number = 20): Promise<any> => {
    const response = await apiClient.get<any>(`/BaoCao/theo-loai/${loaiBaoCao}`, {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Xóa báo cáo
  xoaBaoCao: async (baoCaoId: number): Promise<any> => {
    const response = await apiClient.delete<any>(`/BaoCao/${baoCaoId}`);
    return response.data;
  },

  // Lấy báo cáo gần đây
  layBaoCaoGanDay: async (count: number = 10): Promise<any> => {
    const response = await apiClient.get<any>('/BaoCao/gan-day', {
      params: { count }
    });
    return response.data;
  },

  // Báo cáo tài chính tổng hợp
  baoCaoTaiChinhTongHop: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/tai-chinh-tong-hop', requestData);
    return response.data;
  },

  // Báo cáo doanh thu chi tiết
  baoCaoDoanhThuChiTiet: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/doanh-thu-chi-tiet', requestData);
    return response.data;
  },

  // Báo cáo chi phí chi tiết
  baoCaoChiPhiChiTiet: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/chi-phi-chi-tiet', requestData);
    return response.data;
  },

  // Báo cáo lợi nhuận gộp theo lớp
  baoCaoLoiNhuanGopTheoLop: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/loi-nhuan-gop-lop', requestData);
    return response.data;
  },

  // Báo cáo lợi nhuận ròng theo lớp
  baoCaoLoiNhuanRongTheoLop: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/loi-nhuan-rong-lop', requestData);
    return response.data;
  },

  // Báo cáo tỷ lệ đạt
  baoCaoTyLeDat: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/ty-le-dat', requestData);
    return response.data;
  },

  // Báo cáo thống kê điểm
  baoCaoThongKeDiem: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/thong-ke-diem', requestData);
    return response.data;
  },

  // Báo cáo hiệu suất cơ sở
  baoCaoHieuSuatCoSo: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/hieu-suat-co-so', requestData);
    return response.data;
  },

  // Báo cáo top khóa học
  baoCaoTopKhoaHoc: async (requestData: any): Promise<any> => {
    const response = await apiClient.post<any>('/BaoCao/top-khoa-hoc', requestData);
    return response.data;
  },

  // Lấy danh sách loại báo cáo
  getLoaiBaoCao: async (): Promise<any> => {
    const response = await apiClient.get<any>('/BaoCao/loai-bao-cao');
    return response.data;
  },
};

// ThongBao Service
export const thongBaoService = {
  // Get all notifications
  getAll: async (): Promise<ThongBao[]> => {
    const response = await apiClient.get<ThongBao[]>('/ThongBao');
    return response.data;
  },

  // Get notification by ID
  getById: async (id: number): Promise<ThongBao> => {
    const response = await apiClient.get<ThongBao>(`/ThongBao/${id}`);
    return response.data;
  },

  // Get notifications by recipient ID
  getByNguoiNhan: async (nguoiNhanId: number): Promise<ThongBao[]> => {
    const response = await apiClient.get<ThongBao[]>(`/ThongBao/nguoi-nhan/${nguoiNhanId}`);
    return response.data;
  },

  // Get notifications by recipient and type
  getByNguoiNhanAndLoai: async (nguoiNhanId: number, loaiNguoiNhan: string): Promise<ThongBao[]> => {
    const response = await apiClient.get<ThongBao[]>(`/ThongBao/nguoi-nhan/${nguoiNhanId}/loai/${loaiNguoiNhan}`);
    return response.data;
  },

  // Get notifications by recipient type
  getByLoaiNguoiNhan: async (loaiNguoiNhan: string): Promise<ThongBao[]> => {
    const response = await apiClient.get<ThongBao[]>(`/ThongBao/loai-nguoi-nhan/${loaiNguoiNhan}`);
    return response.data;
  },

  // Get recent notifications
  getRecent: async (count: number = 10): Promise<ThongBao[]> => {
    const response = await apiClient.get<ThongBao[]>('/ThongBao/recent', {
      params: { count }
    });
    return response.data;
  },

  // Create notification
  create: async (thongBao: Omit<ThongBao, 'tBID'>): Promise<ThongBao> => {
    const response = await apiClient.post<ThongBao>('/ThongBao', thongBao);
    return response.data;
  },

  // Update notification
  update: async (id: number, thongBao: ThongBao): Promise<void> => {
    await apiClient.put(`/ThongBao/${id}`, thongBao);
  },

  // Delete notification
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ThongBao/${id}`);
  },

  // Send system-wide notification
  sendSystemNotification: async (noiDung: string): Promise<ThongBao> => {
    const response = await apiClient.post<ThongBao>('/ThongBao/system', { NoiDung: noiDung });
    return response.data;
  },

  // Send class notification (sends to both students and lecturer)
  sendClassNotification: async (lopId: number, noiDung: string): Promise<ThongBao> => {
    const response = await apiClient.post<ThongBao>('/ThongBao/class', { LopId: lopId, NoiDung: noiDung });
    return response.data;
  },

  // Send personal notification
  sendPersonalNotification: async (nguoiNhanId: number, noiDung: string): Promise<ThongBao> => {
    const response = await apiClient.post<ThongBao>('/ThongBao/personal', { NguoiNhanId: nguoiNhanId, NoiDung: noiDung });
    return response.data;
  },
};

export default apiClient;
