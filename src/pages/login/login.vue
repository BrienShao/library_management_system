<template>
  <view class="container">
    <view class="main-content">
      <view class="logo">
        <image src="../../static/logo.svg" mode="aspectFit" @error="onImageError"></image>
      </view>
      <form @submit="handleLogin" class="login-form">
        <view class="form-group">
          <text class="label">用户名</text>
          <input 
            type="text" 
            v-model="username" 
            placeholder="请输入用户名" 
            class="input"
            cursor-spacing="20" 
          />
        </view>
        <view class="form-group">
          <text class="label">密码</text>
          <input 
            type="password" 
            v-model="password" 
            placeholder="请输入密码" 
            class="input"
            cursor-spacing="20" 
          />
        </view>
        <button form-type="submit" class="login-btn">登录</button>
        <view class="extra-actions">
          <navigator url="/pages/forget-password/forget-password" class="action-link">忘记密码</navigator>
          <navigator url="/pages/register/register" class="action-link">注册账号</navigator>
        </view>
      </form>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const username = ref('');
const password = ref('');

const handleLogin = async () => {
  console.log('用户名:', username.value);
  console.log('密码:', password.value);
  try {
    const res = await uni.request({
      url: 'http://localhost:8080/api/user/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        username: username.value,
        password: password.value
      }
    });

    if (res.data.code === 200) {
      const { token, user } = res.data.data;
      // 存储 token 到本地
      uni.setStorageSync('token', token);
      // 存储用户信息到本地
      uni.setStorageSync('userInfo', user);
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      });
      // 使用 uni.navigateTo 进行页面跳转
      uni.navigateTo({
        url: '/pages/home/home'
      });
    } else {
      uni.showToast({
        title: '登录失败，请检查用户名和密码',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('登录请求出错:', error);
    uni.showToast({
      title: '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

const onImageError = (e) => {
  console.error('图片加载失败:', e);
};
</script>

<style scoped>
.container {
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.main-content {
  background-color: #f5f5f5;
  padding: 80rpx 40rpx; 
  border-radius: 20rpx;
  width: 100%;
  max-width: 700rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.logo {
  text-align: center;
  margin-bottom: 60rpx;
  width: 100%;
}

.logo image {
  width: 200rpx;
  height: 200rpx;
}

.login-form {
  width: 100%;
  max-width: 600rpx;
}

.form-group {
  margin-bottom: 40rpx;
  width: 100%;
}

.label {
  display: block;
  margin-bottom: 10rpx;
  color: #333;
  font-size: 28rpx;
}

.input {
  width: 100%;
  padding: 20rpx;
  height: 80rpx; 
  background-color: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  border: 1rpx solid #ddd;
  outline: none;
  position: relative;
  z-index: 1;
  font-family: 'Arial', sans-serif;
  letter-spacing: 0rpx; 
}

.login-btn {
  width: 100%;
  padding: 16rpx; 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 60rpx; 
}

.extra-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
  width: 100%;
}

.action-link {
  color: #667eea;
  font-size: 24rpx;
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .main-content {
    padding: 80rpx 30rpx; 
  }

  .login-form {
    max-width: 100%;
  }

  .logo image {
    width: 150rpx;
    height: 150rpx;
  }

  .label {
    font-size: 30rpx;
    padding-bottom: 5rpx;
  }

  .input {
    font-size: 30rpx;
    height: 90rpx; 
  }

  .login-btn {
    font-size: 28rpx;
    padding: 12rpx;
    margin-top: 50rpx;
  }

  .action-link {
    font-size: 24rpx;
  }
}
</style>