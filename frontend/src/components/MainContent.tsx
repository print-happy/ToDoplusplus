import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import Settings from './Settings';
import { getApiKeyWithPrompt, sanitizeApiKeyForLogging } from '../utils/apiKeyManager';

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
  category?: string; // For custom lists
  viewCategory?: string; // For category-specific tasks
  createdAt?: string;
  updatedAt?: string;
}

interface MainContentProps {
  currentView: string;
  onTodosUpdate?: (todos: Todo[]) => void;
}

const MainContent: React.FC<MainContentProps> = ({ currentView, onTodosUpdate }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState<string>('');
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedTaskForDeletion, setSelectedTaskForDeletion] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const { user, token } = useAuth();

  const datePickerRef = useRef<HTMLDivElement>(null);
  const reminderPickerRef = useRef<HTMLDivElement>(null);
  const moreOptionsRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const initializeTodos = useCallback(() => {
    setLoading(true);
    try {
      // 首先尝试从localStorage获取数据
      const savedTodos = localStorage.getItem('todos');
      console.log('Raw localStorage data:', savedTodos);

      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
        console.log('✅ Loaded todos from localStorage:', parsedTodos);
        console.log('Number of todos loaded:', parsedTodos.length);
      } else {
        // 如果没有保存的数据，使用初始模拟数据
        const mockTodos = [
          {
            _id: '1',
            user: user?._id || '',
            title: 'Finish TODO++',
            description: '完成TODO++项目的开发',
            dueDate: new Date().toISOString(),
            status: 'pending' as const,
            priority: 'high' as const,
            isAIGenerated: false,
            isStarred: true,
            viewCategory: 'important', // Assign to important view
          },
          {
            _id: '2',
            user: user?._id || '',
            title: '阅读源码@vitejs/plugin-react',
            description: '学习React插件的实现',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'pending' as const,
            priority: 'medium' as const,
            isAIGenerated: true,
            isStarred: false,
            viewCategory: 'planned', // Assign to planned view
          },
          {
            _id: '3',
            user: user?._id || '',
            title: '给学弟讲需求分析和设计稿',
            description: '分享项目经验',
            dueDate: new Date(Date.now() + 172800000).toISOString(),
            status: 'completed' as const,
            priority: 'low' as const,
            isAIGenerated: false,
            isStarred: false,
            viewCategory: 'assigned', // Assign to assigned view
          },
          {
            _id: '4',
            user: user?._id || '',
            title: '通用任务示例',
            description: '这是一个通用任务',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'pending' as const,
            priority: 'medium' as const,
            isAIGenerated: false,
            isStarred: false,
            viewCategory: 'tasks', // Assign to tasks view
          },
        ];
        setTodos(mockTodos);
        localStorage.setItem('todos', JSON.stringify(mockTodos));
        console.log('🆕 Initialized with mock todos:', mockTodos);
      }
    } catch (error) {
      message.error('初始化待办事项失败');
      console.error('❌ Initialize todos error:', error);
    }
    setLoading(false);
  }, [user]);

  // 尝试从后端同步数据（可选）
  const syncWithBackend = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        const backendTodos = response.data.sort((a: Todo, b: Todo) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        setTodos(backendTodos);
        localStorage.setItem('todos', JSON.stringify(backendTodos));
        console.log('Synced with backend:', backendTodos);
      }
    } catch (error) {
      console.log('Backend sync failed, using local data:', error);
      // 不显示错误消息，因为本地数据已经可用
    }
  }, [token, API_URL]);

  useEffect(() => {
    initializeTodos();
    // 可选：尝试与后端同步（不阻塞本地功能）
    syncWithBackend();
  }, [initializeTodos, syncWithBackend]);

  // Notify parent component when todos change
  useEffect(() => {
    if (onTodosUpdate) {
      onTodosUpdate(todos);
    }
  }, [todos, onTodosUpdate]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (reminderPickerRef.current && !reminderPickerRef.current.contains(event.target as Node)) {
        setShowReminderPicker(false);
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  const getViewIcon = (view: string) => {
    const icons = {
      'my-day': 'lightbulb',
      'important': 'star_border',
      'planned': 'list_alt',
      'assigned': 'person_outline',
      'flagged': 'flag',
      'tasks': 'task_alt',
    };
    return icons[view as keyof typeof icons] || 'list_alt';
  };

  const getThemeColors = (view: string) => {
    const themes = {
      'my-day': {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        500: '#3b82f6',
        600: '#2563eb'
      },
      'important': {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        500: '#ef4444',
        600: '#dc2626'
      },
      'planned': {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        500: '#3b82f6',
        600: '#2563eb'
      },
      'assigned': {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        500: '#22c55e',
        600: '#16a34a'
      },
      'flagged': {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        500: '#eab308',
        600: '#ca8a04'
      },
      'tasks': {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        500: '#a855f7',
        600: '#9333ea'
      }
    };
    return themes[view as keyof typeof themes] || themes.tasks;
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t._id === id);
    if (!todo) {
      console.error('Todo not found:', id);
      return;
    }

    const newStatus: 'pending' | 'completed' = todo.status === 'completed' ? 'pending' : 'completed';

    console.log(`Toggling todo ${id} from ${todo.status} to ${newStatus}`);

    // 立即更新本地状态以提供即时反馈
    const updatedTodos = todos.map(t =>
      t._id === id ? { ...t, status: newStatus } : t
    );
    setTodos(updatedTodos);

    // 保存到localStorage
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
    console.log('Saved to localStorage:', updatedTodos);

    // 显示成功消息
    message.success(`任务已标记为${newStatus === 'completed' ? '完成' : '待办'}`);

    // 可选：尝试更新后端（不阻塞本地功能）
    if (token) {
      try {
        await axios.put(`${API_URL}/todos/${id}`, { status: newStatus }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Successfully synced to backend');
      } catch (error) {
        console.log('Backend sync failed, but local state is preserved:', error);
        // 不回滚本地状态，因为本地操作已经成功
      }
    }
  };

  const toggleStar = async (id: string) => {
    const todo = todos.find(t => t._id === id);
    if (!todo) {
      console.error('Todo not found for star toggle:', id);
      return;
    }

    const newStarred = !todo.isStarred;

    console.log(`Toggling star for todo ${id} from ${todo.isStarred} to ${newStarred}`);

    // 立即更新本地状态以提供即时反馈
    const updatedTodos = todos.map(t =>
      t._id === id ? { ...t, isStarred: newStarred } : t
    );
    setTodos(updatedTodos);

    // 保存到localStorage
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
    console.log('Star state saved to localStorage:', updatedTodos);

    // 显示成功消息
    message.success(`任务已${newStarred ? '添加到' : '移出'}重要列表`);

    // 可选：尝试更新后端（不阻塞本地功能）
    if (token) {
      try {
        await axios.put(`${API_URL}/todos/${id}`, { isStarred: newStarred }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Star state synced to backend successfully');
      } catch (error) {
        console.log('Backend sync failed for star toggle, but local state is preserved:', error);
        // 不回滚本地状态，因为本地操作已经成功
      }
    }
  };

  const addTask = async () => {
    if (!newTaskInput.trim()) {
      message.warning('请输入任务内容');
      return;
    }

    // 使用选择的日期或默认为明天
    const taskDueDate = selectedDate || dayjs().add(1, 'day').toISOString();

    // Assign task properties based on current view
    let taskProperties = {
      isStarred: false,
      category: undefined as string | undefined,
      dueDate: taskDueDate,
      viewCategory: currentView, // Add explicit view category
    };

    switch (currentView) {
      case 'important':
        taskProperties.isStarred = true;
        taskProperties.viewCategory = 'important';
        break;
      case 'my-day':
        taskProperties.dueDate = dayjs().toISOString(); // Today
        taskProperties.viewCategory = 'my-day';
        break;
      case 'planned':
        // Use selected date or tomorrow
        taskProperties.dueDate = selectedDate || dayjs().add(1, 'day').toISOString();
        taskProperties.viewCategory = 'planned';
        break;
      case 'assigned':
        // Task assigned to current user (default behavior)
        taskProperties.viewCategory = 'assigned';
        break;
      case 'tasks':
        taskProperties.viewCategory = 'tasks';
        break;
      default:
        if (currentView.startsWith('custom-')) {
          taskProperties.category = currentView;
          taskProperties.viewCategory = currentView;
        } else {
          taskProperties.viewCategory = 'tasks'; // Default fallback
        }
        break;
    }

    const newTodo = {
      _id: Date.now().toString(), // 临时ID
      user: user?._id || '',
      title: newTaskInput,
      description: reminderTime ? `提醒: ${reminderTime}` : '',
      dueDate: taskProperties.dueDate,
      priority: 'medium' as const,
      status: 'pending' as const,
      isAIGenerated: false,
      isStarred: taskProperties.isStarred,
      category: taskProperties.category,
      viewCategory: taskProperties.viewCategory,
    };

    // 立即添加到本地状态以提供即时反馈
    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);

    // 清除输入和设置
    setNewTaskInput('');
    setSelectedDate('');
    setReminderTime('');
    setShowDatePicker(false);
    setShowReminderPicker(false);

    // 保存到localStorage
    localStorage.setItem('todos', JSON.stringify(updatedTodos));

    message.success('任务创建成功!');

    try {
      // 尝试同步到后端
      const response = await axios.post(`${API_URL}/todos`, {
        title: newTaskInput,
        description: reminderTime ? `提醒: ${reminderTime}` : '',
        dueDate: taskDueDate,
        priority: 'medium',
        status: 'pending',
        user: user?._id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 用服务器返回的真实ID更新任务
      if (response.data) {
        const finalTodos = updatedTodos.map(t =>
          t._id === newTodo._id ? { ...newTodo, _id: response.data._id } : t
        );
        setTodos(finalTodos);
        localStorage.setItem('todos', JSON.stringify(finalTodos));
      }

      console.log('Task synced to backend successfully');
    } catch (error) {
      console.log('Backend sync failed, task saved locally:', error);
      // 不回滚本地状态，因为本地保存已经成功
    }
  };

  const handleAiGenerate = async () => {
    if (!newTaskInput.trim()) {
      message.warning('请输入任务描述');
      return;
    }

    // Get API key securely
    const apiKey = getApiKeyWithPrompt();
    if (!apiKey) {
      message.error('请先在设置中配置您的SiliconFlow API密钥');
      setShowSettings(true);
      return;
    }

    console.log('🤖 Using API key:', sanitizeApiKeyForLogging(apiKey));

    setAiLoading(true);
    try {
      // 调用硅基流动API
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的任务管理助手。根据用户的自然语言描述，生成具体的、可执行的任务列表。每个任务应该简洁明确，包含具体的行动步骤。请以JSON格式返回任务列表，格式为：{"tasks": [{"title": "任务标题", "description": "任务描述", "priority": "high/medium/low"}]}'
            },
            {
              role: 'user',
              content: `请根据以下描述生成具体的任务列表：${newTaskInput}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        // Assign task properties based on current view for AI tasks (shared logic)
        const getAiTaskProperties = () => {
          const taskDueDate = selectedDate || dayjs().add(1, 'day').toISOString();
          let aiTaskProperties = {
            isStarred: false,
            category: undefined as string | undefined,
            dueDate: taskDueDate,
            viewCategory: currentView,
          };

          switch (currentView) {
            case 'important':
              aiTaskProperties.isStarred = true;
              aiTaskProperties.viewCategory = 'important';
              break;
            case 'my-day':
              aiTaskProperties.dueDate = dayjs().toISOString(); // Today
              aiTaskProperties.viewCategory = 'my-day';
              break;
            case 'planned':
              aiTaskProperties.dueDate = selectedDate || dayjs().add(1, 'day').toISOString();
              aiTaskProperties.viewCategory = 'planned';
              break;
            case 'assigned':
              aiTaskProperties.viewCategory = 'assigned';
              break;
            case 'tasks':
              aiTaskProperties.viewCategory = 'tasks';
              break;
            default:
              if (currentView.startsWith('custom-')) {
                aiTaskProperties.category = currentView;
                aiTaskProperties.viewCategory = currentView;
              } else {
                aiTaskProperties.viewCategory = 'tasks';
              }
              break;
          }

          return aiTaskProperties;
        };

        try {
          // 尝试解析AI返回的JSON
          const parsedResponse = JSON.parse(aiResponse);
          const aiTasks = parsedResponse.tasks || [];

          if (aiTasks.length > 0) {
            const aiTaskProperties = getAiTaskProperties();

            // 为每个AI生成的任务创建todo对象
            const newTodos = aiTasks.map((task: any, index: number) => ({
              _id: `ai-${Date.now()}-${index}`,
              user: user?._id || '',
              title: task.title || task.name || '未命名任务',
              description: task.description || (reminderTime ? `提醒: ${reminderTime}` : ''),
              dueDate: aiTaskProperties.dueDate,
              priority: task.priority || 'medium',
              status: 'pending' as const,
              isAIGenerated: true,
              isStarred: aiTaskProperties.isStarred,
              category: aiTaskProperties.category,
              viewCategory: aiTaskProperties.viewCategory,
            }));

            // 添加到现有任务列表
            const updatedTodos = [...todos, ...newTodos];
            setTodos(updatedTodos);
            localStorage.setItem('todos', JSON.stringify(updatedTodos));

            message.success(`AI成功生成了${newTodos.length}个任务`);

            // 清除输入和设置
            setNewTaskInput('');
            setSelectedDate('');
            setReminderTime('');
            setShowDatePicker(false);
            setShowReminderPicker(false);
          } else {
            // 如果AI没有返回结构化数据，创建单个任务
            const aiTaskProperties = getAiTaskProperties();

            const newTodo = {
              _id: `ai-${Date.now()}`,
              user: user?._id || '',
              title: aiResponse || newTaskInput,
              description: reminderTime ? `AI生成的任务 · 提醒: ${reminderTime}` : 'AI生成的任务',
              dueDate: aiTaskProperties.dueDate,
              priority: 'medium' as const,
              status: 'pending' as const,
              isAIGenerated: true,
              isStarred: aiTaskProperties.isStarred,
              category: aiTaskProperties.category,
              viewCategory: aiTaskProperties.viewCategory,
            };

            const updatedTodos = [...todos, newTodo];
            setTodos(updatedTodos);
            localStorage.setItem('todos', JSON.stringify(updatedTodos));

            message.success('AI生成任务成功');

            // 清除输入和设置
            setNewTaskInput('');
            setSelectedDate('');
            setReminderTime('');
            setShowDatePicker(false);
            setShowReminderPicker(false);
          }
        } catch (parseError) {
          // 如果解析失败，直接使用AI的回复作为任务标题
          const aiTaskProperties = getAiTaskProperties();

          const newTodo = {
            _id: `ai-${Date.now()}`,
            user: user?._id || '',
            title: aiResponse || newTaskInput,
            description: reminderTime ? `AI生成的任务 · 提醒: ${reminderTime}` : 'AI生成的任务',
            dueDate: aiTaskProperties.dueDate,
            priority: 'medium' as const,
            status: 'pending' as const,
            isAIGenerated: true,
            isStarred: aiTaskProperties.isStarred,
            category: aiTaskProperties.category,
            viewCategory: aiTaskProperties.viewCategory,
          };

          const updatedTodos = [...todos, newTodo];
          setTodos(updatedTodos);
          localStorage.setItem('todos', JSON.stringify(updatedTodos));

          message.success('AI生成任务成功');

          // 清除输入和设置
          setNewTaskInput('');
          setSelectedDate('');
          setReminderTime('');
          setShowDatePicker(false);
          setShowReminderPicker(false);
        }
      } else {
        const errorData = await response.json();
        message.error(errorData.error?.message || 'AI生成失败');
      }
    } catch (error) {
      console.error('AI生成请求失败:', error);
      message.error('AI生成请求失败，请检查网络连接');
    } finally {
      setAiLoading(false);
    }
  };

  // 日期选择功能
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setShowCustomDatePicker(false);
    message.success(`已设置截止日期：${dayjs(date).format('YYYY-MM-DD')}`);
  };

  // 自定义日期选择
  const handleCustomDateSelect = () => {
    if (!customDate) {
      message.warning('请选择日期');
      return;
    }

    const selectedDateObj = dayjs(customDate);
    const today = dayjs().startOf('day');

    if (selectedDateObj.isBefore(today)) {
      message.error('不能选择过去的日期');
      return;
    }

    handleDateSelect(selectedDateObj.toISOString());
    setCustomDate('');
  };

  // 显示自定义日期选择器
  const showCustomDateSelector = () => {
    setShowCustomDatePicker(true);
    setShowDatePicker(false);
  };

  // 提醒功能
  const handleReminderSelect = (time: string) => {
    setReminderTime(time);
    setShowReminderPicker(false);
    message.success(`已设置提醒时间：${time}`);
  };

  // 重置功能
  const handleReset = () => {
    setNewTaskInput('');
    setSelectedDate('');
    setReminderTime('');
    setShowDatePicker(false);
    setShowReminderPicker(false);
    message.success('已重置所有设置');
  };

  // 删除任务功能
  const handleDeleteTask = (taskId: string) => {
    setSelectedTaskForDeletion(taskId);
  };

  const confirmDeleteTask = () => {
    if (!selectedTaskForDeletion) return;

    const updatedTodos = todos.filter(t => t._id !== selectedTaskForDeletion);
    setTodos(updatedTodos);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));

    message.success('任务已删除');
    setSelectedTaskForDeletion(null);
    setShowMoreOptions(false);
  };

  const cancelDeleteTask = () => {
    setSelectedTaskForDeletion(null);
  };

  const theme = getThemeColors(currentView);

  // Get view title for display
  const getViewTitle = (view: string) => {
    const titles = {
      'my-day': '我的一天',
      'important': '重要',
      'planned': '已计划',
      'assigned': '已分配给我',
      'tasks': '任务'
    };

    // Check if it's a custom list
    if (view.startsWith('custom-')) {
      const customLists = JSON.parse(localStorage.getItem('customLists') || '[]');
      const customList = customLists.find((list: any) => list.id === view);
      return customList ? customList.name : '自定义列表';
    }

    return titles[view as keyof typeof titles] || '任务';
  };

  // Filter todos based on current view
  const filteredTodos = useMemo(() => {
    const today = dayjs().startOf('day');

    switch (currentView) {
      case 'my-day':
        // Tasks specifically created for "my-day" view OR tasks due today
        return todos.filter(todo => {
          if (todo.viewCategory === 'my-day') return true;
          // Fallback: show tasks due today if no viewCategory is set (for backward compatibility)
          if (!todo.viewCategory) {
            const dueDate = dayjs(todo.dueDate).startOf('day');
            return dueDate.isSame(today, 'day');
          }
          return false;
        });

      case 'important':
        // Only tasks specifically marked for important view OR starred tasks
        return todos.filter(todo => {
          if (todo.viewCategory === 'important') return true;
          // Fallback: show starred tasks if no viewCategory is set (for backward compatibility)
          if (!todo.viewCategory && todo.isStarred) return true;
          return false;
        });

      case 'planned':
        // Only tasks specifically created for "planned" view
        return todos.filter(todo => {
          if (todo.viewCategory === 'planned') return true;
          // Fallback: show future tasks if no viewCategory is set (for backward compatibility)
          if (!todo.viewCategory) {
            const dueDate = dayjs(todo.dueDate).startOf('day');
            return dueDate.isAfter(today) || dueDate.isSame(today, 'day');
          }
          return false;
        });

      case 'assigned':
        // Only tasks specifically created for "assigned" view
        return todos.filter(todo => {
          if (todo.viewCategory === 'assigned') return true;
          // Fallback: show user's tasks if no viewCategory is set (for backward compatibility)
          if (!todo.viewCategory && todo.user === user?._id) return true;
          return false;
        });

      case 'tasks':
        // Only tasks specifically created for "tasks" view OR tasks without viewCategory
        return todos.filter(todo => {
          return todo.viewCategory === 'tasks' || !todo.viewCategory;
        });

      default:
        // Check if it's a custom list
        if (currentView.startsWith('custom-')) {
          // For custom lists, show tasks that have the custom list ID in their category
          return todos.filter(todo => todo.category === currentView);
        }
        // Default to tasks view
        return todos.filter(todo => todo.viewCategory === 'tasks' || !todo.viewCategory);
    }
  }, [todos, currentView, user]);

  // Separate completed and pending tasks
  const pendingTodos = useMemo(() =>
    filteredTodos.filter(todo => todo.status === 'pending'),
    [filteredTodos]
  );

  const completedTodos = useMemo(() =>
    filteredTodos.filter(todo => todo.status === 'completed'),
    [filteredTodos]
  );

  // Debug function to test all functionality
  const runDebugTest = () => {
    console.log('🧪 Running debug test...');
    console.log('Current view:', currentView);
    console.log('Current todos:', todos);
    console.log('Filtered todos:', filteredTodos);
    console.log('Pending todos:', pendingTodos);
    console.log('Completed todos:', completedTodos);
    console.log('Selected date:', selectedDate);
    console.log('Reminder time:', reminderTime);
    console.log('New task input:', newTaskInput);
    console.log('localStorage todos:', localStorage.getItem('todos'));

    // Test filtering logic
    console.log('🔍 Filtering test:');
    todos.forEach(todo => {
      console.log(`Task "${todo.title}":`, {
        isStarred: todo.isStarred,
        category: todo.category,
        dueDate: todo.dueDate,
        status: todo.status,
        user: todo.user
      });
    });

    message.info('Debug info logged to console');
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: theme[600], display: 'flex', alignItems: 'center', margin: 0 }}>
            <span className="material-icons" style={{ marginRight: '8px', color: theme[600], fontSize: '28px' }}>{getViewIcon(currentView)}</span>
            {getViewTitle(currentView)}
          </h1>
          {deleteMode && (
            <span style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
              删除模式
            </span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginRight: '8px',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            title="设置"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <span className="material-icons">settings</span>
          </button>

          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            style={{
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            title="更多选项"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <span className="material-icons">more_horiz</span>
          </button>

          {/* More Options Dropdown */}
          {showMoreOptions && (
            <div ref={moreOptionsRef} style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              minWidth: '150px'
            }}>
              <button
                onClick={runDebugTest}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>🧪</span>
                调试测试
              </button>

              <button
                onClick={() => {
                  setDeleteMode(!deleteMode);
                  setShowMoreOptions(false);
                  message.info(deleteMode ? '已退出删除模式' : '已进入删除模式，点击任务右侧的红色按钮删除任务');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: deleteMode ? '#fef2f2' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left',
                  color: deleteMode ? '#dc2626' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = deleteMode ? '#fecaca' : '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = deleteMode ? '#fef2f2' : 'transparent'}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  {deleteMode ? 'delete_forever' : 'delete'}
                </span>
                {deleteMode ? '退出删除模式' : '删除任务'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Todo List */}
      <div style={{ marginBottom: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <span style={{ color: '#6b7280' }}>加载中...</span>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <span style={{ color: '#6b7280' }}>暂无任务</span>
          </div>
        ) : (
          <div>
            {/* Pending Tasks */}
            {pendingTodos.map((todo) => (
            <div key={todo._id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              marginBottom: '12px'
            }}>
              <button
                onClick={() => toggleTodo(todo._id)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: todo.status === 'completed' ? theme[500] : '#9ca3af',
                  marginRight: '12px',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
                className="material-icons"
                title={todo.status === 'completed' ? '标记为待办' : '标记为完成'}
                onMouseEnter={(e) => {
                  if (todo.status !== 'completed') {
                    e.currentTarget.style.color = theme[500];
                  }
                }}
                onMouseLeave={(e) => {
                  if (todo.status !== 'completed') {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                {todo.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'}
              </button>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '14px',
                  textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                  color: todo.status === 'completed' ? '#6b7280' : '#374151',
                  margin: '0 0 4px 0'
                }}>
                  {todo.title}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  {todo.description && `${todo.description} · `}
                  任务 · {getViewTitle(currentView)} · 计划内
                  {todo.isAIGenerated && ' · AI生成'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => toggleStar(todo._id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: todo.isStarred ? theme[500] : '#9ca3af',
                    padding: '4px'
                  }}
                  className="material-icons"
                  title={todo.isStarred ? '移出重要列表' : '添加到重要列表'}
                >
                  {todo.isStarred ? 'star' : 'star_border'}
                </button>
                {deleteMode && (
                  <button
                    onClick={() => handleDeleteTask(todo._id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#dc2626',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}
                    className="material-icons"
                    title="删除任务"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    delete
                  </button>
                )}
              </div>
            </div>
          ))}

            {/* Completed Tasks Section */}
            {completedTodos.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => setShowCompletedSection(!showCompletedSection)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  {showCompletedSection ? 'expand_less' : 'expand_more'}
                </span>
                已完成 ({completedTodos.length})
              </span>
            </button>

            {showCompletedSection && (
              <div style={{ paddingLeft: '12px' }}>
                {completedTodos.map((todo) => (
                  <div
                    key={todo._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginBottom: '4px',
                      backgroundColor: '#f9fafb',
                      opacity: 0.7
                    }}
                  >
                    <button
                      onClick={() => toggleTodo(todo._id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#10b981',
                        marginRight: '12px',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'all 0.2s'
                      }}
                      className="material-icons"
                      title="标记为待办"
                    >
                      check_circle
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: 0,
                        textDecoration: 'line-through'
                      }}>
                        {todo.title}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                        {todo.description && `${todo.description} · `}
                        任务 · {getViewTitle(currentView)} · 已完成
                        {todo.isAIGenerated && ' · AI生成'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => toggleStar(todo._id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: todo.isStarred ? theme[500] : '#9ca3af',
                          padding: '4px'
                        }}
                        className="material-icons"
                        title={todo.isStarred ? '移出重要列表' : '添加到重要列表'}
                      >
                        {todo.isStarred ? 'star' : 'star_border'}
                      </button>
                      {deleteMode && (
                        <button
                          onClick={() => handleDeleteTask(todo._id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#dc2626',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                          }}
                          className="material-icons"
                          title="删除任务"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </div>
        )}
      </div>

      {/* Add Task Input */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px',
        position: 'relative',
        zIndex: 1,
        backgroundColor: theme[50],
        borderRadius: '8px',
        border: `1px solid ${theme[200]}`
      }}>
        {/* Settings indicators */}
        {(selectedDate || reminderTime) && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
            {selectedDate && (
              <span style={{
                backgroundColor: theme[100],
                color: theme[600],
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span className="material-icons" style={{ fontSize: '14px' }}>calendar_today</span>
                {dayjs(selectedDate).format('MM/DD')}
              </span>
            )}
            {reminderTime && (
              <span style={{
                backgroundColor: theme[100],
                color: theme[600],
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span className="material-icons" style={{ fontSize: '14px' }}>notifications</span>
                {reminderTime}
              </span>
            )}
          </div>
        )}

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="material-icons" style={{ color: theme[500], marginRight: '12px' }}>add</span>
          <input
            style={{
              backgroundColor: 'transparent',
              color: '#374151',
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px'
            }}
            placeholder="添加任务"
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', position: 'relative' }}>
          <button
            style={{
              color: aiLoading ? theme[500] : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            title="AI 生成"
            onClick={handleAiGenerate}
            disabled={aiLoading}
            onMouseEnter={(e) => {
              if (!aiLoading) {
                e.currentTarget.style.backgroundColor = theme[100];
                e.currentTarget.style.color = theme[600];
              }
            }}
            onMouseLeave={(e) => {
              if (!aiLoading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>
              {aiLoading ? 'hourglass_empty' : 'auto_awesome'}
            </span>
          </button>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{
              color: selectedDate ? theme[500] : '#6b7280',
              backgroundColor: selectedDate ? theme[100] : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            title="设置截止日期"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme[100];
              e.currentTarget.style.color = theme[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = selectedDate ? theme[100] : 'transparent';
              e.currentTarget.style.color = selectedDate ? theme[500] : '#6b7280';
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>calendar_today</span>
          </button>
          <button
            onClick={() => setShowReminderPicker(!showReminderPicker)}
            style={{
              color: reminderTime ? theme[500] : '#6b7280',
              backgroundColor: reminderTime ? theme[100] : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            title="设置提醒"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme[100];
              e.currentTarget.style.color = theme[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = reminderTime ? theme[100] : 'transparent';
              e.currentTarget.style.color = reminderTime ? theme[500] : '#6b7280';
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>
              {reminderTime ? 'notifications' : 'notifications_none'}
            </span>
          </button>
          <button
            onClick={handleReset}
            style={{
              color: (selectedDate || reminderTime || newTaskInput) ? '#ef4444' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            title="重置设置"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = (selectedDate || reminderTime || newTaskInput) ? '#ef4444' : '#6b7280';
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>refresh</span>
          </button>
          </div>
        </div>
      </div>

      {/* 日期选择器 */}
      {showDatePicker && (
        <div ref={datePickerRef} style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: '80px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1001,
          minWidth: '200px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>选择截止日期</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => handleDateSelect(dayjs().toISOString())}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              今天 ({dayjs().format('MM/DD')})
            </button>
            <button
              onClick={() => handleDateSelect(dayjs().add(1, 'day').toISOString())}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              明天 ({dayjs().add(1, 'day').format('MM/DD')})
            </button>
            <button
              onClick={() => handleDateSelect(dayjs().add(7, 'day').toISOString())}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              下周 ({dayjs().add(7, 'day').format('MM/DD')})
            </button>
            <button
              onClick={() => handleDateSelect(dayjs().add(1, 'month').toISOString())}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              下个月 ({dayjs().add(1, 'month').format('MM/DD')})
            </button>

            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

            <button
              onClick={showCustomDateSelector}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>date_range</span>
              自定义日期
            </button>
          </div>
        </div>
      )}

      {/* 提醒选择器 */}
      {showReminderPicker && (
        <div ref={reminderPickerRef} style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: '40px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1001,
          minWidth: '200px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>设置提醒</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => handleReminderSelect('5分钟前')}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              5分钟前
            </button>
            <button
              onClick={() => handleReminderSelect('15分钟前')}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              15分钟前
            </button>
            <button
              onClick={() => handleReminderSelect('1小时前')}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              1小时前
            </button>
            <button
              onClick={() => handleReminderSelect('1天前')}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              1天前
            </button>
            <button
              onClick={() => handleReminderSelect('1周前')}
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              1周前
            </button>
          </div>
        </div>
      )}

      {/* Custom Date Picker Modal */}
      {showCustomDatePicker && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>选择自定义日期</h3>
              <button
                onClick={() => setShowCustomDatePicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                选择日期：
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={dayjs().format('YYYY-MM-DD')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCustomDatePicker(false)}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                onClick={handleCustomDateSelect}
                disabled={!customDate}
                style={{
                  backgroundColor: customDate ? theme[500] : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: customDate ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Deletion Confirmation Modal */}
      {selectedTaskForDeletion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                确认删除任务
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                此操作无法撤销。确定要删除这个任务吗？
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelDeleteTask}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDeleteTask}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default MainContent;
