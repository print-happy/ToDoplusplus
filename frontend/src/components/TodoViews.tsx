import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];



const TodoViews: React.FC = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [calendarValue, setCalendarValue] = useState(dayjs());
  const [calendarModal, setCalendarModal] = useState<{visible: boolean, date: string}>({visible: false, date: ''});
  const [activeTab, setActiveTab] = useState('calendar');
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();

  // Toast notification system
  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  useEffect(() => {
    fetchTodos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTodos = async () => {
    try {
      const response = await axios.get('/api/todos');
      setTodos(response.data);
    } catch (error) {
      showNotification('获取待办事项失败', 'error');
    }
  };

  // 日历视图
  const onCalendarSelect = (value: any) => {
    setCalendarModal({ visible: true, date: value.format('YYYY-MM-DD') });
  };
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/todos/${id}`);
      showNotification('删除成功', 'success');
      fetchTodos();
    } catch (error) {
      showNotification('删除失败', 'error');
    }
  };
  // 上下月切换
  const prevMonth = () => setCalendarValue(calendarValue.subtract(1, 'month'));
  const nextMonth = () => setCalendarValue(calendarValue.add(1, 'month'));

  // 新增：周视图切换
  const prevWeek = () => setCalendarValue(calendarValue.subtract(1, 'week'));
  const nextWeek = () => setCalendarValue(calendarValue.add(1, 'week'));

  // 周视图
  const getWeekTodos = () => {
    const startOfWeek = calendarValue.startOf('week').add(1, 'day');
    const endOfWeek = calendarValue.endOf('week').add(1, 'day');
    return todos.filter(todo => dayjs(todo.dueDate).isBetween(startOfWeek, endOfWeek, null, '[]'));
  };
  const weekTodos = getWeekTodos();
  const weekTable: { [key: string]: any[] } = {};
  weekDays.forEach((d, i) => {
    const date = calendarValue.startOf('week').add(i + 1, 'day').format('YYYY-MM-DD');
    weekTable[date] = weekTodos.filter(todo => dayjs(todo.dueDate).format('YYYY-MM-DD') === date);
  });

  return (
    <div className="bg-gray-100 min-h-screen" style={{fontFamily: 'Roboto, sans-serif'}}>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {showToast.message}
        </div>
      )}

      <div className="p-6">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/todos')}
            className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
          >
            <span className="material-icons mr-1">arrow_back</span>
            返回
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">视图选项</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                日历视图
              </button>
              <button
                onClick={() => setActiveTab('week')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'week'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                周视图
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'calendar' && (
              <div>
                <div className="flex items-center justify-center mb-6">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <span className="mx-4 text-lg font-medium">{calendarValue.format('YYYY年MM月')}</span>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                </div>
                {/* Simple Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  <div className="p-2 font-medium text-gray-500">日</div>
                  <div className="p-2 font-medium text-gray-500">一</div>
                  <div className="p-2 font-medium text-gray-500">二</div>
                  <div className="p-2 font-medium text-gray-500">三</div>
                  <div className="p-2 font-medium text-gray-500">四</div>
                  <div className="p-2 font-medium text-gray-500">五</div>
                  <div className="p-2 font-medium text-gray-500">六</div>

                  {/* Calendar days */}
                  {(() => {
                    const year = calendarValue.year();
                    const month = calendarValue.month();
                    const firstDay = dayjs(new Date(year, month, 1));
                    const startDate = firstDay.subtract(firstDay.day(), 'day');
                    const days = [];

                    for (let i = 0; i < 42; i++) {
                      const date = startDate.add(i, 'day');
                      const isCurrentMonth = date.month() === month;
                      const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
                      const dayTodos = todos.filter(todo => dayjs(todo.dueDate).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'));

                      days.push(
                        <button
                          key={i}
                          onClick={() => onCalendarSelect(date)}
                          className={`p-2 h-16 border border-gray-100 hover:bg-blue-50 ${
                            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          } ${
                            isToday ? 'bg-blue-100 text-blue-600 font-medium' : ''
                          }`}
                        >
                          <div>{date.date()}</div>
                          {dayTodos.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {dayTodos.length}个任务
                            </div>
                          )}
                        </button>
                      );
                    }
                    return days;
                  })()}
                </div>

                {/* Modal for day details */}
                {calendarModal.visible && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">{calendarModal.date} 的待办事项</h2>
                        <button
                          onClick={() => setCalendarModal({ visible: false, date: '' })}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {todos.filter(todo => dayjs(todo.dueDate).format('YYYY-MM-DD') === calendarModal.date).map(item => (
                          <div key={item._id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{item.title}</h3>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                <div className="flex items-center mt-2 space-x-2">
                                  {item.priority === 'high' && (
                                    <span className="text-yellow-500">
                                      <span className="material-icons text-sm">star</span>
                                    </span>
                                  )}
                                  {item.isAIGenerated && (
                                    <span className="px-2 py-1 rounded text-xs text-purple-600 bg-purple-50">AI</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="text-red-500 hover:text-red-600 ml-2"
                              >
                                <span className="material-icons text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                        {todos.filter(todo => dayjs(todo.dueDate).format('YYYY-MM-DD') === calendarModal.date).length === 0 && (
                          <p className="text-gray-500 text-center py-4">这一天没有待办事项</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'week' && (
              <div>
                <div className="flex items-center justify-center mb-6">
                  <button
                    onClick={prevWeek}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <span className="mx-4 text-lg font-medium">
                    {calendarValue.startOf('week').add(1, 'day').format('YYYY年MM月DD日')} - {calendarValue.endOf('week').add(1, 'day').format('YYYY年MM月DD日')}
                  </span>
                  <button
                    onClick={nextWeek}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr>
                        {weekDays.map(day => (
                          <th key={day} className="border border-gray-200 p-3 bg-gray-50 font-medium text-gray-700">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {weekDays.map((_, i) => {
                          const date = calendarValue.startOf('week').add(i + 1, 'day').format('YYYY-MM-DD');
                          return (
                            <td key={date} className="border border-gray-200 align-top min-w-[120px] p-2">
                              {weekTable[date].length === 0 ? (
                                <div className="text-gray-400 text-center py-4">无事项</div>
                              ) : (
                                weekTable[date].map(item => (
                                  <div key={item._id} className="mb-3 border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                    <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                                    {item.description && (
                                      <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        {item.priority === 'high' && (
                                          <span className="text-yellow-500">
                                            <span className="material-icons text-sm">star</span>
                                          </span>
                                        )}
                                        {item.isAIGenerated && (
                                          <span className="px-2 py-1 rounded text-xs text-purple-600 bg-purple-50">AI</span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleDelete(item._id)}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        <span className="material-icons text-sm">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoViews; 