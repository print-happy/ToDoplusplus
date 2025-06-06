import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { customListApi, CustomList } from '../services/customListApi';
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.timeout = 80000; // 80秒超时，适应AI调用
axios.defaults.withCredentials = true;

// 添加请求拦截器
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios response error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface Todo {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  customListId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const priorityOrder = { high: 1, medium: 2, low: 3 };

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
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
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({today: true, tomorrow: true, completed: false});
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  // 背景色和三点菜单相关状态
  const [showThemeMenu, setShowThemeMenu] = useState<string | null>(null); // 当前显示主题菜单的选项ID
  const [sidebarThemes, setSidebarThemes] = useState<{[key: string]: string}>(() => {
    const saved = localStorage.getItem('sidebarThemes');
    return saved ? JSON.parse(saved) : {};
  });

  // 预定义的背景色选项
  const themeColors = [
    { name: '蓝色', value: 'bg-blue-500', preview: '#3b82f6' },
    { name: '紫色', value: 'bg-purple-500', preview: '#8b5cf6' },
    { name: '粉色', value: 'bg-pink-500', preview: '#ec4899' },
    { name: '红色', value: 'bg-red-500', preview: '#ef4444' },
    { name: '绿色', value: 'bg-green-500', preview: '#10b981' },
    { name: '青色', value: 'bg-teal-500', preview: '#14b8a6' },
    { name: '灰色', value: 'bg-gray-500', preview: '#6b7280' },
    { name: '浅蓝', value: 'bg-sky-200', preview: '#bae6fd' },
    { name: '浅紫', value: 'bg-purple-200', preview: '#ddd6fe' },
    { name: '浅粉', value: 'bg-pink-200', preview: '#fbcfe8' },
    { name: '浅橙', value: 'bg-orange-200', preview: '#fed7aa' },
    { name: '浅绿', value: 'bg-green-200', preview: '#bbf7d0' },
    { name: '浅青', value: 'bg-teal-200', preview: '#99f6e4' },
    { name: '浅灰', value: 'bg-gray-200', preview: '#e5e7eb' },
    { name: '山景', value: 'bg-gradient-to-r from-blue-400 to-blue-600', preview: 'linear-gradient(to right, #60a5fa, #2563eb)' },
    { name: '日落', value: 'bg-gradient-to-r from-orange-400 to-pink-400', preview: 'linear-gradient(to right, #fb923c, #f472b6)' },
    { name: '森林', value: 'bg-gradient-to-r from-green-400 to-teal-500', preview: 'linear-gradient(to right, #4ade80, #14b8a6)' },
    { name: '海洋', value: 'bg-gradient-to-r from-cyan-400 to-blue-500', preview: 'linear-gradient(to right, #22d3ee, #3b82f6)' },
    { name: '薰衣草', value: 'bg-gradient-to-r from-purple-400 to-pink-400', preview: 'linear-gradient(to right, #c084fc, #f472b6)' },
    { name: '默认', value: '', preview: '#ffffff' }
  ];
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedCustomList, setSelectedCustomList] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const toggleSection = (section: 'today' | 'tomorrow' | 'completed') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 测试网络连接
  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      console.log('Testing connection to backend...');
      // 先测试健康检查端点
      const healthResponse = await axios.get('/health');
      console.log('Health check response:', healthResponse.status);

      // 如果健康检查成功，再测试API端点
      const apiResponse = await axios.get('/api');
      console.log('API test response:', apiResponse.status);

      setConnectionStatus('connected');
      return true;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');

      let errorMessage = '网络连接失败';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = '无法连接到后端服务器，请检查服务器是否运行在 http://localhost:5000';
      } else if (error.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (error.response?.status >= 500) {
        errorMessage = '服务器内部错误';
      }

      showNotification(errorMessage, 'error');
      return false;
    }
  };

  useEffect(() => {
    console.log('TodoList mounted, user:', user);
    testConnection();
    fetchTodos();
    fetchCustomLists();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('selectedCustomList changed:', selectedCustomList);
    fetchTodos();
  }, [selectedCustomList]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('User state changed:', user);
    console.log('Current todos:', todos);
  }, [user, todos]);

  // 点击外部关闭主题菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showThemeMenu) {
        setShowThemeMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeMenu]);

  // Toast notification system
  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const fetchTodos = async () => {
    try {
      console.log('Fetching todos, selectedCustomList:', selectedCustomList);
      console.log('Current user:', user);
      console.log('Current token:', localStorage.getItem('token'));
      console.log('Axios baseURL:', axios.defaults.baseURL);
      console.log('Axios headers:', axios.defaults.headers.common);

      // 确保请求头包含认证信息
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('认证信息缺失，请重新登录', 'error');
        return;
      }

      if (selectedCustomList) {
        // 如果选择了自定义列表，获取该列表的任务
        const response = await customListApi.getTodos(selectedCustomList);
        console.log('Custom list todos response:', response);
        setTodos(response);
      } else {
        // 否则获取所有任务
        const response = await axios.get('/api/todos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('All todos response:', response.data);
        setTodos(response.data);
      }
    } catch (error: any) {
      console.error('Fetch todos error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        code: error.code
      });

      let errorMessage = '获取待办事项失败';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = '网络连接失败，请检查后端服务器是否运行';
      } else if (error.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
    }
  };

  const fetchCustomLists = async () => {
    try {
      const lists = await customListApi.getAll();
      setCustomLists(lists);
    } catch (error) {
      showNotification('获取自定义列表失败', 'error');
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

  // 新建自定义列表
  const handleCreateCustomList = () => {
    setShowNewListInput(true);
    setNewListName('');
  };

  const handleSaveCustomList = async () => {
    if (!newListName.trim()) {
      showNotification('请输入列表名称', 'error');
      return;
    }

    try {
      await customListApi.create({ name: newListName.trim() });
      showNotification('列表创建成功', 'success');
      setShowNewListInput(false);
      setNewListName('');
      fetchCustomLists();
    } catch (error) {
      showNotification('创建列表失败', 'error');
    }
  };

  const handleCancelNewList = () => {
    setShowNewListInput(false);
    setNewListName('');
  };

  // 处理背景色选择
  const handleThemeSelect = (optionId: string, theme: string) => {
    console.log('handleThemeSelect called:', { optionId, theme });
    const newThemes = { ...sidebarThemes, [optionId]: theme };
    console.log('New themes:', newThemes);
    setSidebarThemes(newThemes);
    localStorage.setItem('sidebarThemes', JSON.stringify(newThemes));
    setShowThemeMenu(null);
  };

  // 获取当前视图的背景色样式 - 只应用到右边主内容区域
  const getMainContentStyle = () => {
    const theme = sidebarThemes[currentView];
    console.log('getMainContentStyle:', { currentView, theme, sidebarThemes });

    if (!theme || theme === '') return {};

    const themeColor = themeColors.find(t => t.value === theme);
    console.log('Found themeColor:', themeColor);

    if (!themeColor) return {};

    let style = {};
    if (theme.includes('gradient')) {
      style = { background: themeColor.preview };
    } else {
      style = { backgroundColor: themeColor.preview };
    }

    console.log('Applying style:', style);
    return style;
  };

  // 选择自定义列表
  const handleSelectCustomList = (listId: string) => {
    setSelectedCustomList(listId);
    setCurrentView('custom-list');
    fetchTodos();
  };

  // 删除自定义列表
  const handleDeleteCustomList = async (listId: string) => {
    if (window.confirm('确定要删除这个列表吗？列表中的所有任务也会被删除。')) {
      try {
        await customListApi.delete(listId);
        showNotification('列表删除成功', 'success');
        if (selectedCustomList === listId) {
          setSelectedCustomList(null);
          setCurrentView('planned');
        }
        fetchCustomLists();
        fetchTodos();
      } catch (error) {
        showNotification('删除列表失败', 'error');
      }
    }
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
      // 确保请求头包含认证信息
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('认证信息缺失，请重新登录', 'error');
        return;
      }

      await axios.delete(`/api/todos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      showNotification('删除成功', 'success');
      fetchTodos();
    } catch (error: any) {
      console.error('Delete todo error:', error);
      let errorMessage = '删除失败';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = '网络连接失败，请检查后端服务器是否运行';
      } else if (error.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      showNotification(errorMessage, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodo.title || !newTodo.dueDate) {
      showNotification('请填写标题和截止日期', 'error');
      return;
    }

    try {
      // 确保请求头包含认证信息
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('认证信息缺失，请重新登录', 'error');
        return;
      }

      const todoData = {
        ...newTodo,
        dueDate: new Date(newTodo.dueDate).toISOString(),
        xmlContent: `<todo><title>${newTodo.title}</title><description>${newTodo.description || ''}</description></todo>`,
        ...(selectedCustomList && { customListId: selectedCustomList })
      };

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (editingTodo) {
        await axios.patch(`/api/todos/${editingTodo._id}`, todoData, config);
        showNotification('更新成功', 'success');
      } else {
        await axios.post('/api/todos', todoData, config);
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
    } catch (error: any) {
      console.error('Submit todo error:', error);
      let errorMessage = editingTodo ? '更新失败' : '创建失败';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = '网络连接失败，请检查后端服务器是否运行';
      } else if (error.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      showNotification(errorMessage, 'error');
    }
  };



  // 根据当前视图过滤和排序待办事项
  const getFilteredTodos = () => {
    let filtered = [...todos];
    const today = dayjs().format('YYYY-MM-DD');

    if (currentView === 'custom-list') {
      // 自定义列表已经在fetchTodos中过滤了
      filtered = todos;
    } else {
      switch (currentView) {
        case 'my-day':
          filtered = todos.filter(todo =>
            dayjs(todo.dueDate).format('YYYY-MM-DD') === today
          );
          break;
        case 'important':
          filtered = todos.filter(todo => todo.priority === 'high');
          break;
        case 'planned':
          filtered = todos.filter(todo => !todo.customListId); // 显示所有非自定义列表的任务
          break;
        case 'tasks':
          filtered = todos.filter(todo => !todo.customListId); // 显示所有非自定义列表的任务
          break;
        default:
          filtered = todos.filter(todo => !todo.customListId);
      }
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

  // 为已计划视图分组待办事项
  const getPlannedTodosGrouped = () => {
    const today = dayjs().format('YYYY-MM-DD');
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

    // 按日期分组所有未完成的任务
    const groupedByDate: { [key: string]: Todo[] } = {};
    const completed: Todo[] = [];

    todos.filter(todo => !todo.customListId).forEach(todo => {
      if (todo.status === 'completed') {
        completed.push(todo);
      } else {
        const dateKey = dayjs(todo.dueDate).format('YYYY-MM-DD');
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(todo);
      }
    });

    // 按日期排序
    const sortedDates = Object.keys(groupedByDate).sort();

    // 排序函数
    const sortTodos = (todos: Todo[]) => todos.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
    });

    return {
      today: sortTodos(groupedByDate[today] || []),
      tomorrow: sortTodos(groupedByDate[tomorrow] || []),
      otherDates: sortedDates
        .filter(date => date !== today && date !== tomorrow)
        .map(date => ({
          date,
          label: dayjs(date).format('M月D日'),
          todos: sortTodos(groupedByDate[date])
        })),
      completed: completed.sort((a, b) => dayjs(b.updatedAt || b.createdAt).valueOf() - dayjs(a.updatedAt || a.createdAt).valueOf())
    };
  };

  const plannedTodos = getPlannedTodosGrouped();

  // 获取当前视图的标题和图标
  const getViewInfo = () => {
    if (currentView === 'custom-list' && selectedCustomList) {
      const list = customLists.find(l => l._id === selectedCustomList);
      return {
        title: list?.name || '自定义列表',
        icon: list?.icon || 'list',
        color: 'text-indigo-600'
      };
    }

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
    console.log('handleCheck called with:', { todo: todo._id, checked, user });

    if (!user) {
      showNotification('请先登录', 'error');
      return;
    }

    if (!todo._id) {
      console.error('Todo ID is missing:', todo);
      showNotification('任务ID缺失', 'error');
      return;
    }

    try {
      console.log('Updating todo status:', { todoId: todo._id, status: checked ? 'completed' : 'pending' });
      console.log('Current axios headers:', axios.defaults.headers.common);
      console.log('Current axios baseURL:', axios.defaults.baseURL);

      // 确保请求头包含认证信息
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('认证信息缺失，请重新登录', 'error');
        return;
      }

      const response = await axios.patch(`/api/todos/${todo._id}`,
        { status: checked ? 'completed' : 'pending' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Update response:', response.data);
      await fetchTodos();
      showNotification(checked ? '任务已完成' : '任务已恢复', 'success');
    } catch (e: any) {
      console.error('Update todo status error:', e);
      console.error('Error response:', e.response);
      console.error('Error config:', e.config);

      let errorMessage = '更新事项状态失败';
      if (e.code === 'NETWORK_ERROR' || e.message === 'Network Error') {
        errorMessage = '网络连接失败，请检查后端服务器是否运行';
      } else if (e.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }

      showNotification(errorMessage, 'error');
    }
  };

  // 切换重要性标记
  const handleToggleImportant = async (e: React.MouseEvent, todo: Todo) => {
    e.stopPropagation();
    console.log('handleToggleImportant called with:', { todo: todo._id, currentPriority: todo.priority, user });

    if (!user) {
      showNotification('请先登录', 'error');
      return;
    }

    if (!todo._id) {
      console.error('Todo ID is missing:', todo);
      showNotification('任务ID缺失', 'error');
      return;
    }

    try {
      const newPriority = todo.priority === 'high' ? 'medium' : 'high';
      console.log('Updating todo priority:', { todoId: todo._id, priority: newPriority });
      console.log('Current axios headers:', axios.defaults.headers.common);
      console.log('Current axios baseURL:', axios.defaults.baseURL);

      // 确保请求头包含认证信息
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('认证信息缺失，请重新登录', 'error');
        return;
      }

      const response = await axios.patch(`/api/todos/${todo._id}`,
        { priority: newPriority },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Priority update response:', response.data);
      await fetchTodos();
      showNotification(newPriority === 'high' ? '已标记为重要' : '已取消重要标记', 'success');
    } catch (e: any) {
      console.error('Update todo priority error:', e);
      console.error('Error response:', e.response);
      console.error('Error config:', e.config);

      let errorMessage = '更新重要性失败';
      if (e.code === 'NETWORK_ERROR' || e.message === 'Network Error') {
        errorMessage = '网络连接失败，请检查后端服务器是否运行';
      } else if (e.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }

      showNotification(errorMessage, 'error');
    }
  };





  // 快速添加任务
  const handleQuickAdd = () => {
    setShowQuickAdd(true);
    setQuickAddTitle('');
    setSelectedDate('');
  };

  // AI生成任务
  const handleAiGenerate = async () => {
    if (!quickAddTitle.trim()) {
      showNotification('请输入任务描述', 'error');
      return;
    }

    if (!user) {
      showNotification('请先登录', 'error');
      return;
    }

    setIsAiGenerating(true);
    showNotification('AI正在生成任务，请稍候...', 'success');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('认证信息缺失，请重新登录', 'error');
        return;
      }

      const response = await axios.post('/api/ai/generate-todos', {
        description: quickAddTitle,
        ...(selectedCustomList && { customListId: selectedCustomList })
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 80000 // 80秒超时，专门为AI调用设置
      });

      const dateInfo = response.data.dateInfo;
      const keywords = dateInfo?.detectedKeywords?.length > 0 ? dateInfo.detectedKeywords.join('、') : '无';
      showNotification(`AI成功生成了 ${response.data.count} 个任务 (检测到: ${keywords}, 日期: ${dateInfo?.calculatedDate})`, 'success');
      setShowQuickAdd(false);
      setQuickAddTitle('');
      setSelectedDate('');
      fetchTodos();
    } catch (error: any) {
      console.error('AI生成任务失败:', error);

      let errorMessage = 'AI生成任务失败';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddTitle.trim()) {
      showNotification('请输入任务标题', 'error');
      return;
    }

    const dueDate = selectedDate || dayjs().format('YYYY-MM-DD');

    try {
      // 确保请求头包含认证信息
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('认证信息缺失，请重新登录', 'error');
        return;
      }

      const todoData = {
        title: quickAddTitle,
        description: '',
        dueDate: new Date(dueDate).toISOString(),
        priority: 'medium',
        repeat: 'none',
        xmlContent: `<todo><title>${quickAddTitle}</title><description></description></todo>`,
        ...(selectedCustomList && { customListId: selectedCustomList })
      };

      await axios.post('/api/todos', todoData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      showNotification('任务创建成功', 'success');
      setShowQuickAdd(false);
      setQuickAddTitle('');
      setSelectedDate('');
      fetchTodos();
    } catch (error: any) {
      console.error('Quick add error:', error);
      let errorMessage = '创建任务失败';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = '网络连接失败，请检查后端服务器是否运行';
      } else if (error.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      showNotification(errorMessage, 'error');
    }
  };

  // 日期选择相关
  const getQuickDateOptions = () => {
    const today = dayjs();
    return [
      { label: '今天', value: today.format('YYYY-MM-DD'), day: today.format('dddd') },
      { label: '明天', value: today.add(1, 'day').format('YYYY-MM-DD'), day: today.add(1, 'day').format('dddd') }
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
            <li className="mb-2 relative">
              <div className="flex items-center group">
                <button
                  onClick={() => {
                    setCurrentView('my-day');
                    setSelectedCustomList(null);
                  }}
                  className={`flex-1 flex items-center text-sm p-2 rounded-md cursor-pointer ${
                    currentView === 'my-day'
                      ? 'text-blue-600 bg-blue-100 font-medium'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}

                >
                  <span className={`material-icons mr-3 ${currentView === 'my-day' ? 'text-blue-600' : 'text-gray-500'}`}>lightbulb</span> 我的一天
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThemeMenu(showThemeMenu === 'my-day' ? null : 'my-day');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                  title="主题设置"
                >
                  <span className="material-icons text-sm">more_horiz</span>
                </button>
              </div>

              {/* 主题选择菜单 */}
              {showThemeMenu === 'my-day' && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">主题</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleThemeSelect('my-day', color.value)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{
                          background: color.preview.includes('gradient') ? color.preview : color.preview,
                          border: sidebarThemes['my-day'] === color.value ? '2px solid #3b82f6' : '2px solid #e5e7eb'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </li>
            <li className="mb-2 relative">
              <div className="flex items-center group">
                <button
                  onClick={() => {
                    setCurrentView('important');
                    setSelectedCustomList(null);
                  }}
                  className={`flex-1 flex items-center text-sm p-2 rounded-md cursor-pointer ${
                    currentView === 'important'
                      ? 'text-yellow-600 bg-yellow-100 font-medium'
                      : 'text-gray-700 hover:bg-yellow-50'
                  }`}

                >
                  <span className={`material-icons mr-3 ${currentView === 'important' ? 'text-yellow-600' : 'text-gray-500'}`}>star_border</span> 重要
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThemeMenu(showThemeMenu === 'important' ? null : 'important');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                  title="主题设置"
                >
                  <span className="material-icons text-sm">more_horiz</span>
                </button>
              </div>

              {/* 主题选择菜单 */}
              {showThemeMenu === 'important' && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">主题</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleThemeSelect('important', color.value)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{
                          background: color.preview.includes('gradient') ? color.preview : color.preview,
                          border: sidebarThemes['important'] === color.value ? '2px solid #3b82f6' : '2px solid #e5e7eb'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </li>
            <li className="mb-2 relative">
              <div className="flex items-center group">
                <button
                  onClick={() => {
                    setCurrentView('planned');
                    setSelectedCustomList(null);
                  }}
                  className={`flex-1 flex items-center text-sm p-2 rounded-md cursor-pointer ${
                    currentView === 'planned'
                      ? 'text-blue-600 bg-blue-100 font-medium'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}

                >
                  <span className={`material-icons mr-3 ${currentView === 'planned' ? 'text-blue-600' : 'text-gray-500'}`}>list_alt</span> 已计划
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThemeMenu(showThemeMenu === 'planned' ? null : 'planned');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                  title="主题设置"
                >
                  <span className="material-icons text-sm">more_horiz</span>
                </button>
              </div>

              {/* 主题选择菜单 */}
              {showThemeMenu === 'planned' && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">主题</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleThemeSelect('planned', color.value)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{
                          background: color.preview.includes('gradient') ? color.preview : color.preview,
                          border: sidebarThemes['planned'] === color.value ? '2px solid #3b82f6' : '2px solid #e5e7eb'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </li>
            <li className="mb-2 relative">
              <div className="flex items-center group">
                <button
                  onClick={() => navigate('/views')}
                  className="flex-1 flex items-center text-sm text-gray-700 hover:bg-green-50 p-2 rounded-md cursor-pointer"

                >
                  <span className="material-icons mr-3 text-gray-500">view_module</span> 视图选项
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThemeMenu(showThemeMenu === 'views' ? null : 'views');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                  title="主题设置"
                >
                  <span className="material-icons text-sm">more_horiz</span>
                </button>
              </div>

              {/* 主题选择菜单 */}
              {showThemeMenu === 'views' && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">主题</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleThemeSelect('views', color.value)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{
                          background: color.preview.includes('gradient') ? color.preview : color.preview,
                          border: sidebarThemes['views'] === color.value ? '2px solid #3b82f6' : '2px solid #e5e7eb'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </li>
            <li className="mb-2 relative">
              <div className="flex items-center group">
                <button
                  onClick={() => {
                    setCurrentView('tasks');
                    setSelectedCustomList(null);
                  }}
                  className={`flex-1 flex items-center text-sm p-2 rounded-md cursor-pointer ${
                    currentView === 'tasks'
                      ? 'text-purple-600 bg-purple-100 font-medium'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}

                >
                  <span className={`material-icons mr-3 ${currentView === 'tasks' ? 'text-purple-600' : 'text-gray-500'}`}>task_alt</span> 任务
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThemeMenu(showThemeMenu === 'tasks' ? null : 'tasks');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                  title="主题设置"
                >
                  <span className="material-icons text-sm">more_horiz</span>
                </button>
              </div>

              {/* 主题选择菜单 */}
              {showThemeMenu === 'tasks' && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">主题</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleThemeSelect('tasks', color.value)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{
                          background: color.preview.includes('gradient') ? color.preview : color.preview,
                          border: sidebarThemes['tasks'] === color.value ? '2px solid #3b82f6' : '2px solid #e5e7eb'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </li>
          </ul>

          {/* 自定义列表 */}
          {customLists.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">自定义列表</h3>
              <ul>
                {customLists.map((list) => (
                  <li key={list._id} className="mb-2">
                    <div className="flex items-center group">
                      <button
                        onClick={() => handleSelectCustomList(list._id)}
                        className={`flex-1 flex items-center text-sm p-2 rounded-md cursor-pointer ${
                          selectedCustomList === list._id
                            ? 'text-indigo-600 bg-indigo-100 font-medium'
                            : 'text-gray-700 hover:bg-indigo-50'
                        }`}
                      >
                        <span className={`material-icons mr-3 text-sm ${selectedCustomList === list._id ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {list.icon || 'list'}
                        </span>
                        <span className="truncate">{list.name}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCustomList(list._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        title="删除列表"
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 新建列表输入框 */}
          {showNewListInput && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="输入列表名称"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCustomList();
                    } else if (e.key === 'Escape') {
                      handleCancelNewList();
                    }
                  }}
                />
                <button
                  onClick={handleSaveCustomList}
                  className="text-blue-500 hover:text-blue-600"
                  title="保存"
                >
                  <span className="material-icons text-sm">check</span>
                </button>
                <button
                  onClick={handleCancelNewList}
                  className="text-gray-500 hover:text-red-500"
                  title="取消"
                >
                  <span className="material-icons text-sm">close</span>
                </button>
              </div>
            </div>
          )}
        </nav>
        <div className="space-y-2">
          <button
            onClick={handleCreateCustomList}
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
      <main className="flex-1 p-6 grid grid-cols-1 gap-6" style={getMainContentStyle()}>
        {/* Todo List Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className={`text-2xl font-semibold ${viewInfo.color} flex items-center`}>
              <span className={`material-icons mr-2 ${viewInfo.color}`}>{viewInfo.icon}</span> {viewInfo.title}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">完成率: {percent}%</span>
              {/* Debug info */}
              <span className="text-xs text-gray-400">
                用户: {user ? user.username : '未登录'} | 任务数: {todos.length}
              </span>
              {/* Connection status */}
              <span className={`text-xs px-2 py-1 rounded ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-600' :
                connectionStatus === 'disconnected' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {connectionStatus === 'connected' ? '已连接' :
                 connectionStatus === 'disconnected' ? '连接失败' : '连接中...'}
              </span>
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



          {/* Todo Items */}
          {currentView === 'planned' ? (
            <div className="space-y-4 mb-4">
              {/* 今天 */}
              <div>
                <button
                  onClick={() => setExpandedSections(prev => ({...prev, today: !prev.today}))}
                  className="flex items-center w-full text-left p-2 hover:bg-gray-50 rounded-md"
                >
                  <span className={`material-icons mr-2 text-gray-500 transition-transform ${expandedSections.today ? 'rotate-90' : ''}`}>
                    chevron_right
                  </span>
                  <span className="font-medium text-gray-700">今天</span>
                  <span className="ml-2 text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {plannedTodos.today.length}
                  </span>
                </button>
                {expandedSections.today && (
                  <div className="ml-6 space-y-2 mt-2">
                    {plannedTodos.today.map((todo) => (
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

                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleToggleImportant(e, todo)}
                            className={`${todo.priority === 'high' ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                            title={todo.priority === 'high' ? '取消重要' : '标记为重要'}
                          >
                            <span className="material-icons text-lg">
                              {todo.priority === 'high' ? 'star' : 'star_border'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(todo._id)}
                            className="text-red-500 hover:text-red-600"
                            title="删除"
                          >
                            <span className="material-icons text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 明天 */}
              <div>
                <button
                  onClick={() => setExpandedSections(prev => ({...prev, tomorrow: !prev.tomorrow}))}
                  className="flex items-center w-full text-left p-2 hover:bg-gray-50 rounded-md"
                >
                  <span className={`material-icons mr-2 text-gray-500 transition-transform ${expandedSections.tomorrow ? 'rotate-90' : ''}`}>
                    chevron_right
                  </span>
                  <span className="font-medium text-gray-700">明天</span>
                  <span className="ml-2 text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {plannedTodos.tomorrow.length}
                  </span>
                </button>
                {expandedSections.tomorrow && (
                  <div className="ml-6 space-y-2 mt-2">
                    {plannedTodos.tomorrow.map((todo) => (
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

                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleToggleImportant(e, todo)}
                            className={`${todo.priority === 'high' ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                            title={todo.priority === 'high' ? '取消重要' : '标记为重要'}
                          >
                            <span className="material-icons text-lg">
                              {todo.priority === 'high' ? 'star' : 'star_border'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(todo._id)}
                            className="text-red-500 hover:text-red-600"
                            title="删除"
                          >
                            <span className="material-icons text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 其他日期 */}
              {plannedTodos.otherDates && plannedTodos.otherDates.map((dateGroup) => (
                <div key={dateGroup.date}>
                  <button
                    onClick={() => setExpandedSections(prev => ({...prev, [dateGroup.date]: !prev[dateGroup.date]}))}
                    className="flex items-center w-full text-left p-2 hover:bg-gray-50 rounded-md"
                  >
                    <span className={`material-icons mr-2 text-gray-500 transition-transform ${expandedSections[dateGroup.date] ? 'rotate-90' : ''}`}>
                      chevron_right
                    </span>
                    <span className="font-medium text-gray-700">{dateGroup.label}</span>
                    <span className="ml-2 text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {dateGroup.todos.length}
                    </span>
                  </button>
                  {expandedSections[dateGroup.date] && (
                    <div className="ml-6 space-y-2 mt-2">
                      {dateGroup.todos.map((todo) => (
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
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleToggleImportant(e, todo)}
                              className={`${todo.priority === 'high' ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                              title={todo.priority === 'high' ? '取消重要' : '标记为重要'}
                            >
                              <span className="material-icons text-lg">
                                {todo.priority === 'high' ? 'star' : 'star_border'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(todo._id)}
                              className="text-red-500 hover:text-red-600"
                              title="删除"
                            >
                              <span className="material-icons text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* 已完成 */}
              {plannedTodos.completed.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('completed')}
                    className="flex items-center w-full text-left p-2 hover:bg-gray-50 rounded-md"
                  >
                    <span className={`material-icons mr-2 text-gray-500 transition-transform ${expandedSections.completed ? 'rotate-90' : ''}`}>
                      chevron_right
                    </span>
                    <span className="font-medium text-gray-700">已完成</span>
                    <span className="ml-2 text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {plannedTodos.completed.length}
                    </span>
                  </button>
                  {expandedSections.completed && (
                    <div className="ml-6 space-y-2 mt-2">
                      {plannedTodos.completed.map((todo) => (
                        <div key={todo._id} className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                          <button
                            onClick={() => handleCheck(todo, false)}
                            className="mr-3"
                          >
                            <span className="material-icons text-green-500">
                              check_circle
                            </span>
                          </button>
                          <div className="flex-1">
                            <p className="text-sm line-through text-gray-500">
                              {todo.title}
                            </p>
                            {todo.description && (
                              <p className="text-xs line-through text-gray-400">
                                {todo.description}
                              </p>
                            )}
                            <p className="text-xs line-through text-gray-400">
                              截止: {dayjs(todo.dueDate).format('YYYY-MM-DD')}

                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleToggleImportant(e, todo)}
                              className={`${todo.priority === 'high' ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                              title={todo.priority === 'high' ? '取消重要' : '标记为重要'}
                            >
                              <span className="material-icons text-lg">
                                {todo.priority === 'high' ? 'star' : 'star_border'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(todo._id)}
                              className="text-red-500 hover:text-red-600"
                              title="删除"
                            >
                              <span className="material-icons text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {/* 未完成的任务 */}
              <div className="space-y-3">
                {sortedTodos.filter(todo => todo.status !== 'completed').map((todo) => {
                  // 为自定义列表中的任务显示时间标签
                  const getTimeLabel = (todo: Todo) => {
                    const today = dayjs().format('YYYY-MM-DD');
                    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
                    const todoDate = dayjs(todo.dueDate).format('YYYY-MM-DD');

                    if (todoDate === today) return '我的一天';
                    if (todoDate === tomorrow) return '明天';
                    return null;
                  };

                  const timeLabel = currentView === 'custom-list' ? getTimeLabel(todo) : null;

                  return (
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
                        <div className="flex items-center space-x-2">
                          <p className={`text-xs ${todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                            截止: {dayjs(todo.dueDate).format('YYYY-MM-DD')}

                          </p>
                          {timeLabel && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {timeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleToggleImportant(e, todo)}
                          className={`${todo.priority === 'high' ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                          title={todo.priority === 'high' ? '取消重要' : '标记为重要'}
                        >
                          <span className="material-icons text-lg">
                            {todo.priority === 'high' ? 'star' : 'star_border'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(todo._id)}
                          className="text-red-500 hover:text-red-600"
                          title="删除"
                        >
                          <span className="material-icons text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 已完成的任务 */}
              {sortedTodos.filter(todo => todo.status === 'completed').length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('completed')}
                    className="flex items-center w-full text-left p-2 hover:bg-gray-50 rounded-md"
                  >
                    <span className={`material-icons mr-2 text-gray-500 transition-transform ${expandedSections.completed ? 'rotate-90' : ''}`}>
                      chevron_right
                    </span>
                    <span className="font-medium text-gray-700">已完成</span>
                    <span className="ml-2 text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {sortedTodos.filter(todo => todo.status === 'completed').length}
                    </span>
                  </button>
                  {expandedSections.completed && (
                    <div className="ml-6 space-y-2 mt-2">
                      {sortedTodos.filter(todo => todo.status === 'completed').map((todo) => (
                        <div key={todo._id} className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                          <button
                            onClick={() => handleCheck(todo, false)}
                            className="mr-3"
                          >
                            <span className="material-icons text-green-500">
                              check_circle
                            </span>
                          </button>
                          <div className="flex-1">
                            <p className="text-sm line-through text-gray-500">
                              {todo.title}
                            </p>
                            {todo.description && (
                              <p className="text-xs line-through text-gray-400">
                                {todo.description}
                              </p>
                            )}
                            <p className="text-xs line-through text-gray-400">
                              截止: {dayjs(todo.dueDate).format('YYYY-MM-DD')}

                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleToggleImportant(e, todo)}
                              className={`${todo.priority === 'high' ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                              title={todo.priority === 'high' ? '取消重要' : '标记为重要'}
                            >
                              <span className="material-icons text-lg">
                                {todo.priority === 'high' ? 'star' : 'star_border'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(todo._id)}
                              className="text-red-500 hover:text-red-600"
                              title="删除"
                            >
                              <span className="material-icons text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add New Todo Input - 在重要页面隐藏 */}
          {currentView !== 'important' && (
            <div className="border-t border-gray-200 p-3">
              {/* 始终显示带边框的容器 */}
              <div className="border-2 border-gray-300 rounded-lg p-3 bg-white shadow-sm">
                {!showQuickAdd ? (
                  <button
                    onClick={handleQuickAdd}
                    className="flex items-center text-gray-500 hover:text-blue-600 w-full"
                  >
                    <span className="material-icons text-blue-500 mr-3">add</span>
                    <span className="text-gray-400">添加任务</span>
                  </button>
                ) : (
                  <>
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
                      <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="text-gray-500 hover:text-blue-600"
                        title="选择日期"
                      >
                        <span className="material-icons text-sm">calendar_today</span>
                      </button>
                      <button
                        onClick={handleAiGenerate}
                        disabled={isAiGenerating || !quickAddTitle.trim()}
                        className={`${
                          isAiGenerating || !quickAddTitle.trim()
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-purple-500 hover:text-purple-600'
                        }`}
                        title="AI生成任务"
                      >
                        {isAiGenerating ? (
                          <span className="material-icons text-sm animate-spin">refresh</span>
                        ) : (
                          <span className="material-icons text-sm">auto_awesome</span>
                        )}
                      </button>
                    </div>

                    {/* 日期选择器 */}
                    {showDatePicker && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-lg p-4 mb-3">
                        {/* 快速日期选择 */}
                        <div className="space-y-2 mb-4">
                          {getQuickDateOptions().map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleDateSelect(option.value)}
                              className={`w-full flex items-center p-2 rounded hover:bg-gray-50 ${
                                selectedDate === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              <span className="material-icons mr-3 text-sm">
                                {option.label === '今天' ? 'today' : option.label === '明天' ? 'event' : 'next_week'}
                              </span>
                              <div className="flex-1 text-left">
                                <div>{option.label}</div>
                                <div className="text-sm text-gray-500">{option.day}</div>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                            className="w-full flex items-center p-2 rounded hover:bg-gray-50 text-gray-700"
                          >
                            <span className="material-icons mr-3 text-sm">calendar_month</span>
                            <span>选择日期</span>
                            <span className={`material-icons ml-auto text-sm transition-transform ${showCalendarPicker ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          </button>
                        </div>

                        {/* 日历 */}
                        {showCalendarPicker && (
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
                        )}
                      </div>
                    )}

                    {showQuickAdd && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowQuickAdd(false)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    )}
                  </>
                )}
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