# TodoList Plus

一个现代化的待办事项管理应用，具有AI辅助功能。

## 功能特点

- 简洁现代的浅色主题界面
- AI辅助生成日程计划（基于DeepSeek-R1模型）
- 支持自然语言输入
- 用户账号系统
- 安全的数据存储
- 防网络攻击措施
- 智能任务生成：输入描述，AI自动生成多个相关任务
- 自定义列表管理
- 任务优先级和重要性标记

## 技术栈

### 前端
- React
- TypeScript
- Ant Design
- Axios

### 后端
- Node.js
- Express
- MongoDB
- JWT认证
- 安全中间件

## 项目设置

### 前端设置
1. 进入前端目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm start
   ```

### 后端设置
1. 进入后端目录：
   ```bash
   cd backend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 创建.env文件并配置环境变量：
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. 启动服务器：
   ```bash
   npm start
   ```

## 安全特性

- JWT认证
- 密码加密
- 请求速率限制
- CORS保护
- Helmet安全头
- 输入验证

## AI功能使用说明

### AI任务生成
1. 在添加任务框中输入任务描述
2. 点击紫色的AI图标（✨）
3. AI将根据您的描述自动生成相关的待办事项
4. 生成的任务会自动保存到数据库中

### AI模型配置
- 使用硅基流动平台的DeepSeek-R1-0528-Qwen3-8B模型
- API密钥已配置在后端服务中
- 支持自然语言理解和任务分解

## 开发计划

1. ✅ 基础架构搭建
2. ✅ 用户认证系统
3. ✅ 待办事项CRUD操作
4. ✅ AI集成
5. ✅ 安全措施实现
6. ✅ UI/UX优化
7. 🔄 测试和部署