<template>
  <view class="admin-login-page">
    <view class="title">宠安心管理员登录</view>

    <view class="form-item">
      <text class="label">账号</text>
      <input class="input" type="text" :adjust-position="true" placeholder="请输入管理员账号" v-model="username" />
    </view>

    <view class="form-item">
      <text class="label">密码</text>
      <input class="input" type="text" password :adjust-position="true" placeholder="请输入密码" v-model="password" />
    </view>

    <view class="agree-wrap" @tap="toggleAgree">
      <checkbox :checked="isAgree" />
      <text class="agree-text">我已同意用户隐私协议</text>
    </view>

    <button class="login-btn" @tap="handleLogin" :disabled="loading" :class="{ 'btn-disabled': loading }">
      {{ loading ? '登录中...' : '登录' }}
    </button>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      username: '',
      password: '',
      isAgree: false,
      loading: false
    }
  },
  methods: {
    toggleAgree() {
      this.isAgree = !this.isAgree
    },
    
async handleLogin() {
  // 表单验证
  if (!this.username || !this.password) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' })
    return
  }
  
  if (!this.isAgree) {
    uni.showToast({ title: '请先同意用户隐私协议', icon: 'none' })
    return
  }
  
  this.loading = true
  
  try {
    // 调用后端管理员登录接口
    const res = await request({
      url: '/api/admin/login',
      method: 'POST',
      data: {
        username: this.username,
        password: this.password
      }
    })
    
    // 保存登录信息
    uni.setStorageSync('token', res.token)
    uni.setStorageSync('userInfo', {
      userId: res.adminId,
      username: this.username,
      nickname: res.realName,
      role: 1,  // 1=管理员
      isAdmin: true
    })
    
    uni.showToast({ title: '管理员登录成功', icon: 'success' })
    
    setTimeout(() => {
      // 使用 reLaunch 跳转到管理首页
      uni.reLaunch({
        url: '/pages/admin/index'
      })
    }, 1500)
    
  } catch (error) {
    console.error('管理员登录失败:', error)
    
    if (error.code === 400) {
      uni.showToast({ title: error.message || '账号或密码错误', icon: 'none' })
    } else if (error.code === 401) {
      uni.showToast({ title: '账号已被禁用或锁定', icon: 'none' })
    } else {
      uni.showToast({ title: error.message || '登录失败，请重试', icon: 'none' })
    }
  } finally {
    this.loading = false
  }
  }
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding: 80rpx 60rpx;
  box-sizing: border-box;
  padding-top: calc(100vh / 8);
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 80rpx;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.label {
  font-size: 32rpx;
  color: #333;
  width: 120rpx;
  font-weight: bold;
}

.input {
  flex: 1;
  height: 80rpx;
  border: 2rpx solid #333;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background-color: #FFFFFF;
}

.agree-wrap {
  display: flex;
  align-items: center;
  margin-bottom: 60rpx;
  padding-left: 120rpx;
}

.agree-text {
  font-size: 28rpx;
  color: #333;
  margin-left: 10rpx;
}

.login-btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background-color: #E6D2B5;
  color: #8B7355;
  font-size: 36rpx;
  font-weight: bold;
  border: 2rpx solid #999;
  border-radius: 8rpx;
}

.login-btn.btn-disabled {
  opacity: 0.6;
}
</style>