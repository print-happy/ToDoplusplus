# TODO++ 任务管理应用

一个现代化的任务管理应用，采用React + TypeScript前端和Node.js + Express后端架构，支持AI智能任务生成和个人资料定制。

## 🚀 功能特点

- 🔐 **用户认证系统** - 注册/登录，支持本地存储fallback
- 📝 **智能任务管理** - 完整的CRUD操作，支持分类和优先级
- 🤖 **AI任务生成** - 基于SiliconFlow API的智能任务创建
- 🎨 **动态主题色系统** - 统一的颜色管理，支持自定义列表
- 👤 **个人资料管理** - 头像上传、个人信息编辑
- 📱 **响应式设计** - 完美支持移动端和桌面端
- 🔄 **实时状态同步** - 前后端数据实时同步
- 🐳 **Docker化部署** - 一键启动完整开发环境

## 🛠️ 技术栈

### 前端
- **React 18** - 现代化UI框架
- **TypeScript** - 类型安全的JavaScript
- **Ant Design** - 企业级UI组件库
- **Day.js** - 轻量级日期处理库
- **Axios** - HTTP客户端
- **React Router** - 前端路由管理

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **TypeScript** - 类型安全的服务端开发
- **MongoDB** - NoSQL数据库
- **JWT** - 用户认证
- **bcryptjs** - 密码加密

### AI服务
- **SiliconFlow API** - AI模型服务
- **DeepSeek-R1** - 智能任务生成模型

### 部署
- **Docker** - 容器化部署
- **Docker Compose** - 多服务编排
- **MongoDB** - 数据持久化

## 🚀 快速开始

### 使用Docker（推荐）

**前提条件：**
- Docker >= 20.0
- Docker Compose >= 2.0

**一键启动：**
```bash
# 克隆项目
git clone <repository-url>
cd todo-plus-plus

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件，添加您的配置

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

**访问应用：**
- 前端应用: http://localhost:3000
- 后端API: http://localhost:5000
- MongoDB: localhost:27017

### 传统方式部署

**系统要求：**
- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 5.0

**安装步骤：**

1. **克隆项目**
```bash
git clone <repository-url>
cd todo-plus-plus
```

2. **后端设置**
```bash
cd backend
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动后端服务
npm run dev
```

3. **前端设置**
```bash
cd frontend
npm install

# 启动前端服务
npm start
```

## 🔧 环境配置

### 后端环境变量 (backend/.env)

```env
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://mongodb:27017/todoapp

# JWT配置
JWT_SECRET=your-super-secret-jwt-key

# AI服务配置
SILICONFLOW_API_KEY=your-siliconflow-api-key
```

### Docker服务说明

| 服务 | 端口 | 描述 |
|------|------|------|
| frontend | 3000 | React开发服务器 |
| backend | 5000 | Express API服务器 |
| mongodb | 27017 | MongoDB数据库 |

## 📋 Docker命令参考

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up --build

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# 进入容器
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongodb mongosh

# 清理数据卷（谨慎使用）
docker-compose down -v
```

## 🛡️ 安全特性

- **JWT认证** - 安全的用户身份验证
- **密码加密** - bcrypt加密存储
- **CORS保护** - 跨域请求安全控制
- **输入验证** - 前后端数据验证
- **环境变量** - 敏感信息安全管理
- **容器隔离** - Docker容器安全隔离

## 📁 项目结构

```
todo-plus-plus/
├── docker-compose.yml          # Docker编排配置
├── README.md                   # 项目说明
├── DEVELOPER_GUIDE.md          # 开发者文档
├── frontend/                   # React前端
│   ├── Dockerfile             # 前端Docker配置
│   ├── src/
│   │   ├── components/        # React组件
│   │   ├── contexts/          # React Context
│   │   ├── pages/             # 页面组件
│   │   └── App.tsx            # 应用入口
│   └── package.json
├── backend/                    # Node.js后端
│   ├── Dockerfile             # 后端Docker配置
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务服务
│   │   └── index.ts           # 服务入口
│   └── package.json
└── .env.example               # 环境变量示例
```

## 🚀 部署指南

### 开发环境
```bash
# 使用Docker Compose
docker-compose up -d
```

### 生产环境
```bash
# 1. 克隆项目
git clone <repository-url>
cd todo-plus-plus

# 2. 配置生产环境变量
cp backend/.env.example backend/.env
# 编辑环境变量，设置生产配置

# 3. 构建生产镜像
docker-compose -f docker-compose.prod.yml up -d

# 4. 配置反向代理（Nginx）
# 参考 DEVELOPER_GUIDE.md 中的详细说明
```

## 🐛 故障排除

### 常见问题

**1. 端口占用**
```bash
# 检查端口占用
lsof -i :3000
lsof -i :5000
lsof -i :27017

# 停止Docker服务
docker-compose down
```

**2. 数据库连接失败**
```bash
# 检查MongoDB容器状态
docker-compose logs mongodb

# 重启数据库服务
docker-compose restart mongodb
```

**3. 前端无法访问后端**
```bash
# 检查网络连接
docker-compose exec frontend ping backend

# 检查后端服务状态
docker-compose logs backend
```

**4. 清理和重置**
```bash
# 完全清理（包括数据）
docker-compose down -v
docker system prune -a

# 重新构建
docker-compose up --build
```

## 📖 文档

- [开发者指南](./DEVELOPER_GUIDE.md) - 详细的开发文档
- [API文档](./DEVELOPER_GUIDE.md#api文档--api-documentation) - 接口说明
- [部署指南](./DEVELOPER_GUIDE.md#部署指南--deployment-guide) - 生产环境部署

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b dev/xxx`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin dev/xxx`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [[项目Issues页面](https://github.com/print-happy/ToDoplusplus/issues)]
- Email: print_happy@outlook.com
- 用户反馈: https://www.wjx.cn/vm/tuC09Is.aspx
---

**感谢使用 TODO++！** 🎉