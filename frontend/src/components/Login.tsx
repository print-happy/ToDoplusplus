import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    if (!formData.email) {
      newErrors.email = '请输入用户名';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
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
      await login(formData.email, formData.password);
      // Show success message (you can implement a toast system)
      navigate('/todos');
    } catch (error) {
      setErrors({ general: '登录失败，请检查用户名和密码' });
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
            <h2 className="text-[#0d151b] tracking-light text-[28px] font-bold leading-tight text-center pb-3 pt-5">欢迎回来</h2>

            {errors.general && (
              <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col items-center">
              <div className="flex max-w-[480px] w-full flex-wrap items-end gap-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0d151b] text-base font-medium leading-normal pb-2">用户名</p>
                  <input
                    name="email"
                    type="text"
                    placeholder="请输入用户名"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d151b] focus:outline-0 focus:ring-0 border ${errors.email ? 'border-red-300 bg-red-50' : 'border-[#cfdce7] bg-slate-50 focus:border-[#cfdce7]'} h-14 placeholder:text-[#4c759a] p-[15px] text-base font-normal leading-normal`}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </label>
              </div>
              <div className="flex max-w-[480px] w-full flex-wrap items-end gap-4 py-3">
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
              <div className="flex max-w-[480px] w-full py-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 flex-1 ${isLoading ? 'bg-gray-400' : 'bg-[#1284e7] hover:bg-[#0f6bc7]'} text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] transition-colors`}
                >
                  <span className="truncate">{isLoading ? '登录中...' : '登录'}</span>
                </button>
              </div>
            </form>
            <p className="text-[#4c759a] text-sm font-normal leading-normal pb-3 pt-1 text-center">
              <Link to="/register" className="underline hover:text-[#1284e7]">没有账户？立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;