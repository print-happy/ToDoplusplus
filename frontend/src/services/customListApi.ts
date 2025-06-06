import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// 自定义列表接口
export interface CustomList {
  _id: string;
  name: string;
  userId: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 80000, // 80秒超时
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 自定义列表API
export const customListApi = {
  // 获取所有自定义列表
  getAll: async (): Promise<CustomList[]> => {
    const response = await api.get('/custom-lists');
    return response.data;
  },

  // 创建新的自定义列表
  create: async (data: { name: string; color?: string; icon?: string }): Promise<CustomList> => {
    const response = await api.post('/custom-lists', data);
    return response.data;
  },

  // 更新自定义列表
  update: async (id: string, data: { name?: string; color?: string; icon?: string }): Promise<CustomList> => {
    const response = await api.put(`/custom-lists/${id}`, data);
    return response.data;
  },

  // 删除自定义列表
  delete: async (id: string): Promise<void> => {
    await api.delete(`/custom-lists/${id}`);
  },

  // 获取自定义列表中的任务
  getTodos: async (id: string): Promise<any[]> => {
    const response = await api.get(`/custom-lists/${id}/todos`);
    return response.data;
  }
};

export default customListApi;
