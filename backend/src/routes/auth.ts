import express from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

const router = express.Router();
const userRepo = AppDataSource.getRepository(User);

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await userRepo.findOne({ where: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: '用户名或邮箱已被使用' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = userRepo.create({ username, email, password: hashed });
    const saved = await userRepo.save(newUser);
    req.session.userId = saved.id;
    res.status(201).json({ id: saved.id, username: saved.username });
  } catch (error) {
    res.status(400).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    res.status(400).json({ error: '登录失败' });
  }
});

export default router;