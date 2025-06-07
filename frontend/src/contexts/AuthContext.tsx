import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { clearSessionApiKeyCache, monitorApiKeySecurity } from '../utils/apiKeyManager';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (profile: any) => Promise<void>;
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
        // 🔒 用户状态恢复后进行安全监控
        setTimeout(() => monitorApiKeySecurity(), 100);
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
      // 🔧 安全用户登录：只清理会话数据，保留所有用户数据
      console.log('🔧 SECURITY: Starting safe user login cleanup');

      // 1. 清除会话级API密钥缓存
      clearSessionApiKeyCache();

      // 2. 清除之前用户的认证信息
      setUser(null);
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];

      // 3. 只清除会话相关数据，保留所有用户的持久化数据
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      console.log('🔒 Safe login cleanup completed - all user data preserved');

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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('🔒 User logged in securely via backend');
        // 🔒 登录后进行安全监控
        setTimeout(() => monitorApiKeySecurity(), 100);
        return;
      } catch (backendError) {
        console.log('Backend login failed, using mock login:', backendError);
      }

      // 🔧 后端不可用时的模拟登录（修复版）
      if (email && password) {
        console.log('🔧 Starting mock login verification for:', email);

        // 🔧 获取注册用户列表
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        console.log('📋 Found registered users:', registeredUsers.length);

        // 🔧 查找用户账户
        const registeredUser = registeredUsers.find((user: any) =>
          user.email === email || user.username === email
        );

        if (!registeredUser) {
          console.log('❌ Login failed: Account not found');
          throw new Error('账户不存在，请检查邮箱地址或先注册账户');
        }

        // 🔧 验证密码
        if (registeredUser.password !== password) {
          console.log('❌ Login failed: Incorrect password');
          throw new Error('密码错误，请重新输入');
        }

        // 🔧 登录成功：创建用户会话
        console.log('✅ Login credentials verified, creating session');

        // 使用注册时的用户ID，确保数据一致性
        const userId = registeredUser.id || `user-${email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;

        const mockUser = {
          _id: userId,
          name: registeredUser.username,
          username: registeredUser.username,
          email: registeredUser.email,
          registeredAt: registeredUser.registeredAt,
        };
        const mockToken = `token-${userId}-${Date.now()}`;

        // 🔧 更新最后登录时间
        registeredUser.lastLogin = new Date().toISOString();
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        // 🔧 设置用户会话
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;

        console.log(`✅ User logged in successfully (mock): ${email}`);
        console.log('User ID:', userId);

        // 🔒 登录后进行安全监控
        setTimeout(() => monitorApiKeySecurity(), 100);
        return;
      }

      throw new Error('登录信息不完整');
    } catch (error) {
      throw error instanceof Error ? error : new Error('登录失败');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      // 🔧 安全用户注册：只清理会话数据，保留其他用户的数据
      console.log('🔧 SECURITY: Starting safe user registration cleanup');

      // 1. 清除会话级API密钥缓存
      clearSessionApiKeyCache();

      // 2. 🔧 只清理当前会话相关数据，保留其他用户数据
      const sessionKeysToRemove = ['user', 'token']; // 只清理会话相关数据
      sessionKeysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // 3. 清除sessionStorage
      sessionStorage.clear();

      // 4. 重置当前用户状态
      setUser(null);
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];

      console.log('🔒 Safe registration cleanup completed - other users data preserved');

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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('🔒 User registered securely via backend');
        return;
      } catch (backendError) {
        console.log('Backend registration failed, using mock registration:', backendError);
      }

      // 🔧 后端不可用时的模拟注册（修复版）
      if (username && email && password) {
        console.log('🔧 Starting mock registration for:', email);

        // 🔧 检查本地存储中是否已有相同用户名或邮箱
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userExists = existingUsers.some((user: any) =>
          user.username === username || user.email === email
        );

        if (userExists) {
          console.log('❌ Registration failed: User already exists');
          throw new Error('该用户名或邮箱已被注册，请使用其他信息或直接登录');
        }

        // 🔧 创建唯一用户ID
        const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;

        // 🔧 创建完整的注册用户记录
        const newRegisteredUser = {
          id: userId,
          username: username,
          email: email,
          password: password, // 注意：实际应用中应该加密
          registeredAt: new Date().toISOString(),
          lastLogin: null,
        };

        // 🔧 创建用户会话对象
        const mockUser = {
          _id: userId,
          username: username,
          name: username,
          email: email,
          registeredAt: newRegisteredUser.registeredAt,
        };
        const mockToken = `token-${userId}-${Date.now()}`;

        // 🔧 保存用户到本地注册列表
        existingUsers.push(newRegisteredUser);
        localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
        console.log('✅ User saved to registeredUsers list');

        // 🔧 设置用户会话
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;

        console.log(`✅ Mock registration completed successfully for: ${email}`);
        console.log('User ID:', userId);

        // 🔒 注册后进行安全监控
        setTimeout(() => monitorApiKeySecurity(), 100);
        return;
      }

      throw new Error('注册信息不完整');
    } catch (error) {
      throw error instanceof Error ? error : new Error('注册失败');
    }
  };

  const updateUserProfile = async (profile: any) => {
    try {
      console.log('🔄 AuthContext: updateUserProfile called');
      console.log('📝 AuthContext: Profile data received:', profile);
      console.log('👤 AuthContext: Current user state:', user);

      // Try to update via backend first
      try {
        console.log('🌐 AuthContext: Attempting backend update...');
        const response = await axios.put('http://localhost:5000/api/auth/profile', profile, {
          timeout: 5000
        });
        const updatedUser = response.data.user;
        console.log('✅ AuthContext: Backend update successful:', updatedUser);

        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('💾 AuthContext: User state and localStorage updated via backend');
        return;
      } catch (backendError) {
        console.log('⚠️ AuthContext: Backend update failed, using local fallback');
        console.log('📊 Backend error details:', backendError);
      }

      // Fallback to local storage update
      console.log('🔄 AuthContext: Starting local storage update...');
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...profile };

      console.log('📊 AuthContext: Local update data:');
      console.log('  - Current user:', currentUser);
      console.log('  - Profile updates:', profile);
      console.log('  - Final updated user:', updatedUser);

      // Update state immediately
      console.log('🔄 AuthContext: Updating user state...');
      setUser(updatedUser);

      // Update localStorage
      console.log('💾 AuthContext: Updating localStorage...');
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Also update in registered users list if exists
      console.log('🔄 AuthContext: Updating registered users list...');
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const userIndex = registeredUsers.findIndex((u: any) =>
        u.email === currentUser?.email || u.username === currentUser?.username
      );

      if (userIndex !== -1) {
        registeredUsers[userIndex] = { ...registeredUsers[userIndex], ...profile };
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        console.log('✅ AuthContext: Updated registered users list at index:', userIndex);
      } else {
        console.log('⚠️ AuthContext: User not found in registered users list');
      }

      console.log('✅ AuthContext: Profile update completed successfully');

      // Verify the update
      const verifyUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔍 AuthContext: Verification - localStorage user:', verifyUser);

    } catch (error) {
      console.error('❌ AuthContext: Profile update error:', error);
      console.error('📊 AuthContext: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error instanceof Error ? error : new Error('更新个人资料失败');
    }
  };

  const logout = () => {
    console.log(`🚪 Logging out user: ${user?.email || user?.username || 'unknown'}`);

    // 🔒 安全清理：清除会话级API密钥缓存
    clearSessionApiKeyCache();

    // 清理当前用户的认证信息
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];

    // 注意：我们保留用户的数据，包括todos和API密钥存储
    // 但会话级缓存已被清除，确保安全隔离
    // - 用户专属的todos数据保留在 localStorage 中，键名为 `todos_${userId}`
    // - 用户专属的API密钥保留在 localStorage 中，键名为 `siliconflow_api_key_${userId}`
    // - 会话级API密钥缓存已清除，防止跨用户访问

    console.log('🔒 User logged out securely, session cache cleared, persistent data preserved');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}; 