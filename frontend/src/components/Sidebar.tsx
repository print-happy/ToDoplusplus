import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

interface SidebarProps {
  onViewChange: (view: string) => void;
  currentView: string;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface CustomList {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onViewChange, currentView, userInfo }) => {
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('list');
  const [selectedColor, setSelectedColor] = useState('blue');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'my-day', name: '我的一天', icon: 'lightbulb', color: 'blue' },
    { id: 'important', name: '重要', icon: 'star_border', color: 'yellow' },
    { id: 'planned', name: '已计划', icon: 'list_alt', color: 'blue' },
    { id: 'assigned', name: '已分配给我', icon: 'person_outline', color: 'green' },
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

  // Load custom lists from localStorage
  useEffect(() => {
    const savedLists = localStorage.getItem('customLists');
    if (savedLists) {
      setCustomLists(JSON.parse(savedLists));
    }
  }, []);

  // Save custom lists to localStorage
  const saveCustomLists = (lists: CustomList[]) => {
    localStorage.setItem('customLists', JSON.stringify(lists));
    setCustomLists(lists);
  };

  const handleNewList = () => {
    setIsNewListModalOpen(true);
    setNewListName('');
    setSelectedIcon('list');
    setSelectedColor('blue');
  };

  const handleCreateList = () => {
    if (!newListName.trim()) {
      message.warning('请输入列表名称');
      return;
    }

    const newList: CustomList = {
      id: `custom-${Date.now()}`,
      name: newListName.trim(),
      icon: selectedIcon,
      color: selectedColor
    };

    const updatedLists = [...customLists, newList];
    saveCustomLists(updatedLists);
    setIsNewListModalOpen(false);
    message.success('列表创建成功');
  };

  const handleDeleteCustomList = (listId: string) => {
    const updatedLists = customLists.filter(list => list.id !== listId);
    saveCustomLists(updatedLists);
    message.success('列表已删除');
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
          {/* Default Menu Items */}
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

          {/* Custom Lists */}
          {customLists.length > 0 && (
            <>
              <li style={{ margin: '16px 0 8px 0', padding: '0 8px' }}>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />
              </li>
              {customLists.map((list) => {
                const isActive = currentView === list.id;
                const theme = getThemeColors(list.color);

                return (
                  <li key={list.id} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={() => handleMenuClick(list.id)}
                        style={{
                          flex: 1,
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
                          {list.icon}
                        </span>
                        {list.name}
                      </button>
                      <button
                        onClick={() => handleDeleteCustomList(list.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#dc2626',
                          padding: '4px',
                          borderRadius: '4px',
                          marginLeft: '4px'
                        }}
                        title="删除列表"
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </>
          )}
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

      {/* New List Creation Modal */}
      {isNewListModalOpen && (
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>创建新列表</h3>
              <button
                onClick={() => setIsNewListModalOpen(false)}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                列表名称：
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="输入列表名称"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                maxLength={20}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                选择图标：
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {['list', 'folder', 'work', 'home', 'school', 'shopping_cart', 'favorite', 'star', 'bookmark', 'flag', 'label', 'category'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    style={{
                      padding: '8px',
                      border: selectedIcon === icon ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: selectedIcon === icon ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '20px', color: selectedIcon === icon ? '#3b82f6' : '#6b7280' }}>
                      {icon}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                选择颜色：
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['blue', 'green', 'yellow', 'purple', 'red'].map((color) => {
                  const theme = getThemeColors(color);
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: theme.bg,
                        border: selectedColor === color ? '3px solid #374151' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: theme.text
                      }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsNewListModalOpen(false)}
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
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                style={{
                  backgroundColor: newListName.trim() ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: newListName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
