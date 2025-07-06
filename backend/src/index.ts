import express from 'express';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Todo } from './entities/Todo';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// 路由导入
import authRoutes from './routes/auth';
import todoRoutes from './routes/todo';

// 环境变量配置
dotenv.config();

console.log('Starting server...');
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
// Health check endpoint
app.get('/health', (req, res) => res.sendStatus(200));

// 数据库连接 (MySQL)
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  entities: [User, Todo],
  synchronize: true,
});
AppDataSource.initialize()
  .then(() => console.log('Connected to MySQL'))
  .catch(err => {
    console.error('MySQL connection error:', err);
    process.exit(1);
  });

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 