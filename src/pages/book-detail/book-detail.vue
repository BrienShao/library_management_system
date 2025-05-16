<template>
  <view class="book-detail-container">
    <view class="borrow-status-tag" 
      v-if="['UNCLAIMED', 'CLAIMED', 'UNREPAID'].includes(borrowRecord.state)">
      {{ mapBorrowStatus(borrowRecord.state) }}
    </view>
    <image 
      :src="bookDetail.cover" 
      mode="aspectFit" 
      class="book-cover"
      @error="onImageError"
    />
    <view class="book-info">
      <text class="book-title">{{ bookDetail.title }}</text>
      <text class="book-author">作者: {{ bookDetail.author }}</text>
      <text class="book-isbn">ISBN: {{ bookDetail.isbn }}</text>
      <text class="book-description">描述: {{ bookDetail.description }}</text>
      <text class="book-page-count">页数: {{ bookDetail.pageCount }}</text>
      <text class="book-price">价格: {{ bookDetail.price }}</text>
      <text class="book-publisher">出版商: {{ bookDetail.publisher }}</text>
      <text class="book-publish-date">出版日期: {{ bookDetail.publishedDate }}</text>
      <text class="book-stock-count">库存: {{ bookDetail.stockCount }}</text>
      <text class="book-status">状态: {{ mapBookStatus(bookDetail.state) }}</text>
      <button 
        v-if="bookDetail.state === 'AVAILABLE' &&!['UNCLAIMED', 'CLAIMED', 'UNREPAID'].includes(borrowRecord.state)"
        class="borrow-btn" 
        @click="handleBorrow"
      >
        借阅
      </button>
      <button 
        v-if="['UNCLAIMED', 'CLAIMED', 'UNREPAID'].includes(borrowRecord.state)"
        class="return-btn" 
        @click="handleReturn"
      >
        归还
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const bookDetail = ref({
  id: 0,
  title: '',
  author: '',
  isbn: '',
  description: '',
  pageCount: 0,
  cover: '',
  price: 0,
  publisher: '',
  publishedDate: '',
  stockCount: 0,
  state: ''
});

// 新增借阅记录
const borrowRecord = ref({
  id: 0,
  userId: 0,
  bookId: 0,
  bookName: '',
  author: '',
  image: '',
  createTime: '',
  endTime: '',
  state: ''
});

// 获取图书 ID
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1];
const { id } = currentPage.options;

// 映射图书状态
const mapBookStatus = (state) => {
  const statusMap = {
    'AVAILABLE': '可借阅',
    'BORROWED': '已借出',
    'RESERVED': '被预约',
    'UNDER_MAINTENANCE': '维护中',
    'LOST': '遗失',
    'REMOVED': '下架'
  };
  return statusMap[state] || '未知状态';
};

// 映射借阅状态
const mapBorrowStatus = (state) => {
  const statusMap = {
    'UNCLAIMED': '未领取',
    'CLAIMED': '已领取',
    'UNREPAID': '未归还',
    'REPAID': '已归还'
  };
  return statusMap[state] || '未知状态';
};

// 获取图书详情
const fetchBookDetail = async () => {
  try {
    const token = uni.getStorageSync('token');
    const res = await uni.request({
      url: `http://localhost:8080/api/books/${id}`,
      method: 'GET',
      header: {
        'Authorization': token
      }
    });

    if (res.data.code === 200) {
      bookDetail.value = {
        id: res.data.data.id,
        title: res.data.data.name,
        author: res.data.data.author,
        isbn: res.data.data.isbn,
        description: res.data.data.description,
        pageCount: res.data.data.pageCount,
        cover: res.data.data.image,
        price: res.data.data.price,
        publisher: res.data.data.publisher,
        publishedDate: res.data.data.publishedDate,
        stockCount: res.data.data.stockCount,
        state: res.data.data.state
      };
    } else {
      uni.showToast({
        title: '获取图书详情失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取图书详情出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

// 获取借阅记录
const fetchBorrowRecord = async () => {
  try {
    const token = uni.getStorageSync('token');
    const res = await uni.request({
      url: `http://localhost:8080/api/borrow/book/${id}`,
      method: 'GET',
      header: {
        'Authorization': token
      }
    });

    if (res.data.code === 200 && res.data.data) {
      borrowRecord.value = res.data.data;
    } else {
      borrowRecord.value = {
        id: 0,
        userId: 0,
        bookId: 0,
        bookName: '',
        author: '',
        image: '',
        createTime: '',
        endTime: '',
        state: ''
      };
    }
  } catch (error) {
    console.error('获取借阅记录出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

// 借阅图书逻辑
const handleBorrow = async () => {
  try {
    const token = uni.getStorageSync('token');
    const res = await uni.request({
      url: `http://localhost:8080/api/borrow/${id}`,
      method: 'POST',
      header: {
        'Authorization': token
      }
    });

    if (res.data.code === 200) {
      uni.showToast({
        title: '借阅成功',
        icon: 'success'
      });
      // 借阅成功后重新获取图书详情和借阅记录
      await fetchBookDetail();
      await fetchBorrowRecord();
    } else {
      uni.showToast({
        title: '借阅失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('借阅请求出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

// 归还图书逻辑
const handleReturn = async () => {
  try {
    const token = uni.getStorageSync('token');
    const res = await uni.request({
      url: `http://localhost:8080/api/borrow/${id}`,
      method: 'PATCH',
      header: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        state: borrowRecord.value.state
      }
    });

    if (res.data.code === 200) {
      uni.showToast({
        title: '归还成功',
        icon: 'success'
      });
      // 归还成功后重新获取图书详情和借阅记录
      await fetchBookDetail();
      await fetchBorrowRecord();
    } else {
      uni.showToast({
        title: '归还失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('归还请求出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

const onImageError = (e) => {
  console.error('图片加载失败:', e);
};

onMounted(() => {
  fetchBookDetail();
  fetchBorrowRecord();
});
</script>

<style scoped>
.book-detail-container {
  position: relative;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.borrow-status-tag {
  position: absolute;
  top: 40rpx;
  right: 40rpx;
  background-color: #ff9900;
  color: white;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.book-cover {
  width: 400rpx;
  height: 600rpx;
  margin: 0 auto 40rpx;
}

.book-info {
  background-color: #f5f5f5;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.book-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.book-author, .book-isbn, .book-description, .book-page-count, .book-price, .book-publisher, .book-publish-date, .book-stock-count, .book-status {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.borrow-btn {
  width: 100%;
  padding: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 40rpx;
}

.return-btn {
  width: 100%;
  padding: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 40rpx;
}

.borrow-btn[disabled] {
  background: #cccccc;
}
</style>