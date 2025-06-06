import express from 'express';
import {
  getCustomLists,
  createCustomList,
  updateCustomList,
  deleteCustomList,
  getCustomListTodos
} from '../controllers/customListController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户的所有自定义列表
router.get('/', getCustomLists);

// 创建新的自定义列表
router.post('/', createCustomList);

// 更新自定义列表
router.put('/:id', updateCustomList);

// 删除自定义列表
router.delete('/:id', deleteCustomList);

// 获取自定义列表中的任务
router.get('/:id/todos', getCustomListTodos);

export default router;
