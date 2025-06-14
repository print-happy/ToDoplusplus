# TODO++ 任务管理应用开发者文档
# TODO++ Task Management Application Developer Documentation

## 目录 | Table of Contents

1. [项目概述 | Project Overview](#项目概述--project-overview)
2. [环境搭建 | Development Setup](#环境搭建--development-setup)
3. [项目结构 | Project Structure](#项目结构--project-structure)
4. [核心功能实现 | Core Features Implementation](#核心功能实现--core-features-implementation)
5. [API文档 | API Documentation](#api文档--api-documentation)
6. [部署指南 | Deployment Guide](#部署指南--deployment-guide)
7. [故障排除 | Troubleshooting](#故障排除--troubleshooting)

---

## 项目概述 | Project Overview

### 中文版本

TODO++是一个现代化的任务管理应用，采用React + TypeScript前端和Node.js + Express后端架构。应用提供智能任务管理、AI任务生成、个人资料定制等功能。

**主要功能特性：**
- 🔐 用户认证系统（注册/登录）
- 📝 任务CRUD操作（创建、读取、更新、删除）
- 🤖 AI智能任务生成（基于SiliconFlow API）
- 🎨 动态主题色系统
- 👤 个人资料管理（头像、姓名、邮箱）
- 📱 响应式设计，支持移动端
- 🔄 实时状态同步

**技术栈：**
- **前端**: React 18, TypeScript, Ant Design, Day.js
- **后端**: Node.js, Express, TypeScript, MongoDB
- **AI服务**: SiliconFlow API (DeepSeek-R1模型)
- **状态管理**: React Context API
- **样式**: CSS-in-JS, Material Icons
- **构建工具**: Create React App, Webpack

### English Version

TODO++ is a modern task management application built with React + TypeScript frontend and Node.js + Express backend architecture. The application provides intelligent task management, AI task generation, and personal profile customization features.

**Key Features:**
- 🔐 User authentication system (register/login)
- 📝 Task CRUD operations (Create, Read, Update, Delete)
- 🤖 AI-powered task generation (SiliconFlow API)
- 🎨 Dynamic theme color system
- 👤 Personal profile management (avatar, name, email)
- 📱 Responsive design with mobile support
- 🔄 Real-time state synchronization

**Technology Stack:**
- **Frontend**: React 18, TypeScript, Ant Design, Day.js
- **Backend**: Node.js, Express, TypeScript, MongoDB
- **AI Service**: SiliconFlow API (DeepSeek-R1 model)
- **State Management**: React Context API
- **Styling**: CSS-in-JS, Material Icons
- **Build Tools**: Create React App, Webpack

### 架构图 | Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React TS)    │◄──►│  (Node.js TS)   │◄──►│   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • AuthContext   │    │ • Express API   │    │ • SiliconFlow   │
│ • Components    │    │ • MongoDB       │    │ • AI Models     │
│ • State Mgmt    │    │ • Auth Service  │    │ • DeepSeek-R1   │
│ • Theme System  │    │ • Task Service  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 环境搭建 | Development Setup

### 中文版本

#### 系统要求

**Docker方式（推荐）：**
- Docker >= 20.0.0
- Docker Compose >= 2.0.0

**传统方式：**
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- MongoDB >= 5.0 (可选，支持本地存储fallback)

#### Docker方式安装（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd todo-plus-plus
```

2. **环境配置**

创建 `backend/.env` 文件：
```env
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置（Docker内部网络）
MONGODB_URI=mongodb://mongodb:27017/todoapp

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here

# AI服务配置
SILICONFLOW_API_KEY=your-siliconflow-api-key
```

3. **一键启动所有服务**
```bash
# 启动所有服务（前端、后端、数据库）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

4. **访问应用**
- 前端应用: http://localhost:3000
- 后端API: http://localhost:5000
- MongoDB: localhost:27017

#### 传统方式安装

1. **克隆项目**
```bash
git clone <repository-url>
cd todo-plus-plus
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **安装前端依赖**
```bash
cd ../frontend
npm install
```

4. **环境配置**

创建 `backend/.env` 文件：
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todoapp
JWT_SECRET=your-jwt-secret-key
SILICONFLOW_API_KEY=your-siliconflow-api-key
```

5. **启动开发服务器**

后端服务器：
```bash
cd backend
npm run dev
```

前端服务器：
```bash
cd frontend
npm start
```

#### 依赖项说明

**后端主要依赖：**
- `express`: Web框架
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT认证
- `bcryptjs`: 密码加密
- `cors`: 跨域支持
- `dotenv`: 环境变量管理

**前端主要依赖：**
- `react`: UI框架
- `typescript`: 类型系统
- `antd`: UI组件库
- `axios`: HTTP客户端
- `dayjs`: 日期处理
- `react-router-dom`: 路由管理

### English Version

#### System Requirements
- Node.js >= 16.0.0
- npm >= 8.0.0 or yarn >= 1.22.0
- MongoDB >= 5.0 (optional, supports localStorage fallback)

#### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd todo-plus-plus
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Environment Configuration**

Create `backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todoapp
JWT_SECRET=your-jwt-secret-key
SILICONFLOW_API_KEY=your-siliconflow-api-key
```

5. **Start Development Servers**

Backend server:
```bash
cd backend
npm run dev
```

Frontend server:
```bash
cd frontend
npm start
```

#### Dependencies Overview

**Backend Key Dependencies:**
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password encryption
- `cors`: Cross-origin support
- `dotenv`: Environment variables

**Frontend Key Dependencies:**
- `react`: UI framework
- `typescript`: Type system
- `antd`: UI component library
- `axios`: HTTP client
- `dayjs`: Date manipulation
- `react-router-dom`: Routing

---

## 项目结构 | Project Structure

### 中文版本

```
todo-plus-plus/
├── frontend/                 # React前端应用
│   ├── public/              # 静态资源
│   ├── src/
│   │   ├── components/      # React组件
│   │   │   ├── MainContent.tsx    # 主内容区组件
│   │   │   ├── Sidebar.tsx        # 侧边栏组件
│   │   │   ├── UserProfile.tsx    # 用户资料组件
│   │   │   └── Settings.tsx       # 设置组件
│   │   ├── contexts/        # React Context
│   │   │   └── AuthContext.tsx    # 认证上下文
│   │   ├── pages/           # 页面组件
│   │   │   ├── Login.tsx          # 登录页面
│   │   │   └── Register.tsx       # 注册页面
│   │   ├── types/           # TypeScript类型定义
│   │   ├── utils/           # 工具函数
│   │   └── App.tsx          # 应用根组件
│   ├── package.json         # 前端依赖配置
│   └── tsconfig.json        # TypeScript配置
├── backend/                 # Node.js后端应用
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   │   ├── authController.ts  # 认证控制器
│   │   │   └── todoController.ts  # 任务控制器
│   │   ├── models/          # 数据模型
│   │   │   ├── User.ts            # 用户模型
│   │   │   └── Todo.ts            # 任务模型
│   │   ├── routes/          # 路由定义
│   │   │   ├── auth.ts            # 认证路由
│   │   │   └── todos.ts           # 任务路由
│   │   ├── services/        # 业务服务
│   │   │   └── siliconflowAiService.ts # AI服务
│   │   ├── middleware/      # 中间件
│   │   │   └── auth.ts            # 认证中间件
│   │   └── index.ts         # 应用入口
│   ├── package.json         # 后端依赖配置
│   └── tsconfig.json        # TypeScript配置
└── README.md               # 项目文档
```

### English Version

```
todo-plus-plus/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── MainContent.tsx    # Main content component
│   │   │   ├── Sidebar.tsx        # Sidebar component
│   │   │   ├── UserProfile.tsx    # User profile component
│   │   │   └── Settings.tsx       # Settings component
│   │   ├── contexts/        # React Context
│   │   │   └── AuthContext.tsx    # Authentication context
│   │   ├── pages/           # Page components
│   │   │   ├── Login.tsx          # Login page
│   │   │   └── Register.tsx       # Register page
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Root application component
│   ├── package.json         # Frontend dependencies
│   └── tsconfig.json        # TypeScript configuration
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Controllers
│   │   │   ├── authController.ts  # Authentication controller
│   │   │   └── todoController.ts  # Todo controller
│   │   ├── models/          # Data models
│   │   │   ├── User.ts            # User model
│   │   │   └── Todo.ts            # Todo model
│   │   ├── routes/          # Route definitions
│   │   │   ├── auth.ts            # Authentication routes
│   │   │   └── todos.ts           # Todo routes
│   │   ├── services/        # Business services
│   │   │   └── siliconflowAiService.ts # AI service
│   │   ├── middleware/      # Middleware
│   │   │   └── auth.ts            # Authentication middleware
│   │   └── index.ts         # Application entry point
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
└── README.md               # Project documentation
```

---

## 核心功能实现 | Core Features Implementation

### 中文版本

#### 1. 用户认证系统

**AuthContext实现：**
```typescript
// frontend/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (profile: any) => Promise<void>;
}

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // 登录功能
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email, password
      });

      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      // Fallback to localStorage authentication
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const foundUser = registeredUsers.find((u: any) => u.email === email);

      if (foundUser && await bcrypt.compare(password, foundUser.password)) {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
      } else {
        throw new Error('登录失败');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**后端认证控制器：**
```typescript
// backend/src/controllers/authController.ts
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
```

#### 2. 任务管理功能

**任务组件实现：**
```typescript
// frontend/src/components/MainContent.tsx
const MainContent: React.FC<MainContentProps> = ({ currentView, onViewChange }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // 创建新任务
  const handleCreateTask = async () => {
    if (!newTaskInput.trim()) return;

    const newTodo: Todo = {
      _id: `temp-${Date.now()}`,
      user: user?._id || '',
      title: newTaskInput,
      description: '',
      dueDate: dayjs().toISOString(),
      priority: 'medium',
      status: 'pending',
      isStarred: false,
      category: 'general',
      viewCategory: currentView
    };

    try {
      // 尝试后端API
      const response = await axios.post('http://localhost:5000/api/todos', newTodo);
      setTodos(prev => [...prev, response.data]);
    } catch (error) {
      // Fallback到本地存储
      const localTodos = JSON.parse(localStorage.getItem('todos') || '[]');
      localTodos.push(newTodo);
      localStorage.setItem('todos', JSON.stringify(localTodos));
      setTodos(prev => [...prev, newTodo]);
    }

    setNewTaskInput('');
  };

  // AI任务生成
  const handleAiGenerate = async () => {
    if (!newTaskInput.trim()) return;

    setIsAiGenerating(true);
    try {
      const response = await axios.post('http://localhost:5000/api/ai/generate-tasks', {
        input: newTaskInput
      });

      const aiTasks = response.data.tasks;
      // 处理AI生成的任务...
    } catch (error) {
      // Fallback到前端AI生成
      await generateTasksWithFrontendAI();
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '24px' }}>
      {/* 任务输入区域 */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          placeholder="添加新任务或使用AI生成..."
          style={{ width: '100%', padding: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button onClick={handleCreateTask}>添加任务</button>
          <button onClick={handleAiGenerate} disabled={isAiGenerating}>
            {isAiGenerating ? 'AI生成中...' : 'AI生成'}
          </button>
        </div>
      </div>

      {/* 任务列表 */}
      <div>
        {filteredTodos.map(todo => (
          <TodoItem key={todo._id} todo={todo} onUpdate={handleUpdateTodo} />
        ))}
      </div>
    </div>
  );
};
```

#### 3. AI任务生成

**SiliconFlow AI服务：**
```typescript
// backend/src/services/siliconflowAiService.ts
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';

const todoParser = StructuredOutputParser.fromNamesAndDescriptions({
  title: "任务标题",
  description: "任务描述",
  priority: "优先级 (low/medium/high)",
  dueDate: "截止日期 (ISO 8601格式)"
});

const promptTemplate = new PromptTemplate({
  template: `你是一个智能任务管理助手。根据用户的自然语言描述，生成具体的、可执行的任务列表。

当前时间: {currentTime}
今天是: {todayDate}
明天是: {tomorrowDate}

用户输入: {input}

时间智能分析规则：
1. 如果用户提到"今天"、"今日"，设置dueDate为今天
2. 如果用户提到"明天"、"明日"，设置dueDate为明天
3. 如果用户提到"紧急"、"急"、"马上"，设置dueDate为今天，priority为high
4. 如果用户提到"重要"、"关键"，priority设置为high
5. 根据任务性质推断合适的日期和优先级

请提取以下信息：
{format_instructions}`,
  inputVariables: ["input", "currentTime", "todayDate", "tomorrowDate"],
  partialVariables: { format_instructions: todoParser.getFormatInstructions() }
});

export const generateTodoFromNaturalLanguage = async (naturalLanguageInput: string) => {
  try {
    const now = new Date();
    const currentTime = now.toISOString();
    const todayDate = now.toISOString().split('T')[0];

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const formattedPrompt = await promptTemplate.format({
      input: naturalLanguageInput,
      currentTime,
      todayDate,
      tomorrowDate
    });

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
        messages: [
          { role: 'user', content: formattedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return todoParser.parse(aiResponse);
  } catch (error) {
    console.error('AI生成任务失败:', error);
    throw error;
  }
};
```

### English Version

#### 1. User Authentication System

**AuthContext Implementation:**
```typescript
// frontend/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (profile: any) => Promise<void>;
}

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Login functionality
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email, password
      });

      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      // Fallback to localStorage authentication
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const foundUser = registeredUsers.find((u: any) => u.email === email);

      if (foundUser && await bcrypt.compare(password, foundUser.password)) {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
      } else {
        throw new Error('Login failed');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Backend Authentication Controller:**
```typescript
// backend/src/controllers/authController.ts
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

#### 4. 动态主题色系统

**主题色实现：**
```typescript
// frontend/src/components/MainContent.tsx
const getThemeColors = (view: string) => {
  const themes = {
    'my-day': {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      500: '#3b82f6',
      600: '#2563eb'
    },
    'important': {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      500: '#ef4444',
      600: '#dc2626'
    },
    'planned': {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      500: '#3b82f6',
      600: '#2563eb'
    },
    'assigned': {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      500: '#22c55e',
      600: '#16a34a'
    },
    'flagged': {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      500: '#eab308',
      600: '#ca8a04'
    },
    'tasks': {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      500: '#a855f7',
      600: '#9333ea'
    }
  };

  // Handle custom lists
  if (view.startsWith('custom-')) {
    const customLists = JSON.parse(localStorage.getItem('customLists') || '[]');
    const customList = customLists.find((list: any) => list.id === view);
    if (customList) {
      const colorMap = {
        blue: themes['my-day'],
        green: themes['assigned'],
        yellow: themes['flagged'],
        purple: themes['tasks'],
        red: themes['important']
      };
      return colorMap[customList.color as keyof typeof colorMap] || themes.tasks;
    }
  }

  return themes[view as keyof typeof themes] || themes.tasks;
};

// 应用主题色到组件
const theme = getThemeColors(currentView);
const headerStyle = {
  backgroundColor: theme[100],
  color: theme[600],
  padding: '16px 24px',
  borderRadius: '12px',
  marginBottom: '24px'
};
```

#### 5. 个人资料管理

**用户资料组件：**
```typescript
// frontend/src/components/UserProfile.tsx
const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 预设头像选项
  const avatarOptions = [
    '👤', '👨', '👩', '🧑', '👨‍💻', '👩‍💻', '🧑‍💻',
    '👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍💼', '👩‍💼', '🧑‍💼',
    '🐱', '🐶', '🐼', '🦊', '🐸', '🐧', '🦄',
    '🌟', '⭐', '🎯', '🚀', '💡', '🎨', '📚'
  ];

  const handleSave = async () => {
    if (!displayName.trim() || !email.trim()) {
      message.error('请填写完整信息');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      message.error('请输入有效的邮箱地址');
      return;
    }

    setIsUploading(true);

    const updatedProfile = {
      name: displayName,
      email: email,
      avatar: selectedAvatar
    };

    try {
      await updateUserProfile(updatedProfile);
      message.success('个人资料已更新');

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 头像上传处理
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      message.error('图片大小不能超过2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedAvatar(result);
      message.success('头像已选择');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ /* 模态框样式 */ }}>
      {/* 头像选择区域 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>头像</h3>

        {/* 当前头像预览 */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          backgroundImage: selectedAvatar.startsWith('data:') ? `url(${selectedAvatar})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!selectedAvatar.startsWith('data:') && selectedAvatar}
        </div>

        {/* 上传按钮 */}
        <label style={{ /* 上传按钮样式 */ }}>
          上传图片
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </label>

        {/* 预设头像选择 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '8px' }}>
          {avatarOptions.map((avatar, index) => (
            <button
              key={index}
              onClick={() => setSelectedAvatar(avatar)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: selectedAvatar === avatar ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: selectedAvatar === avatar ? '#eff6ff' : '#f9fafb'
              }}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      {/* 表单字段 */}
      <div style={{ marginBottom: '20px' }}>
        <label>显示名称</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="输入您的显示名称"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>邮箱地址</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="输入您的邮箱地址"
        />
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onClose}>取消</button>
        <button onClick={handleSave} disabled={isUploading}>
          {isUploading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};
```

---

## API文档 | API Documentation

### 中文版本

#### 认证接口

**1. 用户注册**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**响应示例：**
```json
{
  "message": "用户注册成功",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "👤"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**2. 用户登录**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**响应示例：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "👤"
  }
}
```

**3. 更新用户资料**
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "avatar": "string"
}
```

#### 任务管理接口

**1. 获取任务列表**
```http
GET /api/todos
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "todos": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "user": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "完成项目文档",
      "description": "编写API文档和用户指南",
      "dueDate": "2024-01-15T10:00:00.000Z",
      "priority": "high",
      "status": "pending",
      "isStarred": false,
      "category": "work",
      "viewCategory": "my-day",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

**2. 创建新任务**
```http
POST /api/todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "dueDate": "ISO 8601 date string",
  "priority": "low|medium|high",
  "category": "string",
  "viewCategory": "string"
}
```

**3. 更新任务**
```http
PUT /api/todos/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "dueDate": "ISO 8601 date string",
  "priority": "low|medium|high",
  "status": "pending|completed",
  "isStarred": "boolean"
}
```

**4. 删除任务**
```http
DELETE /api/todos/:id
Authorization: Bearer <token>
```

#### AI任务生成接口

**1. 生成AI任务**
```http
POST /api/ai/generate-tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "input": "明天上午开会讨论项目进度，下午完成代码review"
}
```

**响应示例：**
```json
{
  "tasks": [
    {
      "title": "项目进度会议",
      "description": "与团队讨论当前项目进度和下一步计划",
      "priority": "high",
      "dueDate": "2024-01-11T09:00:00.000Z"
    },
    {
      "title": "代码review",
      "description": "审查团队成员提交的代码",
      "priority": "medium",
      "dueDate": "2024-01-11T14:00:00.000Z"
    }
  ]
}
```

### English Version

#### Authentication APIs

**1. User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response Example:**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "👤"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**2. User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**Response Example:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "👤"
  }
}
```

**3. Update User Profile**
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "avatar": "string"
}
```

#### Task Management APIs

**1. Get Tasks**
```http
GET /api/todos
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "todos": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "user": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Complete project documentation",
      "description": "Write API docs and user guide",
      "dueDate": "2024-01-15T10:00:00.000Z",
      "priority": "high",
      "status": "pending",
      "isStarred": false,
      "category": "work",
      "viewCategory": "my-day",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

**2. Create Task**
```http
POST /api/todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "dueDate": "ISO 8601 date string",
  "priority": "low|medium|high",
  "category": "string",
  "viewCategory": "string"
}
```

**3. Update Task**
```http
PUT /api/todos/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "dueDate": "ISO 8601 date string",
  "priority": "low|medium|high",
  "status": "pending|completed",
  "isStarred": "boolean"
}
```

**4. Delete Task**
```http
DELETE /api/todos/:id
Authorization: Bearer <token>
```

#### AI Task Generation APIs

**1. Generate AI Tasks**
```http
POST /api/ai/generate-tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "input": "Meeting tomorrow morning to discuss project progress, code review in the afternoon"
}
```

**Response Example:**
```json
{
  "tasks": [
    {
      "title": "Project Progress Meeting",
      "description": "Discuss current project status and next steps with team",
      "priority": "high",
      "dueDate": "2024-01-11T09:00:00.000Z"
    },
    {
      "title": "Code Review",
      "description": "Review code submissions from team members",
      "priority": "medium",
      "dueDate": "2024-01-11T14:00:00.000Z"
    }
  ]
}
```

---

## 部署指南 | Deployment Guide

### 中文版本

#### Docker生产环境部署（推荐）

**1. 环境准备**
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

**2. 项目部署**
```bash
# 克隆项目
git clone <repository-url>
cd todo-plus-plus

# 配置生产环境变量
cat > backend/.env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/todoapp_prod
JWT_SECRET=$(openssl rand -base64 32)
SILICONFLOW_API_KEY=your-production-api-key
EOF

# 创建生产环境Docker Compose文件
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: todo-backend-prod
    restart: unless-stopped
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: todo-frontend-prod
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

  mongodb:
    image: mongo:5.0
    container_name: todo-db-prod
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data-prod:/data/db
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data-prod:
    driver: local
EOF

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d
```

**3. 生产环境Dockerfile配置**

后端生产Dockerfile (`backend/Dockerfile.prod`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

前端生产Dockerfile (`frontend/Dockerfile.prod`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 传统生产环境部署

**1. 环境准备**
```bash
# 安装Node.js和npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**2. 后端部署**
```bash
# 克隆项目
git clone <repository-url>
cd todo-plus-plus/backend

# 安装依赖
npm install

# 构建TypeScript
npm run build

# 配置环境变量
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todoapp_prod
JWT_SECRET=$(openssl rand -base64 32)
SILICONFLOW_API_KEY=your-production-api-key
EOF

# 使用PM2管理进程
npm install -g pm2
pm2 start dist/index.js --name "todo-backend"
pm2 startup
pm2 save
```

**3. 前端部署**
```bash
cd ../frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 使用Nginx服务静态文件
sudo apt-get install nginx

# 配置Nginx
sudo cat > /etc/nginx/sites-available/todo-app << EOF
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/todo-plus-plus/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/todo-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**4. SSL证书配置（使用Let's Encrypt）**
```bash
# 安装Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

**5. 监控和日志**
```bash
# 查看后端日志
pm2 logs todo-backend

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 监控系统资源
pm2 monit
```

### English Version

#### Production Deployment

**1. Environment Setup**
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**2. Backend Deployment**
```bash
# Clone repository
git clone <repository-url>
cd todo-plus-plus/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Configure environment variables
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todoapp_prod
JWT_SECRET=$(openssl rand -base64 32)
SILICONFLOW_API_KEY=your-production-api-key
EOF

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "todo-backend"
pm2 startup
pm2 save
```

**3. Frontend Deployment**
```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with Nginx
sudo apt-get install nginx

# Configure Nginx
sudo cat > /etc/nginx/sites-available/todo-app << EOF
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/todo-plus-plus/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/todo-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**4. SSL Certificate Setup (Let's Encrypt)**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

**5. Monitoring and Logging**
```bash
# View backend logs
pm2 logs todo-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor system resources
pm2 monit
```

---

## 故障排除 | Troubleshooting

### 中文版本

#### 常见问题和解决方案

**1. Docker相关问题**

**问题**: Docker服务启动失败

**解决方案**:
```bash
# 检查Docker服务状态
sudo systemctl status docker

# 启动Docker服务
sudo systemctl start docker

# 检查Docker Compose版本
docker-compose --version

# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

**2. 端口占用问题**

**问题**: `Error: listen EADDRINUSE: address already in use :::5000`

**Docker环境解决方案**:
```bash
# 停止Docker Compose服务
docker-compose down

# 检查端口占用
lsof -i :3000
lsof -i :5000
lsof -i :27017

# 杀死占用进程
kill -9 <PID>

# 重新启动服务
docker-compose up -d
```

**传统环境解决方案**:
```bash
# 查找占用端口的进程
lsof -i :5000

# 杀死进程
kill -9 <PID>

# 或者更改端口
export PORT=5001
```

**3. MongoDB连接失败**

**问题**: `MongoNetworkError: failed to connect to server`

**Docker环境解决方案**:
```bash
# 检查MongoDB容器状态
docker-compose ps mongodb

# 查看MongoDB日志
docker-compose logs mongodb

# 重启MongoDB容器
docker-compose restart mongodb

# 进入MongoDB容器测试连接
docker-compose exec mongodb mongosh

# 检查网络连接
docker-compose exec backend ping mongodb

# 验证环境变量
docker-compose exec backend env | grep MONGODB_URI
```

**传统环境解决方案**:
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 启动MongoDB
sudo systemctl start mongod

# 检查连接字符串
echo $MONGODB_URI

# 测试连接
mongosh mongodb://localhost:27017/todoapp
```

**3. JWT认证失败**

**问题**: `JsonWebTokenError: invalid token`

**解决方案**:
```bash
# 检查JWT密钥
echo $JWT_SECRET

# 清除浏览器localStorage
# 在浏览器控制台执行：
localStorage.clear()

# 重新生成JWT密钥
openssl rand -base64 32
```

**4. AI服务调用失败**

**问题**: `SiliconFlow API call failed`

**解决方案**:
```bash
# 检查API密钥
echo $SILICONFLOW_API_KEY

# 测试API连接
curl -X POST "https://api.siliconflow.cn/v1/chat/completions" \
  -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 检查网络连接
ping api.siliconflow.cn
```

**5. 前端构建失败**

**问题**: `npm run build` 失败

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node --version
npm --version

# 更新依赖
npm update
```

**6. 用户头像保存失败**

**问题**: 头像更新后不显示

**解决方案**:
```javascript
// 在浏览器控制台检查localStorage
console.log(localStorage.getItem('user'));

// 检查AuthContext状态
// 在React DevTools中查看AuthContext

// 强制刷新页面
window.location.reload();

// 清除缓存重新登录
localStorage.removeItem('user');
localStorage.removeItem('token');
```

**7. 主题色不一致**

**问题**: 自定义列表颜色与选择不符

**解决方案**:
```javascript
// 检查自定义列表数据
console.log(JSON.parse(localStorage.getItem('customLists') || '[]'));

// 清除自定义列表重新创建
localStorage.removeItem('customLists');

// 检查主题色函数
// 在组件中添加调试日志
console.log('Current theme colors:', getThemeColors(currentView));
```

**8. 性能问题**

**问题**: 应用响应缓慢

**解决方案**:
```bash
# 后端性能监控
pm2 monit

# 检查内存使用
free -h

# 检查磁盘空间
df -h

# 优化MongoDB查询
# 在MongoDB中创建索引
db.todos.createIndex({ "user": 1, "status": 1 })
db.users.createIndex({ "email": 1 })
```

#### 调试技巧

**1. 启用详细日志**
```bash
# 后端调试模式
DEBUG=* npm run dev

# 前端开发者工具
# 打开浏览器F12，查看Console、Network、Application标签
```

**2. 数据库调试**
```bash
# 连接MongoDB查看数据
mongo mongodb://localhost:27017/todoapp

# 查看用户数据
db.users.find().pretty()

# 查看任务数据
db.todos.find().pretty()

# 查看索引
db.todos.getIndexes()
```

**3. 网络请求调试**
```javascript
// 在axios请求中添加拦截器
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.log('Error Response:', error.response);
    return Promise.reject(error);
  }
);
```

### English Version

#### Common Issues and Solutions

**1. Port Already in Use**

**Issue**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change the port
export PORT=5001
```

**2. MongoDB Connection Failed**

**Issue**: `MongoNetworkError: failed to connect to server`

**Solution**:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongo mongodb://localhost:27017/todoapp
```

**3. JWT Authentication Failed**

**Issue**: `JsonWebTokenError: invalid token`

**Solution**:
```bash
# Check JWT secret
echo $JWT_SECRET

# Clear browser localStorage
# Execute in browser console:
localStorage.clear()

# Generate new JWT secret
openssl rand -base64 32
```

**4. AI Service Call Failed**

**Issue**: `SiliconFlow API call failed`

**Solution**:
```bash
# Check API key
echo $SILICONFLOW_API_KEY

# Test API connection
curl -X POST "https://api.siliconflow.cn/v1/chat/completions" \
  -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Check network connectivity
ping api.siliconflow.cn
```

**5. Frontend Build Failed**

**Issue**: `npm run build` fails

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version

# Update dependencies
npm update
```

**6. User Avatar Save Failed**

**Issue**: Avatar doesn't update after saving

**Solution**:
```javascript
// Check localStorage in browser console
console.log(localStorage.getItem('user'));

// Check AuthContext state
// Use React DevTools to inspect AuthContext

// Force page refresh
window.location.reload();

// Clear cache and re-login
localStorage.removeItem('user');
localStorage.removeItem('token');
```

**7. Theme Color Inconsistency**

**Issue**: Custom list colors don't match selection

**Solution**:
```javascript
// Check custom lists data
console.log(JSON.parse(localStorage.getItem('customLists') || '[]'));

// Clear custom lists and recreate
localStorage.removeItem('customLists');

// Check theme color function
// Add debug logs in component
console.log('Current theme colors:', getThemeColors(currentView));
```

**8. Performance Issues**

**Issue**: Application responds slowly

**Solution**:
```bash
# Backend performance monitoring
pm2 monit

# Check memory usage
free -h

# Check disk space
df -h

# Optimize MongoDB queries
# Create indexes in MongoDB
db.todos.createIndex({ "user": 1, "status": 1 })
db.users.createIndex({ "email": 1 })
```

#### Debugging Tips

**1. Enable Verbose Logging**
```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend developer tools
# Open browser F12, check Console, Network, Application tabs
```

**2. Database Debugging**
```bash
# Connect to MongoDB to view data
mongo mongodb://localhost:27017/todoapp

# View user data
db.users.find().pretty()

# View todo data
db.todos.find().pretty()

# View indexes
db.todos.getIndexes()
```

**3. Network Request Debugging**
```javascript
// Add interceptors to axios requests
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.log('Error Response:', error.response);
    return Promise.reject(error);
  }
);
```

---

## 贡献指南 | Contributing Guide

### 中文版本

欢迎为TODO++项目贡献代码！请遵循以下步骤：

1. **Fork项目** 并创建功能分支
2. **编写代码** 并确保通过所有测试
3. **提交Pull Request** 并详细描述更改内容
4. **代码审查** 通过后将合并到主分支

### English Version

Welcome to contribute to TODO++ project! Please follow these steps:

1. **Fork the project** and create a feature branch
2. **Write code** and ensure all tests pass
3. **Submit Pull Request** with detailed description of changes
4. **Code review** will be conducted before merging to main branch

---

## 许可证 | License

MIT License - 详见LICENSE文件 | See LICENSE file for details

---

## 联系方式 | Contact

如有问题或建议，请通过以下方式联系：
For questions or suggestions, please contact via:

- GitHub Issues: [项目Issues页面 | Project Issues Page]
- Email: [your-email@example.com]

---

**感谢使用TODO++！| Thank you for using TODO++!** 🎉
