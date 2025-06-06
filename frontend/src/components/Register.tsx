import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.username, formData.email, formData.password);
      navigate('/todos');
    } catch (error) {
      setErrors({ general: '注册失败，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden" style={{fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-center whitespace-nowrap border-b border-solid border-b-[#e7eef3] px-10 py-6">
          <div className="flex flex-col items-center gap-3 text-[#0d151b]">
            <div className="size-12 flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-[#0d151b] text-xl font-bold leading-tight tracking-[-0.015em]">ToDo++</h2>
          </div>
        </header>
        <div className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 flex-1">
            <h2 className="text-[#0d151b] tracking-light text-[28px] font-bold leading-tight text-center pb-3 pt-5">创建账户</h2>

            {errors.general && (
              <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0d151b] text-base font-medium leading-normal pb-2">用户名</p>
                  <input
                    name="username"
                    type="text"
                    placeholder="请输入用户名"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d151b] focus:outline-0 focus:ring-0 border ${errors.username ? 'border-red-300 bg-red-50' : 'border-[#cfdce7] bg-slate-50 focus:border-[#cfdce7]'} h-14 placeholder:text-[#4c759a] p-[15px] text-base font-normal leading-normal`}
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0d151b] text-base font-medium leading-normal pb-2">邮箱</p>
                  <input
                    name="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d151b] focus:outline-0 focus:ring-0 border ${errors.email ? 'border-red-300 bg-red-50' : 'border-[#cfdce7] bg-slate-50 focus:border-[#cfdce7]'} h-14 placeholder:text-[#4c759a] p-[15px] text-base font-normal leading-normal`}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0d151b] text-base font-medium leading-normal pb-2">密码</p>
                  <input
                    name="password"
                    type="password"
                    placeholder="请输入密码"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d151b] focus:outline-0 focus:ring-0 border ${errors.password ? 'border-red-300 bg-red-50' : 'border-[#cfdce7] bg-slate-50 focus:border-[#cfdce7]'} h-14 placeholder:text-[#4c759a] p-[15px] text-base font-normal leading-normal`}
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0d151b] text-base font-medium leading-normal pb-2">确认密码</p>
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d151b] focus:outline-0 focus:ring-0 border ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-[#cfdce7] bg-slate-50 focus:border-[#cfdce7]'} h-14 placeholder:text-[#4c759a] p-[15px] text-base font-normal leading-normal`}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </label>
              </div>
              <div className="flex px-4 py-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 flex-1 ${isLoading ? 'bg-gray-400' : 'bg-[#1284e7] hover:bg-[#0f6bc7]'} text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] transition-colors`}
                >
                  <span className="truncate">{isLoading ? '创建账户中...' : '注册'}</span>
                </button>
              </div>
            </form>
            <p className="text-[#4c759a] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
              <Link to="/login" className="underline hover:text-[#1284e7]">已有账户？立即登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 