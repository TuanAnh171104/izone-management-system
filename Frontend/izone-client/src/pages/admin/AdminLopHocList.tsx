import React, { useState, useEffect } from 'react';
import { lopHocService, LopHoc, khoaHocService, KhoaHoc, giangVienService, GiangVien, diaDiemService, DiaDiem } from '../../services/api';
import AdminClassDetailsModal from '../../components/AdminClassDetailsModal';
import { mapLopHocStatus } from '../../utils/statusMapping';
import { Visibility, Edit, DeleteForever } from '@mui/icons-material';
import '../../styles/Management.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface FilterState {
  startDate: string;
  endDate: string;
  khoaHocID: string;
  giangVienID: string;
  diaDiemID: string;
  trangThai: string;
  minDonGia: string;
  maxDonGia: string;
  caHoc: string;
  ngayHocTrongTuan: string;
}

const AdminLopHocList: React.FC = () => {
  const [lopHocs, setLopHocs] = useState<LopHoc[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    khoaHocID: '',
    giangVienID: '',
    diaDiemID: '',
    trangThai: '',
    minDonGia: '',
    maxDonGia: '',
    caHoc: '',
    ngayHocTrongTuan: ''
  });
  const [khoaHocs, setKhoaHocs] = useState<KhoaHoc[]>([]);
  const [giangViens, setGiangViens] = useState<GiangVien[]>([]);
  const [diaDiems, setDiaDiems] = useState<DiaDiem[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLopHoc, setEditingLopHoc] = useState<LopHoc | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLopHoc, setSelectedLopHoc] = useState<LopHoc | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredLopHocs, setFilteredLopHocs] = useState<LopHoc[]>([]);
  const [editFormData, setEditFormData] = useState({
    khoaHocID: 0,
    giangVienID: 0,
    diaDiemID: 0,
    ngayBatDau: '',
    ngayKetThuc: '',
    caHoc: '',
    ngayHocTrongTuan: '',
    donGiaBuoiDay: 0,
    thoiLuongGio: 1.5,
    soLuongToiDa: 0,
    trangThai: 'ChuaBatDau'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLopHoc, setNewLopHoc] = useState({
    khoaHocID: 0,
    giangVienID: 0,
    diaDiemID: 0,
    ngayBatDau: '',
    ngayKetThuc: '', // Sẽ được tính tự động
    caHoc: '',
    ngayHocTrongTuan: '',
    donGiaBuoiDay: 0,
    thoiLuongGio: 1.5,
    soLuongToiDa: 0,
    trangThai: 'ChuaBatDau'
  });
  const [calculatedEndDate, setCalculatedEndDate] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const [editSelectedDays, setEditSelectedDays] = useState<number[]>([]);

  // Utility functions for day selection
  const stringToDayArray = (dayString: string): number[] => {
    if (!dayString) return [];
    return dayString.split(',')
      .map(day => parseInt(day.trim()))
      .filter(day => !isNaN(day) && day >= 2 && day <= 8);
  };

  const dayArrayToString = (days: number[]): string => {
    return days.sort().join(',');
  };

  const getDayName = (dayNumber: number): string => {
    const days: { [key: number]: string } = {
      2: 'Thứ 2',
      3: 'Thứ 3',
      4: 'Thứ 4',
      5: 'Thứ 5',
      6: 'Thứ 6',
      7: 'Thứ 7',
      8: 'Chủ nhật'
    };
    return days[dayNumber] || '';
  };

  const getSelectedDaysText = (days: number[]): string => {
    if (days.length === 0) return 'Chọn ngày học';
    if (days.length === 7) return 'Tất cả ngày trong tuần';
    return days.map(day => getDayName(day)).join(', ');
  };

  // Predefined study schedule options
  const studyScheduleOptions = [
    { value: '7:00-8:30', label: '7:00 - 8:30 (Sáng sớm)' },
    { value: '9:00-10:30', label: '9:00 - 10:30 (Sáng)' },
    { value: '9:30-11:00', label: '9:30 - 11:00 (Sáng)' },
    { value: '13:00-14:30', label: '13:00 - 14:30 (Chiều sớm)' },
    { value: '14:00-15:30', label: '14:00 - 15:30 (Chiều)' },
    { value: '15:30-17:00', label: '15:30 - 17:00 (Chiều muộn)' },
    { value: '18:00-19:30', label: '18:00 - 19:30 (Tối sớm)' },
    { value: '18:30-20:00', label: '18:30 - 20:00 (Tối)' },
    { value: '19:30-21:00', label: '19:30 - 21:00 (Tối muộn)' },
    { value: '19:45-21:15', label: '19:45 - 21:15 (Tối - phổ biến)' }
  ];

  // Sync selectedDays with newLopHoc.ngayHocTrongTuan and vice versa
  useEffect(() => {
    const daysFromString = stringToDayArray(newLopHoc.ngayHocTrongTuan);
    if (JSON.stringify(daysFromString.sort()) !== JSON.stringify(selectedDays.sort())) {
      setSelectedDays(daysFromString);
    }
  }, [newLopHoc.ngayHocTrongTuan]);

  useEffect(() => {
    const stringFromDays = dayArrayToString(selectedDays);
    if (stringFromDays !== newLopHoc.ngayHocTrongTuan) {
      setNewLopHoc({...newLopHoc, ngayHocTrongTuan: stringFromDays});
    }
  }, [selectedDays]);

  // Sync editSelectedDays with editFormData.ngayHocTrongTuan and vice versa
  useEffect(() => {
    const daysFromString = stringToDayArray(editFormData.ngayHocTrongTuan);
    if (JSON.stringify(daysFromString.sort()) !== JSON.stringify(editSelectedDays.sort())) {
      setEditSelectedDays(daysFromString);
    }
  }, [editFormData.ngayHocTrongTuan]);

  useEffect(() => {
    const stringFromDays = dayArrayToString(editSelectedDays);
    if (stringFromDays !== editFormData.ngayHocTrongTuan) {
      setEditFormData({...editFormData, ngayHocTrongTuan: stringFromDays});
    }
  }, [editSelectedDays]);

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => {
      const isSelected = prev.includes(day);
      if (isSelected) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleCancelAddClass = () => {
    setShowAddForm(false);
    setNewLopHoc({
      khoaHocID: 0,
      giangVienID: 0,
      diaDiemID: 0,
      ngayBatDau: '',
      ngayKetThuc: '',
      caHoc: '',
      ngayHocTrongTuan: '',
      donGiaBuoiDay: 0,
      thoiLuongGio: 1.5,
      soLuongToiDa: 0,
      trangThai: 'ChuaBatDau'
    });
    setSelectedDays([]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tính toán ngày kết thúc tự động khi các thông tin liên quan thay đổi
  useEffect(() => {
    if (newLopHoc.ngayBatDau && newLopHoc.khoaHocID > 0 && newLopHoc.ngayHocTrongTuan) {
      const khoaHoc = khoaHocs.find(k => k.khoaHocID === newLopHoc.khoaHocID);
      if (khoaHoc) {
        // Tính số buổi học trong tuần
        const soBuoiTrongTuan = newLopHoc.ngayHocTrongTuan.split(',')
          .filter(s => s.trim()).length;

        if (soBuoiTrongTuan > 0) {
          // Tính tổng số tuần (làm tròn lên)
          const tongSoTuan = Math.ceil(khoaHoc.soBuoi / soBuoiTrongTuan);

          // Tính ngày kết thúc
          const startDate = new Date(newLopHoc.ngayBatDau);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + (tongSoTuan * 7) - 1);

          setCalculatedEndDate(endDate.toLocaleDateString('vi-VN'));
        }
      }
    } else {
      setCalculatedEndDate('');
    }
  }, [newLopHoc.ngayBatDau, newLopHoc.khoaHocID, newLopHoc.ngayHocTrongTuan, khoaHocs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [lopHocData, khoaHocData, giangVienData, diaDiemData] = await Promise.all([
        lopHocService.getAll(),
        khoaHocService.getAll(),
        giangVienService.getAll(),
        diaDiemService.getAll()
      ]);

      setLopHocs(lopHocData);
      setKhoaHocs(khoaHocData);
      setGiangViens(giangVienData);
      setDiaDiems(diaDiemData);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách lớp học:', err);
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      try {
        await lopHocService.delete(id);
        setLopHocs(lopHocs.filter(l => l.lopID !== id));
        alert('Xóa lớp học thành công!');
      } catch (error) {
        console.error('Error deleting class:', error);
        setError('Có lỗi xảy ra khi xóa lớp học');
      }
    }
  };

  const handleAddNewClass = async () => {
    if (newLopHoc.khoaHocID === 0) {
      alert('Vui lòng chọn khóa học');
      return;
    }
    if (newLopHoc.giangVienID === 0) {
      alert('Vui lòng chọn giảng viên');
      return;
    }
    if (!newLopHoc.ngayBatDau) {
      alert('Vui lòng nhập ngày bắt đầu');
      return;
    }
    if (!newLopHoc.ngayHocTrongTuan) {
      alert('Vui lòng nhập ngày học trong tuần');
      return;
    }
    if (newLopHoc.donGiaBuoiDay <= 0) {
      alert('Đơn giá buổi dạy phải lớn hơn 0');
      return;
    }

    try {
      // Tạo object để gửi lên server (không bao gồm ngày kết thúc vì sẽ được tính tự động)
      const lopHocToCreate = {
        khoaHocID: newLopHoc.khoaHocID,
        giangVienID: newLopHoc.giangVienID,
        diaDiemID: newLopHoc.diaDiemID || null,
        ngayBatDau: newLopHoc.ngayBatDau, // Đã là string từ input type="date"
        ngayKetThuc: null, // Để backend tự động tính
        caHoc: newLopHoc.caHoc || null,
        ngayHocTrongTuan: newLopHoc.ngayHocTrongTuan || null,
        donGiaBuoiDay: newLopHoc.donGiaBuoiDay || null,
        thoiLuongGio: newLopHoc.thoiLuongGio,
        soLuongToiDa: newLopHoc.soLuongToiDa || null,
        trangThai: newLopHoc.trangThai
      };

      console.log('Creating class with data:', lopHocToCreate);
      console.log('Data types:', {
        khoaHocID: typeof lopHocToCreate.khoaHocID,
        giangVienID: typeof lopHocToCreate.giangVienID,
        ngayBatDau: typeof lopHocToCreate.ngayBatDau,
        donGiaBuoiDay: typeof lopHocToCreate.donGiaBuoiDay,
        thoiLuongGio: typeof lopHocToCreate.thoiLuongGio
      });

      const createdLopHoc = await lopHocService.create(lopHocToCreate);
      console.log('Created class:', createdLopHoc);

      setLopHocs([...lopHocs, createdLopHoc]);

      // Hiển thị thông báo thành công với đầy đủ thông tin lớp học
      const successMessage = `
Lớp học đã được tạo thành công!

📚 Thông tin lớp học:
• Mã lớp: ${createdLopHoc.lopID}
• Khóa học: ${getKhoaHocName(createdLopHoc.khoaHocID)}
• Giảng viên: ${getGiangVienName(createdLopHoc.giangVienID)}
• Ngày bắt đầu: ${formatDate(createdLopHoc.ngayBatDau)}
• Ngày kết thúc: ${createdLopHoc.ngayKetThuc ? formatDate(createdLopHoc.ngayKetThuc) : 'Chưa xác định'}
• Ngày học trong tuần: ${createdLopHoc.ngayHocTrongTuan || 'Chưa xác định'}
• Ca học: ${createdLopHoc.caHoc || 'Chưa xác định'}
• Đơn giá: ${createdLopHoc.donGiaBuoiDay ? createdLopHoc.donGiaBuoiDay.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa xác định'}
• Số lượng tối đa: ${createdLopHoc.soLuongToiDa || 'Không giới hạn'}
• Địa điểm: ${getDiaDiemName(createdLopHoc.diaDiemID)}
• Trạng thái: ${mapLopHocStatus(createdLopHoc.trangThai)}
      `;

      alert(successMessage);
      setNewLopHoc({
        khoaHocID: 0,
        giangVienID: 0,
        diaDiemID: 0,
        ngayBatDau: '',
        ngayKetThuc: '',
        caHoc: '',
        ngayHocTrongTuan: '',
        donGiaBuoiDay: 0,
        thoiLuongGio: 1.5,
        soLuongToiDa: 0,
        trangThai: 'ChuaBatDau'
      });
      setCalculatedEndDate('');
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error creating class:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo lớp học mới';
      setError('Có lỗi xảy ra khi tạo lớp học mới: ' + errorMessage);
    }
  };



  const getKhoaHocName = (khoaHocID: number): string => {
    if (!khoaHocID || khoaHocID === 0) return 'Chưa xác định';
    const khoaHoc = khoaHocs.find(k => k.khoaHocID === khoaHocID);
    return khoaHoc ? khoaHoc.tenKhoaHoc : `Khóa học ${khoaHocID}`;
  };

  const getGiangVienName = (giangVienID: number): string => {
    if (!giangVienID || giangVienID === 0) return 'Chưa xác định';
    const giangVien = giangViens.find(g => g.giangVienID === giangVienID);
    return giangVien ? giangVien.hoTen : `Giảng viên ${giangVienID}`;
  };

  const getDiaDiemName = (diaDiemID: number | null): string => {
    if (!diaDiemID || diaDiemID === 0) return 'Chưa xác định';
    const diaDiem = diaDiems.find((d: DiaDiem) => d.diaDiemID === diaDiemID);
    return diaDiem ? diaDiem.tenCoSo : `Địa điểm ${diaDiemID}`;
  };

  const getDiaDiemCapacity = (diaDiemID: number | null): number => {
    if (!diaDiemID || diaDiemID === 0) return 0;
    const diaDiem = diaDiems.find((d: DiaDiem) => d.diaDiemID === diaDiemID);
    return diaDiem ? diaDiem.sucChua || 0 : 0;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleEditLopHoc = (lopHoc: LopHoc) => {
    // Initialize editSelectedDays from the existing ngayHocTrongTuan
    const initialSelectedDays = stringToDayArray(lopHoc.ngayHocTrongTuan || '');
    setEditSelectedDays(initialSelectedDays);

    setEditingLopHoc(lopHoc);
    setEditFormData({
      khoaHocID: lopHoc.khoaHocID || 0,
      giangVienID: lopHoc.giangVienID || 0,
      diaDiemID: lopHoc.diaDiemID || 0,
      ngayBatDau: lopHoc.ngayBatDau || '',
      ngayKetThuc: lopHoc.ngayKetThuc || '',
      caHoc: lopHoc.caHoc || '',
      ngayHocTrongTuan: lopHoc.ngayHocTrongTuan || '',
      donGiaBuoiDay: lopHoc.donGiaBuoiDay || 0,
      thoiLuongGio: lopHoc.thoiLuongGio || 1.5,
      soLuongToiDa: lopHoc.soLuongToiDa || 0,
      trangThai: lopHoc.trangThai || 'ChuaBatDau'
    });
    setShowEditModal(true);
  };

  // Tạo component dropdown days tái sử dụng
  const DaysDropdownComponent = ({
    selectedDays,
    onDaysChange,
    isOpen,
    onToggle
  }: {
    selectedDays: number[];
    onDaysChange: (days: number[]) => void;
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const handleDayToggle = (day: number) => {
      const isSelected = selectedDays.includes(day);
      if (isSelected) {
        onDaysChange(selectedDays.filter(d => d !== day));
      } else {
        onDaysChange([...selectedDays, day]);
      }
    };

    return (
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={onToggle}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '38px'
          }}
        >
          <span style={{ color: selectedDays.length === 0 ? '#999' : '#333' }}>
            {getSelectedDaysText(selectedDays)}
          </span>
          <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}
             style={{ color: '#666', fontSize: '12px' }}></i>
        </button>

        {isOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'transparent',
                zIndex: 999
              }}
              onClick={onToggle}
            />
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {[2, 3, 4, 5, 6, 7, 8].map(day => (
                <div
                  key={day}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: day < 8 ? '1px solid #f0f0f0' : 'none',
                    backgroundColor: selectedDays.includes(day) ? '#f8f9ff' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleDayToggle(day)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    style={{
                      marginRight: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: '#333',
                    userSelect: 'none'
                  }}>
                    {getDayName(day)}
                  </span>
                </div>
              ))}
              <div style={{
                padding: '8px 12px',
                borderTop: '1px solid #eee',
                backgroundColor: '#f9f9f9'
              }}>
                <button
                  type="button"
                  onClick={() => onDaysChange([])}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const handleViewDetails = (lopHoc: LopHoc) => {
    setSelectedLopHoc(lopHoc);
    setShowDetailsModal(true);
  };

  const handleUpdateLopHoc = async () => {
    if (!editingLopHoc) return;

    try {
      // Tạo dữ liệu để gửi lên server theo định dạng backend mong đợi
      // ID lớp học phải luôn là ID gốc, không được thay đổi
      const updateData = {
        lopID: editingLopHoc.lopID, // Luôn dùng ID gốc từ editingLopHoc
        khoaHocID: editFormData.khoaHocID,
        giangVienID: editFormData.giangVienID,
        diaDiemID: editFormData.diaDiemID,
        ngayBatDau: editFormData.ngayBatDau,
        ngayKetThuc: editFormData.ngayKetThuc,
        caHoc: editFormData.caHoc,
        ngayHocTrongTuan: editFormData.ngayHocTrongTuan,
        donGiaBuoiDay: editFormData.donGiaBuoiDay,
        thoiLuongGio: editFormData.thoiLuongGio,
        soLuongToiDa: editFormData.soLuongToiDa,
        trangThai: editFormData.trangThai
      };

      console.log('📤 Gửi dữ liệu cập nhật:', updateData);
      console.log('🔍 Editing LopHoc ID:', editingLopHoc.lopID);
      console.log('📋 Form data:', editFormData);

      // Đảm bảo ID không phải null/undefined trước khi gửi
      if (!editingLopHoc.lopID) {
        alert('Lỗi: Không tìm thấy ID lớp học để cập nhật');
        return;
      }

      await lopHocService.update(editingLopHoc.lopID, updateData);

      // Cập nhật state với dữ liệu mới
      const updatedLopHoc = {
        ...editingLopHoc,
        khoaHocID: editFormData.khoaHocID,
        giangVienID: editFormData.giangVienID,
        diaDiemID: editFormData.diaDiemID,
        ngayBatDau: editFormData.ngayBatDau,
        ngayKetThuc: editFormData.ngayKetThuc,
        caHoc: editFormData.caHoc,
        ngayHocTrongTuan: editFormData.ngayHocTrongTuan,
        donGiaBuoiDay: editFormData.donGiaBuoiDay,
        thoiLuongGio: editFormData.thoiLuongGio,
        soLuongToiDa: editFormData.soLuongToiDa,
        trangThai: editFormData.trangThai
      };

      // Cập nhật state
      const updatedLopHocs = lopHocs.map(lh =>
        lh.lopID === editingLopHoc.lopID ? updatedLopHoc : lh
      );
      setLopHocs(updatedLopHocs);

      setShowEditModal(false);
      setEditingLopHoc(null);
      alert('Cập nhật lớp học thành công!');
    } catch (error: any) {
      console.error('Lỗi khi cập nhật lớp học:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật lớp học';
      alert('Không thể cập nhật lớp học: ' + errorMessage);
    }
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter and sort logic
  const applyFilters = () => {
    if (!lopHocs || lopHocs.length === 0) return;

    let filtered = [...lopHocs];

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.ngayBatDau).getTime() - new Date(a.ngayBatDau).getTime());

    // Apply filters if any filters are active
    const hasActiveFilters =
      filters.startDate ||
      filters.endDate ||
      filters.khoaHocID ||
      filters.giangVienID ||
      filters.diaDiemID ||
      filters.trangThai ||
      filters.minDonGia ||
      filters.maxDonGia ||
      filters.caHoc ||
      filters.ngayHocTrongTuan ||
      searchTerm;

    if (hasActiveFilters) {
      // Date range filter
      if (filters.startDate) {
        filtered = filtered.filter(lopHoc => new Date(lopHoc.ngayBatDau) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        filtered = filtered.filter(lopHoc => new Date(lopHoc.ngayBatDau) <= new Date(filters.endDate));
      }

      // Course filter
      if (filters.khoaHocID) {
        filtered = filtered.filter(lopHoc => lopHoc.khoaHocID === parseInt(filters.khoaHocID));
      }

      // Lecturer filter
      if (filters.giangVienID) {
        filtered = filtered.filter(lopHoc => lopHoc.giangVienID === parseInt(filters.giangVienID));
      }

      // Location filter
      if (filters.diaDiemID) {
        filtered = filtered.filter(lopHoc => lopHoc.diaDiemID === parseInt(filters.diaDiemID));
      }

      // Status filter
      if (filters.trangThai) {
        filtered = filtered.filter(lopHoc => lopHoc.trangThai === filters.trangThai);
      }

      // Price range filter
      if (filters.minDonGia) {
        filtered = filtered.filter(lopHoc => (lopHoc.donGiaBuoiDay || 0) >= parseInt(filters.minDonGia));
      }
      if (filters.maxDonGia) {
        filtered = filtered.filter(lopHoc => (lopHoc.donGiaBuoiDay || 0) <= parseInt(filters.maxDonGia));
      }

      // Schedule filters
      if (filters.caHoc) {
        filtered = filtered.filter(lopHoc => lopHoc.caHoc && lopHoc.caHoc.toLowerCase().includes(filters.caHoc.toLowerCase()));
      }
      if (filters.ngayHocTrongTuan) {
        filtered = filtered.filter(lopHoc =>
          lopHoc.ngayHocTrongTuan && lopHoc.ngayHocTrongTuan.toLowerCase().includes(filters.ngayHocTrongTuan.toLowerCase())
        );
      }

      // Search term filter
      if (searchTerm) {
        filtered = filtered.filter(lopHoc =>
          (lopHoc.lopID || '').toString().includes(searchTerm) ||
          getKhoaHocName(lopHoc.khoaHocID).toLowerCase().includes(searchTerm.toLowerCase()) ||
          getGiangVienName(lopHoc.giangVienID).toLowerCase().includes(searchTerm.toLowerCase()) ||
          getDiaDiemName(lopHoc.diaDiemID).toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lopHoc.ngayHocTrongTuan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lopHoc.caHoc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lopHoc.donGiaBuoiDay || '').toString().includes(searchTerm)
        );
      }
    }

    setFilteredLopHocs(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [lopHocs, filters, searchTerm]);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      khoaHocID: '',
      giangVienID: '',
      diaDiemID: '',
      trangThai: '',
      minDonGia: '',
      maxDonGia: '',
      caHoc: '',
      ngayHocTrongTuan: ''
    });
    setSearchTerm('');
  };

  // Pagination logic - use filtered results
  const filteredLopHocsData = filteredLopHocs;

  // Calculate pagination
  const totalFilteredItems = filteredLopHocs.length;
  const totalPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedLopHocs = filteredLopHocs.slice(startIndex, startIndex + pagination.itemsPerPage);

  // Update pagination state when filtered results change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(totalFilteredItems / prev.itemsPerPage),
      totalItems: totalFilteredItems,
      currentPage: totalFilteredItems === 0 ? 1 : Math.min(prev.currentPage, Math.ceil(totalFilteredItems / prev.itemsPerPage))
    }));
  }, [totalFilteredItems]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(totalFilteredItems / itemsPerPage)
    }));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị {startIndex + 1}-{Math.min(startIndex + pagination.itemsPerPage, totalFilteredItems)} của {totalFilteredItems} kết quả
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            ‹ Trước
          </button>

          {startPage > 1 && (
            <>
              <button onClick={() => handlePageChange(1)} className="pagination-btn">1</button>
              {startPage > 2 && <span className="pagination-dots">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-btn ${pagination.currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
              <button onClick={() => handlePageChange(totalPages)} className="pagination-btn">{totalPages}</button>
            </>
          )}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === totalPages}
            className="pagination-btn"
          >
            Sau ›
          </button>
        </div>

        <div className="pagination-size">
          <label>Hiển thị:</label>
          <select
            value={pagination.itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="pagination-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Quản lý Lớp học</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Quản lý Lớp học</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Lớp học</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                background: 'white',
                color: '#dc2626',
                border: '2px solid #dc2626',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: '180px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fas fa-plus"></i>
              <span>Thêm lớp học mới</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '14px 28px',
              background: 'white',
              color: '#dc2626',
              border: '2px solid #dc2626',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.3s ease',
              minWidth: '160px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fas fa-filter"></i>
            <span>BỘ LỌC</span>
            <i className={`fas ${showFilters ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{
              transition: 'transform 0.3s ease',
              transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)'
            }}></i>
          </button>
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo khóa học, giảng viên hoặc mã lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '350px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-container" style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          padding: '25px',
          marginBottom: '25px',
          borderRadius: '15px',
          border: '1px solid #dc2626',
          boxShadow: '0 10px 25px rgba(220, 38, 38, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </div>

              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </div>

              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Khóa học:
                </label>
                <select
                  value={filters.khoaHocID}
                  onChange={(e) => handleFilterChange('khoaHocID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <option value="">Tất cả</option>
                  {khoaHocs.map(khoaHoc => (
                    <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>
                      {khoaHoc.tenKhoaHoc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Giảng viên:
                </label>
                <select
                  value={filters.giangVienID}
                  onChange={(e) => handleFilterChange('giangVienID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <option value="">Tất cả</option>
                  {giangViens.map(giangVien => (
                    <option key={giangVien.giangVienID} value={giangVien.giangVienID}>
                      {giangVien.hoTen}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Địa điểm:
                </label>
                <select
                  value={filters.diaDiemID}
                  onChange={(e) => handleFilterChange('diaDiemID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <option value="">Tất cả</option>
                  {diaDiems.map((diaDiem: DiaDiem) => (
                    <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>
                      {diaDiem.tenCoSo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Trạng thái:
                </label>
                <select
                  value={filters.trangThai}
                  onChange={(e) => handleFilterChange('trangThai', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="ChuaBatDau">Chưa bắt đầu</option>
                  <option value="DangDienRa">Đang diễn ra</option>
                  <option value="DaKetThuc">Đã kết thúc</option>
                  <option value="DaHuy">Đã hủy</option>
                </select>
              </div>

              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Giá từ (VNĐ):
                </label>
                <input
                  type="number"
                  value={filters.minDonGia}
                  onChange={(e) => handleFilterChange('minDonGia', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </div>

              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Giá đến (VNĐ):
                </label>
                <input
                  type="number"
                  value={filters.maxDonGia}
                  onChange={(e) => handleFilterChange('maxDonGia', e.target.value)}
                  placeholder="Không giới hạn"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255,255,255,0.2)'
            }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <i className="fas fa-times" style={{ marginRight: '5px' }}></i>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-container" style={{
        background: '#e9ecef',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div>
          <strong>Tổng số lớp học:</strong> {filteredLopHocs.length} lớp
        </div>
      </div>

      {showAddForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3>Thêm lớp học mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Khóa học: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={newLopHoc.khoaHocID}
                onChange={(e) => setNewLopHoc({...newLopHoc, khoaHocID: Number(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Chọn khóa học</option>
                {khoaHocs.map(khoaHoc => (
                  <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>
                    {khoaHoc.tenKhoaHoc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Giảng viên: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={newLopHoc.giangVienID}
                onChange={(e) => setNewLopHoc({...newLopHoc, giangVienID: Number(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Chọn giảng viên</option>
                {giangViens.map(giangVien => (
                  <option key={giangVien.giangVienID} value={giangVien.giangVienID}>
                    {giangVien.hoTen}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Ngày bắt đầu: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                value={newLopHoc.ngayBatDau}
                onChange={(e) => setNewLopHoc({...newLopHoc, ngayBatDau: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Ngày kết thúc: <span style={{ fontWeight: 'normal', color: '#666' }}>(Tự động tính)</span>
              </label>
              <div style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: 'black',
                fontSize: '14px',
                fontWeight: '400'
              }}>
                {calculatedEndDate || 'Ngày kết thúc'}
              </div>

            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Ngày học trong tuần:
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '38px',
                    fontSize: '14px'
                  }}
                >
                  <span style={{ color: selectedDays.length === 0 ? '#495057' : '#495057' }}>
                    {getSelectedDaysText(selectedDays)}
                  </span>
                  <i className={`fas ${isDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                     style={{ color: '#495057', fontSize: '12px' }}></i>
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'transparent',
                        zIndex: 999
                      }}
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {[2, 3, 4, 5, 6, 7, 8].map(day => (
                        <div
                          key={day}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: day < 8 ? '1px solid #f0f0f0' : 'none',
                            backgroundColor: selectedDays.includes(day) ? '#f8f9ff' : 'white',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={() => handleDayToggle(day)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day)}
                            onChange={() => handleDayToggle(day)}
                            style={{
                              marginRight: '8px',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{
                            fontSize: '14px',
                            color: '#333',
                            userSelect: 'none'
                          }}>
                            {getDayName(day)}
                          </span>
                        </div>
                      ))}
                      <div style={{
                        padding: '8px 12px',
                        borderTop: '1px solid #eee',
                        backgroundColor: '#f9f9f9'
                      }}>
                        <button
                          type="button"
                          onClick={() => setSelectedDays([])}
                          style={{
                            width: '100%',
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Xóa tất cả
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Ca học:
              </label>
              <select
                value={newLopHoc.caHoc}
                onChange={(e) => setNewLopHoc({...newLopHoc, caHoc: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Chọn ca học</option>
                {studyScheduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Đơn giá buổi dạy (VNĐ): <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="number"
                value={newLopHoc.donGiaBuoiDay}
                onChange={(e) => setNewLopHoc({...newLopHoc, donGiaBuoiDay: Number(e.target.value)})}
                placeholder="0"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Thời lượng (giờ):
              </label>
              <input
                type="number"
                value={newLopHoc.thoiLuongGio}
                onChange={(e) => setNewLopHoc({...newLopHoc, thoiLuongGio: Number(e.target.value)})}
                placeholder="1.5"
                min="0"
                step="0.5"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Địa điểm:
              </label>
              <select
                value={newLopHoc.diaDiemID}
                onChange={(e) => {
                  const diaDiemID = Number(e.target.value);
                  const capacity = getDiaDiemCapacity(diaDiemID);
                  setNewLopHoc({
                    ...newLopHoc,
                    diaDiemID: diaDiemID,
                    soLuongToiDa: capacity // Auto-set max capacity based on location
                  });
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Chọn địa điểm</option>
                {diaDiems.map((diaDiem: DiaDiem) => (
                  <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>
                    {diaDiem.tenCoSo} (Sức chứa: {diaDiem.sucChua || 'Không giới hạn'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Số lượng tối đa:
              </label>
              <input
                type="number"
                value={newLopHoc.soLuongToiDa}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const maxCapacity = getDiaDiemCapacity(newLopHoc.diaDiemID);
                  if (maxCapacity > 0 && value > maxCapacity) {
                    alert(`Số lượng tối đa không được vượt quá sức chứa của địa điểm (${maxCapacity})`);
                    return;
                  }
                  setNewLopHoc({...newLopHoc, soLuongToiDa: value});
                }}
                placeholder="0"
                min="0"
                max={getDiaDiemCapacity(newLopHoc.diaDiemID)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              {newLopHoc.diaDiemID > 0 && (
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Tối đa: {getDiaDiemCapacity(newLopHoc.diaDiemID)} (theo sức chứa địa điểm)
                </small>
              )}
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <button
              onClick={handleCancelAddClass}
              style={{
                padding: '8px 16px',
                marginRight: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleAddNewClass}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Thêm mới
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã lớp</th>
              <th>Khóa học</th>
              <th>Giảng viên</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Ngày học trong tuần</th>
              <th>Ca học</th>
              <th>Địa điểm</th>
              <th>Đơn giá buổi dạy</th>
              <th>Thời lượng (giờ)</th>
              <th>Số lượng tối đa</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLopHocs.map(lopHoc => (
              <tr key={lopHoc.lopID}>
                <td>{lopHoc.lopID || 'Chưa có mã'}</td>
                <td>{getKhoaHocName(lopHoc.khoaHocID)}</td>
                <td>{getGiangVienName(lopHoc.giangVienID)}</td>
                <td>{formatDate(lopHoc.ngayBatDau)}</td>
                <td>{lopHoc.ngayKetThuc ? formatDate(lopHoc.ngayKetThuc) : 'Chưa xác định'}</td>
                <td>{lopHoc.ngayHocTrongTuan || 'Chưa xác định'}</td>
                <td>{lopHoc.caHoc || 'Chưa xác định'}</td>
                <td>{getDiaDiemName(lopHoc.diaDiemID)}</td>
                <td>{lopHoc.donGiaBuoiDay ? lopHoc.donGiaBuoiDay.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa xác định'}</td>
                <td>{lopHoc.thoiLuongGio}</td>
                <td>{lopHoc.soLuongToiDa || 'Không giới hạn'}</td>
                <td>
                  <span className="status-badge">
                    {mapLopHocStatus(lopHoc.trangThai)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(lopHoc)}
                      title="Xem chi tiết"
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <Visibility fontSize="small" color="action" />
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => handleEditLopHoc(lopHoc)}
                      title="Chỉnh sửa"
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <Edit fontSize="small" color="action" />
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(lopHoc.lopID)}
                      title="Xóa"
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <DeleteForever fontSize="small" color="error" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredLopHocs.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  {searchTerm ? 'Không tìm thấy lớp học nào phù hợp.' : 'Chưa có lớp học nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal chỉnh sửa lớp học */}
      {showEditModal && editingLopHoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              Chỉnh sửa lớp học
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Khóa học: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={editFormData.khoaHocID}
                  onChange={(e) => handleEditFormChange('khoaHocID', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Chọn khóa học</option>
                  {khoaHocs.map(khoaHoc => (
                    <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>
                      {khoaHoc.tenKhoaHoc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Giảng viên: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={editFormData.giangVienID}
                  onChange={(e) => handleEditFormChange('giangVienID', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Chọn giảng viên</option>
                  {giangViens.map(giangVien => (
                    <option key={giangVien.giangVienID} value={giangVien.giangVienID}>
                      {giangVien.hoTen}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ngày bắt đầu: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.ngayBatDau}
                  onChange={(e) => handleEditFormChange('ngayBatDau', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ngày kết thúc:
                </label>
                <input
                  type="date"
                  value={editFormData.ngayKetThuc}
                  onChange={(e) => handleEditFormChange('ngayKetThuc', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ngày học trong tuần:
                </label>
                <div style={{ position: 'relative' }}>
                  <DaysDropdownComponent
                    selectedDays={editSelectedDays}
                    onDaysChange={setEditSelectedDays}
                    isOpen={isEditDropdownOpen}
                    onToggle={() => setIsEditDropdownOpen(!isEditDropdownOpen)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Ca học:
                </label>
                <select
                  value={editFormData.caHoc}
                  onChange={(e) => handleEditFormChange('caHoc', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Chọn ca học</option>
                  {studyScheduleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Đơn giá buổi dạy (VNĐ): <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  value={editFormData.donGiaBuoiDay}
                  onChange={(e) => handleEditFormChange('donGiaBuoiDay', Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Thời lượng (giờ):
                </label>
                <input
                  type="number"
                  value={editFormData.thoiLuongGio}
                  onChange={(e) => handleEditFormChange('thoiLuongGio', Number(e.target.value))}
                  placeholder="1.5"
                  min="0"
                  step="0.5"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Địa điểm:
                </label>
                <select
                  value={editFormData.diaDiemID}
                  onChange={(e) => {
                    const diaDiemID = Number(e.target.value);
                    const capacity = getDiaDiemCapacity(diaDiemID);
                    handleEditFormChange('diaDiemID', diaDiemID);
                    handleEditFormChange('soLuongToiDa', capacity);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Chọn địa điểm</option>
                  {diaDiems.map((diaDiem: DiaDiem) => (
                    <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>
                      {diaDiem.tenCoSo} (Sức chứa: {diaDiem.sucChua || 'Không giới hạn'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Số lượng tối đa:
                </label>
                <input
                  type="number"
                  value={editFormData.soLuongToiDa}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const maxCapacity = getDiaDiemCapacity(editFormData.diaDiemID);
                    if (maxCapacity > 0 && value > maxCapacity) {
                      alert(`Số lượng tối đa không được vượt quá sức chứa của địa điểm (${maxCapacity})`);
                      return;
                    }
                    handleEditFormChange('soLuongToiDa', value);
                  }}
                  placeholder="0"
                  min="0"
                  max={getDiaDiemCapacity(editFormData.diaDiemID)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {editFormData.diaDiemID > 0 && (
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Tối đa: {getDiaDiemCapacity(editFormData.diaDiemID)} (theo sức chứa địa điểm)
                  </small>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateLopHoc}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết lớp học */}
      <AdminClassDetailsModal
        lopHoc={selectedLopHoc}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLopHoc(null);
        }}
      />
    </div>
  );
};

export default AdminLopHocList;
