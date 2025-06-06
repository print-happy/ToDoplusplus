import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Calendar from './Calendar';
import TaskDetailModal from './TaskDetailModal';
import { useAuth } from '../contexts/AuthContext';

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

const NewTodoPage: React.FC = () => {
  const [currentView, setCurrentView] = useState('planned');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<Todo[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const { user } = useAuth();

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  // Get theme colors based on current view
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
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        500: '#eab308',
        600: '#ca8a04'
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
    return themes[view as keyof typeof themes] || themes.planned;
  };

  const theme = getThemeColors(currentView);

  // Handle calendar date click
  const handleDateClick = useCallback((date: string, tasks: Todo[]) => {
    setSelectedDate(date);
    setSelectedTasks(tasks);
    setShowTaskModal(true);
  }, []);

  // Handle todo toggle from calendar modal
  const handleToggleTodo = useCallback((id: string) => {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;

    const newStatus: 'pending' | 'completed' = todo.status === 'completed' ? 'pending' : 'completed';

    // Update local state
    const updatedTodos = todos.map(t =>
      t._id === id ? { ...t, status: newStatus } : t
    );
    setTodos(updatedTodos);
    setSelectedTasks(prev => prev.map(t =>
      t._id === id ? { ...t, status: newStatus } : t
    ));

    // Save to localStorage
    localStorage.setItem('todos', JSON.stringify(updatedTodos));

    console.log(`Toggled todo ${id} to ${newStatus}`);
  }, [todos]);

  // Handle star toggle from calendar modal
  const handleToggleStar = useCallback((id: string) => {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;

    const newStarred = !todo.isStarred;

    // Update local state
    const updatedTodos = todos.map(t =>
      t._id === id ? { ...t, isStarred: newStarred } : t
    );
    setTodos(updatedTodos);
    setSelectedTasks(prev => prev.map(t =>
      t._id === id ? { ...t, isStarred: newStarred } : t
    ));

    // Save to localStorage
    localStorage.setItem('todos', JSON.stringify(updatedTodos));

    console.log(`Toggled star for todo ${id} to ${newStarred}`);
  }, [todos]);

  // Callback to receive todos from MainContent
  const handleTodosUpdate = useCallback((updatedTodos: Todo[]) => {
    setTodos(updatedTodos);
  }, []);

  const userInfo = {
    name: user?.name || 'username',
    email: user?.email || 'test@gmail.com',
    avatar: user?.avatar
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', display: 'flex', minHeight: '100vh' }}>
      {/* Include Material Icons */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

      {/* Sidebar */}
      <Sidebar
        onViewChange={handleViewChange}
        currentView={currentView}
        userInfo={userInfo}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Todo List */}
        <div>
          <MainContent
            currentView={currentView}
            onTodosUpdate={handleTodosUpdate}
          />
        </div>

        {/* Calendar */}
        <div>
          <Calendar
            todos={todos}
            onDateClick={handleDateClick}
            theme={theme}
          />
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        date={selectedDate}
        tasks={selectedTasks}
        theme={theme}
        onToggleTodo={handleToggleTodo}
        onToggleStar={handleToggleStar}
      />
    </div>
  );
};

export default NewTodoPage;
