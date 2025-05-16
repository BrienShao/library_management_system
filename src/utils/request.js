const request = async (options) => {
  // 检查 token 是否存在
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({
      url: '/pages/login/login'
    });
    return Promise.reject(new Error('未登录'));
  }

  const defaultOptions = {
    header: {
      'Authorization': token
    },
    ...options
  };

  try {
    const res = await uni.request(defaultOptions);
    // 检查响应状态，假设 token 过期返回状态码 401
    if (res.data.code === 401) {
      // 清除过期的 token
      uni.removeStorageSync('token');
      uni.navigateTo({
        url: '/pages/login/login'
      });
      return Promise.reject(new Error('请重新登录'));
    }
    return res;
  } catch (error) {
    return Promise.reject(error);
  }
};

export default request;