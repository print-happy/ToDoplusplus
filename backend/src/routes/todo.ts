import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import Todo, { ITodo } from '../models/Todo';
import { generateTodoFromSiliconFlow, AiTodoData } from '../services/siliconflowAiService';

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

// 新增：AI生成待办事项并保存的路由 (使用硅基流动API)
router.post('/ai-create-siliconflow', auth, async (req: Request, res: Response) => {
  console.log('[TODO ROUTE] Received request for /ai-create-siliconflow');
  console.log('[TODO ROUTE] Request body:', req.body);
  console.log('[TODO ROUTE] User:', (req as any).user);
  
  try {
    const { naturalLanguageInput } = req.body;
    const userId = (req as any).user._id;

    if (!userId) {
      console.error('[TODO ROUTE] Error: User ID is missing');
      return res.status(401).json({ message: '用户未认证' });
    }

    console.log('[TODO ROUTE] naturalLanguageInput:', naturalLanguageInput);
    console.log('[TODO ROUTE] userId:', userId);

    if (!naturalLanguageInput) {
      console.error('[TODO ROUTE] Error: naturalLanguageInput is missing');
      return res.status(400).json({ message: '自然语言输入是必需的' });
    }

    console.log('[TODO ROUTE] Calling generateTodoFromSiliconFlow...');
    const aiResult: AiTodoData | null = await generateTodoFromSiliconFlow(naturalLanguageInput);
    console.log('[TODO ROUTE] generateTodoFromSiliconFlow response:', aiResult);

    if (!aiResult) {
      console.error('[TODO ROUTE] Error: AI service failed to generate todo');
      return res.status(500).json({ message: 'AI服务未能成功生成待办事项' });
    }

    const { xmlContent, title, description, dueDate, status, priority } = aiResult;

    // 验证从AI获取的数据是否满足模型要求
    if (!title || !dueDate || !xmlContent) {
        console.error('[TODO ROUTE] Error: AI returned invalid data (missing title, dueDate, or xmlContent)', aiResult);
        return res.status(400).json({ message: 'AI未能生成有效的待办事项数据 (缺少title, dueDate, 或 xmlContent)' });
    }

    const newTodo = new Todo({
      user: userId,
      title,
      description,
      dueDate,
      status,
      priority,
      xmlContent,
      isAIGenerated: true,
    });
    console.log('[TODO ROUTE] New todo object to be saved:', newTodo);

    await newTodo.save();
    console.log('[TODO ROUTE] Todo saved successfully:', newTodo);

    res.status(201).json(newTodo);
  } catch (error) {
    console.error('[TODO ROUTE] Error creating AI-generated todo:', error);
    const errorMessage = error instanceof Error ? error.message : '服务器内部错误';
    res.status(500).json({ message: '创建AI待办事项时服务器出错', error: errorMessage });
  }
});

export default router;