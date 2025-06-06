import express from 'express';
import { auth } from '../middleware/auth';
import Todo from '../models/Todo';

const router = express.Router();

// 获取所有待办事项
router.get('/', auth, async (req: any, res) => {
  try {
    console.log('GET todos request for user:', req.user._id);
    const todos = await Todo.find({ user: req.user._id })
      .sort({ dueDate: 1 });
    console.log('Found todos:', todos.length);
    res.json(todos);
  } catch (error: any) {
    console.error('Get todos error:', error);
    res.status(500).json({
      error: '获取待办事项失败',
      message: error.message
    });
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
    console.log('PATCH request received:', {
      id: req.params.id,
      body: req.body,
      user: req.user._id
    });

    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      console.log('Todo not found:', req.params.id);
      return res.status(404).json({ error: '待办事项不存在' });
    }

    console.log('Updating todo:', todo._id, 'with data:', req.body);
    Object.assign(todo, req.body);
    await todo.save();

    console.log('Todo updated successfully:', todo);
    res.json(todo);
  } catch (error: any) {
    console.error('Update todo error:', error);
    res.status(400).json({
      error: '更新待办事项失败',
      message: error.message
    });
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



export default router; 