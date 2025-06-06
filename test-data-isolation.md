# 数据隔离测试指南

## 🧪 测试目的
验证用户数据隔离修复是否成功，确保每个用户只能看到自己的待办事项。

## 🔍 测试步骤

### 1. 清理测试环境
```javascript
// 在浏览器控制台执行
localStorage.clear();
location.reload();
```

### 2. 创建测试用户A
1. 打开应用: http://localhost:3000
2. 注册新用户A:
   - 用户名: testuser_a
   - 邮箱: a@test.com
   - 密码: 123456
3. 登录后创建几个测试任务:
   - "用户A的任务1"
   - "用户A的任务2"
   - "用户A的重要任务" (标记为重要)

### 3. 验证用户A的数据
```javascript
// 在浏览器控制台执行
window.todoDebug.getCurrentUserTodos();
window.todoDebug.getAllUserTodos();
```

### 4. 登出用户A
点击用户头像 → 登出

### 5. 创建测试用户B
1. 注册新用户B:
   - 用户名: testuser_b
   - 邮箱: b@test.com
   - 密码: 123456
2. 登录后验证:
   - ✅ 应该看到空的待办列表
   - ✅ 不应该看到用户A的任务

### 6. 为用户B创建任务
创建几个测试任务:
- "用户B的任务1"
- "用户B的任务2"
- "用户B的计划任务" (设置为明天)

### 7. 验证用户B的数据
```javascript
// 在浏览器控制台执行
window.todoDebug.getCurrentUserTodos();
window.todoDebug.getAllUserTodos();
```

### 8. 切换用户测试
1. 登出用户B
2. 重新登录用户A (a@test.com)
3. 验证:
   - ✅ 应该只看到用户A的任务
   - ✅ 不应该看到用户B的任务
4. 登出用户A
5. 重新登录用户B (b@test.com)
6. 验证:
   - ✅ 应该只看到用户B的任务
   - ✅ 不应该看到用户A的任务

## 🛠️ 开发者调试工具

### 查看当前用户数据
```javascript
window.todoDebug.getCurrentUserTodos();
```

### 查看所有用户数据
```javascript
window.todoDebug.getAllUserTodos();
```

### 清理当前用户数据
```javascript
window.todoDebug.clearCurrentUserTodos();
```

### 完整数据隔离测试
```javascript
window.todoDebug.testDataIsolation();
```

## ✅ 预期结果

### 数据隔离验证
1. **用户A登录时**:
   - localStorage键: `todos_a@test.com` 或 `todos_${userA._id}`
   - 只能看到用户A创建的任务
   - 任务数据中 `user` 字段为用户A的ID

2. **用户B登录时**:
   - localStorage键: `todos_b@test.com` 或 `todos_${userB._id}`
   - 只能看到用户B创建的任务
   - 任务数据中 `user` 字段为用户B的ID

3. **新用户首次登录**:
   - 看到空的待办列表
   - 没有其他用户的数据泄露

### 后端API验证
1. **GET /api/todos**:
   - 只返回当前认证用户的任务
   - 使用JWT token验证用户身份
   - 数据库查询包含用户过滤条件

2. **POST /api/todos**:
   - 新任务自动关联到当前用户
   - 其他用户无法访问

3. **PUT/DELETE /api/todos/:id**:
   - 只能操作属于当前用户的任务
   - 跨用户操作被拒绝

## 🚨 安全检查清单

- [ ] 不同用户的localStorage数据完全隔离
- [ ] 新用户首次登录看到空列表
- [ ] 用户切换时数据正确隔离
- [ ] 后端API正确验证用户身份
- [ ] 数据库查询包含用户过滤
- [ ] JWT token正确传递和验证
- [ ] 无跨用户数据泄露
- [ ] 登出时不清理其他用户数据

## 🔧 故障排除

### 如果仍然看到其他用户的数据
1. 检查localStorage中是否还有旧的共享数据:
   ```javascript
   localStorage.getItem('todos'); // 应该为null
   ```

2. 检查用户专属数据:
   ```javascript
   Object.keys(localStorage).filter(key => key.startsWith('todos_'));
   ```

3. 强制清理并重新测试:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### 如果后端同步失败
1. 检查JWT token:
   ```javascript
   localStorage.getItem('token');
   ```

2. 检查网络请求:
   - 打开开发者工具 → Network
   - 查看API请求是否包含正确的Authorization头

3. 检查后端日志:
   ```bash
   docker-compose logs backend
   ```

## 📝 测试报告模板

```
数据隔离测试报告
==================

测试时间: [日期时间]
测试环境: [开发/生产]

用户A测试:
- 注册: ✅/❌
- 登录: ✅/❌
- 创建任务: ✅/❌
- 数据隔离: ✅/❌

用户B测试:
- 注册: ✅/❌
- 登录: ✅/❌
- 空列表验证: ✅/❌
- 创建任务: ✅/❌
- 数据隔离: ✅/❌

切换用户测试:
- A→B切换: ✅/❌
- B→A切换: ✅/❌
- 数据完整性: ✅/❌

后端API测试:
- 用户过滤: ✅/❌
- JWT验证: ✅/❌
- 跨用户保护: ✅/❌

总体评估: ✅通过/❌失败
```

## 🎯 修复确认

如果所有测试都通过，说明数据隔离问题已经成功修复：

1. ✅ 每个用户拥有独立的数据空间
2. ✅ 新用户看到干净的空列表
3. ✅ 用户间数据完全隔离
4. ✅ 后端API正确验证权限
5. ✅ 无数据泄露风险

**数据隔离修复完成！** 🎉
