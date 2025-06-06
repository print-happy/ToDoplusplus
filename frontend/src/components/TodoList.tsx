import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

axios.defaults.baseURL = 'http://localhost:5000';

interface Todo {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  isAIGenerated: boolean;
}

const priorityOrder = { high: 1, medium: 2, low: 3 };

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    repeat: 'none'
  });
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [currentView, setCurrentView] = useState('planned'); // 'my-day', 'important', 'planned', 'assigned', 'tasks'
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    fetchTodos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toast notification system
  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const fetchTodos = async () => {
    try {
      const response = await axios.get('/api/todos');
      setTodos(response.data);
    } catch (error) {
      showNotification('获取待办事项失败', 'error');
    }
  };

  const handleCreate = () => {
    setEditingTodo(null);
    setNewTodo({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      repeat: 'none'
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setNewTodo({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      repeat: 'none'
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodo.title || !newTodo.dueDate) {
      showNotification('请填写标题和截止日期', 'error');
      return;
    }

    try {
      const todoData = {
        ...newTodo,
        dueDate: new Date(newTodo.dueDate).toISOString(),
        xmlContent: `<todo><title>${newTodo.title}</title><description>${newTodo.description || ''}</description></todo>`
      };

      if (editingTodo) {
        await axios.patch(`/api/todos/${editingTodo._id}`, todoData);
        showNotification('更新成功', 'success');
      } else {
        await axios.post('/api/todos', todoData);
        showNotification('创建成功', 'success');
      }
      setIsModalVisible(false);
      setNewTodo({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        repeat: 'none'
      });
      fetchTodos();
    } catch (error) {
      showNotification(editingTodo ? '更新失败' : '创建失败', 'error');
    }
  };



  // 根据当前视图过滤和排序待办事项
  const getFilteredTodos = () => {
    let filtered = [...todos];
    const today = dayjs().format('YYYY-MM-DD');

    switch (currentView) {
      case 'my-day':
        filtered = todos.filter(todo => dayjs(todo.dueDate).format('YYYY-MM-DD') === today);
        break;
      case 'important':
        filtered = todos.filter(todo => todo.priority === 'high');
        break;
      case 'planned':
        filtered = todos; // 显示所有计划的任务
        break;
      case 'tasks':
        filtered = todos; // 显示所有任务
        break;
      default:
        filtered = todos;
    }

    // 排序：优先级高->低，日期近->远
    return filtered.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
    });
  };

  const sortedTodos = getFilteredTodos();

  // 获取当前视图的标题和图标
  const getViewInfo = () => {
    switch (currentView) {
      case 'my-day':
        return { title: '我的一天', icon: 'lightbulb', color: 'text-blue-600' };
      case 'important':
        return { title: '重要', icon: 'star_border', color: 'text-yellow-600' };
      case 'planned':
        return { title: '已计划', icon: 'list_alt', color: 'text-blue-600' };
      case 'tasks':
        return { title: '任务', icon: 'task_alt', color: 'text-purple-600' };
      default:
        return { title: '已计划', icon: 'list_alt', color: 'text-blue-600' };
    }
  };

  const viewInfo = getViewInfo();

  // 计算完成率
  const completedCount = todos.filter(t => t.status === 'completed').length;
  const totalCount = todos.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // 勾选完成事项
  const handleCheck = async (todo: Todo, checked: boolean) => {
    try {
      await axios.patch(`/api/todos/${todo._id}`, { status: checked ? 'completed' : 'pending' });
      await fetchTodos();
    } catch (e) {
      showNotification('更新事项状态失败', 'error');
    }
  };

  // 切换重要性标记
  const handleToggleImportant = async (todo: Todo) => {
    try {
      const newPriority = todo.priority === 'high' ? 'medium' : 'high';
      await axios.patch(`/api/todos/${todo._id}`, { priority: newPriority });
      await fetchTodos();
    } catch (e) {
      showNotification('更新重要性失败', 'error');
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) {
      showNotification('请输入自然语言描述', 'error');
      return;
    }
    try {
      await axios.post('/api/todos/generate', { prompt: aiPrompt });
      showNotification('AI生成成功', 'success');
      setAiPrompt('');
      fetchTodos();
    } catch (error) {
      showNotification('AI生成失败', 'error');
    }
  };

  // 快速添加任务
  const handleQuickAdd = () => {
    setShowQuickAdd(true);
    setQuickAddTitle('');
    setSelectedDate('');
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddTitle.trim()) {
      showNotification('请输入任务标题', 'error');
      return;
    }

    const dueDate = selectedDate || dayjs().format('YYYY-MM-DD');

    try {
      const todoData = {
        title: quickAddTitle,
        description: '',
        dueDate: new Date(dueDate).toISOString(),
        priority: 'medium',
        repeat: 'none',
        xmlContent: `<todo><title>${quickAddTitle}</title><description></description></todo>`
      };

      await axios.post('/api/todos', todoData);
      showNotification('任务创建成功', 'success');
      setShowQuickAdd(false);
      setQuickAddTitle('');
      setSelectedDate('');
      fetchTodos();
    } catch (error) {
      showNotification('创建任务失败', 'error');
    }
  };

  // 日期选择相关
  const getQuickDateOptions = () => {
    const today = dayjs();
    return [
      { label: '今天', value: today.format('YYYY-MM-DD'), day: today.format('dddd') },
      { label: '明天', value: today.add(1, 'day').format('YYYY-MM-DD'), day: today.add(1, 'day').format('dddd') },
      { label: '下周', value: today.add(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD'), day: '周一' }
    ];
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = dayjs().format('YYYY-MM-DD');

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const isCurrentMonth = date.getMonth() === month;
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;

      days.push(
        <button
          key={i}
          onClick={() => handleDateSelect(dateStr)}
          className={`w-8 h-8 text-sm ${
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          } ${
            isToday ? 'bg-blue-500 text-white rounded' : ''
          } ${
            isSelected ? 'bg-blue-600 text-white rounded' : ''
          } hover:bg-blue-100 rounded`}
        >
          {date.getDate()}
        </button>
      );
    }

    return days;
  };



  return (
    <div className="bg-gray-100 flex min-h-screen" style={{fontFamily: 'Roboto, sans-serif'}}>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {showToast.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white p-4 border-r border-gray-200 flex flex-col">
        <div className="flex items-center mb-6">
          <img alt="User avatar" className="w-10 h-10 rounded-full mr-3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxbm1JchewrOoKfk-Px1243Q4G4-Qag0e7HHa1z7h449aqcQigSqOPDMUooO8RBSqnFu3BxSJL7MROuzUzZE4AmLMI8fLa8Z6jqzLu3JhHbEcWVbQcNjI4IveTP-tfMpAuMleWjQ9h27VGI2mQFApp3JzBTWIKpr8v6YppgqRHwPMBE0sChwkg_7XrtJQUwjxxUrmndjuFZU6vfYjakHPCvV0Q0bNqBfkXMfRjY40kBiMgmaFc6pI9pcHo5osWULhwoT9TxK-FjTQ"/>
          <div>
            <p className="font-semibold text-sm">{user?.username || '用户'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-2">
              <button
                onClick={() => setCurrentView('my-day')}
                className={`w-full flex items-center text-sm p-2 rounded-md cursor-pointer ${
                  currentView === 'my-day'
                    ? 'text-blue-600 bg-blue-100 font-medium'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <span className={`material-icons mr-3 ${currentView === 'my-day' ? 'text-blue-600' : 'text-gray-500'}`}>lightbulb</span> 我的一天
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentView('important')}
                className={`w-full flex items-center text-sm p-2 rounded-md cursor-pointer ${
                  currentView === 'important'
                    ? 'text-yellow-600 bg-yellow-100 font-medium'
                    : 'text-gray-700 hover:bg-yellow-50'
                }`}
              >
                <span className={`material-icons mr-3 ${currentView === 'important' ? 'text-yellow-600' : 'text-gray-500'}`}>star_border</span> 重要
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentView('planned')}
                className={`w-full flex items-center text-sm p-2 rounded-md cursor-pointer ${
                  currentView === 'planned'
                    ? 'text-blue-600 bg-blue-100 font-medium'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <span className={`material-icons mr-3 ${currentView === 'planned' ? 'text-blue-600' : 'text-gray-500'}`}>list_alt</span> 已计划
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => navigate('/views')}
                className="w-full flex items-center text-sm text-gray-700 hover:bg-green-50 p-2 rounded-md cursor-pointer"
              >
                <span className="material-icons mr-3 text-gray-500">view_module</span> 视图选项
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => setCurrentView('tasks')}
                className={`w-full flex items-center text-sm p-2 rounded-md cursor-pointer ${
                  currentView === 'tasks'
                    ? 'text-purple-600 bg-purple-100 font-medium'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className={`material-icons mr-3 ${currentView === 'tasks' ? 'text-purple-600' : 'text-gray-500'}`}>task_alt</span> 任务
              </button>
            </li>
          </ul>
        </nav>
        <div className="space-y-2">
          <button
            onClick={handleCreate}
            className="w-full flex items-center text-sm text-gray-700 hover:bg-gray-100 p-2 rounded-md"
          >
            <span className="material-icons mr-2">add</span> 新建列表
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center text-sm text-red-600 hover:bg-red-50 p-2 rounded-md"
          >
            <span className="material-icons mr-2">logout</span> 退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 gap-6">
        {/* Todo List Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className={`text-2xl font-semibold ${viewInfo.color} flex items-center`}>
              <span className={`material-icons mr-2 ${viewInfo.color}`}>{viewInfo.icon}</span> {viewInfo.title}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">完成率: {percent}%</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    percent < 50 ? 'bg-red-500' : percent < 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* AI Input Section */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="输入自然语言描述，让AI生成待办事项"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={handleAIGenerate}
                className="text-blue-500 hover:text-blue-600"
                title="AI 生成"
              >
                <span className="material-icons text-sm">auto_awesome</span>
              </button>
            </div>
          </div>

          {/* Todo Items */}
          <div className="space-y-3 mb-4">
            {sortedTodos.map((todo) => (
              <div key={todo._id} className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <button
                  onClick={() => handleCheck(todo, todo.status !== 'completed')}
                  className="mr-3"
                >
                  <span className={`material-icons ${todo.status === 'completed' ? 'text-green-500' : 'text-gray-400'}`}>
                    {todo.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className={`text-xs ${todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                      {todo.description}
                    </p>
                  )}
                  <p className={`text-xs ${todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                    截止: {dayjs(todo.dueDate).format('YYYY-MM-DD')}
                    {todo.isAIGenerated && <span className="ml-1 px-2 py-1 rounded text-xs text-purple-600 bg-purple-50">AI</span>}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleImportant(todo)}
                    className={`${todo.priority === 'high' ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                    title={todo.priority === 'high' ? '取消重要' : '标记为重要'}
                  >
                    <span className="material-icons text-sm">
                      {todo.priority === 'high' ? 'star' : 'star_border'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(todo._id)}
                    className="text-red-500 hover:text-red-600"
                    title="删除"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Todo Input */}
          {!showQuickAdd ? (
            <div className="flex items-center py-2 px-3 border-t border-gray-200">
              <button
                onClick={handleQuickAdd}
                className="flex items-center text-gray-500 hover:text-blue-600 w-full"
              >
                <span className="material-icons text-blue-500 mr-3">add</span>
                <span className="text-gray-400">添加任务</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-200 p-3">
              <div className="flex items-center space-x-2 mb-3">
                <button
                  onClick={handleQuickAddSubmit}
                  className="text-blue-500 hover:text-blue-600"
                  title="创建任务"
                >
                  <span className="material-icons">radio_button_unchecked</span>
                </button>
                <input
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-lg"
                  placeholder="学习"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickAddSubmit();
                    }
                  }}
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="text-gray-500 hover:text-blue-600"
                    title="选择日期"
                  >
                    <span className="material-icons text-sm">calendar_today</span>
                  </button>
                  <button className="text-gray-500 hover:text-blue-600" title="任务">
                    <span className="material-icons text-sm">home</span>
                  </button>
                  <button className="text-gray-500 hover:text-blue-600" title="日历">
                    <span className="material-icons text-sm">calendar_month</span>
                  </button>
                </div>
              </div>

              {/* 日期选择器 */}
              {showDatePicker && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mb-3">
                  {/* 快速日期选择 */}
                  <div className="space-y-2 mb-4">
                    {getQuickDateOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleDateSelect(option.value)}
                        className={`w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 ${
                          selectedDate === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="material-icons mr-3 text-sm">
                            {option.label === '今天' ? 'today' : option.label === '明天' ? 'tomorrow' : 'next_week'}
                          </span>
                          <span>{option.label}</span>
                        </div>
                        <span className="text-sm text-gray-500">{option.day}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => {/* 保持日历打开 */}}
                      className="w-full flex items-center p-2 rounded hover:bg-gray-50 text-gray-700"
                    >
                      <span className="material-icons mr-3 text-sm">calendar_month</span>
                      <span>选择日期</span>
                    </button>
                  </div>

                  {/* 日历 */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">
                        {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                      </h3>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <span className="material-icons text-sm">chevron_left</span>
                        </button>
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <span className="material-icons text-sm">chevron_right</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                      <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {renderCalendar()}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal for creating/editing todos */}
      {isModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingTodo ? '编辑待办事项' : '新建待办事项'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    type="text"
                    required
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="输入描述（可选）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                  <input
                    type="date"
                    required
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo({...newTodo, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({...newTodo, priority: e.target.value as 'low' | 'medium' | 'high'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">重复</label>
                  <select
                    value={newTodo.repeat}
                    onChange={(e) => setNewTodo({...newTodo, repeat: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">无</option>
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleModalCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTodo ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList; 