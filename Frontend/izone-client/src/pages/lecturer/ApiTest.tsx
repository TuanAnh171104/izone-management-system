import React, { useState } from 'react';
import { lopHocService, taiKhoanService } from '../../services/api';

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLopHocAPI = async () => {
    setLoading(true);
    addLog('🔄 Bắt đầu test API LopHoc...');

    try {
      addLog('📚 Gọi lopHocService.getAll()...');
      const classes = await lopHocService.getAll();
      addLog(`✅ Thành công! Nhận được ${classes.length} lớp học`);

      if (classes.length > 0) {
        addLog(`📋 Lớp học đầu tiên: ID=${classes[0].lopID}, GiangVienID=${classes[0].giangVienID}`);
      }
    } catch (error: any) {
      addLog(`❌ Lỗi: ${error.message}`);
      addLog(`❌ Chi tiết: ${JSON.stringify(error.response?.data || error)}`);
    }

    setLoading(false);
  };

  const testTaiKhoanAPI = async () => {
    setLoading(true);
    addLog('🔄 Bắt đầu test API TaiKhoan...');

    try {
      addLog('👤 Gọi taiKhoanService.getAll()...');
      const accounts = await taiKhoanService.getAll();
      addLog(`✅ Thành công! Nhận được ${accounts.length} tài khoản`);

      if (accounts.length > 0) {
        addLog(`📋 Tài khoản đầu tiên: ID=${accounts[0].taiKhoanID}, Email=${accounts[0].email}, VaiTro=${accounts[0].vaiTro}`);
      }
    } catch (error: any) {
      addLog(`❌ Lỗi: ${error.message}`);
      addLog(`❌ Chi tiết: ${JSON.stringify(error.response?.data || error)}`);
    }

    setLoading(false);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 API Test Page</h2>
      <p>Trang này để test các API endpoint và debug vấn đề kết nối.</p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testLopHocAPI}
          disabled={loading}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Đang test...' : 'Test LopHoc API'}
        </button>

        <button
          onClick={testTaiKhoanAPI}
          disabled={loading}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test TaiKhoan API
        </button>

        <button
          onClick={clearLogs}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Xóa Logs
        </button>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '15px',
        height: '400px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h4>Kết quả test:</h4>
        {testResults.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>Chưa có kết quả test nào...</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{
              marginBottom: '5px',
              padding: '5px',
              backgroundColor: result.includes('❌') ? '#f8d7da' : result.includes('✅') ? '#d4edda' : '#fff3cd',
              borderRadius: '3px'
            }}>
              {result}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
        <p><strong>Debug Info:</strong></p>
        <p>API Base URL: http://localhost:5080/api</p>
        <p>Auth Token: {localStorage.getItem('authToken') ? 'Có' : 'Không có'}</p>
        <p>User Info: {localStorage.getItem('userInfo') ? 'Có' : 'Không có'}</p>
      </div>
    </div>
  );
};

export default ApiTest;
