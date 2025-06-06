import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { message } from 'antd';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔧 输入验证
    if (!username || !password) {
      message.error('请输入邮箱/用户名和密码');
      return;
    }

    setLoading(true);
    console.log('🔧 Attempting login for:', username);

    try {
      await login(username, password);
      message.success('登录成功！欢迎回来');
      console.log('✅ Login successful, navigating to todos');
      navigate('/todos');
    } catch (error: any) {
      // 🔧 详细错误处理：显示具体的错误信息
      console.error('❌ Login failed:', error);

      const errorMessage = error?.message || '登录失败，请重试';

      // 🔧 根据错误类型显示不同的提示
      if (errorMessage.includes('账户不存在')) {
        message.error({
          content: '账户不存在，请检查邮箱地址或先注册账户',
          duration: 4,
        });
      } else if (errorMessage.includes('密码错误')) {
        message.error({
          content: '密码错误，请重新输入',
          duration: 3,
        });
      } else if (errorMessage.includes('网络')) {
        message.error({
          content: '网络连接失败，请检查网络后重试',
          duration: 4,
        });
      } else {
        message.error({
          content: errorMessage,
          duration: 4,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      backgroundColor: '#f8fafc',
      overflowX: 'hidden',
      fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif'
    }}>
      <div style={{ display: 'flex', height: '100%', flexDirection: 'column', flexGrow: 1 }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid #e7eef3',
          padding: '12px 40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#0d151b' }}>
            <div style={{ width: '16px', height: '16px' }}>
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 style={{
              color: '#0d151b',
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: '1.2',
              letterSpacing: '-0.015em',
              margin: 0
            }}>ToDo++</h2>
          </div>
        </header>
        <div style={{ padding: '20px 160px', display: 'flex', flex: 1, justifyContent: 'center' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '512px',
            maxWidth: '512px',
            padding: '20px 0',
            flex: 1
          }}>
            <h2 style={{
              color: '#0d151b',
              fontSize: '28px',
              fontWeight: 'bold',
              lineHeight: '1.2',
              padding: '20px 16px 12px',
              textAlign: 'center',
              margin: 0
            }}>Welcome back</h2>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex',
                maxWidth: '480px',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                gap: '16px',
                padding: '12px 16px'
              }}>
                <label style={{ display: 'flex', flexDirection: 'column', minWidth: '160px', flex: 1 }}>
                  <p style={{
                    color: '#0d151b',
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '1.5',
                    paddingBottom: '8px',
                    margin: 0
                  }}>Username</p>
                  <input
                    placeholder="Enter your username"
                    style={{
                      display: 'flex',
                      width: '100%',
                      minWidth: 0,
                      flex: 1,
                      resize: 'none',
                      overflow: 'hidden',
                      borderRadius: '12px',
                      color: '#0d151b',
                      border: '1px solid #cfdce7',
                      backgroundColor: '#f8fafc',
                      height: '56px',
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'normal',
                      lineHeight: '1.5',
                      outline: 'none'
                    }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </label>
              </div>
              <div style={{
                display: 'flex',
                maxWidth: '480px',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                gap: '16px',
                padding: '12px 16px'
              }}>
                <label style={{ display: 'flex', flexDirection: 'column', minWidth: '160px', flex: 1 }}>
                  <p style={{
                    color: '#0d151b',
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '1.5',
                    paddingBottom: '8px',
                    margin: 0
                  }}>Password</p>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    style={{
                      display: 'flex',
                      width: '100%',
                      minWidth: 0,
                      flex: 1,
                      resize: 'none',
                      overflow: 'hidden',
                      borderRadius: '12px',
                      color: '#0d151b',
                      border: '1px solid #cfdce7',
                      backgroundColor: '#f8fafc',
                      height: '56px',
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'normal',
                      lineHeight: '1.5',
                      outline: 'none'
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', padding: '12px 16px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    minWidth: '84px',
                    maxWidth: '480px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '25px',
                    height: '40px',
                    padding: '0 16px',
                    flex: 1,
                    backgroundColor: '#1284e7',
                    color: '#f8fafc',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    lineHeight: '1.5',
                    letterSpacing: '0.015em',
                    opacity: loading ? 0.5 : 1,
                    border: 'none'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loading ? '登录中...' : 'Login'}
                  </span>
                </button>
              </div>
            </form>
            <p style={{
              color: '#4c759a',
              fontSize: '14px',
              fontWeight: 'normal',
              lineHeight: '1.5',
              paddingBottom: '12px',
              paddingTop: '4px',
              padding: '4px 16px 12px',
              textAlign: 'center',
              textDecoration: 'underline',
              margin: 0
            }}>
              <Link
                to="/register"
                style={{
                  color: '#4c759a',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1284e7'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4c759a'}
              >
                Don't have an account? Register
              </Link>
            </p>
            <p style={{
              color: '#4c759a',
              fontSize: '14px',
              fontWeight: 'normal',
              lineHeight: '1.5',
              paddingBottom: '12px',
              paddingTop: '4px',
              padding: '4px 16px 12px',
              textAlign: 'center',
              textDecoration: 'underline',
              margin: 0,
              cursor: 'pointer'
            }}>
              Forgot password?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;