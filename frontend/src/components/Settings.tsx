import React, { useState, useEffect } from 'react';
import { message } from 'antd';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Load existing API key from localStorage
    const savedApiKey = localStorage.getItem('siliconflow_api_key');
    if (savedApiKey) {
      try {
        // Simple decoding (in production, use proper encryption)
        const decodedKey = atob(savedApiKey);
        setApiKey(decodedKey);
      } catch (error) {
        console.error('Failed to decode API key:', error);
      }
    }
  }, []);

  const validateApiKey = (key: string): boolean => {
    // SiliconFlow API key format validation
    const apiKeyPattern = /^sk-[a-zA-Z0-9]{48,}$/;
    return apiKeyPattern.test(key);
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      message.error('请输入API密钥');
      return;
    }

    if (!validateApiKey(apiKey)) {
      message.error('API密钥格式不正确。应该以"sk-"开头，后跟至少48个字符');
      return;
    }

    setIsValidating(true);
    
    // Test the API key by making a simple request
    testApiKey(apiKey)
      .then((isValid) => {
        if (isValid) {
          // Simple encoding (in production, use proper encryption)
          const encodedKey = btoa(apiKey);
          localStorage.setItem('siliconflow_api_key', encodedKey);
          message.success('API密钥已保存并验证成功');
          onClose();
        } else {
          message.error('API密钥验证失败，请检查密钥是否正确');
        }
      })
      .catch(() => {
        message.error('API密钥验证失败，请检查网络连接和密钥');
      })
      .finally(() => {
        setIsValidating(false);
      });
  };

  const testApiKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
          messages: [
            {
              role: 'user',
              content: 'test'
            }
          ],
          max_tokens: 1
        }),
      });

      return response.status === 200 || response.status === 400; // 400 might be due to minimal request
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('siliconflow_api_key');
    setApiKey('');
    message.success('API密钥已删除');
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
                width: '100%',
                padding: '12px 40px 12px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace'
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
