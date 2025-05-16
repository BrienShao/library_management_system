<template>
  <view class="container">
    <view class="page-title">
      <text>我的借阅记录</text>
    </view>
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
          placeholder="搜索借阅记录" 
          class="search-input"
          @input="handleSearch"
        />
        <image 
          src="/src/static/search.svg" 
          mode="aspectFit" 
          class="search-btn"
          @click="handleSearch"
        />
      </view>
    </view>
    <scroll-view 
      class="borrow-list" 
      scroll-y 
      @scrolltolower="loadMore"
    >
      <view 
        v-for="record in filteredRecords" 
        :key="record.id" 
        class="borrow-item"
        @click="goToDetail(record.bookId)"
      >
        <view class="book-info-wrapper">
          <image 
            :src="record.bookCover" 
            mode="aspectFit" 
            class="book-cover"
            @error="onImageError"
          />
          <view class="borrow-info">
            <text class="book-title">{{ record.bookTitle }}</text>
            <text class="book-author">作者: {{ record.bookAuthor }}</text>
            <text class="borrow-date">借阅日期: {{ record.borrowDate }}</text>
            <text class="due-date">应还日期: {{ record.dueDate }}</text>
            <text class="borrow-status">状态: {{ record.status }}</text>
          </view>
        </view>
        <view class="action-footer">
          <text 
            class="delete-text" 
            @click.stop="handleDelete(record.id)"
          >
            删除
          </text>
          <view class="spacer"></view>
          <button 
            class="return-btn" 
            @click.stop="handleReturn(record.id)" 
            :disabled="record.status === '已归还'"
          >
            归还
          </button>
        </view>
      </view>
      <!-- 加载提示 -->
      <view v-if="isLoading" class="loading">加载中...</view>
      <view v-if="!isLoading && pageNo.value > 1 && filteredRecords.length === 0" class="no-more">没有更多数据了</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow, onReachBottom } from '@dcloudio/uni-app';
import request from '@/utils/request'; // 引入封装的请求拦截器

// 初始化借阅记录
const borrowRecords = ref([]);
const searchKeyword = ref('');
const selectedCategory = ref('');
const categories = ref(['全部', '未领取', '已领取', '未归还', '已归还']);
const pageNo = ref(1); // 当前页码
const pageSize = ref(10); // 每页显示数量
const total = ref(0); // 总记录数
const isLoading = ref(false); // 加载状态

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// 映射借阅状态
const mapBorrowState = (state) => {
  const stateMap = {
    'UNCLAIMED': '未领取',
    'CLAIMED': '已领取',
    'UNREPAID': '未归还',
    'REPAID': '已归还'
  };
  return stateMap[state] || '未知状态';
};

// 映射借阅状态到接口所需的 state 值
const stateMap = {
  '全部': null,
  '未领取': 'UNCLAIMED',
  '已领取': 'CLAIMED',
  '未归还': 'UNREPAID',
  '已归还': 'REPAID'
};

// 获取借阅记录
const fetchBorrowRecords = async (isLoadMore = false) => {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const res = await request({
      url: 'http://localhost:8080/api/borrow/records',
      method: 'GET',
      data: {
        // 传递 state 参数
        state: stateMap[selectedCategory.value], 
        searchKeyword: searchKeyword.value,
        pageNo: pageNo.value,
        pageSize: pageSize.value
      }
    });

    if (res.data.code === 200) {
      const newRecords = res.data.data.list.map(record => ({
        id: record.id,
        bookId: record.bookId,
        bookTitle: record.bookName,
        bookCover: record.image,
        bookAuthor: record.author,
        borrowDate: record.createTime,
        dueDate: record.endTime,
        status: mapBorrowState(record.state)
      }));

      if (isLoadMore) {
        borrowRecords.value = [...borrowRecords.value, ...newRecords];
      } else {
        borrowRecords.value = newRecords;
      }

      total.value = res.data.data.total; // 更新总记录数
      if (newRecords.length > 0) {
        pageNo.value++;
      }
    } else {
      uni.showToast({
        title: '获取借阅记录失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取借阅记录出错:', error);
    uni.showToast({
      title: error.message || '网络请求出错，请稍后重试',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 计算过滤后的借阅记录列表
const filteredRecords = computed(() => {
  return borrowRecords.value.filter(record => {
    const matchSearch = record.bookTitle.includes(searchKeyword.value) || 
                        record.bookAuthor.includes(searchKeyword.value);
    const matchCategory = selectedCategory.value === '全部' || 
                         selectedCategory.value === '' || 
                         record.status === selectedCategory.value; 
    return matchSearch && matchCategory;
  });
});

const handleSearch = () => {
  pageNo.value = 1; // 搜索时重置页码
  fetchBorrowRecords();
};

const handleCategoryChange = (e) => {
  selectedCategory.value = categories.value[e.detail.value];
  pageNo.value = 1; // 切换分类时重置页码
  fetchBorrowRecords();
};

const goToDetail = (bookId) => {
  // 跳转到图书详情页
  uni.navigateTo({
    url: `/pages/book-detail/book-detail?id=${bookId}`
  });
};

// 修改归还图书逻辑
const handleReturn = async (recordId) => {
  const record = borrowRecords.value.find(r => r.id === recordId);
  if (record && record.status !== '已归还') {
    try {
      const token = uni.getStorageSync('token');
      // 映射当前状态到接口所需的 state 值
      const stateMapping = {
        '未领取': 'UNCLAIMED',
        '已领取': 'CLAIMED',
        '未归还': 'UNREPAID'
      };
      const currentState = stateMapping[record.status];

      const res = await uni.request({
        url: `http://localhost:8080/api/borrow/${record.bookId}`,
        method: 'PATCH',
        header: {
          'Authorization': token,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          // 传递当前状态到后端
          state: currentState
        }
      });

      if (res.data.code === 200) {
        record.status = '已归还';
        uni.showToast({
          title: '归还成功',
          icon: 'success'
        });
        // 归还成功后重置搜索关键词和分类
        searchKeyword.value = '';
        selectedCategory.value = '全部';
        pageNo.value = 1; // 重置页码
        // 归还成功后重新获取借阅记录
        await fetchBorrowRecords();
      } else {
        uni.showToast({
          title: res.data.msg || '归还失败',
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
  }
};

// 修改删除借阅记录逻辑
const handleDelete = async (recordId) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条借阅记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const token = uni.getStorageSync('token');
          const res = await uni.request({
            url: `http://localhost:8080/api/borrow/${recordId}`,
            method: 'DELETE',
            header: {
              'Authorization': token
            }
          });

          if (res.data.code === 200) {
            borrowRecords.value = borrowRecords.value.filter(r => r.id !== recordId);
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
          } else {
            uni.showToast({
              title: res.data.msg || '删除失败',
              icon: 'none'
            });
          }
        } catch (error) {
          console.error('删除借阅记录出错:', error);
          uni.showToast({
            title: error.message || '网络请求出错，请稍后重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

const onImageError = (e) => {
  console.error('图片加载失败:', e);
};

// 加载更多数据
const loadMore = () => {
  if (isLoading.value) return;
  if (pageNo.value <= totalPages.value) {
    fetchBorrowRecords(true);
  }
};

// 监听页面触底事件
onReachBottom(() => {
  loadMore();
});

// 重新获取借阅记录的函数
const refreshBorrowRecords = () => {
  pageNo.value = 1; // 重置页码
  fetchBorrowRecords();
};

onMounted(() => {
  fetchBorrowRecords();
});

// 当页面显示时重新获取借阅记录
onShow(() => {
  refreshBorrowRecords();
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
  min-width: 150rpx; 
}

.picker {
  padding: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: 1rpx solid #ddd;
  text-align: center;
  display: flex; 
  justify-content: center;
  align-items: center;
  white-space: nowrap; 
  overflow: hidden;
  text-overflow: ellipsis; 
}

.borrow-list {
  flex: 1;
}

.borrow-item {
  background-color: #f5f5f5;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.book-info-wrapper {
  display: flex;
  flex-direction: row;
  margin-bottom: 20rpx;
}

.book-cover {
  width: 200rpx;
  height: 300rpx;
  margin-right: 30rpx;
}

.borrow-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.action-footer {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}

.return-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
  color: #fff;
  width: 150rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
}

.delete-text {
  color: #999;
  font-size: 24rpx;
  text-decoration: underline;
  cursor: pointer;
}

.spacer {
  flex: 1;
  width: 100%;
}

.loading, .no-more {
  text-align: center;
  color: #fff;
  font-size: 28rpx;
  padding: 20rpx;
}
</style>