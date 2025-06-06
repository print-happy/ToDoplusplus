import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Input, Button, Modal, Form, DatePicker, Select, message, Tag, Tooltip, Popconfirm, Row, Col, Typography, Spin, Progress, Table, Space, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

dayjs.locale('zh-cn');
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const { Option } = Select;
const { Title } = Typography;

axios.defaults.baseURL = 'http://localhost:5000';

interface Todo {
  _id: string;
  user: string;
  title: string;
  description?: string;
  dueDate: string; // Or Date, ensure consistency
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  xmlContent?: string;
  isAIGenerated?: boolean;
  createdAt?: string; // Or Date
  updatedAt?: string; // Or Date
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [form] = Form.useForm();
  const { user, token } = useAuth();
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchTodos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(response.data.sort((a: Todo, b: Todo) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    } catch (error) {
      message.error('获取待办事项失败');
      console.error('Fetch todos error:', error);
    }
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const showModal = () => {
    setIsEditMode(false);
    setEditingTodo(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onFinish = async (values: any) => {
    if (!token) {
      message.error('用户未认证');
      return;
    }
    setLoading(true);
    const todoData = {
      ...values,
      dueDate: dayjs(values.dueDate).toISOString(),
      user: user?._id, // Ensure user object and _id property exist
    };

    try {
      if (isEditMode && editingTodo) {
        await axios.put(`${API_URL}/todos/${editingTodo._id}`, todoData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('待办更新成功!');
      } else {
        await axios.post(`${API_URL}/todos`, todoData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('待办创建成功!');
      }
      fetchTodos();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(isEditMode ? '更新失败' : '创建失败');
      console.error('Form finish error:', error);
    }
    setLoading(false);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
    message.error('表单提交失败，请检查输入项。');
  };

  const handleEdit = (todo: Todo) => {
    setIsEditMode(true);
    setEditingTodo(todo);
    form.setFieldsValue({
      ...todo,
      dueDate: dayjs(todo.dueDate),
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('删除成功');
      fetchTodos();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const toggleComplete = async (id: string) => {
    if (!token) return;
    const todo = todos.find(t => t._id === id);
    if (!todo) return;
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      await axios.put(`${API_URL}/todos/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTodos();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleAiCreate = async () => {
    console.log('[handleAiCreate] Clicked AI 生成 button'); // Log 1: Function called

    if (!aiInput.trim()) {
      message.warning('请输入自然语言描述');
      console.log('[handleAiCreate] AI input is empty');
      return;
    }
    console.log('[handleAiCreate] AI Input:', aiInput); // Log 2: AI Input value

    if (!token) {
      message.error('用户未认证，无法创建待办');
      console.log('[handleAiCreate] Token is missing'); // Log 3: Token missing
      return;
    }
    console.log('[handleAiCreate] Token present:', token ? 'Yes' : 'No (should not happen)'); // Log 4: Token status

    setAiLoading(true);
    console.log('[handleAiCreate] Attempting to fetch from API...'); // Log 5: Before fetch
    try {
      const response = await fetch(`${API_URL}/todos/ai-create-siliconflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ naturalLanguageInput: aiInput }),
      });

      console.log('[handleAiCreate] Fetch response received. Status:', response.status); // Log 6: Response status

      if (response.ok) {
        const newTodo = await response.json();
        console.log('[handleAiCreate] AI生成成功, response data:', newTodo); // Log 7: Success response data
        message.success('AI生成成功');
        fetchTodos();
        setAiInput('');
      } else {
        let errorMessage = 'AI生成失败，请查看控制台日志';
        try {
          const errorData = await response.json();
          console.error('[handleAiCreate] AI生成失败, status:', response.status, 'error data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('[handleAiCreate] AI生成失败, status:', response.status, 'response is not JSON');
          errorMessage = `AI生成失败 (状态: ${response.status})，响应不是有效的JSON。`;
        }
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('[handleAiCreate] AI生成请求捕获到错误:', error); // Log 10: Catch block error
      message.error('AI生成请求失败，请查看控制台日志');
    } finally {
      setAiLoading(false);
      console.log('[handleAiCreate] Finished AI create process.'); // Log 11: Finally block
    }
  };

  const columns = [
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (status: string, record: Todo) => (
        <Checkbox 
          checked={status === 'completed'} 
          onChange={() => toggleComplete(record._id)}
          style={record.status === 'completed' ? { opacity: 0.5 } : {}}
        />
      ),
      sorter: (a: Todo, b: Todo) => a.status.localeCompare(b.status),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Todo) => <span style={record.status === 'completed' ? { textDecoration: 'line-through', opacity: 0.5 } : {}}>{text}</span>,
      sorter: (a: Todo, b: Todo) => a.title.localeCompare(b.title),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Todo) => <span style={record.status === 'completed' ? { opacity: 0.5 } : {}}>{text}</span>,
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string, record: Todo) => <span style={record.status === 'completed' ? { opacity: 0.5 } : {}}>{dayjs(date).format('YYYY-MM-DD HH:mm')}</span>,
      sorter: (a: Todo, b: Todo) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix(),
      defaultSortOrder: 'ascend' as 'ascend',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string, record: Todo) => {
        let color = priority === 'high' ? 'volcano' : priority === 'medium' ? 'orange' : 'green';
        if (record.status === 'completed') color = 'default';
        return <Tag color={color} style={record.status === 'completed' ? { opacity: 0.5 } : {}}>{priority.toUpperCase()}</Tag>;
      },
      sorter: (a: Todo, b: Todo) => {
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        // Ensure priority is a key of priorityOrder
        const priorityA = a.priority as keyof typeof priorityOrder;
        const priorityB = b.priority as keyof typeof priorityOrder;
        return priorityOrder[priorityA] - priorityOrder[priorityB];
      },
    },
    { title: 'AI生成', dataIndex: 'isAIGenerated', key: 'isAIGenerated', render: (val: boolean, record: Todo) => val ? <Tag color="purple" style={record.status === 'completed' ? { opacity: 0.5 } : {}}>AI</Tag> : null },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Todo) => (
        <Space size="small"> {/* Corrected usage of Space */}
          <Tooltip title="编辑">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
          </Tooltip>
          <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record._id)} okText="是" cancelText="否">
            <Tooltip title="删除">
              <Button icon={<DeleteOutlined />} danger size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const calculateCompletion = useCallback(() => {
    if (todos.length === 0) return 0;
    const completedCount = todos.filter(todo => todo.status === 'completed').length;
    return Math.round((completedCount / todos.length) * 100);
  }, [todos]);

  const percent = useMemo(calculateCompletion, [calculateCompletion]);

  const getProgressColor = useCallback(() => {
    const currentPercent = calculateCompletion(); // Recalculate for current color
    if (currentPercent < 30) return '#ff4d4f';
    if (currentPercent < 70) return '#faad14';
    return '#52c41a';
  }, [calculateCompletion]);

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix());
    // Add other sorting criteria if necessary, or rely on Table's sorter
  }, [todos]);

  if (loading && !isModalVisible) { // Adjusted loading condition
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Title level={4}>任务管理</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal} style={{ marginBottom: 16 }}>
            创建待办
          </Button>
          <Button onClick={() => navigate('/views')} style={{ marginLeft: 8 }}>视图选项</Button>
        </Col>
        <Col xs={24} md={12}>
          <Title level={4}>AI助手</Title>
          <Input.TextArea
            rows={3}
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="输入自然语言描述，让AI生成待办事项"
            style={{ marginBottom: 8 }}
          />
          <Button type="primary" onClick={handleAiCreate} loading={aiLoading} icon={<RobotOutlined />}>
            AI生成
          </Button>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Progress percent={percent} strokeColor={getProgressColor()} showInfo format={() => `完成率 ${percent}%`} />
      </div>
      <Table
        columns={columns}
        dataSource={sortedTodos.map(todo => ({ ...todo, key: todo._id }))}
        pagination={{ pageSize: 8 }}
        rowClassName={(record) => record.status === 'completed' ? 'completed-todo-row' : ''}
        loading={loading && !isModalVisible} // Show table loading indicator
      />

      <Modal
        title={isEditMode ? '编辑待办' : '创建待办'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="dueDate" label="截止日期" rules={[{ required: true, message: '请选择截止日期!' }]}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>
          {isEditMode && (
            <Form.Item name="status" label="状态" initialValue="pending">
              <Select>
                <Option value="pending">待处理</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            {/* Changed loading prop for the submit button to a more specific one if needed, or keep general form loading */}
            <Button type="primary" htmlType="submit" loading={form.getFieldValue('_submitting') || loading}> 
              {isEditMode ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TodoList;