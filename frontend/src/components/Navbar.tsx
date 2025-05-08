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

  return (
    <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
      <div className="logo" />
      <Menu theme="light" mode="horizontal" defaultSelectedKeys={['1']}>
        <Menu.Item key="1">
          <Link to="/todos">待办事项</Link>
        </Menu.Item>
        <Menu.Item key="views">
          <Link to="/views">视图选项</Link>
        </Menu.Item>
        <Menu.Item key="countdown">
          <Link to="/countdown">倒计时</Link>
        </Menu.Item>
        {user ? (
          <>
            <Menu.Item key="2" style={{ marginLeft: 'auto' }}>
              <span>欢迎, {user.username}</span>
            </Menu.Item>
            <Menu.Item key="3">
              <Button type="link" onClick={handleLogout}>
                退出
              </Button>
            </Menu.Item>
          </>
        ) : (
          <>
            <Menu.Item key="4" style={{ marginLeft: 'auto' }}>
              <Link to="/login">登录</Link>
            </Menu.Item>
            <Menu.Item key="5">
              <Link to="/register">注册</Link>
            </Menu.Item>
          </>
        )}
      </Menu>
    </Header>
  );
};

export default Navbar; 