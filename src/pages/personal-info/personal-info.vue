<template>
  <view class="container">
    <view class="page-title">
      <text>个人信息</text>
    </view>
    <view class="info-list">
      <view class="info-item">
        <text class="label">用户名</text>
        <text class="value">{{ username }}</text>
      </view>
      <view class="info-item">
        <text class="label">昵称</text>
        <input 
          v-model="nickname" 
          class="edit-input" 
          placeholder="请输入昵称"
        />
      </view>
      <view class="info-item">
        <text class="label">电话</text>
        <input 
          v-model="phone" 
          class="edit-input" 
          placeholder="请输入电话"
          type="number"
        />
      </view>
      <view class="info-item">
        <text class="label">邮箱</text>
        <input 
          v-model="email" 
          class="edit-input" 
          placeholder="请输入邮箱"
        />
      </view>
      <view class="info-item">
        <text class="label">性别</text>
        <picker 
          v-model="gender" 
          :range="genders" 
          class="gender-picker"
          @change="handleGenderChange"
        >
          <view class="picker">{{ gender }}</view>
        </picker>
      </view>
      <view class="info-item">
        <text class="label">生日</text>
        <picker 
          v-model="birthday" 
          mode="date" 
          class="birthday-picker"
          @change="handleBirthdayChange"
        >
          <view class="picker">{{ birthday }}</view>
        </picker>
      </view>
      <view class="info-item">
        <text class="label">可借数量</text>
        <text class="value">{{ amount }}</text>
      </view>
    </view>
    <button class="save-btn" @click="handleSave">保存</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '@/utils/request';

// 初始化可编辑字段
const nickname = ref('');
const phone = ref('');
const email = ref('');
const gender = ref('');
const genders = ref(['男', '女']);
const birthday = ref('');
const amount = ref(0);
const username = ref('');
const userId = ref(0);

// 获取个人信息
const fetchUserInfo = async () => {
  try {
    const res = await request({
      url: 'http://localhost:8080/api/user/info',
      method: 'GET'
    });

    if (res.data.code === 200) {
      const userInfo = res.data.data;
      userId.value = userInfo.id;
      username.value = userInfo.username;
      nickname.value = userInfo.nickname;
      phone.value = userInfo.phone;
      email.value = userInfo.email;
      gender.value = userInfo.gender;
      birthday.value = userInfo.birthday;
      amount.value = userInfo.amount;
      // 更新本地缓存
      uni.setStorageSync('userInfo', userInfo);
    } else {
      uni.showToast({
        title: '获取个人信息失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取个人信息出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

const handleGenderChange = (e) => {
  gender.value = genders.value[e.detail.value];
};

const handleBirthdayChange = (e) => {
  birthday.value = e.detail.value;
};

// 保存用户信息
const handleSave = async () => {
  try {
    const token = uni.getStorageSync('token');

    const res = await request({
      url: 'http://localhost:8080/api/user/info',
      method: 'PUT',
      header: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      data: {
        id: userId.value,
        username: username.value,
        gender: gender.value,
        phone: phone.value,
        nickname: nickname.value,
        email: email.value,
        birthday: birthday.value
      }
    });

    if (res.data.code === 200) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      });
      // 保存成功后重新获取个人信息
      await fetchUserInfo();
    } else {
      uni.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('保存用户信息出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

onMounted(() => {
  fetchUserInfo();
});
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

.info-list {
  background-color: #f5f5f5;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 40rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #ddd;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 28rpx;
  color: #666;
}

.value {
  font-size: 28rpx;
  color: #333;
}

.edit-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.gender-picker {
  flex: 1;
  text-align: right;
}

.birthday-picker {
  flex: 1;
  text-align: right;
}

.picker {
  text-align: right;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.save-btn {
  width: 100%;
  padding: 16rpx; 
  background: linear-gradient(135deg, #66eae6 0%, #4ba27f 100%);
  color: #fffffffc;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 60rpx; 
}
</style>