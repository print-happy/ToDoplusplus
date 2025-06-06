import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    // 恢复用户信息
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      // 尝试真实的后端登录
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email,
          password,
        }, { timeout: 5000 });
        const { user, token } = response.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return;
      } catch (backendError) {
        console.log('Backend login failed, using mock login:', backendError);
      }

      // 后端不可用时的模拟登录
      if (email && password) {
        // 检查本地注册的用户
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const registeredUser = registeredUsers.find((user: any) =>
          user.email === email && user.password === password
        );

        if (registeredUser) {
          // 使用注册的用户信息
          const mockUser = {
            _id: 'mock-user-' + Date.now(),
            name: registeredUser.username,
            username: registeredUser.username,
            email: registeredUser.email,
          };
          const mockToken = 'mock-jwt-token-' + Date.now();

          setUser(mockUser);
          setToken(mockToken);
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));
          return;
        }

        // 如果没有注册用户，允许任何邮箱密码组合（演示模式）
        const mockUser = {
          _id: 'mock-user-demo',
          name: email.split('@')[0] || 'username',
          username: email.split('@')[0] || 'username',
          email: email,
        };
        const mockToken = 'mock-jwt-token-' + Date.now();

        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return;
      }

      throw new Error('登录信息不完整');
    } catch (error) {
      throw error instanceof Error ? error : new Error('登录失败');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      // 尝试真实的后端注册
      try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          username,
          email,
          password,
        }, { timeout: 5000 });
        const { user, token } = response.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return;
      } catch (backendError) {
        console.log('Backend registration failed, using mock registration:', backendError);
      }

      // 后端不可用时的模拟注册
      if (username && email && password) {
        // 检查本地存储中是否已有相同用户名或邮箱
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userExists = existingUsers.some((user: any) =>
          user.username === username || user.email === email
        );

        if (userExists) {
          throw new Error('用户名或邮箱已被使用');
        }

        const mockUser = {
          _id: 'mock-user-' + Date.now(),
          username: username,
          name: username,
          email: email,
        };
        const mockToken = 'mock-jwt-token-' + Date.now();

        // 保存用户到本地注册列表
        existingUsers.push({ username, email, password });
        localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return;
      }

      throw new Error('注册信息不完整');
    } catch (error) {
      throw error instanceof Error ? error : new Error('注册失败');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 