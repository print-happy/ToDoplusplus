import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header } = Layout;

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '1',
      label: <Link to="/todos">待办事项</Link>
    },
    {
      key: 'views',
      label: <Link to="/views">视图选项</Link>
    },
    {
      key: 'countdown',
      label: <Link to="/countdown">倒计时</Link>
    },
    ...(user ? [
      {
        key: '2',
        label: <span>欢迎, {user.username}</span>,
        style: { marginLeft: 'auto' }
      },
      {
        key: '3',
        label: <Button type="link" onClick={handleLogout}>退出</Button>
      }
    ] : [
      {
        key: '4',
        label: <Link to="/login">登录</Link>,
        style: { marginLeft: 'auto' }
      },
      {
        key: '5',
        label: <Link to="/register">注册</Link>
      }
    ])
  ];

  return (
    <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
      <div className="logo" />
      <Menu theme="light" mode="horizontal" defaultSelectedKeys={['1']} items={menuItems} />
    </Header>
  );
};

export default Navbar; 