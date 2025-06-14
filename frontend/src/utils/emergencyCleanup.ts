/**
 * 🚨 紧急安全清理工具
 * Emergency Security Cleanup Utility
 * 
 * 用于完全清理应用状态，解决数据隔离安全漏洞
 */

import { clearSessionApiKeyCache } from './apiKeyManager';

/**
 * 🚨 紧急完全清理：清除所有用户数据和状态
 * Emergency complete cleanup: Clear all user data and state
 */
export const emergencyCompleteCleanup = (): void => {
  console.log('🚨 EMERGENCY: Starting complete application cleanup');
  
  try {
    // 1. 清除所有localStorage数据
    const keysToPreserve = ['theme', 'language', 'app-version']; // 保留非敏感设置
    const allKeys = Object.keys(localStorage);
    let clearedCount = 0;
    
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    console.log(`🧹 Cleared ${clearedCount} localStorage keys`);
    
    // 2. 清除所有sessionStorage数据
    sessionStorage.clear();
    console.log('🧹 Cleared all sessionStorage data');
    
    // 3. 清除API密钥会话缓存
    clearSessionApiKeyCache();
    console.log('🧹 Cleared API key session cache');
    
    // 4. 清除可能的内存状态
    if (typeof window !== 'undefined') {
      // 清除可能的全局变量
      (window as any).currentUser = null;
      (window as any).userTodos = null;
      (window as any).apiKey = null;
    }
    
    console.log('✅ EMERGENCY: Complete application cleanup finished');
    
    // 5. 强制页面重新加载以确保状态完全重置
    setTimeout(() => {
      console.log('🔄 Forcing page reload for complete state reset');
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ EMERGENCY: Error during complete cleanup:', error);
    // 即使出错也要尝试重新加载页面
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};

/**
 * 🔒 安全用户切换清理
 * Secure user switching cleanup
 */
export const secureUserSwitchCleanup = (newUserId?: string): void => {
  console.log('🔒 SECURITY: Starting secure user switch cleanup');
  
  try {
    // 1. 清除会话级缓存
    clearSessionApiKeyCache();
    
    // 2. 清除认证相关数据
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // 3. 清除可能的临时数据
    sessionStorage.clear();
    
    // 4. 如果指定了新用户ID，验证数据隔离
    if (newUserId) {
      const allTodoKeys = Object.keys(localStorage).filter(key => key.startsWith('todos_'));
      const newUserTodoKey = `todos_${newUserId}`;
      
      // 检查是否存在数据污染
      allTodoKeys.forEach(key => {
        if (key !== newUserTodoKey) {
          try {
            const todos = JSON.parse(localStorage.getItem(key) || '[]');
            const contaminatedTodos = todos.filter((todo: any) => 
              todo.user === newUserId
            );
            
            if (contaminatedTodos.length > 0) {
              console.warn(`🚨 SECURITY: Found ${contaminatedTodos.length} contaminated todos in ${key}`);
              // 清理被污染的数据
              const cleanTodos = todos.filter((todo: any) => 
                todo.user !== newUserId
              );
              localStorage.setItem(key, JSON.stringify(cleanTodos));
            }
          } catch (error) {
            console.error(`Error checking contamination in ${key}:`, error);
          }
        }
      });
    }
    
    console.log('✅ SECURITY: Secure user switch cleanup completed');
    
  } catch (error) {
    console.error('❌ SECURITY: Error during secure user switch cleanup:', error);
  }
};

/**
 * 🔍 数据隔离安全检查
 * Data isolation security check
 */
export const performSecurityCheck = (currentUserId: string): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} => {
  console.log('🔍 SECURITY: Performing data isolation security check');
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // 1. 检查localStorage中的数据隔离
    const allKeys = Object.keys(localStorage);
    const todoKeys = allKeys.filter(key => key.startsWith('todos_'));
    const apiKeyKeys = allKeys.filter(key => key.startsWith('siliconflow_api_key_'));
    
    // 2. 检查是否存在旧的共享数据
    if (localStorage.getItem('todos')) {
      issues.push('Found legacy shared todos data');
      recommendations.push('Remove legacy shared todos data');
    }
    
    if (localStorage.getItem('siliconflow_api_key')) {
      issues.push('Found legacy shared API key data');
      recommendations.push('Remove legacy shared API key data');
    }
    
    // 3. 检查当前用户的数据完整性
    const currentUserTodoKey = `todos_${currentUserId}`;
    const currentUserApiKeyKey = `siliconflow_api_key_${currentUserId}`;
    
    if (!todoKeys.includes(currentUserTodoKey)) {
      console.log(`ℹ️ No todos found for current user: ${currentUserId}`);
    }
    
    // 4. 检查跨用户数据污染
    todoKeys.forEach(key => {
      if (key !== currentUserTodoKey) {
        try {
          const todos = JSON.parse(localStorage.getItem(key) || '[]');
          const contaminatedTodos = todos.filter((todo: any) => 
            todo.user === currentUserId
          );
          
          if (contaminatedTodos.length > 0) {
            issues.push(`Found ${contaminatedTodos.length} contaminated todos in ${key}`);
            recommendations.push(`Clean contaminated data in ${key}`);
          }
        } catch (error) {
          issues.push(`Error reading todos from ${key}`);
        }
      }
    });
    
    // 5. 检查API密钥隔离
    const sessionCache = (window as any).sessionApiKeyCache;
    if (sessionCache && sessionCache.userId !== currentUserId) {
      issues.push('Session API key cache user ID mismatch');
      recommendations.push('Clear session API key cache');
    }
    
    const isSecure = issues.length === 0;
    
    console.log(`🔍 SECURITY: Security check completed - ${isSecure ? 'SECURE' : 'ISSUES FOUND'}`);
    console.log('Issues found:', issues);
    console.log('Recommendations:', recommendations);
    
    return {
      isSecure,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ SECURITY: Error during security check:', error);
    return {
      isSecure: false,
      issues: ['Security check failed due to error'],
      recommendations: ['Perform emergency cleanup and restart application']
    };
  }
};

/**
 * 🛠️ 自动修复数据隔离问题
 * Auto-fix data isolation issues
 */
export const autoFixDataIsolation = (currentUserId: string): boolean => {
  console.log('🛠️ SECURITY: Starting auto-fix for data isolation issues');
  
  try {
    const securityCheck = performSecurityCheck(currentUserId);
    
    if (securityCheck.isSecure) {
      console.log('✅ No issues found, no fixes needed');
      return true;
    }
    
    // 修复发现的问题
    let fixedCount = 0;
    
    // 1. 移除旧的共享数据
    if (localStorage.getItem('todos')) {
      localStorage.removeItem('todos');
      fixedCount++;
      console.log('🔧 Fixed: Removed legacy shared todos data');
    }
    
    if (localStorage.getItem('siliconflow_api_key')) {
      localStorage.removeItem('siliconflow_api_key');
      fixedCount++;
      console.log('🔧 Fixed: Removed legacy shared API key data');
    }
    
    // 2. 清理跨用户数据污染
    const todoKeys = Object.keys(localStorage).filter(key => key.startsWith('todos_'));
    const currentUserTodoKey = `todos_${currentUserId}`;
    
    todoKeys.forEach(key => {
      if (key !== currentUserTodoKey) {
        try {
          const todos = JSON.parse(localStorage.getItem(key) || '[]');
          const cleanTodos = todos.filter((todo: any) => 
            todo.user !== currentUserId
          );
          
          if (cleanTodos.length !== todos.length) {
            localStorage.setItem(key, JSON.stringify(cleanTodos));
            fixedCount++;
            console.log(`🔧 Fixed: Cleaned contaminated data in ${key}`);
          }
        } catch (error) {
          console.error(`Error fixing contamination in ${key}:`, error);
        }
      }
    });
    
    // 3. 清理API密钥会话缓存
    clearSessionApiKeyCache();
    fixedCount++;
    console.log('🔧 Fixed: Cleared session API key cache');
    
    console.log(`✅ SECURITY: Auto-fix completed - ${fixedCount} issues fixed`);
    return true;
    
  } catch (error) {
    console.error('❌ SECURITY: Error during auto-fix:', error);
    return false;
  }
};

// 导出给调试工具使用
if (process.env.NODE_ENV === 'development') {
  (window as any).emergencyCleanup = {
    emergencyCompleteCleanup,
    secureUserSwitchCleanup,
    performSecurityCheck,
    autoFixDataIsolation
  };
}
