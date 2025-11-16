import React, { useState, useEffect } from 'react';
import { diaDiemService, DiaDiem, thueMatBangService, ThueMatBang, lopHocService, LopHoc } from '../../services/api';
import { Edit, DeleteForever } from '@mui/icons-material';
import '../../styles/Management.css';

const AdminDiaDiemList: React.FC = () => {
  // State cho danh sách cơ sở
  const [diaDiemList, setDiaDiemList] = useState<DiaDiem[]>([]);
  const [filteredDiaDiemList, setFilteredDiaDiemList] = useState<DiaDiem[]>([]);
  const [selectedDiaDiem, setSelectedDiaDiem] = useState<DiaDiem | null>(null);

  // State cho hợp đồng thuê
  const [thueMatBangList, setThueMatBangList] = useState<ThueMatBang[]>([]);
  const [selectedThue, setSelectedThue] = useState<ThueMatBang | null>(null);

  // State cho lớp học
  const [lopHocList, setLopHocList] = useState<LopHoc[]>([]);

  // State cho loading và error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho form thêm/sửa cơ sở
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    tenCoSo: '',
    diaChi: '',
    sucChua: ''
  });

  // State cho form thêm hợp đồng
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [contractFormData, setContractFormData] = useState({
    giaThueThang: '',
    ngayApDung: '',
    hanHopDong: '',
    ghiChu: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [diaDiemList, searchTerm]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [diaDiemData, lopHocData] = await Promise.all([
        diaDiemService.getAll(),
        lopHocService.getAll()
      ]);

      setDiaDiemList(diaDiemData);
      setLopHocList(lopHocData);

      // Chọn cơ sở đầu tiên mặc định
      if (diaDiemData.length > 0) {
        setSelectedDiaDiem(diaDiemData[0]);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...diaDiemList];

    if (searchTerm) {
      filtered = filtered.filter(diaDiem =>
        diaDiem.tenCoSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diaDiem.diaChi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDiaDiemList(filtered);
  };

  const handleDiaDiemSelect = async (diaDiem: DiaDiem) => {
    console.log('=== DEBUG DiaDiem Select ===');
    console.log('DiaDiem object:', diaDiem);
    console.log('DiaDiemID:', diaDiem.diaDiemID);
    console.log('TenCoSo:', diaDiem.tenCoSo);

    setSelectedDiaDiem(diaDiem);

    // Lấy danh sách hợp đồng thuê cho cơ sở này
    try {
      console.log('🔄 Đang tải hợp đồng cho cơ sở:', diaDiem.tenCoSo, 'với ID:', diaDiem.diaDiemID);
      console.log('🔗 API URL sẽ gọi:', `/ThueMatBang/dia-diem/${diaDiem.diaDiemID}`);

      const contracts = await thueMatBangService.getByDiaDiemId(diaDiem.diaDiemID);
      console.log('📦 Hợp đồng nhận được:', contracts);
      console.log('📊 Số lượng hợp đồng:', contracts?.length || 0);

      if (!contracts) {
        console.log('❌ Không nhận được dữ liệu hợp đồng (null/undefined)');
        setThueMatBangList([]);
        return;
      }

      if (contracts.length === 0) {
        console.log('⚠️ Không có hợp đồng nào cho cơ sở này');
        console.log('💡 Kiểm tra database có ThueMatBang với DiaDiemID =', diaDiem.diaDiemID);
        console.log('💡 Kiểm tra API endpoint có hoạt động không');
      } else {
        console.log('✅ Tìm thấy hợp đồng cho cơ sở này');
        contracts.forEach((contract, index) => {
          console.log(`  Hợp đồng ${index + 1}:`, {
            thueID: contract.thueID,
            giaThueThang: contract.giaThueThang,
            ngayApDung: contract.ngayApDung,
            hanHopDong: contract.hanHopDong
          });
        });
      }

      setThueMatBangList(contracts);
    } catch (error) {
      console.error('❌ Lỗi khi tải hợp đồng thuê:', error);
      console.error('❌ Error details:', {
        message: (error as any)?.message,
        response: (error as any)?.response,
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data
      });

      // Hiển thị thông báo lỗi cho người dùng
      alert(`Không thể tải hợp đồng thuê: ${(error as any)?.message || 'Lỗi không xác định'}`);
      setThueMatBangList([]);
    }
  };

  const getLopHocCount = (diaDiemID: number) => {
    return lopHocList.filter(lop => lop.diaDiemID === diaDiemID).length;
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

  // Hàm xử lý form cơ sở
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      tenCoSo: '',
      diaChi: '',
      sucChua: ''
    });
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (selectedDiaDiem) {
      setFormData({
        tenCoSo: selectedDiaDiem.tenCoSo,
        diaChi: selectedDiaDiem.diaChi,
        sucChua: selectedDiaDiem.sucChua?.toString() || ''
      });
      setIsEditing(true);
      setShowAddModal(true); // Thêm dòng này để hiển thị modal
    }
  };

  const handleSave = async () => {
    try {
      if (isEditing && selectedDiaDiem) {
        // Cập nhật cơ sở
        const updatedDiaDiem = {
          ...selectedDiaDiem,
          tenCoSo: formData.tenCoSo,
          diaChi: formData.diaChi,
          sucChua: formData.sucChua ? parseInt(formData.sucChua) : null
        };

        await diaDiemService.update(selectedDiaDiem.diaDiemID, updatedDiaDiem);

        // Cập nhật state
        const updatedList = diaDiemList.map(dd =>
          dd.diaDiemID === selectedDiaDiem.diaDiemID ? updatedDiaDiem : dd
        );
        setDiaDiemList(updatedList);
        setSelectedDiaDiem(updatedDiaDiem);
      } else {
        // Thêm cơ sở mới
        const newDiaDiem = {
          tenCoSo: formData.tenCoSo,
          diaChi: formData.diaChi,
          sucChua: formData.sucChua ? parseInt(formData.sucChua) : null
        };

        const createdDiaDiem = await diaDiemService.create(newDiaDiem);

        // Cập nhật state
        setDiaDiemList(prev => [...prev, createdDiaDiem]);
        setSelectedDiaDiem(createdDiaDiem);
      }

      resetForm();
      alert(isEditing ? 'Cập nhật cơ sở thành công!' : 'Thêm cơ sở thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu cơ sở:', error);
      alert('Không thể lưu cơ sở. Vui lòng thử lại.');
    }
  };

  const handleDelete = async () => {
    if (!selectedDiaDiem) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa cơ sở "${selectedDiaDiem.tenCoSo}"?`)) {
      try {
        await diaDiemService.delete(selectedDiaDiem.diaDiemID);

        // Cập nhật state
        const updatedList = diaDiemList.filter(dd => dd.diaDiemID !== selectedDiaDiem.diaDiemID);
        setDiaDiemList(updatedList);

        // Chọn cơ sở khác
        if (updatedList.length > 0) {
          setSelectedDiaDiem(updatedList[0]);
        } else {
          setSelectedDiaDiem(null);
          setThueMatBangList([]);
        }

        alert('Xóa cơ sở thành công!');
      } catch (error) {
        console.error('Lỗi khi xóa cơ sở:', error);
        alert('Không thể xóa cơ sở. Vui lòng thử lại.');
      }
    }
  };

  // Hàm xử lý hợp đồng thuê
  const handleContractInputChange = (field: string, value: string) => {
    setContractFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetContractForm = () => {
    setContractFormData({
      giaThueThang: '',
      ngayApDung: '',
      hanHopDong: '',
      ghiChu: ''
    });
  };

  const handleAddContract = async () => {
    if (!selectedDiaDiem) {
      console.log('❌ Không có cơ sở nào được chọn');
      return;
    }

    console.log('🔄 Bắt đầu thêm hợp đồng mới...');
    console.log('📋 Dữ liệu form:', contractFormData);
    console.log('🏢 Cơ sở được chọn:', selectedDiaDiem.tenCoSo, 'ID:', selectedDiaDiem.diaDiemID);

    // Validation
    if (!contractFormData.giaThueThang || !contractFormData.ngayApDung) {
      console.log('❌ Thiếu thông tin bắt buộc');
      alert('Vui lòng nhập đầy đủ giá thuê và ngày áp dụng!');
      return;
    }

    try {
      const newContract = {
        diaDiemID: selectedDiaDiem.diaDiemID,
        giaThueThang: parseFloat(contractFormData.giaThueThang),
        ngayApDung: contractFormData.ngayApDung,
        hanHopDong: contractFormData.hanHopDong || null,
        ghiChu: contractFormData.ghiChu || null
      };

      console.log('📦 Dữ liệu hợp đồng sẽ gửi:', newContract);

      const createdContract = await thueMatBangService.create(newContract);
      console.log('✅ Hợp đồng đã được tạo thành công:', createdContract);

      // Cập nhật state
      setThueMatBangList(prev => [...prev, createdContract]);
      resetContractForm();
      setShowAddContractModal(false);

      alert('Thêm hợp đồng thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi thêm hợp đồng:', error);
      console.error('❌ Chi tiết lỗi:', {
        message: (error as any)?.message,
        response: (error as any)?.response,
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data
      });

      // Thông báo lỗi chi tiết hơn
      const errorMessage = (error as any)?.response?.data?.message ||
                          (error as any)?.message ||
                          'Không thể thêm hợp đồng. Vui lòng thử lại.';

      alert(`Không thể thêm hợp đồng: ${errorMessage}`);
    }
  };

  const handleDeleteContract = async (thue: ThueMatBang) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
      try {
        await thueMatBangService.delete(thue.thueID);

        // Cập nhật state
        const updatedContracts = thueMatBangList.filter(t => t.thueID !== thue.thueID);
        setThueMatBangList(updatedContracts);

        alert('Xóa hợp đồng thành công!');
      } catch (error) {
        console.error('Lỗi khi xóa hợp đồng:', error);
        alert('Không thể xóa hợp đồng. Vui lòng thử lại.');
      }
    }
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="management-header">
          <h2>Quản lý Cơ sở vật chất</h2>
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
          <h2>Quản lý Cơ sở vật chất</h2>
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
        <h2>Quản lý Cơ sở vật chất</h2>
      </div>

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
          <strong>Tổng số cơ sở:</strong> {filteredDiaDiemList.length} cơ sở
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 220px)', overflow: 'hidden' }}>
        {/* Khu vực A: Danh sách cơ sở (với nút sửa/xóa inline) */}
        <div style={{ flex: '1', background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#dc2626' }}>Danh sách cơ sở</h3>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
                Thêm cơ sở
              </button>
            </div>

            {/* Tìm kiếm */}
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }}></i>
              <input
                type="text"
                placeholder="Tìm kiếm cơ sở..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Danh sách cơ sở với nút sửa/xóa inline */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredDiaDiemList.map((diaDiem) => (
              <div
                key={diaDiem.diaDiemID}
                onClick={() => handleDiaDiemSelect(diaDiem)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  border: selectedDiaDiem?.diaDiemID === diaDiem.diaDiemID ? '2px solid #dc2626' : '2px solid #e9ecef',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedDiaDiem?.diaDiemID === diaDiem.diaDiemID ? '#fff5f5' : 'white',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  if (selectedDiaDiem?.diaDiemID !== diaDiem.diaDiemID) {
                    e.currentTarget.style.borderColor = '#dc2626';
                    e.currentTarget.style.background = '#fff5f5';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedDiaDiem?.diaDiemID !== diaDiem.diaDiemID) {
                    e.currentTarget.style.borderColor = '#e9ecef';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                      {diaDiem.tenCoSo}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      {diaDiem.diaChi}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Sức chứa: {diaDiem.sucChua || 'Chưa cập nhật'} |
                      Lớp học: {getLopHocCount(diaDiem.diaDiemID)}
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
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
                </div>
              </div>
            ))}

            {filteredDiaDiemList.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                {diaDiemList.length === 0 ? 'Chưa có cơ sở nào.' : 'Không tìm thấy cơ sở nào phù hợp.'}
              </div>
            )}
          </div>
        </div>

        {/* Khu vực B: Hợp đồng thuê (khu vực chính) */}
        <div style={{ flex: '2', background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#dc2626' }}>
              Hợp đồng thuê {selectedDiaDiem ? `- ${selectedDiaDiem.tenCoSo}` : ''}
            </h3>
            <button
              onClick={() => setShowAddContractModal(true)}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '14px' }}
              disabled={!selectedDiaDiem}
            >
              <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
              Thêm hợp đồng
            </button>
          </div>

          {!selectedDiaDiem ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '60px 20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-building" style={{ fontSize: '64px', color: '#ddd', marginBottom: '20px' }}></i>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Chọn một cơ sở</div>
              <div style={{ fontSize: '14px' }}>Chọn cơ sở bên trái để xem và quản lý hợp đồng thuê</div>
            </div>
          ) : (
            <>
              {/* Danh sách hợp đồng - Khu vực chính */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '20px',
                minHeight: '400px',
                maxHeight: '500px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '10px'
              }}>
                {thueMatBangList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: '80px 20px' }}>
                    <i className="fas fa-file-contract" style={{ fontSize: '48px', color: '#ddd', marginBottom: '20px' }}></i>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Chưa có hợp đồng thuê nào</div>
                    <div style={{ fontSize: '14px', marginBottom: '20px' }}>Cơ sở <strong>{selectedDiaDiem.tenCoSo}</strong> chưa có hợp đồng thuê mặt bằng nào.</div>
                    <div style={{ fontSize: '14px', marginBottom: '15px' }}>💡 Hãy thêm hợp đồng đầu tiên bằng nút "Thêm hợp đồng" ở trên</div>
                    <button
                      onClick={() => setShowAddContractModal(true)}
                      className="btn btn-primary"
                      style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      Thêm hợp đồng ngay
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {thueMatBangList.map((thue, index) => (
                      <div
                        key={thue.thueID}
                        style={{
                          padding: '15px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: 'white'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#dc2626';
                          e.currentTarget.style.background = '#fff5f5';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e9ecef';
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', color: '#dc2626' }}>
                              {formatCurrency(thue.giaThueThang)}/tháng
                            </div>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>
                              <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i>
                              Ngày áp dụng: {formatDate(thue.ngayApDung)}
                            </div>
                            {thue.hanHopDong && (
                              <div style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>
                                <i className="fas fa-calendar-times" style={{ marginRight: '5px' }}></i>
                                Hạn hợp đồng: {formatDate(thue.hanHopDong)}
                              </div>
                            )}
                            {thue.ghiChu && (
                              <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', padding: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                                <i className="fas fa-sticky-note" style={{ marginRight: '5px' }}></i>
                                {thue.ghiChu}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteContract(thue)}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form thêm hợp đồng nhanh */}
              <div style={{
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '15px',
                background: '#f8f9fa',
                marginTop: 'auto'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '14px' }}>
                  <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>
                  Thêm hợp đồng mới cho <strong>{selectedDiaDiem.tenCoSo}</strong>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Giá thuê/tháng:
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 10000000"
                      value={contractFormData.giaThueThang}
                      onChange={(e) => handleContractInputChange('giaThueThang', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #e9ecef',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Ngày áp dụng:
                    </label>
                    <input
                      type="date"
                      value={contractFormData.ngayApDung}
                      onChange={(e) => handleContractInputChange('ngayApDung', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #e9ecef',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Hạn hợp đồng:
                    </label>
                    <input
                      type="date"
                      value={contractFormData.hanHopDong}
                      onChange={(e) => handleContractInputChange('hanHopDong', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #e9ecef',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Ghi chú:
                    </label>
                    <input
                      type="text"
                      placeholder="Tùy chọn"
                      value={contractFormData.ghiChu}
                      onChange={(e) => handleContractInputChange('ghiChu', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #e9ecef',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddContract}
                  className="btn btn-success"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  disabled={!contractFormData.giaThueThang || !contractFormData.ngayApDung}
                >
                  <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
                  Thêm hợp đồng
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal thêm hợp đồng mới */}
      {showAddContractModal && (
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
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              Thêm hợp đồng thuê mới
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Giá thuê/tháng: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="number"
                placeholder="Nhập giá thuê (VNĐ)"
                value={contractFormData.giaThueThang}
                onChange={(e) => handleContractInputChange('giaThueThang', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Ngày áp dụng: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="date"
                value={contractFormData.ngayApDung}
                onChange={(e) => handleContractInputChange('ngayApDung', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Hạn hợp đồng:
              </label>
              <input
                type="date"
                value={contractFormData.hanHopDong}
                onChange={(e) => handleContractInputChange('hanHopDong', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Ghi chú:
              </label>
              <input
                type="text"
                placeholder="Nhập ghi chú (tùy chọn)"
                value={contractFormData.ghiChu}
                onChange={(e) => handleContractInputChange('ghiChu', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddContractModal(false)}
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
                onClick={handleAddContract}
                disabled={!contractFormData.giaThueThang || !contractFormData.ngayApDung}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: (!contractFormData.giaThueThang || !contractFormData.ngayApDung) ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!contractFormData.giaThueThang || !contractFormData.ngayApDung) ? 'not-allowed' : 'pointer'
                }}
              >
                Thêm hợp đồng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa cơ sở vật chất */}
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc2626', textAlign: 'center' }}>
              {isEditing ? 'Cập nhật cơ sở vật chất' : 'Thêm cơ sở mới'}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Tên cơ sở: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.tenCoSo}
                onChange={(e) => handleInputChange('tenCoSo', e.target.value)}
                placeholder="Nhập tên cơ sở"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Địa chỉ: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.diaChi}
                onChange={(e) => handleInputChange('diaChi', e.target.value)}
                placeholder="Nhập địa chỉ"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                Sức chứa:
              </label>
              <input
                type="number"
                value={formData.sucChua}
                onChange={(e) => handleInputChange('sucChua', e.target.value)}
                placeholder="Nhập sức chứa (tùy chọn)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddModal(false)}
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
                onClick={handleSave}
                disabled={!formData.tenCoSo || !formData.diaChi}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: (!formData.tenCoSo || !formData.diaChi) ? '#6c757d' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!formData.tenCoSo || !formData.diaChi) ? 'not-allowed' : 'pointer'
                }}
              >
                {isEditing ? 'Cập nhật cơ sở' : 'Thêm cơ sở'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiaDiemList;
