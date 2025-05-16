<template>
  <view class="container">
    <view class="page-title">
      <text>修改密码</text>
    </view>
    <view class="form-wrapper">
      <view class="input-group">
        <text class="input-label">旧密码</text>
        <input 
          v-model="oldPassword" 
          type="password" 
          placeholder="请输入旧密码" 
          class="form-input"
        />
      </view>
      <view class="input-group">
        <text class="input-label">新密码</text>
        <input 
          v-model="newPassword" 
          type="password" 
          placeholder="请输入新密码" 
          class="form-input"
        />
      </view>
      <view class="input-group">
        <text class="input-label">确认密码</text>
        <input 
          v-model="confirmPassword" 
          type="password" 
          placeholder="请再次输入新密码" 
          class="form-input"
        />
      </view>
      <button class="submit-btn" @click="handleSubmit">确认修改</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const handleSubmit = async () => {
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({
      title: '两次输入的新密码不一致',
      icon: 'none'
    });
    return;
  }

  try {
    const token = uni.getStorageSync('token');
    const res = await uni.request({
      url: 'http://localhost:8080/api/user/password',
      method: 'PUT',
      header: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      data: {
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value
      }
    });

    if (res.data.code === 200) {
      uni.showToast({
        title: '密码修改成功',
        icon: 'success'
      });
      // 密码修改成功后可跳转到登录页面
      uni.navigateTo({
        url: '/pages/login/login'
      });
    } else {
      uni.showToast({
        title: res.data.msg || '密码修改失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('修改密码出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};
</script>

<style scoped>
.container {
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40rpx;
  text-align: center;
}

.form-wrapper {
  background-color: #f5f5f5;
  border-radius: 20rpx;
  padding: 60rpx 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.form-input {
  width: 100%;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  border: 1rpx solid #ddd;
  outline: none;
  margin-bottom: 30rpx;
  height: 100rpx;
}

.submit-btn {
  width: 100%;
  padding: 16rpx; 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 60rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.input-label {
  display: block;
  margin-bottom: 10rpx;
  color: #333;
  font-size: 30rpx;
}
</style>