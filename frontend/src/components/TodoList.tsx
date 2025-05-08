import React, { useState, useEffect } from 'react';
import { Input, Button, Modal, Form, DatePicker, Select, message, Tag, Table, Progress, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

axios.defaults.baseURL = 'http://localhost:5000';

const { TextArea } = Input;
const { Option } = Select;

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
  const [form] = Form.useForm();
  const [aiPrompt, setAiPrompt] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('/api/todos');
      setTodos(response.data);
    } catch (error) {
      message.error('获取待办事项失败');
    }
  };

  const handleCreate = () => {
    setEditingTodo(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/todos/${id}`);
      message.success('删除成功');
      fetchTodos();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const todoData = {
        ...values,
        dueDate: values.dueDate.toISOString(),
        xmlContent: `<todo><title>${values.title}</title><description>${values.description || ''}</description></todo>`
      };
      if (editingTodo) {
        await axios.patch(`/api/todos/${editingTodo._id}`, todoData);
        message.success('更新成功');
      } else {
        await axios.post('/api/todos', todoData);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchTodos();
    } catch (error) {
      message.error(editingTodo ? '更新失败' : '创建失败');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  // 排序：优先级高->低，日期近->远
  const sortedTodos = [...todos].sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
  });

  // 计算完成率
  const completedCount = todos.filter(t => t.status === 'completed').length;
  const totalCount = todos.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  // 渐变色
  const getProgressColor = () => {
    if (percent < 50) return 'red';
    if (percent < 80) return 'gold';
    return 'green';
  };

  // 勾选完成事项
  const handleCheck = async (todo: Todo, checked: boolean) => {
    try {
      await axios.patch(`/api/todos/${todo._id}`, { status: checked ? 'completed' : 'pending' });
      // 等待后端返回后刷新数据
      await fetchTodos();
    } catch (e) {
      message.error('更新事项状态失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '',
      dataIndex: 'status',
      key: 'check',
      render: (_: any, record: Todo) => (
        <Checkbox checked={record.status === 'completed'} onChange={e => handleCheck(record, e.target.checked)} />
      )
    },
    { title: '标题', dataIndex: 'title', key: 'title', render: (text: string, record: Todo) => (
      <span style={record.status === 'completed' ? { textDecoration: 'line-through', color: '#aaa' } : {}}>{text}</span>
    ) },
    { title: '描述', dataIndex: 'description', key: 'description', render: (text: string, record: Todo) => (
      <span style={record.status === 'completed' ? { textDecoration: 'line-through', color: '#aaa' } : {}}>{text}</span>
    ) },
    { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate', render: (text: string, record: Todo) => (
      <span style={record.status === 'completed' ? { textDecoration: 'line-through', color: '#aaa' } : {}}>{dayjs(text).format('YYYY-MM-DD')}</span>
    ) },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (priority: string, record: Todo) => (
      <Tag color={getPriorityColor(priority)} style={record.status === 'completed' ? { opacity: 0.5 } : {}}>{priority}</Tag>
    ) },
    { title: '状态', dataIndex: 'status', key: 'status', render: (text: string) => text === 'completed' ? '已完成' : '待办' },
    { title: 'AI生成', dataIndex: 'isAIGenerated', key: 'isAIGenerated', render: (val: boolean, record: Todo) => val ? <Tag color="purple" style={record.status === 'completed' ? { opacity: 0.5 } : {}}>AI</Tag> : null },
    { title: '操作', key: 'action', render: (_: any, record: Todo) => (
      <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record._id)}>删除</Button>
    ) },
  ];

  const handleAIGenerate = async () => {
    if (!aiPrompt) {
      message.warning('请输入自然语言描述');
      return;
    }
    try {
      await axios.post('/api/todos/generate', { prompt: aiPrompt });
      message.success('AI生成成功');
      setAiPrompt('');
      fetchTodos();
    } catch (error) {
      message.error('AI生成失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button onClick={() => navigate('/views')}>视图选项</Button>
        <Input
          placeholder="输入自然语言描述，让AI生成待办事项"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button type="primary" onClick={handleAIGenerate}>
          AI生成
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建待办
        </Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Progress percent={percent} strokeColor={getProgressColor()} showInfo format={() => `完成率 ${percent}%`} />
      </div>
      <Table
        columns={columns}
        dataSource={sortedTodos.map(todo => ({ ...todo, key: todo._id }))}
        pagination={{ pageSize: 8 }}
        rowClassName={() => 'todo-row'}
        style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      />
      <Modal
        title={editingTodo ? '编辑待办事项' : '新建待办事项'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnClose={true}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="dueDate"
            label="截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="repeat"
            label="重复"
            initialValue="none"
          >
            <Select>
              <Option value="none">无</Option>
              <Option value="daily">每日</Option>
              <Option value="weekly">每周</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingTodo ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TodoList; 