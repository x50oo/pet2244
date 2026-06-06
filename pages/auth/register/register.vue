<template>
  <view class="register-page">
    <view class="title">宠安心注册</view>

    <view class="form-item">
      <text class="label">手机号</text>
      <input class="input" type="number" :adjust-position="true" placeholder="请输入手机号" v-model="phone" maxlength="11" />
    </view>

    <view class="form-item code-item">
      <text class="label label-placeholder"></text>
      <input class="input code-input" type="number" :adjust-position="true" placeholder="请输入验证码" v-model="code" maxlength="6" />
      <button class="send-btn" :disabled="isCounting || !canSend" @tap="sendCode">
        {{ isCounting ? count + 's' : '发送验证码' }}
      </button>
    </view>

    <view class="form-item">
      <text class="label">密码</text>
      <input class="input" type="text" password :adjust-position="true" placeholder="请设置密码" v-model="newPwd" />
    </view>

    <view class="form-item">
      <text class="label label-placeholder"></text>
      <input class="input" type="text" password :adjust-position="true" placeholder="请再次输入密码" v-model="confirmPwd" />
    </view>

    <button class="register-btn" @tap="handleRegister" :disabled="registering">
      {{ registering ? '注册中...' : '确认注册' }}
    </button>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      phone: '',
      code: '',
      newPwd: '',
      confirmPwd: '',
      isCounting: false,
      count: 60,
      timer: null,
      registering: false
    }
  },
  computed: {
    canSend() {
      return /^1[3-9]\d{9}$/.test(this.phone)
    }
  },
  methods: {
    // 发送验证码
    async sendCode() {
      // 手机号验证
      if (!this.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }

      uni.showLoading({ title: '发送中...' })

      try {
        // ✅ 修改：添加 /api 前缀
        await request({
          url: '/api/auth/send-code',
          method: 'POST',
          data: {
            phone: this.phone
          }
        })

        uni.hideLoading()
        uni.showToast({ title: '验证码已发送', icon: 'success' })

        // 开始倒计时
        this.isCounting = true
        this.count = 60
        this.timer = setInterval(() => {
          this.count--
          if (this.count <= 0) {
            clearInterval(this.timer)
            this.isCounting = false
          }
        }, 1000)

      } catch (error) {
        uni.hideLoading()
        console.error('发送验证码失败:', error)
        uni.showToast({ title: error.message || '发送失败，请重试', icon: 'none' })
      }
    },

    // 用户注册
    async handleRegister() {
      // 表单验证
      if (!this.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      if (!this.code) {
        uni.showToast({ title: '请输入验证码', icon: 'none' })
        return
      }
      if (this.code.length !== 6) {
        uni.showToast({ title: '验证码为6位数字', icon: 'none' })
        return
      }
      if (!this.newPwd) {
        uni.showToast({ title: '请设置密码', icon: 'none' })
        return
      }
      if (this.newPwd.length < 6) {
        uni.showToast({ title: '密码长度不能少于6位', icon: 'none' })
        return
      }
      if (this.newPwd !== this.confirmPwd) {
        uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
        return
      }

      this.registering = true
      uni.showLoading({ title: '注册中...' })

      try {
        // ✅ 修改：添加 /api 前缀
        const res = await request({
          url: '/api/auth/register',
          method: 'POST',
          data: {
            phone: this.phone,
            code: this.code,
            password: this.newPwd,
            confirmPassword: this.confirmPwd
          }
        })

        uni.hideLoading()
        
        // 注册成功，自动登录
        uni.setStorageSync('token', res.token)
        uni.setStorageSync('userInfo', {
          userId: res.userId,
          nickname: res.nickname,
          phone: res.phone,
          avatarUrl: res.avatarUrl || '',
          role: 0,
          isNewUser: true
        })

        uni.showToast({ title: '注册成功', icon: 'success' })

        // 延迟跳转到首页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/home/index'
          })
        }, 1500)

      } catch (error) {
        uni.hideLoading()
        console.error('注册失败:', error)

        // 处理错误
        if (error.code === 400) {
          if (error.message && error.message.includes('验证码')) {
            uni.showToast({ title: '验证码错误或已过期', icon: 'none' })
          } else if (error.message && error.message.includes('密码不一致')) {
            uni.showToast({ title: '两次密码不一致', icon: 'none' })
          } else {
            uni.showToast({ title: error.message || '注册失败', icon: 'none' })
          }
        } else if (error.code === 409) {
          uni.showModal({
            title: '提示',
            content: '该手机号已注册，是否直接登录？',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: `/pages/auth/login/login?phone=${this.phone}`
                })
              }
            }
          })
        } else {
          uni.showToast({ title: error.message || '注册失败，请重试', icon: 'none' })
        }
      } finally {
        this.registering = false
      }
    }
  },
  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>

<style scoped>
.register-page {
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

.label-placeholder {
  visibility: hidden;
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

.code-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.code-input {
  flex: 1;
}

.send-btn {
  width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D4A036;
  font-size: 26rpx;
  font-weight: bold;
  border: 2rpx solid #999;
  border-radius: 8rpx;
  text-align: center;
  padding: 0;
}

.send-btn:disabled {
  background-color: #eee;
  color: #999;
}

.register-btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background-color: #FFE0A8;
  color: #D4A036;
  font-size: 36rpx;
  font-weight: bold;
  border: 2rpx solid #999;
  border-radius: 8rpx;
  margin-top: 40rpx;
}

.register-btn:disabled {
  opacity: 0.6;
}
</style>