import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Debug component mount and props
  useEffect(() => {
    console.log('🔄 UserProfile: Component mounted/updated');
    console.log('📊 UserProfile: Props - isOpen:', isOpen);
    console.log('👤 UserProfile: AuthContext user:', user);
    console.log('🔧 UserProfile: updateUserProfile function:', typeof updateUserProfile);
  }, [isOpen, user, updateUserProfile]);

  // Predefined avatar options
  const avatarOptions = [
    '👤', '👨', '👩', '🧑', '👨‍💻', '👩‍💻', '🧑‍💻',
    '👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍💼', '👩‍💼', '🧑‍💼',
    '🐱', '🐶', '🐼', '🦊', '🐸', '🐧', '🦄',
    '🌟', '⭐', '🎯', '🚀', '💡', '🎨', '📚'
  ];

  useEffect(() => {
    console.log('UserProfile: User data changed:', user);
    if (user) {
      setDisplayName(user.name || user.username || '');
      setEmail(user.email || '');
      setSelectedAvatar(user.avatar || '👤');
      console.log('UserProfile: Set avatar to:', user.avatar || '👤');
    }
  }, [user]);

  const handleSave = async () => {
    console.log('🔄 handleSave function called');
    console.log('📝 Current form data:', {
      displayName,
      email,
      selectedAvatar,
      isUploading
    });

    // Validation
    if (!displayName.trim()) {
      console.log('❌ Validation failed: displayName is empty');
      message.error('请输入显示名称');
      return;
    }

    if (!email.trim()) {
      console.log('❌ Validation failed: email is empty');
      message.error('请输入邮箱地址');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: invalid email format');
      message.error('请输入有效的邮箱地址');
      return;
    }

    console.log('✅ All validations passed, starting save process');

    // Set loading state
    setIsUploading(true);
    console.log('🔄 Set isUploading to true');

    // Update user profile
    const updatedProfile = {
      name: displayName,
      email: email,
      avatar: selectedAvatar
    };

    console.log('📦 Prepared profile data:', updatedProfile);

    try {
      console.log('🚀 Starting updateUserProfile call...');

      // Check if updateUserProfile function exists
      if (!updateUserProfile) {
        console.error('❌ updateUserProfile function not found in AuthContext');
        throw new Error('updateUserProfile function not available');
      }

      // Use updateUserProfile function from AuthContext
      await updateUserProfile(updatedProfile);

      console.log('✅ Profile update completed successfully');
      console.log('💬 Showing success message');
      message.success('个人资料已更新');

      // Close modal after successful update
      console.log('⏰ Setting timeout to close modal in 1.5 seconds');
      setTimeout(() => {
        console.log('🚪 Closing profile modal');
        onClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Profile update error:', error);
      console.error('📊 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : '更新失败，请重试';
      message.error(errorMessage);

    } finally {
      console.log('🔄 Setting isUploading to false');
      setIsUploading(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      message.error('图片大小不能超过2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedAvatar(result);
      message.success('头像已选择');
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>个人资料</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Avatar Selection */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
            头像
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: selectedAvatar.startsWith('data:') ? '0' : '32px',
              backgroundImage: selectedAvatar.startsWith('data:') ? `url(${selectedAvatar})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '2px solid #e5e7eb'
            }}>
              {!selectedAvatar.startsWith('data:') && selectedAvatar}
            </div>
            
            <div>
              <label style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'inline-block'
              }}>
                上传图片
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                支持 JPG、PNG 格式，最大 2MB
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>或选择预设头像：</p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', 
              gap: '8px',
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}>
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: selectedAvatar === avatar ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: selectedAvatar === avatar ? '#eff6ff' : '#f9fafb',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            显示名称
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="输入您的显示名称"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            邮箱地址
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="输入您的邮箱地址"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            取消
          </button>

          {/* Test Button for debugging */}
          <button
            onClick={() => {
              console.log('🧪 Test button clicked - direct localStorage update');
              const testProfile = {
                name: displayName,
                email: email,
                avatar: selectedAvatar
              };

              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              const updatedUser = { ...currentUser, ...testProfile };
              localStorage.setItem('user', JSON.stringify(updatedUser));

              console.log('✅ Direct localStorage update completed');
              message.success('测试保存成功（直接localStorage）');

              // Force page refresh to see changes
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            测试保存
          </button>

          <button
            onClick={(e) => {
              console.log('🖱️ Save button clicked!');
              console.log('📊 Button event:', e);
              console.log('🔄 Current isUploading state:', isUploading);
              handleSave();
            }}
            disabled={isUploading}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isUploading ? 0.6 : 1
            }}
          >
            {isUploading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
