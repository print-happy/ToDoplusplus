import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// 路由导入
import authRoutes from './routes/auth';
import todoRoutes from './routes/todo';

// 环境变量配置
dotenv.config();

const app = express();

// 中间件
app.use(express.json());
app.use(cors());
app.use(helmet());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use(limiter);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 