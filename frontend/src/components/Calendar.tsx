import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';

interface Todo {
  _id: string;
  user: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  xmlContent?: string;
  isAIGenerated?: boolean;
  isStarred?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CalendarProps {
  todos: Todo[];
  onDateClick: (date: string, tasks: Todo[]) => void;
  theme: any;
}

const Calendar: React.FC<CalendarProps> = ({ todos, onDateClick, theme }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // Group todos by date
  const todosByDate = useMemo(() => {
    const grouped: { [key: string]: Todo[] } = {};

    todos.forEach(todo => {
      const dateKey = dayjs(todo.dueDate).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(todo);
    });

    return grouped;
  }, [todos]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');

    const days = [];
    let current = startOfCalendar;

    while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }

    return days;
  }, [currentMonth]);

  const getTasksForDate = (date: dayjs.Dayjs): Todo[] => {
    const dateKey = date.format('YYYY-MM-DD');
    return todosByDate[dateKey] || [];
  };

  const getTaskCountByStatus = (tasks: Todo[]) => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return { pending, completed };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'prev' ? prev.subtract(1, 'month') : prev.add(1, 'month')
    );
  };

  const goToToday = () => {
    setCurrentMonth(dayjs());
  };

  const isToday = (date: dayjs.Dayjs) => date.isSame(dayjs(), 'day');
  const isCurrentMonth = (date: dayjs.Dayjs) => date.isSame(currentMonth, 'month');

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      padding: '24px'
    }}>
      {/* Calendar Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: theme[600],
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-icons" style={{ fontSize: '28px' }}>calendar_month</span>
          {currentMonth.format('YYYY年 MM月')}
        </h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigateMonth('prev')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <span className="material-icons">chevron_left</span>
          </button>

          <button
            onClick={goToToday}
            style={{
              backgroundColor: theme[100],
              color: theme[600],
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            今天
          </button>

          <button
            onClick={() => navigateMonth('next')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        backgroundColor: '#e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Day Headers */}
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div
            key={day}
            style={{
              backgroundColor: '#f9fafb',
              padding: '12px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map(date => {
          const tasks = getTasksForDate(date);
          const { pending, completed } = getTaskCountByStatus(tasks);
          const hasAnyTasks = tasks.length > 0;

          return (
            <div
              key={date.format('YYYY-MM-DD')}
              onClick={() => hasAnyTasks && onDateClick(date.toISOString(), tasks)}
              style={{
                backgroundColor: 'white',
                padding: '8px',
                minHeight: '80px',
                cursor: hasAnyTasks ? 'pointer' : 'default',
                position: 'relative',
                border: isToday(date) ? `2px solid ${theme[500]}` : 'none',
                opacity: isCurrentMonth(date) ? 1 : 0.4,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (hasAnyTasks) {
                  e.currentTarget.style.backgroundColor = theme[50];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              {/* Date Number */}
              <div style={{
                fontSize: '14px',
                fontWeight: isToday(date) ? '600' : '400',
                color: isToday(date) ? theme[600] : '#374151',
                marginBottom: '4px'
              }}>
                {date.format('D')}
              </div>

              {/* Task Indicators */}
              {hasAnyTasks && (
                <div style={{ fontSize: '10px', lineHeight: '1.2' }}>
                  {pending > 0 && (
                    <div style={{
                      backgroundColor: theme[100],
                      color: theme[600],
                      borderRadius: '4px',
                      padding: '2px 4px',
                      marginBottom: '2px',
                      fontSize: '10px'
                    }}>
                      {pending} 待办
                    </div>
                  )}
                  {completed > 0 && (
                    <div style={{
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      fontSize: '10px'
                    }}>
                      {completed} 完成
                    </div>
                  )}
                </div>
              )}

              {/* Task Priority Indicator */}
              {hasAnyTasks && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: tasks.some(t => t.priority === 'high') ? '#ef4444' :
                                  tasks.some(t => t.priority === 'medium') ? '#f59e0b' : '#10b981'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          高优先级
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          中优先级
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          低优先级
        </div>
      </div>
    </div>
  );
};

export default Calendar;
