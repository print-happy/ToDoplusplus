import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; email: string; password: string }) => {
    console.log('🔧 Attempting registration for:', values.email);

    try {
      await register(values.username, values.email, values.password);
      message.success({
        content: '注册成功！欢迎加入TODO++',
        duration: 3,
      });
      console.log('✅ Registration successful, navigating to todos');
      navigate('/todos');
    } catch (error: any) {
      // 🔧 详细错误处理：显示具体的错误信息
      console.error('❌ Registration failed:', error);

      const errorMessage = error?.message || '注册失败，请稍后重试';

      // 🔧 根据错误类型显示不同的提示
      if (errorMessage.includes('已被注册') || errorMessage.includes('已被使用')) {
        message.error({
          content: '该邮箱或用户名已被注册，请使用其他信息或直接登录',
          duration: 4,
        });
      } else if (errorMessage.includes('网络')) {
        message.error({
          content: '网络连接失败，请检查网络后重试',
          duration: 4,
        });
      } else if (errorMessage.includes('验证')) {
        message.error({
          content: '输入信息格式不正确，请检查后重试',
          duration: 4,
        });
      } else {
        message.error({
          content: errorMessage,
          duration: 4,
        });
      }
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <Card title="注册" bordered={false}>
        <Form
          name="register"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            已有账号？ <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 