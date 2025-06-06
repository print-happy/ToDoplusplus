/**
 * Secure API Key Management Utility
 * Handles storage, retrieval, and validation of SiliconFlow API keys
 * API keys are stored per user to ensure privacy and security
 */

const API_KEY_STORAGE_PREFIX = 'siliconflow_api_key_';

// 🔒 会话级API密钥缓存（内存中存储，用户切换时自动清除）
let sessionApiKeyCache: {
  userId: string | null;
  apiKey: string | null;
} = {
  userId: null,
  apiKey: null
};

// 🔒 API密钥访问日志（仅开发环境）
interface ApiKeyAccessLog {
  timestamp: string;
  userId: string | null;
  action: 'GET' | 'STORE' | 'REMOVE' | 'CLEAR';
  success: boolean;
  securityNote?: string;
}

let apiKeyAccessLogs: ApiKeyAccessLog[] = [];

/**
 * 🔒 记录API密钥访问日志
 */
const logApiKeyAccess = (action: ApiKeyAccessLog['action'], success: boolean, securityNote?: string): void => {
  if (process.env.NODE_ENV !== 'development') return;

  const log: ApiKeyAccessLog = {
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    action,
    success,
    securityNote
  };

  apiKeyAccessLogs.push(log);

  // 保持最近100条日志
  if (apiKeyAccessLogs.length > 100) {
    apiKeyAccessLogs = apiKeyAccessLogs.slice(-100);
  }

  console.log(`🔒 API Key Access Log:`, log);
};

/**
 * Gets current user ID for API key management
 */
const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user._id || user.email || null;
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  return null;
};

/**
 * Gets user-specific API key storage key
 */
const getUserApiKeyStorageKey = (): string => {
  const userId = getCurrentUserId();
  if (userId) {
    return `${API_KEY_STORAGE_PREFIX}${userId}`;
  }

  // Fallback to anonymous key (for backward compatibility)
  return `${API_KEY_STORAGE_PREFIX}anonymous`;
};

/**
 * 🔒 清除会话级API密钥缓存（用户切换时调用）
 */
export const clearSessionApiKeyCache = (): void => {
  console.log('🔒 Clearing session API key cache for security');
  logApiKeyAccess('CLEAR', true, 'Session cache cleared for security');
  sessionApiKeyCache = {
    userId: null,
    apiKey: null
  };
};

/**
 * 🔒 验证会话级API密钥缓存是否有效
 */
const isSessionCacheValid = (): boolean => {
  const currentUserId = getCurrentUserId();
  return sessionApiKeyCache.userId === currentUserId &&
         sessionApiKeyCache.apiKey !== null &&
         currentUserId !== null;
};

export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates SiliconFlow API key format
 */
export const validateApiKeyFormat = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // SiliconFlow API key format: sk- followed by at least 48 characters
  const apiKeyPattern = /^sk-[a-zA-Z0-9]{48,}$/;
  return apiKeyPattern.test(apiKey.trim());
};

/**
 * 🔒 安全存储API密钥（会话级隔离）
 * Securely stores API key with session-level isolation
 * Note: In production, consider using more robust encryption
 */
export const storeApiKey = (apiKey: string): boolean => {
  try {
    const currentUserId = getCurrentUserId();

    // 🔒 安全检查：如果没有用户登录，拒绝存储
    if (!currentUserId) {
      console.error('🔒 Cannot store API key: No user logged in');
      return false;
    }

    if (!validateApiKeyFormat(apiKey)) {
      throw new Error('Invalid API key format');
    }

    // Basic encoding (in production, use proper encryption)
    const encodedKey = btoa(apiKey.trim());
    const userApiKeyStorageKey = getUserApiKeyStorageKey();
    localStorage.setItem(userApiKeyStorageKey, encodedKey);

    // 🔒 更新会话缓存
    sessionApiKeyCache = {
      userId: currentUserId,
      apiKey: apiKey.trim()
    };

    console.log(`🔒 API key stored securely for user: ${currentUserId}`);
    logApiKeyAccess('STORE', true, `API key stored for user: ${currentUserId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to store API key:', error);
    logApiKeyAccess('STORE', false, `Failed to store API key: ${error}`);
    clearSessionApiKeyCache();
    return false;
  }
};

/**
 * 🔒 安全获取API密钥（会话级隔离）
 * Retrieves and decodes API key with session-level isolation
 */
export const getApiKey = (): string | null => {
  try {
    const currentUserId = getCurrentUserId();

    // 🔒 安全检查：如果没有用户登录，清除缓存并返回null
    if (!currentUserId) {
      clearSessionApiKeyCache();
      console.log('🔒 No user logged in, API key access denied');
      logApiKeyAccess('GET', false, 'No user logged in');
      return null;
    }

    // 🔒 会话级缓存检查：如果缓存有效且属于当前用户，直接返回
    if (isSessionCacheValid()) {
      console.log('🔒 Using cached API key for current session');
      return sessionApiKeyCache.apiKey;
    }

    // 🔒 清除无效缓存
    clearSessionApiKeyCache();

    const userApiKeyStorageKey = getUserApiKeyStorageKey();
    const encodedKey = localStorage.getItem(userApiKeyStorageKey);

    if (!encodedKey) {
      // Try to migrate from old global key (backward compatibility)
      const oldKey = localStorage.getItem('siliconflow_api_key');
      if (oldKey) {
        console.log('🔄 Migrating API key to user-specific storage...');
        try {
          const decodedOldKey = atob(oldKey);
          if (validateApiKeyFormat(decodedOldKey)) {
            // Store in new user-specific location
            localStorage.setItem(userApiKeyStorageKey, oldKey);
            // Remove old global key
            localStorage.removeItem('siliconflow_api_key');

            // 🔒 更新会话缓存
            sessionApiKeyCache = {
              userId: currentUserId,
              apiKey: decodedOldKey
            };

            console.log('✅ API key migrated successfully');
            return decodedOldKey;
          }
        } catch (migrationError) {
          console.error('❌ Failed to migrate API key:', migrationError);
        }
      }
      return null;
    }

    // Decode the stored key
    const decodedKey = atob(encodedKey);

    // Validate the decoded key
    if (!validateApiKeyFormat(decodedKey)) {
      console.warn('⚠️ Stored API key has invalid format, removing...');
      removeApiKey();
      return null;
    }

    // 🔒 更新会话缓存
    sessionApiKeyCache = {
      userId: currentUserId,
      apiKey: decodedKey
    };

    console.log('🔒 API key loaded and cached for current user session');
    logApiKeyAccess('GET', true, `API key retrieved for user: ${currentUserId}`);
    return decodedKey;
  } catch (error) {
    console.error('❌ Failed to retrieve API key:', error);
    logApiKeyAccess('GET', false, `Failed to retrieve API key: ${error}`);
    // 🔒 清除缓存并移除损坏的密钥
    clearSessionApiKeyCache();
    removeApiKey();
    return null;
  }
};

/**
 * 🔒 安全删除API密钥（会话级隔离）
 * Removes API key with session-level isolation
 */
export const removeApiKey = (): void => {
  try {
    const currentUserId = getCurrentUserId();
    const userApiKeyStorageKey = getUserApiKeyStorageKey();

    // 🔒 清除localStorage中的密钥
    localStorage.removeItem(userApiKeyStorageKey);

    // 🔒 清除会话缓存
    clearSessionApiKeyCache();

    console.log(`🔒 API key securely removed for user: ${currentUserId || 'anonymous'}`);
    logApiKeyAccess('REMOVE', true, `API key removed for user: ${currentUserId || 'anonymous'}`);
  } catch (error) {
    console.error('❌ Failed to remove API key:', error);
    logApiKeyAccess('REMOVE', false, `Failed to remove API key: ${error}`);
    // 确保缓存被清除
    clearSessionApiKeyCache();
  }
};

/**
 * Checks if API key is configured
 */
export const hasApiKey = (): boolean => {
  return getApiKey() !== null;
};

/**
 * Tests API key validity by making a minimal request to SiliconFlow API
 */
export const testApiKey = async (apiKey?: string): Promise<ApiKeyValidationResult> => {
  const keyToTest = apiKey || getApiKey();
  
  if (!keyToTest) {
    return {
      isValid: false,
      error: 'No API key provided'
    };
  }
  
  if (!validateApiKeyFormat(keyToTest)) {
    return {
      isValid: false,
      error: 'Invalid API key format'
    };
  }
  
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToTest}`,
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
    
    if (response.status === 200) {
      return { isValid: true };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: 'API key is invalid or expired'
      };
    } else if (response.status === 429) {
      return {
        isValid: true, // Key is valid but rate limited
        error: 'Rate limit exceeded, but key is valid'
      };
    } else {
      // For other status codes, assume key might be valid
      return { isValid: true };
    }
  } catch (error) {
    console.error('API key test failed:', error);
    return {
      isValid: false,
      error: 'Network error or API unavailable'
    };
  }
};

/**
 * 🔒 安全获取API密钥（带用户提示）
 * Gets API key with user prompt if not configured - with enhanced security
 */
export const getApiKeyWithPrompt = (): string | null => {
  const currentUserId = getCurrentUserId();

  // 🔒 严格安全检查：必须有用户登录
  if (!currentUserId) {
    console.error('🔒 SECURITY: Cannot access API key - no user logged in');
    return null;
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn(`⚠️ No API key configured for user: ${currentUserId}. Please configure your SiliconFlow API key in settings.`);
    return null;
  }

  // 🔒 额外验证：确保返回的API密钥属于当前用户
  if (sessionApiKeyCache.userId !== currentUserId) {
    console.error('🔒 SECURITY BREACH DETECTED: API key user mismatch!');
    clearSessionApiKeyCache();
    return null;
  }

  console.log(`🔒 API key securely accessed for user: ${currentUserId}`);
  return apiKey;
};

/**
 * Sanitizes API key for logging (shows only first and last few characters)
 */
export const sanitizeApiKeyForLogging = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 10) {
    return '[INVALID_KEY]';
  }

  const start = apiKey.substring(0, 6);
  const end = apiKey.substring(apiKey.length - 4);
  const middle = '*'.repeat(Math.max(0, apiKey.length - 10));

  return `${start}${middle}${end}`;
};

/**
 * Development tool: Get all user API keys for debugging
 * Only available in development mode
 */
export const getAllUserApiKeys = (): Record<string, string> => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ getAllUserApiKeys is only available in development mode');
    return {};
  }

  const allKeys = Object.keys(localStorage).filter(key =>
    key.startsWith(API_KEY_STORAGE_PREFIX)
  );

  const userApiKeys: Record<string, string> = {};

  allKeys.forEach(key => {
    try {
      const userId = key.replace(API_KEY_STORAGE_PREFIX, '');
      const encodedKey = localStorage.getItem(key);
      if (encodedKey) {
        const decodedKey = atob(encodedKey);
        userApiKeys[userId] = sanitizeApiKeyForLogging(decodedKey);
      }
    } catch (error) {
      console.error(`Error decoding API key for ${key}:`, error);
    }
  });

  return userApiKeys;
};

/**
 * Development tool: Clear all API keys
 * Only available in development mode
 */
export const clearAllApiKeys = (): void => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ clearAllApiKeys is only available in development mode');
    return;
  }

  const allKeys = Object.keys(localStorage).filter(key =>
    key.startsWith(API_KEY_STORAGE_PREFIX)
  );

  allKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // 🔒 清除会话缓存
  clearSessionApiKeyCache();

  console.log(`🧹 Cleared ${allKeys.length} API keys from storage and session cache`);
};

/**
 * 🔒 获取API密钥访问日志（仅开发环境）
 * Get API key access logs for security auditing
 */
export const getApiKeyAccessLogs = (): ApiKeyAccessLog[] => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ getApiKeyAccessLogs is only available in development mode');
    return [];
  }

  return [...apiKeyAccessLogs];
};

/**
 * 🔒 清除API密钥访问日志（仅开发环境）
 * Clear API key access logs
 */
export const clearApiKeyAccessLogs = (): void => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ clearApiKeyAccessLogs is only available in development mode');
    return;
  }

  apiKeyAccessLogs = [];
  console.log('🧹 API key access logs cleared');
};

/**
 * 🔒 实时安全监控：检查API密钥安全状态
 * Real-time security monitoring for API key security
 */
export const monitorApiKeySecurity = (): void => {
  if (process.env.NODE_ENV !== 'development') return;

  const currentUserId = getCurrentUserId();
  const securityIssues: string[] = [];

  // 检查1：用户登录状态与缓存一致性
  if (!currentUserId && sessionApiKeyCache.apiKey !== null) {
    securityIssues.push('🚨 CRITICAL: Session cache contains API key but no user logged in');
  }

  // 检查2：缓存用户ID与当前用户一致性
  if (currentUserId && sessionApiKeyCache.userId && sessionApiKeyCache.userId !== currentUserId) {
    securityIssues.push('🚨 CRITICAL: Session cache user ID mismatch');
  }

  // 检查3：localStorage中是否存在旧的全局API密钥
  const oldGlobalKey = localStorage.getItem('siliconflow_api_key');
  if (oldGlobalKey) {
    securityIssues.push('⚠️ WARNING: Old global API key found in localStorage');
  }

  // 检查4：检查是否有多个用户的API密钥
  const allUserKeys = Object.keys(localStorage).filter(key =>
    key.startsWith(API_KEY_STORAGE_PREFIX)
  );
  if (allUserKeys.length > 3) {
    securityIssues.push(`ℹ️ INFO: Multiple user API keys detected (${allUserKeys.length} users)`);
  }

  if (securityIssues.length > 0) {
    console.warn('🔒 Security Monitor Alert:', securityIssues);
    logApiKeyAccess('GET', false, `Security issues detected: ${securityIssues.join(', ')}`);
  } else {
    console.log('🔒 Security Monitor: All checks passed');
  }
};

/**
 * 🔒 安全测试工具：验证API密钥隔离
 * Security test tool: Verify API key isolation
 */
export const testApiKeyIsolation = (): {
  currentUser: string | null;
  sessionCache: any;
  allStoredKeys: Record<string, string>;
  securityStatus: string;
} => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ testApiKeyIsolation is only available in development mode');
    return {
      currentUser: null,
      sessionCache: null,
      allStoredKeys: {},
      securityStatus: 'Test not available in production'
    };
  }

  const currentUser = getCurrentUserId();
  const allStoredKeys = getAllUserApiKeys();

  // 检查会话缓存状态
  const sessionCacheStatus = {
    userId: sessionApiKeyCache.userId,
    hasApiKey: sessionApiKeyCache.apiKey !== null,
    isValid: isSessionCacheValid()
  };

  // 安全状态评估
  let securityStatus = '✅ SECURE';

  if (!currentUser) {
    if (sessionApiKeyCache.apiKey !== null) {
      securityStatus = '🚨 SECURITY BREACH: Session cache contains API key but no user logged in';
    }
  } else {
    if (sessionApiKeyCache.userId !== currentUser) {
      securityStatus = '🚨 SECURITY BREACH: Session cache user ID mismatch';
    }
  }

  const result = {
    currentUser,
    sessionCache: sessionCacheStatus,
    allStoredKeys,
    securityStatus
  };

  console.log('🔒 API Key Isolation Test Results:', result);
  return result;
};
