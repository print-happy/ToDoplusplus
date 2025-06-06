import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { storeApiKey, getApiKey, removeApiKey, testApiKey as testApiKeyUtil, validateApiKeyFormat } from '../utils/apiKeyManager';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // 🔒 安全加载：使用用户专属的API密钥管理器
    const savedKey = getApiKey();
    if (savedKey) {
      setApiKey(savedKey);
      console.log('✅ Loaded API key for current user (secure)');
    } else {
      console.log('ℹ️ No API key found for current user');
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      message.error('请输入API密钥');
      return;
    }

    if (!validateApiKeyFormat(apiKey)) {
      message.error('API密钥格式不正确。应该以"sk-"开头，后跟至少48个字符');
      return;
    }

    setIsValidating(true);

    try {
      // 🔒 安全验证：使用安全的API密钥测试工具
      const isValid = await testApiKeyUtil(apiKey);

      if (isValid) {
        // 🔒 安全存储：使用用户专属的API密钥管理器
        const success = storeApiKey(apiKey);

        if (success) {
          message.success('API密钥已保存并验证成功');
          console.log('🔒 API key securely stored for current user');
          onClose();
        } else {
          message.error('API密钥保存失败');
        }
      } else {
        message.error('API密钥验证失败，请检查密钥是否正确');
      }
    } catch (error) {
      console.error('API key validation error:', error);
      message.error('API密钥验证失败，请检查网络连接和密钥');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    // 🔒 安全删除：使用用户专属的API密钥管理器
    removeApiKey();
    setApiKey('');
    message.success('API密钥已删除');
    console.log('🔒 API key securely removed for current user');
  };

  if (!isOpen) return null;

  return (
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
        maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>设置</h2>
          <button
            onClick={onClose}
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

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
            SiliconFlow API 密钥配置
          </h3>
          
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '14px',
            color: '#374151'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>如何获取API密钥：</p>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>访问 <a href="https://siliconflow.cn" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>SiliconFlow官网</a></li>
              <li>注册账户并登录</li>
              <li>在控制台中创建新的API密钥</li>
              <li>复制密钥并粘贴到下方输入框</li>
            </ol>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入您的SiliconFlow API密钥 (sk-...)"
              style={{
                width: 'calc(100% - 8px)',
                maxWidth: '100%',
                padding: '12px 40px 12px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                {showApiKey ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={handleSaveApiKey}
              disabled={isValidating}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: isValidating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isValidating ? 0.6 : 1
              }}
            >
              {isValidating ? '验证中...' : '保存并验证'}
            </button>
            
            {apiKey && (
              <button
                onClick={handleRemoveApiKey}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                删除密钥
              </button>
            )}
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '8px', 
          padding: '12px',
          fontSize: '14px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#92400e' }}>安全提示：</p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
            <li>API密钥将安全存储在您的浏览器本地</li>
            <li>请勿与他人分享您的API密钥</li>
            <li>如果怀疑密钥泄露，请立即在SiliconFlow控制台重新生成</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
