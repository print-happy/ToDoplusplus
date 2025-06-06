import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Calendar from './Calendar';
import { useAuth } from '../contexts/AuthContext';

const NewTodoPage: React.FC = () => {
  const [currentView, setCurrentView] = useState('planned');
  const { user } = useAuth();

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

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
          <MainContent currentView={currentView} />
        </div>

        {/* Calendar */}
        <div>
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default NewTodoPage;
