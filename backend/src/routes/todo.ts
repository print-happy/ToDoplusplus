import express from 'express';
import { auth } from '../middleware/auth';
import Todo from '../models/Todo';

const router = express.Router();

// 获取所有待办事项
router.get('/', auth, async (req: any, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id })
      .sort({ dueDate: 1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: '获取待办事项失败' });
  }
});

// 创建待办事项
router.post('/', auth, async (req: any, res) => {
  try {
    const todo = new Todo({
      ...req.body,
      user: req.user._id
    });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ error: '创建待办事项失败' });
  }
});

// 更新待办事项
router.patch('/:id', auth, async (req: any, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ error: '待办事项不存在' });
    }

    Object.assign(todo, req.body);
    await todo.save();
    res.json(todo);
  } catch (error) {
    res.status(400).json({ error: '更新待办事项失败' });
  }
});

// 删除待办事项
router.delete('/:id', auth, async (req: any, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ error: '待办事项不存在' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: '删除待办事项失败' });
  }
});

// AI生成待办事项
router.post('/generate', auth, async (req: any, res) => {
  try {
    const { prompt } = req.body;
    
    // TODO: 调用ChatGLM API生成待办事项
    // 这里需要实现与ChatGLM的集成
    // 临时返回模拟数据
    const generatedTodo = new Todo({
      user: req.user._id,
      title: 'AI生成的待办事项',
      description: '这是一个示例待办事项',
      dueDate: new Date(),
      xmlContent: '<todo><title>AI生成的待办事项</title><description>这是一个示例待办事项</description></todo>',
      isAIGenerated: true
    });
    
    await generatedTodo.save();
    res.status(201).json(generatedTodo);
  } catch (error) {
    res.status(500).json({ error: '生成待办事项失败' });
  }
});

export default router; 