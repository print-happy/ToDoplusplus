import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  onViewChange: (view: string) => void;
  currentView: string;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ onViewChange, currentView, userInfo }) => {
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'my-day', name: '我的一天', icon: 'lightbulb', color: 'blue' },
    { id: 'important', name: '重要', icon: 'star_border', color: 'yellow' },
    { id: 'planned', name: '已计划', icon: 'list_alt', color: 'blue' },
    { id: 'assigned', name: '已分配给我', icon: 'person_outline', color: 'green' },
    { id: 'flagged', name: '标记的电子邮件', icon: 'flag', color: 'yellow' },
    { id: 'tasks', name: '任务', icon: 'task_alt', color: 'purple' },
  ];

  const getThemeColors = (color: string) => {
    const themes = {
      blue: { bg: '#dbeafe', text: '#2563eb', hover: '#eff6ff' },
      green: { bg: '#dcfce7', text: '#16a34a', hover: '#f0fdf4' },
      yellow: { bg: '#fef9c3', text: '#ca8a04', hover: '#fefce8' },
      purple: { bg: '#f3e8ff', text: '#9333ea', hover: '#faf5ff' },
      red: { bg: '#fee2e2', text: '#dc2626', hover: '#fef2f2' },
    };
    return themes[color as keyof typeof themes] || themes.blue;
  };

  const handleMenuClick = (itemId: string) => {
    onViewChange(itemId);
  };

  const handleNewList = () => {
    setIsNewListModalOpen(true);
    // TODO: Implement new list creation modal
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{ width: '256px', backgroundColor: 'white', padding: '16px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      {/* User Info */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <img
          alt="User avatar"
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }}
          src={userInfo?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBxbm1JchewrOoKfk-Px1243Q4G4-Qag0e7HHa1z7h449aqcQigSqOPDMUooO8RBSqnFu3BxSJL7MROuzUzZE4AmLMI8fLa8Z6jqzLu3JhHbEcWVbQcNjI4IveTP-tfMpAuMleWjQ9h27VGI2mQFApp3JzBTWIKpr8v6YppgqRHwPMBE0sChwkg_7XrtJQUwjxxUrmndjuFZU6vfYjakHPCvV0Q0bNqBfkXMfRjY40kBiMgmaFc6pI9pcHo5osWULhwoT9TxK-FjTQ"}
        />
        <div>
          <p style={{ fontWeight: '600', fontSize: '14px' }}>{userInfo?.name || 'username'}</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>{userInfo?.email || 'test@gmail.com'}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flexGrow: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            const theme = getThemeColors(item.color);

            return (
              <li key={item.id} style={{ marginBottom: '8px' }}>
                <button
                  onClick={() => handleMenuClick(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isActive ? theme.bg : 'transparent',
                    color: isActive ? theme.text : '#374151',
                    fontWeight: isActive ? '500' : 'normal',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span
                    className="material-icons"
                    style={{
                      marginRight: '12px',
                      color: isActive ? theme.text : '#6b7280',
                      fontSize: '20px'
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* New List Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleNewList}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#374151',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="material-icons" style={{ marginRight: '8px', fontSize: '20px' }}>add</span>
          新建列表
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#dc2626',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="material-icons" style={{ marginRight: '8px', fontSize: '20px' }}>logout</span>
          登出
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
