import { Request, Response } from 'express';
import CustomList from '../models/CustomList';
import Todo from '../models/Todo';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

// 获取用户的所有自定义列表
export const getCustomLists = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const lists = await CustomList.find({ userId }).sort({ createdAt: 1 });
    res.json(lists);
  } catch (error) {
    console.error('获取自定义列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建新的自定义列表
export const createCustomList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { name, color, icon } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: '列表名称不能为空' });
    }

    // 检查是否已存在同名列表
    const existingList = await CustomList.findOne({ userId, name: name.trim() });
    if (existingList) {
      return res.status(400).json({ message: '已存在同名列表' });
    }

    const newList = new CustomList({
      name: name.trim(),
      userId,
      color: color || '#6366f1',
      icon: icon || 'list'
    });

    await newList.save();
    res.status(201).json(newList);
  } catch (error) {
    console.error('创建自定义列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新自定义列表
export const updateCustomList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;
    const { name, color, icon } = req.body;

    const list = await CustomList.findOne({ _id: id, userId });
    if (!list) {
      return res.status(404).json({ message: '列表不存在' });
    }

    if (name && name.trim().length > 0) {
      // 检查是否已存在同名列表（排除当前列表）
      const existingList = await CustomList.findOne({ 
        userId, 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingList) {
        return res.status(400).json({ message: '已存在同名列表' });
      }
      list.name = name.trim();
    }

    if (color) list.color = color;
    if (icon) list.icon = icon;

    await list.save();
    res.json(list);
  } catch (error) {
    console.error('更新自定义列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除自定义列表
export const deleteCustomList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;

    const list = await CustomList.findOne({ _id: id, userId });
    if (!list) {
      return res.status(404).json({ message: '列表不存在' });
    }

    // 删除列表中的所有任务
    await Todo.deleteMany({ customListId: id, user: userId });

    // 删除列表
    await CustomList.findByIdAndDelete(id);

    res.json({ message: '列表删除成功' });
  } catch (error) {
    console.error('删除自定义列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取自定义列表中的任务
export const getCustomListTodos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;

    // 验证列表是否属于当前用户
    const list = await CustomList.findOne({ _id: id, userId });
    if (!list) {
      return res.status(404).json({ message: '列表不存在' });
    }

    const todos = await Todo.find({ customListId: id, user: userId })
      .sort({ createdAt: -1 });

    res.json(todos);
  } catch (error) {
    console.error('获取自定义列表任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
