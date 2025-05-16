<template>
  <view class="container">
    <view class="search-and-filter">
      <picker 
        v-model="selectedCategory" 
        :range="categories" 
        class="category-picker"
        @change="handleCategoryChange"
      >
        <view class="picker">{{ selectedCategory || '全部' }}</view>
      </picker>
      <view class="search-wrapper">
        <input 
          v-model="searchKeyword" 
          placeholder="搜索图书" 
          class="search-input"
          @input="handleSearch"
        />
        <image 
          src="/src/static/search.svg" 
          mode="aspectFit" 
          class="search-btn"
          @click="handleSearch"
        />
        <image 
          :src="userInfo.avatar || '@/static/mine.svg'" 
          mode="aspectFit" 
          class="mine-icon"
          @click="goToMyPage"
        />
      </view>
    </view>
    <scroll-view class="book-list" scroll-y>
      <view 
        v-for="book in filteredBooks" 
        :key="book.id" 
        class="book-item"
        @click="goToDetail(book.id)"
      >
        <image 
          :src="book.cover" 
          mode="aspectFit" 
          class="book-cover"
          @error="onImageError"
        />
        <view class="book-info">
          <text class="book-title">{{ book.title }}</text>
          <text class="book-author">作者: {{ book.author }}</text>
          <text class="book-publisher">出版商: {{ book.publisher }}</text>
          <text class="book-publish-date">出版时间: {{ book.publishDate }}</text>
          <text class="book-status">状态: {{ book.status }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onReachBottom } from '@dcloudio/uni-app';
import request from '@/utils/request';

const books = ref([]);
const searchKeyword = ref('');
const selectedCategory = ref('全部');
const categories = ref(['全部']);
const pageNo = ref(1);
const pageSize = ref(10);
const isLoading = ref(false);

// 分类 ID 映射
const categoryIdMap = {
  '全部': null
};

// 获取图书列表
const fetchBooks = async (isLoadMore = false) => {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    if (!isLoadMore) {
      pageNo.value = 1;
    }

    const res = await request({
      url: 'http://localhost:8080/api/books',
      method: 'GET',
      data: {
        pageNo: pageNo.value,
        pageSize: pageSize.value,
        categoryId: categoryIdMap[selectedCategory.value],
        searchKeyword: searchKeyword.value
      }
    });

    if (res.data.code === 200) {
      const newBooks = res.data.data.list.map(book => ({
        id: book.id,
        title: book.name,
        cover: book.image,
        author: book.author,
        publisher: book.publisher,
        publishDate: book.publishedDate,
        status: mapBookStatus(book.state)
      }));

      if (isLoadMore) {
        books.value = [...books.value, ...newBooks];
      } else {
        books.value = newBooks;
      }

      if (newBooks.length > 0) {
        pageNo.value++;
      }
    } else {
      uni.showToast({
        title: '获取图书列表失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取图书列表出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

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

// 获取分类列表
const fetchCategories = async () => {
  try {
    const token = uni.getStorageSync('token');
    const res = await uni.request({
      url: 'http://localhost:8080/api/category',
      method: 'GET',
      header: {
        'Authorization': token
      }
    });

    if (res.data.code === 200) {
      const categoryList = res.data.data.map(category => category.categoryName);
      categories.value = ['全部', ...categoryList];
      categoryList.forEach(category => {
        const categoryObj = res.data.data.find(c => c.categoryName === category);
        if (categoryObj) {
          categoryIdMap[category] = categoryObj.id;
        }
      });
    } else {
      uni.showToast({
        title: '获取分类列表失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取分类列表出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  }
};

// 计算过滤后的图书列表
const filteredBooks = computed(() => {
  return books.value.filter(book => {
    const matchSearch = book.title.includes(searchKeyword.value) || 
                        book.author.includes(searchKeyword.value);
    const matchCategory = selectedCategory.value === '全部' || 
                         selectedCategory.value === '' || 
                         true; 
    return matchSearch && matchCategory;
  });
});

const handleSearch = () => {
  pageNo.value = 1;
  fetchBooks();
};

const handleCategoryChange = (e) => {
  selectedCategory.value = categories.value[e.detail.value];
  pageNo.value = 1;
  fetchBooks();
};

const goToDetail = (bookId) => {
  // 跳转到图书详情页
  uni.navigateTo({
    url: `/pages/book-detail/book-detail?id=${bookId}`
  });
};

const onImageError = (e) => {
  console.error('图片加载失败:', e);
};

const goToMyPage = () => {
  uni.navigateTo({
    url: '/pages/my/my'
  });
};

const userInfo = ref({});

onMounted(() => {
  // 从缓存中获取用户信息
  const cachedUserInfo = uni.getStorageSync('userInfo');
  if (cachedUserInfo) {
    userInfo.value = cachedUserInfo;
  }
  fetchCategories(); // 组件挂载时获取分类列表
  fetchBooks();
});

// 加载更多数据
const loadMore = () => {
  fetchBooks(true);
};

// 监听页面触底事件
onReachBottom(() => {
  loadMore();
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

.search-and-filter {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;
  flex-direction: row;
  gap: 20rpx; 
}

.search-wrapper {
  position: relative;
  flex: 1; 
}

.search-input {
  width: 100%;
  padding: 20rpx 60rpx 20rpx 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  border: 1rpx solid #ddd;
  outline: none;
  height: 80rpx; 
}

.search-btn {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 30rpx;
  height: 30rpx;
  cursor: pointer;
}

.category-picker {
    width: auto; 
    max-width: 200rpx; 
  }

  .picker {
    padding: 20rpx;
    background-color: #fff;
    border-radius: 16rpx;
    font-size: 28rpx;
    border: 1rpx solid #ddd;
    text-align: center;
    word-wrap: break-word; 
    min-width: 120rpx; 
  }

.book-list {
  flex: 1;
}

.book-item {
  background-color: #f5f5f5;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.book-cover {
  width: 200rpx;
  height: 300rpx;
  margin-right: 30rpx;
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; 
}

.book-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.book-author, .book-publisher, .book-publish-date {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.book-status {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.detail-btn {
  display: none;
}

.mine-icon {
  position: fixed;
  right: 40rpx;
  bottom: 40rpx;
  width: 80rpx;
  height: 80rpx;
  z-index: 999;
}
</style>