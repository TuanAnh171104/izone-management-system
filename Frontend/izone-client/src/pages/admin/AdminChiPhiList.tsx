import React, { useState, useEffect } from 'react';
import { chiPhiService, ChiPhi, lopHocService, LopHoc, khoaHocService, KhoaHoc, diaDiemService, DiaDiem } from '../../services/api';
import { mapLoaiChiPhi, mapNguonGoc } from '../../utils/statusMapping';
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
  loaiChiPhi: string;
  subLoai: string;
  lopID: string;
  khoaHocID: string;
  diaDiemID: string;
  allocationMethod: string;
  nguonGoc: string;
  minAmount: string;
  maxAmount: string;
}

const AdminChiPhiList: React.FC = () => {
  const [costs, setCosts] = useState<ChiPhi[]>([]);
  const [filteredCosts, setFilteredCosts] = useState<ChiPhi[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lopHocList, setLopHocList] = useState<LopHoc[]>([]);
  const [khoaHocList, setKhoaHocList] = useState<KhoaHoc[]>([]);
  const [diaDiemList, setDiaDiemList] = useState<DiaDiem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [editingChiPhi, setEditingChiPhi] = useState<ChiPhi | null>(null);

  // Form state cho thêm chi phí mới
  const [newCost, setNewCost] = useState({
    loaiChiPhi: '',
    subLoai: '',
    soTien: 0,
    ngayPhatSinh: new Date().toISOString().split('T')[0],
    lopID: '',
    khoaHocID: '',
    diaDiemID: '',
    allocationMethod: 'SeatHours',
    nguonGoc: 'NhapTay',
    nguoiNhap: '',
    ghiChu: ''
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    loaiChiPhi: '',
    subLoai: '',
    lopID: '',
    khoaHocID: '',
    diaDiemID: '',
    allocationMethod: '',
    nguonGoc: '',
    minAmount: '',
    maxAmount: ''
  });

  // Các loại chi phí có sẵn
  const loaiChiPhiOptions = [
    { value: 'LuongGV', label: 'Lương giảng viên' },
    { value: 'LuongNV', label: 'Lương nhân viên' },
    { value: 'TaiLieu', label: 'Tài liệu' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'MatBang', label: 'Mặt bằng' },
    { value: 'Utilities', label: 'Tiện ích' },
    { value: 'BaoHiem', label: 'Bảo hiểm' },
    { value: 'Thue', label: 'Thuế' },
    { value: 'BaoTri', label: 'Bảo trì' },
    { value: 'CongNghe', label: 'Công nghệ' },
    { value: 'SuKien', label: 'Sự kiện' },
    { value: 'Khac', label: 'Khác' }
  ];

  const allocationMethodOptions = ['SeatHours', 'PerStudent', 'Revenue'];
  const nguonGocOptions = [
    { value: 'NhapTay', label: 'Nhập tay' },
    { value: 'TuDong', label: 'Tự động' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (costs.length > 0) {
      // Luôn hiển thị tất cả dữ liệu khi có dữ liệu từ API
      setFilteredCosts(costs);

      // Cập nhật pagination cho dữ liệu đầy đủ
      const totalItems = costs.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      setPagination(prev => ({
        ...prev,
        totalPages,
        totalItems
      }));
    }
  }, [costs]);

  useEffect(() => {
    if (costs.length > 0) {
      applyFilters();
    }
  }, [costs, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [costsData, lopHocData, khoaHocData, diaDiemData] = await Promise.all([
        chiPhiService.getAll(),
        lopHocService.getAll(),
        khoaHocService.getAll(),
        diaDiemService.getAll()
      ]);

      setCosts(costsData);
      setLopHocList(lopHocData);
      setKhoaHocList(khoaHocData);
      setDiaDiemList(diaDiemData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...costs];

    // Chỉ lọc nếu có ít nhất một filter được áp dụng
    const hasActiveFilters =
      filters.startDate ||
      filters.endDate ||
      filters.loaiChiPhi ||
      filters.subLoai ||
      filters.lopID ||
      filters.khoaHocID ||
      filters.diaDiemID ||
      filters.allocationMethod ||
      filters.nguonGoc ||
      filters.minAmount ||
      filters.maxAmount;

    if (hasActiveFilters) {
      // Lọc theo thời gian
      if (filters.startDate) {
        filtered = filtered.filter(cost => cost.ngayPhatSinh >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter(cost => cost.ngayPhatSinh <= filters.endDate);
      }

      // Lọc theo loại chi phí
      if (filters.loaiChiPhi) {
        filtered = filtered.filter(cost => cost.loaiChiPhi === filters.loaiChiPhi);
      }

      // Lọc theo sub loại
      if (filters.subLoai) {
        filtered = filtered.filter(cost =>
          cost.subLoai && cost.subLoai.toLowerCase().includes(filters.subLoai.toLowerCase())
        );
      }

      // Lọc theo lớp học
      if (filters.lopID) {
        filtered = filtered.filter(cost => cost.lopID === parseInt(filters.lopID));
      }

      // Lọc theo khóa học
      if (filters.khoaHocID) {
        filtered = filtered.filter(cost => cost.khoaHocID === parseInt(filters.khoaHocID));
      }

      // Lọc theo địa điểm
      if (filters.diaDiemID) {
        filtered = filtered.filter(cost => cost.diaDiemID === parseInt(filters.diaDiemID));
      }

      // Lọc theo phương pháp phân bổ
      if (filters.allocationMethod) {
        filtered = filtered.filter(cost => cost.allocationMethod === filters.allocationMethod);
      }

      // Lọc theo nguồn gốc
      if (filters.nguonGoc) {
        filtered = filtered.filter(cost => cost.nguonGoc === filters.nguonGoc);
      }

      // Lọc theo số tiền
      if (filters.minAmount) {
        filtered = filtered.filter(cost => cost.soTien >= parseFloat(filters.minAmount));
      }
      if (filters.maxAmount) {
        filtered = filtered.filter(cost => cost.soTien <= parseFloat(filters.maxAmount));
      }
    }

    setFilteredCosts(filtered);

    // Cập nhật pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalPages,
      totalItems,
      currentPage: Math.min(prev.currentPage, totalPages)
    }));
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      loaiChiPhi: '',
      subLoai: '',
      lopID: '',
      khoaHocID: '',
      diaDiemID: '',
      allocationMethod: '',
      nguonGoc: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getLopHocName = (lopID?: number | null) => {
    if (!lopID) return '-';
    const lop = lopHocList.find(l => l.lopID === lopID);
    return lop ? `Lớp ${lop.lopID}` : `Lớp ${lopID}`;
  };

  const getKhoaHocName = (khoaHocID?: number | null) => {
    if (!khoaHocID) return '-';
    const khoaHoc = khoaHocList.find(k => k.khoaHocID === khoaHocID);
    return khoaHoc ? khoaHoc.tenKhoaHoc : `KH ${khoaHocID}`;
  };

  const getDiaDiemName = (diaDiemID?: number | null) => {
    if (!diaDiemID) return '-';
    const diaDiem = diaDiemList.find(d => d.diaDiemID === diaDiemID);
    return diaDiem ? diaDiem.tenCoSo : `ĐD ${diaDiemID}`;
  };

  // Pagination logic
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const paginatedCosts = filteredCosts.slice(startIndex, startIndex + pagination.itemsPerPage);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(filteredCosts.length / itemsPerPage)
    }));
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị {startIndex + 1}-{Math.min(startIndex + pagination.itemsPerPage, filteredCosts.length)} của {filteredCosts.length} kết quả
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

          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="pagination-dots">...</span>}
              <button onClick={() => handlePageChange(pagination.totalPages)} className="pagination-btn">{pagination.totalPages}</button>
            </>
          )}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
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

  const calculateTotalCost = () => {
    return filteredCosts.reduce((total, cost) => total + cost.soTien, 0);
  };

  // Hàm xử lý thay đổi dữ liệu trong form thêm chi phí mới
  const handleNewCostChange = (field: string, value: string | number) => {
    setNewCost(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Hàm reset form về trạng thái ban đầu
  const resetNewCostForm = () => {
    setNewCost({
      loaiChiPhi: '',
      subLoai: '',
      soTien: 0,
      ngayPhatSinh: new Date().toISOString().split('T')[0],
      lopID: '',
      khoaHocID: '',
      diaDiemID: '',
      allocationMethod: 'SeatHours',
      nguonGoc: 'NhapTay',
      nguoiNhap: '',
      ghiChu: ''
    });
  };

  // Hàm xử lý tạo chi phí mới
  const handleCreateCost = async () => {
    try {
      setIsSubmitting(true);

      // Validate dữ liệu
      if (!newCost.loaiChiPhi) {
        alert('Vui lòng chọn loại chi phí');
        return;
      }
      if (!newCost.soTien || newCost.soTien <= 0) {
        alert('Vui lòng nhập số tiền hợp lệ');
        return;
      }
      if (!newCost.ngayPhatSinh) {
        alert('Vui lòng chọn ngày phát sinh');
        return;
      }

      // Chuẩn bị dữ liệu gửi lên server
      const costData = {
        loaiChiPhi: newCost.loaiChiPhi,
        subLoai: newCost.subLoai || null,
        soTien: newCost.soTien,
        ngayPhatSinh: newCost.ngayPhatSinh,
        lopID: newCost.lopID ? parseInt(newCost.lopID) : null,
        khoaHocID: newCost.khoaHocID ? parseInt(newCost.khoaHocID) : null,
        diaDiemID: newCost.diaDiemID ? parseInt(newCost.diaDiemID) : null,
        allocationMethod: newCost.allocationMethod,
        nguonGoc: newCost.nguonGoc,
        nguoiNhap: newCost.nguoiNhap || null,
        ghiChu: newCost.ghiChu || null,
        recurring: false,
        nguonChiPhi: newCost.ghiChu || null,
        thoiGianKy: null,
        periodStart: null,
        periodEnd: null
      };

      // Gọi API tạo chi phí mới
      await chiPhiService.create(costData);

      // Reset form và đóng modal
      resetNewCostForm();
      setShowAddModal(false);

      // Refresh dữ liệu
      await fetchInitialData();

      alert('Thêm chi phí thành công!');
    } catch (error) {
      console.error('Lỗi khi tạo chi phí:', error);
      alert('Không thể tạo chi phí. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm xử lý chỉnh sửa chi phí
  const handleEditChiPhi = (chiPhi: ChiPhi) => {
    setEditingChiPhi(chiPhi);
    setNewCost({
      loaiChiPhi: chiPhi.loaiChiPhi,
      subLoai: chiPhi.subLoai || '',
      soTien: Number(chiPhi.soTien),
      ngayPhatSinh: chiPhi.ngayPhatSinh,
      lopID: chiPhi.lopID?.toString() || '',
      khoaHocID: chiPhi.khoaHocID?.toString() || '',
      diaDiemID: chiPhi.diaDiemID?.toString() || '',
      allocationMethod: chiPhi.allocationMethod,
      nguonGoc: chiPhi.nguonGoc,
      nguoiNhap: chiPhi.nguoiNhap || '',
      ghiChu: chiPhi.nguonChiPhi || ''
    });
    setShowEditModal(true);
  };

  // Hàm xử lý cập nhật chi phí
  const handleUpdateChiPhi = async () => {
    if (!editingChiPhi) return;

    try {
      setIsSubmitting(true);

      // Validate dữ liệu
      if (!newCost.loaiChiPhi) {
        alert('Vui lòng chọn loại chi phí');
        return;
      }
      if (!newCost.soTien || newCost.soTien <= 0) {
        alert('Vui lòng nhập số tiền hợp lệ');
        return;
      }
      if (!newCost.ngayPhatSinh) {
        alert('Vui lòng chọn ngày phát sinh');
        return;
      }

      // Chuẩn bị dữ liệu gửi lên server
      const costData = {
        chiPhiID: editingChiPhi.chiPhiID,
        loaiChiPhi: newCost.loaiChiPhi,
        subLoai: newCost.subLoai || null,
        soTien: newCost.soTien,
        ngayPhatSinh: newCost.ngayPhatSinh,
        lopID: newCost.lopID ? parseInt(newCost.lopID) : null,
        khoaHocID: newCost.khoaHocID ? parseInt(newCost.khoaHocID) : null,
        diaDiemID: newCost.diaDiemID ? parseInt(newCost.diaDiemID) : null,
        allocationMethod: newCost.allocationMethod,
        nguonGoc: newCost.nguonGoc,
        nguoiNhap: newCost.nguoiNhap || null,
        ghiChu: newCost.ghiChu || null,
        recurring: false,
        nguonChiPhi: newCost.ghiChu || null,
        thoiGianKy: null,
        periodStart: null,
        periodEnd: null
      };

      // Gọi API cập nhật chi phí
      await chiPhiService.update(editingChiPhi.chiPhiID, costData);

      // Reset form và đóng modal
      resetNewCostForm();
      setShowEditModal(false);
      setEditingChiPhi(null);

      // Refresh dữ liệu
      await fetchInitialData();

      alert('Cập nhật chi phí thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật chi phí:', error);
      alert('Không thể cập nhật chi phí. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm xử lý xóa chi phí
  const handleDeleteChiPhi = async (chiPhiID: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
      try {
        await chiPhiService.delete(chiPhiID);

        // Cập nhật state
        const updatedCosts = costs.filter(cost => cost.chiPhiID !== chiPhiID);
        setCosts(updatedCosts);

        alert('Xóa chi phí thành công!');
      } catch (error) {
        console.error('Lỗi khi xóa chi phí:', error);
        alert('Không thể xóa chi phí. Vui lòng thử lại.');
      }
    }
  };

  // Hàm xử lý chọn file import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];

      if (!allowedTypes.includes(file.type) &&
          !file.name.toLowerCase().endsWith('.xlsx') &&
          !file.name.toLowerCase().endsWith('.xls') &&
          !file.name.toLowerCase().endsWith('.csv')) {
        alert('Định dạng file không được hỗ trợ. Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        return;
      }

      setImportFile(file);
      setImportPreview(null);
      setImportResult(null);
    }
  };

  // Hàm preview dữ liệu từ file (chỉ hiển thị preview, không import)
  const handlePreviewImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);

      // Sử dụng service đã định nghĩa để preview
      const previewData = await chiPhiService.previewImportFromFile(importFile);
      setImportPreview(previewData.data || previewData);

    } catch (error) {
      console.error('Lỗi khi đọc file để preview:', error);
      alert('Không thể đọc file để preview. Vui lòng thử lại.');
    } finally {
      setIsImporting(false);
    }
  };

  // Hàm thực hiện import
  const handleImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);

      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('http://localhost:5080/api/ChiPhi/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Import thất bại');
      }

      const result = await response.json();
      setImportResult(result);

      if (result.isSuccess) {
        alert(`Import thành công! Đã thêm ${result.successCount} chi phí.`);
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview(null);
        setImportResult(null);
        // Refresh dữ liệu
        await fetchInitialData();
      } else {
        alert(`Import hoàn thành với ${result.errorCount} lỗi. Vui lòng kiểm tra báo cáo lỗi.`);
      }
    } catch (error) {
      console.error('Lỗi khi import:', error);
      alert('Không thể import file. Vui lòng thử lại.');
    } finally {
      setIsImporting(false);
    }
  };

  // Hàm download template file
  const handleDownloadTemplate = () => {
    // Tạo file Excel mẫu với header đầy đủ các cột
    const headers = [
      'LoaiChiPhi', 'SubLoai', 'SoTien', 'NgayPhatSinh',
      'LopID', 'KhoaHocID', 'DiaDiemID',
      'NguoiNhap', 'NguonChiPhi', 'AllocationMethod', 'NguonGoc'
    ];

    const csvContent = headers.join(',') + '\n' +
      'LuongGV,Lương giảng viên,5000000,2024-01-15,1,1,1,Nguyễn Văn A,Chi phí nhân sự,SeatHours,NhapTay\n' +
      'TaiLieu,Sách giáo khoa,1500000,2024-01-20,,2,1,Trần Thị B,Học liệu,PerStudent,NhapTay\n' +
      'MatBang,Thuê mặt bằng,8000000,2024-01-01,,,,Nguyễn Văn C,Chi phí mặt bằng,SeatHours,NhapTay';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'chi_phi_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hàm reset import form
  const resetImportForm = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Quản lý Chi phí</h2>
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
          <h2>Quản lý Chi phí</h2>
        </div>
        <div className="table-container" style={{ padding: 20 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchInitialData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Quản lý Chi phí</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-outline-light' : 'btn-primary'}`}
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              minWidth: '90px'
            }}
            onMouseOver={(e) => {
              if (!showFilters) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = showFilters ? 'scale(1.02)' : 'scale(1)';
            }}
          >
            <i className={`fas fa-filter`}></i>
            <span>Bộ lọc</span>
            <i className={`fas ${showFilters ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{
              transition: 'transform 0.3s ease',
              transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)'
            }}></i>
          </button>
          <button
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              minWidth: '90px'
            }}
            onClick={() => setShowImportModal(true)}
          >
            <i className="fas fa-file-import"></i>
            <span>Import</span>
          </button>
          <button
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              minWidth: '90px'
            }}
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-plus"></i>
            <span>Thêm chi phí</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc nâng cao */}
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
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />

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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
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
                  Loại chi phí:
                </label>
                <select
                  value={filters.loaiChiPhi}
                  onChange={(e) => handleFilterChange('loaiChiPhi', e.target.value)}
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                >
                  <option value="">Tất cả</option>
                  {loaiChiPhiOptions.map(loai => (
                    <option key={loai.value} value={loai.value}>{loai.label}</option>
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
                  Sub loại:
                </label>
                <input
                  type="text"
                  value={filters.subLoai}
                  onChange={(e) => handleFilterChange('subLoai', e.target.value)}
                  placeholder="Nhập sub loại..."
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
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
                  Lớp học:
                </label>
                <select
                  value={filters.lopID}
                  onChange={(e) => handleFilterChange('lopID', e.target.value)}
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                >
                  <option value="">Tất cả</option>
                  {lopHocList.map(lop => (
                    <option key={lop.lopID} value={lop.lopID}>Lớp {lop.lopID}</option>
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                >
                  <option value="">Tất cả</option>
                  {khoaHocList.map(khoaHoc => (
                    <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>{khoaHoc.tenKhoaHoc}</option>
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                >
                  <option value="">Tất cả</option>
                  {diaDiemList.map(diaDiem => (
                    <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>{diaDiem.tenCoSo}</option>
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
                  Phương pháp phân bổ:
                </label>
                <select
                  value={filters.allocationMethod}
                  onChange={(e) => handleFilterChange('allocationMethod', e.target.value)}
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                >
                  <option value="">Tất cả</option>
                  {allocationMethodOptions.map(method => (
                    <option key={method} value={method}>{method}</option>
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
                  Nguồn gốc:
                </label>
                <select
                  value={filters.nguonGoc}
                  onChange={(e) => handleFilterChange('nguonGoc', e.target.value)}
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                >
                  <option value="">Tất cả</option>
                  {nguonGocOptions.map(nguon => (
                    <option key={nguon.value} value={nguon.value}>{nguon.label}</option>
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
                  Số tiền từ:
                </label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
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
                  Số tiền đến:
                </label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
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
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
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
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <i className="fas fa-times" style={{ marginRight: '5px' }}></i>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="stats-container" style={{
        background: '#e9ecef',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Tổng số chi phí:</strong> {filteredCosts.length} khoản
        </div>
        <div>
          <strong>Tổng tiền:</strong> {formatCurrency(calculateTotalCost())}
        </div>
        <div>
          <strong>Chi phí trung bình:</strong> {filteredCosts.length > 0 ? formatCurrency(calculateTotalCost() / filteredCosts.length) : '0 VND'}
        </div>
      </div>

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ngày phát sinh</th>
              <th>Loại chi phí</th>
              <th>Sub loại</th>
              <th>Số tiền</th>
              <th>Lớp học</th>
              <th>Khóa học</th>
              <th>Địa điểm</th>
              <th>Phương pháp</th>
              <th>Nguồn gốc</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCosts.map((cost, index) => (
              <tr key={cost.chiPhiID}>
                <td>{startIndex + index + 1}</td>
                <td>{formatDate(cost.ngayPhatSinh)}</td>
                <td>
                  <span className={`badge badge-${cost.loaiChiPhi.toLowerCase()}`}>
                    {mapLoaiChiPhi(cost.loaiChiPhi)}
                  </span>
                </td>
                <td>{cost.subLoai || '-'}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc3545' }}>
                  {formatCurrency(cost.soTien)}
                </td>
                <td>{getLopHocName(cost.lopID)}</td>
                <td>{getKhoaHocName(cost.khoaHocID)}</td>
                <td>{getDiaDiemName(cost.diaDiemID)}</td>
                <td>{cost.allocationMethod}</td>
                <td>
                  <span className={`badge ${cost.nguonGoc === 'TuDong' ? 'badge-success' : 'badge-secondary'}`}>
                    {mapNguonGoc(cost.nguonGoc)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditChiPhi(cost)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteChiPhi(cost.chiPhiID)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedCosts.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {costs.length === 0 ? 'Chưa có chi phí nào.' : 'Không tìm thấy chi phí nào phù hợp với bộ lọc.'}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal thêm chi phí mới */}
      {showAddModal && (
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
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f8f9fa'
            }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontWeight: '600' }}>
                <i className="fas fa-plus-circle" style={{ marginRight: '10px' }}></i>
                Thêm chi phí mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6c757d',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Form */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '25px'
            }}>
              {/* Loại chi phí */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Loại chi phí: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={newCost.loaiChiPhi}
                  onChange={(e) => handleNewCostChange('loaiChiPhi', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn loại chi phí</option>
                  {loaiChiPhiOptions.map(loai => (
                    <option key={loai.value} value={loai.value}>{loai.label}</option>
                  ))}
                </select>
              </div>

              {/* Sub loại */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Sub loại:
                </label>
                <input
                  type="text"
                  value={newCost.subLoai}
                  onChange={(e) => handleNewCostChange('subLoai', e.target.value)}
                  placeholder="Nhập sub loại (tùy chọn)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Số tiền */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Số tiền: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  value={newCost.soTien || ''}
                  onChange={(e) => handleNewCostChange('soTien', parseFloat(e.target.value) || 0)}
                  placeholder="Nhập số tiền"
                  min="0"
                  step="1000"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Ngày phát sinh */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Ngày phát sinh: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="date"
                  value={newCost.ngayPhatSinh}
                  onChange={(e) => handleNewCostChange('ngayPhatSinh', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Lớp học */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Lớp học:
                </label>
                <select
                  value={newCost.lopID}
                  onChange={(e) => handleNewCostChange('lopID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn lớp học (tùy chọn)</option>
                  {lopHocList.map(lop => (
                    <option key={lop.lopID} value={lop.lopID}>Lớp {lop.lopID}</option>
                  ))}
                </select>
              </div>

              {/* Khóa học */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Khóa học:
                </label>
                <select
                  value={newCost.khoaHocID}
                  onChange={(e) => handleNewCostChange('khoaHocID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn khóa học (tùy chọn)</option>
                  {khoaHocList.map(khoaHoc => (
                    <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>{khoaHoc.tenKhoaHoc}</option>
                  ))}
                </select>
              </div>

              {/* Địa điểm */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Địa điểm:
                </label>
                <select
                  value={newCost.diaDiemID}
                  onChange={(e) => handleNewCostChange('diaDiemID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn địa điểm (tùy chọn)</option>
                  {diaDiemList.map(diaDiem => (
                    <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>{diaDiem.tenCoSo}</option>
                  ))}
                </select>
              </div>

              {/* Phương pháp phân bổ */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Phương pháp phân bổ:
                </label>
                <select
                  value={newCost.allocationMethod}
                  onChange={(e) => handleNewCostChange('allocationMethod', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  {allocationMethodOptions.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Nguồn gốc */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Nguồn gốc:
                </label>
                <select
                  value={newCost.nguonGoc}
                  onChange={(e) => handleNewCostChange('nguonGoc', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  {nguonGocOptions.map(nguon => (
                    <option key={nguon.value} value={nguon.value}>{nguon.label}</option>
                  ))}
                </select>
              </div>

              {/* Người nhập */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Người nhập:
                </label>
                <input
                  type="text"
                  value={newCost.nguoiNhap}
                  onChange={(e) => handleNewCostChange('nguoiNhap', e.target.value)}
                  placeholder="Nhập tên người nhập (tùy chọn)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Ghi chú */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Ghi chú:
                </label>
                <textarea
                  value={newCost.ghiChu}
                  onChange={(e) => handleNewCostChange('ghiChu', e.target.value)}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #f8f9fa'
            }}>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSubmitting ? 0.6 : 1
                }}
                onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.background = '#5a6268')}
                onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.background = '#6c757d')}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCost}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  background: isSubmitting ? '#6c757d' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSubmitting ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.background = '#b91c1c')}
                onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.background = '#dc2626')}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    <span>Tạo chi phí</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa chi phí */}
      {showEditModal && editingChiPhi && (
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
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f8f9fa'
            }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontWeight: '600' }}>
                <i className="fas fa-edit" style={{ marginRight: '10px' }}></i>
                Chỉnh sửa chi phí
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6c757d',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Form */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '25px'
            }}>
              {/* Loại chi phí */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Loại chi phí: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={newCost.loaiChiPhi}
                  onChange={(e) => handleNewCostChange('loaiChiPhi', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn loại chi phí</option>
                  {loaiChiPhiOptions.map(loai => (
                    <option key={loai.value} value={loai.value}>{loai.label}</option>
                  ))}
                </select>
              </div>

              {/* Sub loại */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Sub loại:
                </label>
                <input
                  type="text"
                  value={newCost.subLoai}
                  onChange={(e) => handleNewCostChange('subLoai', e.target.value)}
                  placeholder="Nhập sub loại (tùy chọn)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Số tiền */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Số tiền: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  value={newCost.soTien || ''}
                  onChange={(e) => handleNewCostChange('soTien', parseFloat(e.target.value) || 0)}
                  placeholder="Nhập số tiền"
                  min="0"
                  step="1000"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Ngày phát sinh */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Ngày phát sinh: <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="date"
                  value={newCost.ngayPhatSinh}
                  onChange={(e) => handleNewCostChange('ngayPhatSinh', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Lớp học */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Lớp học:
                </label>
                <select
                  value={newCost.lopID}
                  onChange={(e) => handleNewCostChange('lopID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn lớp học (tùy chọn)</option>
                  {lopHocList.map(lop => (
                    <option key={lop.lopID} value={lop.lopID}>Lớp {lop.lopID}</option>
                  ))}
                </select>
              </div>

              {/* Khóa học */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Khóa học:
                </label>
                <select
                  value={newCost.khoaHocID}
                  onChange={(e) => handleNewCostChange('khoaHocID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn khóa học (tùy chọn)</option>
                  {khoaHocList.map(khoaHoc => (
                    <option key={khoaHoc.khoaHocID} value={khoaHoc.khoaHocID}>{khoaHoc.tenKhoaHoc}</option>
                  ))}
                </select>
              </div>

              {/* Địa điểm */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Địa điểm:
                </label>
                <select
                  value={newCost.diaDiemID}
                  onChange={(e) => handleNewCostChange('diaDiemID', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Chọn địa điểm (tùy chọn)</option>
                  {diaDiemList.map(diaDiem => (
                    <option key={diaDiem.diaDiemID} value={diaDiem.diaDiemID}>{diaDiem.tenCoSo}</option>
                  ))}
                </select>
              </div>

              {/* Phương pháp phân bổ */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Phương pháp phân bổ:
                </label>
                <select
                  value={newCost.allocationMethod}
                  onChange={(e) => handleNewCostChange('allocationMethod', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  {allocationMethodOptions.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Nguồn gốc */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Nguồn gốc:
                </label>
                <select
                  value={newCost.nguonGoc}
                  onChange={(e) => handleNewCostChange('nguonGoc', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  {nguonGocOptions.map(nguon => (
                    <option key={nguon.value} value={nguon.value}>{nguon.label}</option>
                  ))}
                </select>
              </div>

              {/* Người nhập */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Người nhập:
                </label>
                <input
                  type="text"
                  value={newCost.nguoiNhap}
                  onChange={(e) => handleNewCostChange('nguoiNhap', e.target.value)}
                  placeholder="Nhập tên người nhập (tùy chọn)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {/* Ghi chú */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Ghi chú:
                </label>
                <textarea
                  value={newCost.ghiChu}
                  onChange={(e) => handleNewCostChange('ghiChu', e.target.value)}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #f8f9fa'
            }}>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSubmitting ? 0.6 : 1
                }}
                onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.background = '#5a6268')}
                onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.background = '#6c757d')}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateChiPhi}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  background: isSubmitting ? '#6c757d' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSubmitting ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.background = '#b91c1c')}
                onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.background = '#dc2626')}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    <span>Cập nhật</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Chi phí */}
      {showImportModal && (
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
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f8f9fa'
            }}>
              <h3 style={{ margin: 0, color: '#28a745', fontWeight: '600' }}>
                <i className="fas fa-file-import" style={{ marginRight: '10px' }}></i>
                Import Chi phí từ File
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImportForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6c757d',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Nội dung Modal */}
            <div style={{ marginBottom: '25px' }}>
              {/* Hướng dẫn */}
              <div style={{
                background: '#e9ecef',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                borderLeft: '4px solid #28a745'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '16px' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                  Hướng dẫn Import
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d', fontSize: '14px' }}>
                  <li>Chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)</li>
                  <li>File phải có header với các cột: LoaiChiPhi, SubLoai, SoTien, NgayPhatSinh, LopID, KhoaHocID, DiaDiemID, NguoiNhap, NguonChiPhi, AllocationMethod, NguonGoc</li>
                  <li>Số tiền phải là số dương</li>
                  <li>Ngày phát sinh theo định dạng YYYY-MM-DD</li>
                  <li>LopID, KhoaHocID, DiaDiemID có thể để trống (nhập trực tiếp hoặc để trống ô)</li>
                  <li>Các giá trị LoaiChiPhi hợp lệ: LuongGV, LuongNV, TaiLieu, Marketing, MatBang, Utilities, BaoHiem, Thue, BaoTri, CongNghe, SuKien, Khac</li>
                </ul>
              </div>

              {/* Upload File */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  Chọn file để import:
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#28a745'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
                {importFile && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '5px',
                    color: '#155724',
                    fontSize: '14px'
                  }}>
                    <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                    Đã chọn file: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Download Template */}
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={handleDownloadTemplate}
                  style={{
                    padding: '10px 16px',
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#138496'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#17a2b8'}
                >
                  <i className="fas fa-download"></i>
                  <span>Tải file mẫu</span>
                </button>
              </div>

              {/* Preview Data */}
              {importPreview && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    margin: '0 0 15px 0',
                    color: '#495057',
                    fontSize: '16px',
                    borderBottom: '2px solid #e9ecef',
                    paddingBottom: '8px'
                  }}>
                    <i className="fas fa-eye" style={{ marginRight: '8px' }}></i>
                    Preview dữ liệu (5 dòng đầu)
                  </h4>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px'
                    }}>
                  <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Ngày phát sinh</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Loại chi phí</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Sub loại</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'right',
                            fontWeight: '600'
                          }}>Số tiền</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Lớp học</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Khóa học</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Địa điểm</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Phương pháp</th>
                          <th style={{
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>Nguồn gốc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 5).map((item: any, index: number) => (
                          <tr key={index}>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>{formatDate(item.ngayPhatSinh)}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>{item.loaiChiPhi}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>{item.subLoai || '-'}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6',
                              textAlign: 'right'
                            }}>{formatCurrency(item.soTien)}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>{item.lopID ? getLopHocName(parseInt(item.lopID)) : '-'}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>{item.khoaHocID ? getKhoaHocName(parseInt(item.khoaHocID)) : '-'}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>{item.diaDiemID ? getDiaDiemName(parseInt(item.diaDiemID)) : '-'}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>{item.allocationMethod || 'SeatHours'}</td>
                            <td style={{
                              padding: '8px 10px',
                              border: '1px solid #dee2e6'
                            }}>
                              <span className={`badge ${item.nguonGoc === 'TuDong' ? 'badge-success' : 'badge-secondary'}`}>
                                {item.nguonGoc || 'NhapTay'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{
                    marginTop: '10px',
                    fontSize: '13px',
                    color: '#6c757d',
                    textAlign: 'center'
                  }}>
                    Tổng cộng: {importPreview.length} bản ghi
                  </div>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div style={{
                  marginBottom: '20px',
                  padding: '15px',
                  borderRadius: '8px',
                  border: `1px solid ${importResult.successCount > 0 ? '#c3e6cb' : '#f5c6cb'}`,
                  background: importResult.successCount > 0 ? '#d4edda' : '#f8d7da'
                }}>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    color: importResult.successCount > 0 ? '#155724' : '#721c24',
                    fontSize: '15px'
                  }}>
                    <i className={`fas ${importResult.successCount > 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}
                       style={{ marginRight: '8px' }}></i>
                    {importResult.successCount > 0 ? 'Import hoàn thành!' : 'Import thất bại'}
                  </h4>
                  <div style={{
                    fontSize: '14px',
                    color: importResult.successCount > 0 ? '#155724' : '#721c24'
                  }}>
                    <div>Thành công: {importResult.successCount} bản ghi</div>
                    {importResult.errorCount > 0 && (
                      <div>Thất bại: {importResult.errorCount} bản ghi</div>
                    )}
                    {importResult.totalRecords && (
                      <div>Tổng số bản ghi trong file: {importResult.totalRecords}</div>
                    )}
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <details>
                        <summary style={{
                          cursor: 'pointer',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: '#721c24'
                        }}>
                          Xem chi tiết lỗi ({importResult.errors.length} lỗi)
                        </summary>
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          fontSize: '12px',
                          background: 'rgba(114, 28, 36, 0.05)',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(114, 28, 36, 0.1)'
                        }}>
                          {importResult.errors.map((error: any, index: number) => (
                            <div key={index} style={{
                              marginBottom: '8px',
                              padding: '5px',
                              color: '#721c24',
                              borderBottom: index < importResult.errors.length - 1 ? '1px solid rgba(114, 28, 36, 0.1)' : 'none'
                            }}>
                              <strong>Dòng {error.rowNumber}:</strong> {error.errorMessage}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #f8f9fa'
            }}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImportForm();
                }}
                disabled={isImporting}
                style={{
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isImporting ? 0.6 : 1
                }}
                onMouseOver={(e) => !isImporting && (e.currentTarget.style.background = '#5a6268')}
                onMouseOut={(e) => !isImporting && (e.currentTarget.style.background = '#6c757d')}
              >
                Đóng
              </button>

              {importFile && !importPreview && (
                <>
                  <button
                    onClick={handlePreviewImport}
                    disabled={isImporting}
                    style={{
                      padding: '12px 24px',
                      background: isImporting ? '#6c757d' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: isImporting ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => !isImporting && (e.currentTarget.style.background = '#138496')}
                    onMouseOut={(e) => !isImporting && (e.currentTarget.style.background = '#17a2b8')}
                  >
                    {isImporting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-eye"></i>
                        <span>Preview</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    style={{
                      padding: '12px 24px',
                      background: isImporting ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: isImporting ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => !isImporting && (e.currentTarget.style.background = '#218838')}
                    onMouseOut={(e) => !isImporting && (e.currentTarget.style.background = '#28a745')}
                  >
                    {isImporting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Đang import...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload"></i>
                        <span>Import trực tiếp</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {importPreview && !importResult && (
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  style={{
                    padding: '12px 24px',
                    background: isImporting ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isImporting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isImporting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => !isImporting && (e.currentTarget.style.background = '#218838')}
                  onMouseOut={(e) => !isImporting && (e.currentTarget.style.background = '#28a745')}
                >
                  {isImporting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Đang import...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload"></i>
                      <span>Import dữ liệu</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChiPhiList;
