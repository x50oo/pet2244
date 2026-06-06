<template>
  <view class="login-page">
    <view class="title">宠安心用户登录</view>

    <view class="form-item">
      <text class="label">手机号</text>
      <input class="input" type="number" :adjust-position="true" placeholder="请输入手机号" v-model="phone" maxlength="11" />
    </view>

    <view class="form-item">
      <text class="label">密码</text>
      <input class="input" :type="showPassword ? 'text' : 'password'" :adjust-position="true" placeholder="请输入密码" v-model="password" />
      <view class="eye-icon" @tap="showPassword = !showPassword" v-if="password">
        <text>{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text>
      </view>
    </view>

    <view class="forgot-wrap">
      <text class="forgot-pwd" @tap="goForgotPwd">忘记密码</text>
    </view>

    <view class="agree-wrap" @tap="toggleAgree">
      <checkbox :checked="isAgree" style="transform:scale(0.7)" />
      <text class="agree-text">我已同意用户隐私协议</text>
    </view>

    <button class="login-btn" @tap="handleLogin" :disabled="loading" :class="{ 'btn-disabled': loading }">
      {{ loading ? '登录中...' : '登录' }}
    </button>

    <button class="register-btn" type="default" @click="goRegister">注册</button>

    <view class="other-login">
      <text class="text">其他登录方式：</text>
      <image class="wx-icon" src="/static/微信.png" mode="aspectFit" @tap="wxLogin" />
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      phone: '',
      password: '',
      isAgree: false,
      loading: false,
      showPassword: false
    }
  },
  methods: {
    toggleAgree() {
      this.isAgree = !this.isAgree
    },
    
    validatePhone() {
      if (!this.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return false
      }
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
        return false
      }
      return true
    },
    
    async handleLogin() {
      if (!this.validatePhone()) return
      
      if (!this.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }
      
      if (this.password.length < 6) {
        uni.showToast({ title: '密码长度不能小于6位', icon: 'none' })
        return
      }
      
      if (!this.isAgree) {
        uni.showToast({ title: '请先同意用户隐私协议', icon: 'none' })
        return
      }
      
      this.loading = true
      
      try {
        const res = await request({
          url: '/api/auth/phone-login',
          method: 'POST',
          data: {
            phone: this.phone,
            password: this.password
          }
        })
        
        // 保存登录信息
        uni.setStorageSync('token', res.token)
        uni.setStorageSync('userInfo', {
          userId: res.userId,
          nickname: res.nickname,
          phone: res.phone,
          avatarUrl: res.avatarUrl || '',
          role: 0
        })
        
        uni.showToast({ title: '登录成功', icon: 'success' })
        
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/home/index'
          })
        }, 1500)
        
      } catch (error) {
        console.error('登录失败:', error)
        
        if (error && error.code === 403) {
          uni.showToast({ title: error.message || '账号已被锁定', icon: 'none' })
        } else if (error && error.code === 400) {
          if (error.message && error.message.includes('不存在')) {
            uni.showModal({
              title: '提示',
              content: '账号不存在，是否前往注册？',
              success: (res) => {
                if (res.confirm) {
                  uni.navigateTo({
                    url: `/pages/auth/register/register?phone=${this.phone}`
                  })
                }
              }
            })
          } else {
            uni.showToast({ title: error.message || '密码错误', icon: 'none' })
          }
        } else {
          uni.showToast({ title: error?.message || '登录失败', icon: 'none' })
        }
      } finally {
        this.loading = false
      }
    },
    
    async wxLogin() {
      if (!this.isAgree) {
        uni.showToast({ title: '请先同意用户隐私协议', icon: 'none' })
        return
      }
      
      uni.showLoading({ title: '登录中...' })
      
      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            success: resolve,
            fail: reject
          })
        })
        
        const res = await request({
          url: '/api/auth/wechat-login',
          method: 'POST',
          data: {
            code: loginRes.code
          }
        })
        
        uni.setStorageSync('token', res.token)
        uni.setStorageSync('userInfo', {
          userId: res.userId,
          nickname: res.nickname,
          phone: res.phone || '',
          avatarUrl: res.avatarUrl || '',
          role: 0
        })
        
        uni.hideLoading()
        uni.showToast({ title: '登录成功', icon: 'success' })
        
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/home/index'
          })
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('微信登录失败:', error)
        
        if (error && error.code === 400) {
          uni.showToast({ title: '登录凭证无效，请重试', icon: 'none' })
        } else if (error && error.code === 500) {
          uni.showToast({ title: '服务器异常，请稍后重试', icon: 'none' })
        } else {
          uni.showToast({ title: error?.message || '微信登录失败', icon: 'none' })
        }
      }
    },
    
    goForgotPwd() {
      uni.navigateTo({
        url: '/pages/auth/forget/forget'
      })
    },
    
    goRegister() {
      uni.navigateTo({
        url: '/pages/auth/register/register'
      })
    }
  }
}
</script>

<style scoped>
.login-page {
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
  margin-bottom: 30rpx;
  position: relative;
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

.eye-icon {
  position: absolute;
  right: 20rpx;
  padding: 10rpx;
  font-size: 32rpx;
}

.forgot-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 40rpx;
}

.forgot-pwd {
  font-size: 28rpx;
  color: #D4A036;
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
  background-color: #FFE0A8;
  color: #D4A036;
  font-size: 36rpx;
  font-weight: bold;
  border: 2rpx solid #999;
  border-radius: 8rpx;
  margin-bottom: 30rpx;
}

.login-btn.btn-disabled {
  opacity: 0.6;
}

.register-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: transparent;
  color: #D4A036;
  font-size: 30rpx;
  border: none;
  margin-bottom: 60rpx;
}
.register-btn::after {
  border: none;
}

.other-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.other-login .text {
  font-size: 30rpx;
  color: #D4A036;
}

.wx-icon {
  width: 60rpx;
  height: 60rpx;
}
</style>