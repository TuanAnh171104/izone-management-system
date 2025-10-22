import React, { useState, useMemo } from 'react';
import { BuoiHoc, DiaDiem } from '../services/api';

interface MonthlyCalendarProps {
  buoiHocs: BuoiHoc[];
  diaDiem?: DiaDiem | null;
  onSessionClick?: (buoiHoc: BuoiHoc) => void;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: BuoiHoc[];
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  buoiHocs,
  diaDiem,
  onSessionClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Lấy tháng và năm hiện tại
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Đồng bộ selectedMonth và selectedYear với currentDate
  useMemo(() => {
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
  }, [currentDate]);

  // Tạo dữ liệu lịch cho tháng hiện tại
  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const calendarDays: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    // Tạo 6 tuần x 7 ngày = 42 ô
    for (let i = 0; i < 42; i++) {
      const daySessions = buoiHocs.filter(session => {
        const sessionDate = new Date(session.ngayHoc);
        return sessionDate.toDateString() === currentDate.toDateString();
      });

      calendarDays.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === selectedMonth,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        sessions: daySessions
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendarDays;
  }, [selectedYear, selectedMonth, buoiHocs]);

  // Điều hướng tháng
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Về tháng hiện tại
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format ngày tháng
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Lấy màu sắc cho trạng thái buổi học
  const getSessionColor = (status: string | null) => {
    console.log('Session status:', status); // Debug log để kiểm tra trạng thái thực tế

    switch (status?.toLowerCase()) {
      case 'dadiendra':
      case 'đã diễn ra':
      case 'dadienra':
        return '#10b981'; // xanh lá
      case 'sapdienra':
      case 'sắp diễn ra':
      case 'chuadienra':
        return '#f59e0b'; // cam
      case 'dangdienra':
      case 'đang diễn ra':
        return '#3b82f6'; // xanh dương
      case 'dahuy':
      case 'đã hủy':
      case 'huy':
        return '#6b7280'; // xám
      default:
        console.warn('Unknown session status:', status); // Debug log cho trạng thái không xác định
        return '#dc2626'; // đỏ mặc định
    }
  };

  // Format thời gian buổi học
  const formatSessionTime = (session: BuoiHoc) => {
    if (session.thoiGianBatDau && session.thoiGianKetThuc) {
      return `${session.thoiGianBatDau} - ${session.thoiGianKetThuc}`;
    }
    return 'Chưa xác định';
  };

  // Hàm xử lý chọn tháng
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setCurrentDate(new Date(selectedYear, month, 1));
  };

  // Hàm xử lý chọn năm
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentDate(new Date(year, selectedMonth, 1));
  };

  // Tạo danh sách tháng
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Tạo danh sách năm (từ năm hiện tại - 5 đến + 5)
  const currentYearValue = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYearValue - 5 + i);

  // Các thứ trong tuần
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header lịch */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigateMonth('prev')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          {/* Dropdown chọn tháng và năm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {months.map((month, index) => (
                <option key={index} value={index} style={{ color: '#374151' }}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {years.map(year => (
                <option key={year} value={year} style={{ color: '#374151' }}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <button
          onClick={goToToday}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Hôm nay
        </button>
      </div>

      {/* Grid lịch */}
      <div style={{ padding: '20px' }}>
        {/* Header các ngày trong tuần */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '10px'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              padding: '10px',
              textAlign: 'center',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Các ngày trong tháng */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px'
        }}>
          {calendarData.map((day, index) => (
            <div
              key={index}
              style={{
                minHeight: '120px',
                padding: '4px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: day.isToday
                  ? 'rgba(220, 38, 38, 0.05)'
                  : day.isCurrentMonth
                    ? 'white'
                    : '#f9fafb',
                position: 'relative'
              }}
            >
              {/* Số ngày */}
              <div style={{
                padding: '6px 8px',
                fontSize: '14px',
                fontWeight: day.isToday ? '700' : '500',
                color: day.isToday
                  ? '#dc2626'
                  : day.isCurrentMonth
                    ? '#374151'
                    : '#9ca3af',
                textAlign: 'left'
              }}>
                {day.day}
                {day.isToday && (
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: '#dc2626',
                    borderRadius: '50%',
                    marginLeft: '4px'
                  }}></span>
                )}
              </div>

              {/* Các buổi học trong ngày */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                marginTop: '4px'
              }}>
                {day.sessions.slice(0, 3).map((session, sessionIndex) => (
                  <div
                    key={session.buoiHocID}
                    onClick={() => onSessionClick?.(session)}
                    style={{
                      background: getSessionColor(session.trangThai || null),
                      color: 'white',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      position: 'relative'
                    }}
                    title={`${formatSessionTime(session)} - ${diaDiem?.tenCoSo || 'Chưa xác định địa điểm'}`}
                  >
                    <i className="fas fa-circle" style={{ marginRight: '2px', fontSize: '8px' }}></i>
                    {session.thoiGianBatDau || `${sessionIndex + 1}`}
                  </div>
                ))}

                {/* Hiển thị "..." nếu có nhiều hơn 3 buổi học */}
                {day.sessions.length > 3 && (
                  <div style={{
                    fontSize: '10px',
                    color: '#6b7280',
                    fontStyle: 'italic',
                    padding: '2px 4px'
                  }}>
                    +{day.sessions.length - 3} buổi
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: '15px 20px',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
          <i className="fas fa-circle" style={{ marginRight: '5px', fontSize: '10px' }}></i>
          Buổi học
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></div>
            <span>Đã diễn ra</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }}></div>
            <span>Sắp diễn ra</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }}></div>
            <span>Đang diễn ra</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', background: '#6b7280', borderRadius: '2px' }}></div>
            <span>Đã hủy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendar;
