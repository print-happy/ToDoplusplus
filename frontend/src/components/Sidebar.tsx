import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import UserProfile from './UserProfile';

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('list');
  const [selectedColor, setSelectedColor] = useState('blue');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Debug user state changes
  useEffect(() => {
    console.log('🔄 Sidebar: User state changed:', user);
    console.log('👤 Sidebar: User avatar:', user?.avatar);
    console.log('📝 Sidebar: User name:', user?.name || user?.username);
    console.log('📧 Sidebar: User email:', user?.email);
  }, [user]);

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

  // Get main content theme colors to match the selected view
  const getMainContentThemeColors = (view: string) => {
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

    // Handle custom lists
    if (view.startsWith('custom-')) {
      const customLists = JSON.parse(localStorage.getItem('customLists') || '[]');
      const customList = customLists.find((list: any) => list.id === view);
      if (customList) {
        // Map custom list colors to theme colors
        const colorMap = {
          blue: themes['my-day'],
          green: themes['assigned'],
          yellow: themes['flagged'],
          purple: themes['tasks'],
          red: themes['important']
        };
        return colorMap[customList.color as keyof typeof colorMap] || themes.tasks;
      }
    }

    return themes[view as keyof typeof themes] || themes.tasks;
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
      <button
        onClick={() => setIsProfileModalOpen(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          marginRight: '12px',
          backgroundColor: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          backgroundImage: user?.avatar?.startsWith('data:') ? `url(${user.avatar})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!user?.avatar?.startsWith('data:') && (user?.avatar || '👤')}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>
            {user?.name || user?.username || 'username'}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            {user?.email || 'test@gmail.com'}
          </p>
        </div>
        <span className="material-icons" style={{ fontSize: '16px', color: '#9ca3af' }}>
          edit
        </span>
      </button>

      {/* Navigation Menu */}
      <nav style={{ flexGrow: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {/* Default Menu Items */}
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            const mainTheme = getMainContentThemeColors(item.id);
            // const theme = getThemeColors(item.color); // Not used currently

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
                    backgroundColor: isActive ? mainTheme[100] : 'transparent',
                    color: isActive ? mainTheme[600] : '#374151',
                    fontWeight: isActive ? '500' : 'normal',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = mainTheme[50];
                      e.currentTarget.style.color = mainTheme[600];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  <span
                    className="material-icons"
                    style={{
                      marginRight: '12px',
                      color: isActive ? mainTheme[600] : '#6b7280',
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
                const mainTheme = getMainContentThemeColors(list.id);
                // const theme = getThemeColors(list.color); // Not used currently

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
                          backgroundColor: isActive ? mainTheme[100] : 'transparent',
                          color: isActive ? mainTheme[600] : '#374151',
                          fontWeight: isActive ? '500' : 'normal',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = mainTheme[50];
                            e.currentTarget.style.color = mainTheme[600];
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#374151';
                          }
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{
                            marginRight: '12px',
                            color: isActive ? mainTheme[600] : '#6b7280',
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
                  // Get the actual theme colors that will be used
                  const colorMap = {
                    blue: { bg: '#dbeafe', text: '#2563eb' },
                    green: { bg: '#dcfce7', text: '#16a34a' },
                    yellow: { bg: '#fef9c3', text: '#ca8a04' },
                    purple: { bg: '#f3e8ff', text: '#9333ea' },
                    red: { bg: '#fee2e2', text: '#dc2626' }
                  };
                  const theme = colorMap[color as keyof typeof colorMap];
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

      {/* User Profile Modal */}
      <UserProfile
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
