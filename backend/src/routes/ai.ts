import express from 'express';
import { auth } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { dateParserService } from '../services/dateParserService';
import Todo from '../models/Todo';

const router = express.Router();

// AI生成待办事项
router.post('/generate-todos', auth, async (req: any, res) => {
  try {
    const { description, customListId, baseDate } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        error: '请提供有效的任务描述'
      });
    }

    // 限制描述长度
    if (description.length > 500) {
      return res.status(400).json({
        error: '任务描述过长，请控制在500字符以内'
      });
    }

    // 验证baseDate格式（如果提供）
    if (baseDate && !dateParserService.isValidDateFormat(baseDate)) {
      return res.status(400).json({
        error: '基准日期格式错误，请使用YYYY-MM-DD格式'
      });
    }

    console.log('AI生成请求:', {
      user: req.user._id,
      description: description.substring(0, 100) + '...',
      customListId,
      baseDate: baseDate || '使用系统当前日期'
    });

    // 第一步：解析用户输入，提取时间信息并计算具体日期
    const dateInfo = dateParserService.parseUserInput(description.trim(), baseDate);

    console.log('日期解析结果:', dateInfo);

    // 第二步：调用AI服务生成任务内容（不包含日期）
    const generatedTodos = await aiService.generateTodos({
      description: description.trim(),
      targetDate: dateInfo.calculatedDate
    });

    if (!generatedTodos || generatedTodos.length === 0) {
      return res.status(500).json({
        error: 'AI生成失败，请稍后重试'
      });
    }

    // 第三步：将生成的待办事项与计算好的日期结合，保存到数据库
    const savedTodos = [];
    for (const todoData of generatedTodos) {
      try {
        const todo = new Todo({
          user: req.user._id,
          title: todoData.title,
          description: todoData.description,
          dueDate: new Date(dateInfo.calculatedDate), // 使用解析出的准确日期
          priority: todoData.priority,
          status: 'pending',
          xmlContent: `<todo><title>${todoData.title}</title><description>${todoData.description}</description></todo>`,
          ...(customListId && { customListId })
        });

        const savedTodo = await todo.save();
        savedTodos.push(savedTodo);
        console.log('AI生成的待办事项已保存:', savedTodo._id, '日期:', dateInfo.calculatedDate);
      } catch (saveError) {
        console.error('保存AI生成的待办事项失败:', saveError);
        // 继续处理其他待办事项，不中断整个流程
      }
    }

    if (savedTodos.length === 0) {
      return res.status(500).json({ 
        error: '保存AI生成的待办事项失败' 
      });
    }

    console.log(`成功生成并保存了 ${savedTodos.length} 个待办事项`);

    res.status(201).json({
      message: `成功生成 ${savedTodos.length} 个待办事项`,
      todos: savedTodos,
      count: savedTodos.length,
      dateInfo: {
        detectedKeywords: dateInfo.detectedTimeKeywords,
        calculatedDate: dateInfo.calculatedDate,
        baseDate: dateInfo.baseDate
      }
    });

  } catch (error: any) {
    console.error('AI生成待办事项错误:', error);
    
    let errorMessage = 'AI生成待办事项失败';
    if (error.message?.includes('API')) {
      errorMessage = 'AI服务暂时不可用，请稍后重试';
    } else if (error.message?.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络连接';
    } else if (error.message?.includes('认证')) {
      errorMessage = 'AI服务认证失败';
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 设置AI服务基准日期
router.post('/set-current-date', auth, async (req: any, res) => {
  try {
    const { currentDate } = req.body;

    if (!currentDate) {
      return res.status(400).json({
        error: '请提供基准日期'
      });
    }

    // 验证日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
      return res.status(400).json({
        error: '日期格式错误，请使用YYYY-MM-DD格式'
      });
    }

    // 验证日期有效性
    const [year, month, day] = currentDate.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    if (testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
      return res.status(400).json({
        error: '无效的日期'
      });
    }

    // 注意：新的架构中不再需要设置全局基准日期
    // 日期计算由dateParserService处理

    console.log(`AI服务基准日期已设置为: ${currentDate}`);

    res.json({
      message: '基准日期设置成功',
      currentDate: currentDate
    });

  } catch (error: any) {
    console.error('设置基准日期失败:', error);
    res.status(500).json({
      error: '设置基准日期失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取当前AI服务配置
router.get('/config', auth, async (req: any, res) => {
  try {
    const now = new Date();
    const systemDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    res.json({
      systemCurrentDate: systemDate,
      message: '当前AI服务配置信息'
    });
  } catch (error) {
    console.error('获取AI配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 获取AI生成历史（可选功能）
router.get('/generation-history', auth, async (req: any, res) => {
  try {
    // 这里可以添加获取AI生成历史的逻辑
    // 目前返回空数组，后续可以扩展
    res.json([]);
  } catch (error) {
    console.error('获取AI生成历史失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

export default router;
