<template>
  <view class="container">
    <view class="user-info">
      <image 
        :src="avatar" 
        mode="aspectFit" 
        class="avatar"
        @click="changeAvatar"
      />
      <text class="username">{{ nickname }}</text>
    </view>
    <view class="menu-list">
      <view class="menu-item" @click="goToPersonalInfo">
        <text>个人信息</text>
        <image
          src="@/static/logo.svg"
          mode="aspectFit"
          class="arrow-icon"
        />
      </view>
      <view class="menu-item" @click="goToBorrowList">
        <text>我的借阅</text>
        <image 
          src="@/static/logo.svg" 
          mode="aspectFit" 
          class="arrow-icon"
        />
      </view>
      <view class="menu-item" @click="goToChangePassword">
        <text>修改密码</text>
        <image 
          src="@/static/logo.svg" 
          mode="aspectFit" 
          class="arrow-icon"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 初始化头像路径和昵称
const avatar = ref('@/static/logo.svg');
const nickname = ref('');

const fetchUserInfoFromCache = () => {
  // 从本地缓存获取用户信息
  const cachedUserInfo = uni.getStorageSync('userInfo');
  if (cachedUserInfo) {
    avatar.value = cachedUserInfo.avatar || '@/static/logo.svg';
    nickname.value = cachedUserInfo.nickname || '';
  }
};

onMounted(() => {
  fetchUserInfoFromCache();
});

onShow(() => {
  // 页面显示时重新获取用户信息
  fetchUserInfoFromCache();
});

const changeAvatar = async () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0];
      try {
        const token = uni.getStorageSync('token');
        // 上传图片
        const uploadRes = await uni.uploadFile({
          url: 'http://localhost:8080/api/upload',
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': token
          }
        });

        const uploadData = JSON.parse(uploadRes.data);
        if (uploadRes.statusCode === 200) {
          // 更新头像
          const updateRes = await uni.request({
            url: 'http://localhost:8080/api/user/updateAvatar',
            method: 'PATCH',
            header: {
              'Authorization': token,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
              avatarUrl: uploadData
            }
          });

          if (updateRes.data.code === 200) {
            // 更新本地头像
            avatar.value = uploadData;
            // 更新本地缓存的用户信息
            const cachedUserInfo = uni.getStorageSync('userInfo');
            if (cachedUserInfo) {
              cachedUserInfo.avatar = uploadData;
              uni.setStorageSync('userInfo', cachedUserInfo);
            }
            uni.showToast({
              title: '头像更换成功',
              icon: 'success'
            });
          } else {
            uni.showToast({
              title: '更新头像失败',
              icon: 'none'
            });
          }
        } else {
          uni.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('更换头像出错:', error);
        uni.showToast({
          title: '网络请求出错，请稍后重试',
          icon: 'none'
        });
      }
    },
    fail: (err) => {
      uni.showToast({
        title: '选择图片失败',
        icon: 'none'
      });
      console.error('选择图片失败:', err);
    }
  });
};

const goToBorrowList = () => {
  uni.navigateTo({
    url: '/pages/borrow-list/borrow-list'
  });
};

const goToPersonalInfo = () => {
  uni.navigateTo({
    url: '/pages/personal-info/personal-info'
  });
};

const goToChangePassword = () => {
  uni.navigateTo({
    url: '/pages/change-password/change-password'
  });
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

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.avatar {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  margin-bottom: 20rpx;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.menu-list {
  background-color: #f5f5f5;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  padding: 10rpx;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #ddd;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item text {
  font-size: 28rpx;
  color: #333;
}

.arrow-icon {
  width: 30rpx;
  height: 30rpx;
}
</style>