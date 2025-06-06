import React, { useState } from 'react';
import dayjs from 'dayjs';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  
  const getThemeColors = () => {
    return {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      500: '#3b82f6',
      600: '#2563eb'
    };
  };

  const theme = getThemeColors();

  const goToPreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
  };

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');
    
    const days = [];
    let day = startOfWeek;
    
    while (day.isBefore(endOfWeek) || day.isSame(endOfWeek, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }
    
    return days;
  };

  const isToday = (date: dayjs.Dayjs) => {
    return date.isSame(dayjs(), 'day');
  };

  const isCurrentMonth = (date: dayjs.Dayjs) => {
    return date.isSame(currentDate, 'month');
  };

  const days = getDaysInMonth();

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={goToPreviousMonth}
            style={{ color: '#6b7280', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <span className="material-icons">chevron_left</span>
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', margin: '0 8px' }}>
            {currentDate.format('YYYY MMMM')}
          </h2>
          <button
            onClick={goToNextMonth}
            style={{ color: '#6b7280', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
        <button
          onClick={goToToday}
          style={{
            fontSize: '14px',
            color: theme[600],
            backgroundColor: 'transparent',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Today
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
        <div>Su</div>
        <div>Mo</div>
        <div>Tu</div>
        <div>We</div>
        <div>Th</div>
        <div>Fr</div>
        <div>Sa</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '14px' }}>
        {days.map((day, index) => (
          <div
            key={index}
            style={{
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '6px',
              backgroundColor: isToday(day) ? theme[100] : 'transparent',
              color: isToday(day) ? theme[600] : isCurrentMonth(day) ? '#111827' : '#9ca3af',
              fontWeight: isToday(day) ? '500' : 'normal'
            }}
            onMouseEnter={(e) => {
              if (!isToday(day)) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isToday(day)) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {day.format('DD')}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
