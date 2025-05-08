import React, { useState, useEffect } from 'react';
import { Calendar, Modal, List, Button, Tag, Tabs } from 'antd';
import { LeftOutlined, RightOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const { TabPane } = Tabs;

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const priorityOrder = { high: 1, medium: 2, low: 3 };

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'orange';
    case 'low': return 'green';
    default: return 'blue';
  }
};

const TodoViews: React.FC = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [calendarValue, setCalendarValue] = useState(dayjs());
  const [calendarModal, setCalendarModal] = useState<{visible: boolean, date: string}>({visible: false, date: ''});
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/todos');
      setTodos(response.data);
    } catch (error) {
      //
    }
  };

  // 日历视图
  const dateCellRender = (_: any) => null; // 不显示事项
  const onCalendarSelect = (value: any) => {
    setCalendarModal({ visible: true, date: value.format('YYYY-MM-DD') });
  };
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`);
      fetchTodos();
    } catch {}
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
    <div style={{ padding: 24 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="日历视图" key="calendar">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Button icon={<LeftOutlined />} onClick={prevMonth} />
            <span style={{ margin: '0 16px', fontWeight: 500 }}>{calendarValue.format('YYYY年MM月')}</span>
            <Button icon={<RightOutlined />} onClick={nextMonth} />
          </div>
          <Calendar
            value={calendarValue}
            onPanelChange={setCalendarValue}
            onSelect={onCalendarSelect}
            dateCellRender={dateCellRender}
            fullscreen
          />
          <Modal
            open={calendarModal.visible}
            title={calendarModal.date + ' 的待办事项'}
            onCancel={() => setCalendarModal({ visible: false, date: '' })}
            footer={null}
          >
            <List
              dataSource={todos.filter(todo => dayjs(todo.dueDate).format('YYYY-MM-DD') === calendarModal.date)}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(item._id)}>删除</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={<>
                      <div>描述: {item.description}</div>
                      <div>优先级: <Tag color={getPriorityColor(item.priority)}>{item.priority}</Tag></div>
                    </>}
                  />
                </List.Item>
              )}
            />
          </Modal>
        </TabPane>
        <TabPane tab="周视图" key="week">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Button icon={<LeftOutlined />} onClick={prevWeek} />
            <span style={{ margin: '0 16px', fontWeight: 500 }}>{calendarValue.startOf('week').add(1, 'day').format('YYYY年MM月DD日')} - {calendarValue.endOf('week').add(1, 'day').format('YYYY年MM月DD日')}</span>
            <Button icon={<RightOutlined />} onClick={nextWeek} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  {weekDays.map(day => (
                    <th key={day} style={{ border: '1px solid #eee', padding: 8, background: '#fafafa' }}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {weekDays.map((_, i) => {
                    const date = calendarValue.startOf('week').add(i + 1, 'day').format('YYYY-MM-DD');
                    return (
                      <td key={date} style={{ border: '1px solid #eee', verticalAlign: 'top', minWidth: 120 }}>
                        {weekTable[date].length === 0 ? <div style={{ color: '#bbb', padding: '16px 0' }}>无事项</div> :
                          weekTable[date].map(item => (
                            <div key={item._id} style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 12, padding: 10, background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                              <div style={{ fontWeight: 500, fontSize: 16 }}>{item.title}</div>
                              <div style={{ fontSize: 13, color: '#888', margin: '4px 0 6px 0' }}>{item.description}</div>
                              <div><Tag color={getPriorityColor(item.priority)}>{item.priority}</Tag></div>
                            </div>
                          ))}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TodoViews; 