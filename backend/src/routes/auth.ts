import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已被使用' });
    }

    // 创建新用户
    const user = new User({ username, email, password });
    await user.save();

    // 生成token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: '登录失败' });
  }
});

export default router; 