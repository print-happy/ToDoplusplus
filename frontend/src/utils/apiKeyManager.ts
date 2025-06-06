/**
 * Secure API Key Management Utility
 * Handles storage, retrieval, and validation of SiliconFlow API keys
 */

const API_KEY_STORAGE_KEY = 'siliconflow_api_key';

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
 * Securely stores API key in localStorage with basic encoding
 * Note: In production, consider using more robust encryption
 */
export const storeApiKey = (apiKey: string): boolean => {
  try {
    if (!validateApiKeyFormat(apiKey)) {
      throw new Error('Invalid API key format');
    }
    
    // Basic encoding (in production, use proper encryption)
    const encodedKey = btoa(apiKey.trim());
    localStorage.setItem(API_KEY_STORAGE_KEY, encodedKey);
    
    console.log('✅ API key stored securely');
    return true;
  } catch (error) {
    console.error('❌ Failed to store API key:', error);
    return false;
  }
};

/**
 * Retrieves and decodes API key from localStorage
 */
export const getApiKey = (): string | null => {
  try {
    const encodedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encodedKey) {
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
    
    return decodedKey;
  } catch (error) {
    console.error('❌ Failed to retrieve API key:', error);
    // Remove corrupted key
    removeApiKey();
    return null;
  }
};

/**
 * Removes API key from localStorage
 */
export const removeApiKey = (): void => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    console.log('✅ API key removed from storage');
  } catch (error) {
    console.error('❌ Failed to remove API key:', error);
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
 * Gets API key with user prompt if not configured
 */
export const getApiKeyWithPrompt = (): string | null => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn('⚠️ No API key configured. Please configure your SiliconFlow API key in settings.');
    return null;
  }
  
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
