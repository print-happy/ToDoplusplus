import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// 检查邮箱是否已注册
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: '请提供邮箱地址' });
    }

    const existingUser = await User.findOne({ email });
    res.json({ exists: !!existingUser });
  } catch (error: any) {
    console.error('检查邮箱错误:', error);
    res.status(500).json({ error: '检查邮箱失败' });
  }
});

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ error: '请提供所有必需的字段' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少为6个字符' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: '该邮箱已被注册' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: '该用户名已被使用' });
      }
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

    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      token
    };

    res.status(201).json(userResponse);
  } catch (error: any) {
    console.error('注册错误:', error);
    res.status(400).json({ 
      error: '注册失败',
      message: error.message
    });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和密码' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '该邮箱未注册' });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 生成token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      token
    };

    res.json(userResponse);
  } catch (error: any) {
    console.error('登录错误:', error);
    res.status(400).json({ 
      error: '登录失败',
      message: error.message
    });
  }
});

export default router; 