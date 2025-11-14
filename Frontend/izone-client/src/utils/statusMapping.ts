/**
 * Utility functions for mapping database status values to display-friendly Vietnamese text
 * These functions convert abbreviated status codes (without accents) to proper Vietnamese with accents
 */

// Mapping for LopHoc.TrangThai
export const mapLopHocStatus = (status: string | null): string => {
  if (!status) return 'Chưa xác định';

  switch (status.toLowerCase()) {
    case 'chuabatdau':
      return 'Chưa bắt đầu';
    case 'dangdienra':
      return 'Đang diễn ra';
    case 'daketthuc':
      return 'Đã kết thúc';
    case 'dahuy':
      return 'Đã hủy';
    default:
      return status; // Return original if no mapping found
  }
};

// Mapping for DangKyLop.TrangThaiDangKy
export const mapTrangThaiDangKy = (status: string | null): string => {
  if (!status) return 'Chưa xác định';

  switch (status.toLowerCase()) {
    case 'danghoc':
      return 'Đang học';
    case 'dabaoluu':
      return 'Đã bảo lưu';
    case 'dahoanthanh':
      return 'Đã hoàn thành';
    case 'dahuy':
      return 'Đã hủy';
    default:
      return status;
  }
};

// Mapping for DangKyLop.TrangThaiThanhToan
export const mapTrangThaiThanhToan = (status: string | null): string => {
  if (!status) return 'Chưa xác định';

  switch (status.toLowerCase()) {
    case 'chuathanhtoan':
      return 'Chưa thanh toán';
    case 'dathanhtoan':
      return 'Đã thanh toán';
    case 'thanhtoanthieu':
      return 'Thiếu thanh toán';
    default:
      return status;
  }
};

// Mapping for ThanhToan.Status (if needed for display)
export const mapThanhToanStatus = (status: string | null): string => {
  if (!status) return 'Chưa xác định';

  switch (status.toLowerCase()) {
    case 'pending':
      return 'Đang chờ';
    case 'success':
      return 'Thành công';
    case 'failed':
      return 'Thất bại';
    case 'refunded':
      return 'Hoàn tiền';
    default:
      return status;
  }
};

// Mapping for BuoiHoc.TrangThai
export const mapBuoiHocStatus = (status: string | null): string => {
  if (!status) return 'Chưa xác định';

  switch (status.toLowerCase()) {
    case 'chuadienra':
      return 'Chưa diễn ra';
    case 'dangdienra':
      return 'Đang diễn ra';
    case 'dadienra':
      return 'Đã diễn ra';
    case 'dahuy':
      return 'Đã hủy';
    default:
      return status;
  }
};

// Mapping for BaoLuu.TrangThai
export const mapBaoLuuStatus = (status: string | null): string => {
  if (!status) return 'Chưa xác định';

  switch (status.toLowerCase()) {
    case 'dangchoduyet':
      return 'Đang chờ duyệt';
    case 'daduyet':
      return 'Đã duyệt';
    case 'dasudung':
      return 'Đã sử dụng';
    case 'tuchoi':
      return 'Từ chối';
    case 'hethan':
      return 'Hết hạn';
    default:
      return status;
  }
};

// Mapping for ChiPhi.LoaiChiPhi
export const mapLoaiChiPhi = (loaiChiPhi: string | null): string => {
  if (!loaiChiPhi) return 'Chưa xác định';

  switch (loaiChiPhi.toLowerCase()) {
    case 'luonggv':
      return 'Lương giảng viên';
    case 'luongnv':
      return 'Lương nhân viên';
    case 'tailieu':
      return 'Tài liệu';
    case 'marketing':
      return 'Marketing';
    case 'matbang':
      return 'Mặt bằng';
    case 'utilities':
      return 'Tiện ích';
    case 'baohiem':
      return 'Bảo hiểm';
    case 'thue':
      return 'Thuế';
    case 'baotri':
      return 'Bảo trì';
    case 'congnghe':
      return 'Công nghệ';
    case 'sukien':
      return 'Sự kiện';
    case 'khac':
      return 'Khác';
    default:
      return loaiChiPhi;
  }
};

// Mapping for ChiPhi.NguonGoc
export const mapNguonGoc = (nguonGoc: string | null): string => {
  if (!nguonGoc) return 'Chưa xác định';

  switch (nguonGoc.toLowerCase()) {
    case 'nhaptay':
      return 'Nhập tay';
    case 'tudong':
      return 'Tự động';
    default:
      return nguonGoc;
  }
};

// Mapping for DiemSo.LoaiDiem
export const mapLoaiDiem = (loaiDiem: string | null): string => {
  if (!loaiDiem) return 'Chưa xác định';

  switch (loaiDiem.toLowerCase()) {
    case 'giuaky':
      return 'Giữa kỳ';
    case 'cuoiky':
      return 'Cuối kỳ';
    default:
      return loaiDiem;
  }
};

// Mapping for DiemSo.KetQua
export const mapKetQuaDiem = (ketQua: string | null): string => {
  if (!ketQua) return 'Chưa có';

  switch (ketQua.toLowerCase()) {
    case 'dat':
      return 'Đạt';
    case 'truot':
      return 'Trượt';
    case 'chuaco':
      return 'Chưa có';
    default:
      return ketQua;
  }
};

// Mapping for TaiKhoan.VaiTro
export const mapVaiTro = (vaiTro: string | null): string => {
  if (!vaiTro) return 'Chưa xác định';

  switch (vaiTro.toLowerCase()) {
    case 'admin':
      return 'Quản trị viên';
    case 'giangvien':
      return 'Giảng viên';
    case 'hocvien':
      return 'Học viên';
    default:
      return vaiTro;
  }
};

// Generic status mapping function that tries to map based on context
export const mapStatus = (status: string | null, type: 'lophoc' | 'dangky' | 'thanhtoan' | 'buoihoc' | 'baoluu' | 'diem' | 'payment' = 'lophoc'): string => {
  switch (type) {
    case 'lophoc':
      return mapLopHocStatus(status);
    case 'dangky':
      return mapTrangThaiDangKy(status);
    case 'thanhtoan':
      return mapTrangThaiThanhToan(status);
    case 'buoihoc':
      return mapBuoiHocStatus(status);
    case 'baoluu':
      return mapBaoLuuStatus(status);
    case 'diem':
      return mapKetQuaDiem(status);
    case 'payment':
      return mapThanhToanStatus(status);
    default:
      return status || 'Chưa xác định';
  }
};
