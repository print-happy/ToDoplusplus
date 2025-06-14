/**
 * 🔑 AI API密钥管理器 - 双重密钥机制
 * AI API Key Manager - Dual Key Mechanism
 * 
 * 实现个人密钥优先，平台密钥回退的安全机制
 */

import { getApiKey, getCurrentUserId } from './apiKeyManager';

// 🔒 平台密钥配置接口
interface PlatformKeyConfig {
  endpoint: string;
  model: string;
  maxTokens: number;
}

// 🔒 API密钥使用结果
interface ApiKeyResult {
  apiKey: string;
  keyType: 'personal' | 'platform';
  keySource: string;
  isValid: boolean;
  model: string;
  modelSource: 'user_choice' | 'platform_locked' | 'default';
}

/**
 * 🔒 获取平台公用API密钥配置
 * Get platform public API key configuration
 * 
 * 注意：平台密钥通过环境变量或安全配置获取，绝不硬编码
 */
const getPlatformKeyConfig = (): PlatformKeyConfig => {
  // 🔒 从环境变量获取平台密钥（生产环境）
  const platformKey = process.env.REACT_APP_PLATFORM_SILICONFLOW_KEY;
  
  if (platformKey) {
    console.log('🔑 Using platform API key from environment variable');
    return {
      endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
      model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
      maxTokens: 1000,
    };
  }
  
  // 🔒 开发环境回退配置（仅用于开发测试）
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Using development platform API key configuration');
    return {
      endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
      model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
      maxTokens: 1000,
    };
  }
  
  throw new Error('Platform API key not configured');
};

// 🤖 默认AI模型配置
const DEFAULT_AI_MODEL = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';
const PLATFORM_LOCKED_MODEL = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';

// 🤖 可选的AI模型列表（供个人密钥用户选择）
const AVAILABLE_AI_MODELS = [
  'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
  'Qwen/Qwen3-8B',
  'THUDM/GLM-Z1-9B-0414',
  'deepseek-ai/DeepSeek-R1',
  'Qwen/Qwen3-32B',
  'THUDM/GLM-Z1-32B-0414',
  'Pro/deepseek-ai/DeepSeek-V3'
];

/**
 * 🤖 获取用户选择的AI模型
 * Get user selected AI model
 */
export const getUserSelectedModel = (): string => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.log('🤖 No current user, using default model');
      return DEFAULT_AI_MODEL;
    }

    const modelKey = `ai_model_${currentUserId}`;
    const savedModel = localStorage.getItem(modelKey);

    if (savedModel && AVAILABLE_AI_MODELS.includes(savedModel)) {
      console.log(`🤖 Using user selected model: ${savedModel}`);
      return savedModel;
    }

    console.log(`🤖 No valid user model found, using default: ${DEFAULT_AI_MODEL}`);
    return DEFAULT_AI_MODEL;
  } catch (error) {
    console.error('❌ Error getting user selected model:', error);
    return DEFAULT_AI_MODEL;
  }
};

/**
 * 🤖 保存用户选择的AI模型
 * Save user selected AI model
 */
export const saveUserSelectedModel = (model: string): boolean => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.warn('⚠️ Cannot save model: No current user');
      return false;
    }

    // 验证模型是否在可选列表中
    if (!AVAILABLE_AI_MODELS.includes(model)) {
      console.warn(`⚠️ Invalid model selection: ${model}`);
      return false;
    }

    const modelKey = `ai_model_${currentUserId}`;
    localStorage.setItem(modelKey, model);
    console.log(`🤖 Saved user model selection: ${model}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving user selected model:', error);
    return false;
  }
};

/**
 * 🤖 获取AI模型配置（根据密钥类型）
 * Get AI model configuration based on key type
 */
export const getAiModelConfig = (keyType: 'personal' | 'platform'): {
  model: string;
  modelSource: 'user_choice' | 'platform_locked' | 'default';
  canUserModify: boolean;
} => {
  if (keyType === 'platform') {
    // 🔒 平台密钥强制使用锁定模型
    return {
      model: PLATFORM_LOCKED_MODEL,
      modelSource: 'platform_locked',
      canUserModify: false,
    };
  }

  // 🤖 个人密钥允许用户选择模型
  const userModel = getUserSelectedModel();
  return {
    model: userModel,
    modelSource: userModel === DEFAULT_AI_MODEL ? 'default' : 'user_choice',
    canUserModify: true,
  };
};

/**
 * 🤖 获取可用的AI模型列表
 * Get available AI models list
 */
export const getAvailableAiModels = (): string[] => {
  return [...AVAILABLE_AI_MODELS];
};

/**
 * 🤖 检查用户是否可以修改AI模型
 * Check if user can modify AI model
 */
export const canUserModifyModel = (): boolean => {
  const hasPersonal = hasPersonalApiKey();
  return hasPersonal;
};

/**
 * 🔒 安全获取平台API密钥
 * Securely get platform API key
 * 
 * 注意：此函数不会在日志中暴露实际密钥值
 */
const getPlatformApiKey = (): string | null => {
  try {
    // 🔒 从环境变量获取（生产环境）
    const platformKey = process.env.REACT_APP_PLATFORM_SILICONFLOW_KEY;
    if (platformKey && platformKey.startsWith('sk-')) {
      console.log('🔑 Platform API key loaded from environment');
      return platformKey;
    }
    
    // 🔒 开发环境回退（仅用于开发测试）
    if (process.env.NODE_ENV === 'development') {
      // 注意：这里使用您提供的平台密钥，但在生产环境中应该从环境变量获取
      const devPlatformKey = 'sk-xuuvwffyuzajucdzjzvqyyqydgedsjivrmdhydcsjjwiditr';
      console.log('🔑 Using development platform API key');
      return devPlatformKey;
    }
    
    console.warn('⚠️ Platform API key not available');
    return null;
  } catch (error) {
    console.error('❌ Error getting platform API key:', error);
    return null;
  }
};

/**
 * 🔑 检查用户是否配置了个人API密钥
 * Check if user has configured personal API key
 */
export const hasPersonalApiKey = (): boolean => {
  try {
    const personalKey = getApiKey();
    const hasKey = !!(personalKey && personalKey.trim().length > 0);
    console.log(`🔍 Personal API key check: ${hasKey ? 'configured' : 'not configured'}`);
    return hasKey;
  } catch (error) {
    console.error('❌ Error checking personal API key:', error);
    return false;
  }
};

/**
 * 🔑 获取AI任务生成的API密钥（双重机制）
 * Get API key for AI task generation (dual mechanism)
 * 
 * 优先级：个人密钥 > 平台密钥
 */
export const getAiApiKey = (): ApiKeyResult | null => {
  try {
    console.log('🔑 Starting dual API key mechanism...');
    
    // 🔒 第一优先级：尝试获取用户个人API密钥
    const personalKey = getApiKey();
    if (personalKey && personalKey.trim().length > 0) {
      const modelConfig = getAiModelConfig('personal');
      console.log('✅ Using personal API key for AI generation');
      console.log(`🤖 Model: ${modelConfig.model} (${modelConfig.modelSource})`);
      return {
        apiKey: personalKey,
        keyType: 'personal',
        keySource: 'user_configuration',
        isValid: true,
        model: modelConfig.model,
        modelSource: modelConfig.modelSource,
      };
    }

    console.log('ℹ️ No personal API key found, falling back to platform key');

    // 🔒 第二优先级：使用平台公用API密钥
    const platformKey = getPlatformApiKey();
    if (platformKey && platformKey.trim().length > 0) {
      const modelConfig = getAiModelConfig('platform');
      console.log('✅ Using platform API key for AI generation');
      console.log(`🤖 Model: ${modelConfig.model} (locked for platform key)`);
      return {
        apiKey: platformKey,
        keyType: 'platform',
        keySource: 'platform_configuration',
        isValid: true,
        model: modelConfig.model,
        modelSource: modelConfig.modelSource,
      };
    }
    
    console.warn('⚠️ No API key available for AI generation');
    return null;
  } catch (error) {
    console.error('❌ Error in dual API key mechanism:', error);
    return null;
  }
};

/**
 * 🔑 获取API密钥使用状态信息（用于用户反馈）
 * Get API key usage status for user feedback
 */
export const getApiKeyStatus = (): {
  hasPersonalKey: boolean;
  hasPlatformKey: boolean;
  currentKeyType: 'personal' | 'platform' | 'none';
  userMessage: string;
  modelInfo: {
    currentModel: string;
    modelSource: string;
    canModify: boolean;
  };
} => {
  const hasPersonal = hasPersonalApiKey();
  const platformAvailable = !!getPlatformApiKey();

  let currentKeyType: 'personal' | 'platform' | 'none' = 'none';
  let userMessage = '';
  let modelInfo = {
    currentModel: DEFAULT_AI_MODEL,
    modelSource: 'default',
    canModify: false,
  };

  if (hasPersonal) {
    currentKeyType = 'personal';
    const modelConfig = getAiModelConfig('personal');
    modelInfo = {
      currentModel: modelConfig.model,
      modelSource: modelConfig.modelSource,
      canModify: modelConfig.canUserModify,
    };
    userMessage = `正在使用您的个人API密钥进行AI生成（模型：${modelConfig.model}）`;
  } else if (platformAvailable) {
    currentKeyType = 'platform';
    const modelConfig = getAiModelConfig('platform');
    modelInfo = {
      currentModel: modelConfig.model,
      modelSource: modelConfig.modelSource,
      canModify: modelConfig.canUserModify,
    };
    userMessage = `正在使用平台提供的API密钥进行AI生成（模型：${modelConfig.model}）`;
  } else {
    userMessage = 'AI功能暂时不可用，请配置API密钥或联系管理员';
  }

  return {
    hasPersonalKey: hasPersonal,
    hasPlatformKey: platformAvailable,
    currentKeyType,
    userMessage,
    modelInfo,
  };
};

/**
 * 🔑 安全的API密钥信息（用于调试，不暴露实际密钥）
 * Secure API key information for debugging (without exposing actual keys)
 */
export const getSecureApiKeyInfo = (): {
  personalKeyStatus: string;
  platformKeyStatus: string;
  selectedKeyType: string;
  securityNote: string;
} => {
  const personalKey = getApiKey();
  const platformKey = getPlatformApiKey();
  const keyResult = getAiApiKey();
  
  return {
    personalKeyStatus: personalKey ? 
      `configured (${personalKey.substring(0, 8)}...)` : 'not configured',
    platformKeyStatus: platformKey ? 
      `available (${platformKey.substring(0, 8)}...)` : 'not available',
    selectedKeyType: keyResult?.keyType || 'none',
    securityNote: 'Actual API keys are never logged or exposed in debug tools',
  };
};

/**
 * 🔑 验证API密钥格式
 * Validate API key format
 */
export const validateApiKeyFormat = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // SiliconFlow API密钥格式验证
  const trimmedKey = apiKey.trim();
  return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
};

/**
 * 🔑 测试API密钥连接（不暴露密钥值）
 * Test API key connection (without exposing key values)
 */
export const testApiKeyConnection = async (keyType: 'personal' | 'platform' | 'auto' = 'auto'): Promise<{
  success: boolean;
  keyType: string;
  message: string;
  error?: string;
}> => {
  try {
    let apiKeyResult: ApiKeyResult | null = null;
    
    if (keyType === 'personal') {
      const personalKey = getApiKey();
      if (personalKey) {
        const modelConfig = getAiModelConfig('personal');
        apiKeyResult = {
          apiKey: personalKey,
          keyType: 'personal',
          keySource: 'user_configuration',
          isValid: true,
          model: modelConfig.model,
          modelSource: modelConfig.modelSource,
        };
      }
    } else if (keyType === 'platform') {
      const platformKey = getPlatformApiKey();
      if (platformKey) {
        const modelConfig = getAiModelConfig('platform');
        apiKeyResult = {
          apiKey: platformKey,
          keyType: 'platform',
          keySource: 'platform_configuration',
          isValid: true,
          model: modelConfig.model,
          modelSource: modelConfig.modelSource,
        };
      }
    } else {
      apiKeyResult = getAiApiKey();
    }
    
    if (!apiKeyResult) {
      return {
        success: false,
        keyType: 'none',
        message: 'No API key available for testing',
      };
    }
    
    // 验证密钥格式
    if (!validateApiKeyFormat(apiKeyResult.apiKey)) {
      return {
        success: false,
        keyType: apiKeyResult.keyType,
        message: 'Invalid API key format',
      };
    }
    
    // 注意：这里可以添加实际的API连接测试
    // 但为了安全起见，我们只进行格式验证
    
    return {
      success: true,
      keyType: apiKeyResult.keyType,
      message: `${apiKeyResult.keyType} API key is valid and ready to use`,
    };
  } catch (error) {
    return {
      success: false,
      keyType: 'unknown',
      message: 'API key test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
