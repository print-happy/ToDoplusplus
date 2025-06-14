// TODO++ MongoDB 初始化脚本

// 切换到todoapp数据库
db = db.getSiblingDB('todoapp');

// 创建应用用户
db.createUser({
  user: 'todoapp',
  pwd: 'todoapp-password-change-this',
  roles: [
    {
      role: 'readWrite',
      db: 'todoapp'
    }
  ]
});

// 创建用户集合并添加索引
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

// 创建待办事项集合并添加索引
db.createCollection('todos');
db.todos.createIndex({ userId: 1 });
db.todos.createIndex({ createdAt: -1 });
db.todos.createIndex({ dueDate: 1 });
db.todos.createIndex({ completed: 1 });
db.todos.createIndex({ 
  userId: 1, 
  completed: 1, 
  createdAt: -1 
});

// 创建会话集合并添加索引
db.createCollection('sessions');
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ 
  createdAt: 1 
}, { 
  expireAfterSeconds: 86400 // 24小时后自动删除
});

// 创建日志集合并添加索引
db.createCollection('logs');
db.logs.createIndex({ timestamp: -1 });
db.logs.createIndex({ level: 1 });
db.logs.createIndex({ 
  timestamp: 1 
}, { 
  expireAfterSeconds: 2592000 // 30天后自动删除
});

// 创建API密钥集合并添加索引
db.createCollection('apikeys');
db.apikeys.createIndex({ userId: 1 });
db.apikeys.createIndex({ keyHash: 1 }, { unique: true });
db.apikeys.createIndex({ createdAt: -1 });

print('✅ TODO++ 数据库初始化完成');
print('📊 创建的集合: users, todos, sessions, logs, apikeys');
print('🔍 创建的索引: 用户邮箱/用户名唯一索引, 待办事项复合索引, 会话TTL索引等');
print('👤 创建的用户: todoapp (readWrite权限)');
print('⚠️  请记得修改默认密码！');
