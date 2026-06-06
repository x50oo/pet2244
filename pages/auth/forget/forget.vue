<template>
  <view class="reset-page">
    <view class="title">密码重置</view>

    <!-- 手机号输入框 -->
    <view class="form-item">
      <text class="label">账号</text>
      <input class="input" type="number" :adjust-position="true" placeholder="请输入手机号" v-model="phone" maxlength="11" />
    </view>

    <!-- 验证码行 - 标签占位保持对齐 -->
    <view class="form-item code-item">
      <text class="label label-placeholder"></text>
      <input class="input code-input" type="number" :adjust-position="true" placeholder="请输入验证码" v-model="code" maxlength="6" />
      <button class="send-btn" :disabled="isCounting || !canSend" @tap="sendCode">
        {{ isCounting ? count + 's' : '发送验证码' }}
      </button>
    </view>

    <view class="form-item">
      <text class="label">密码</text>
      <input class="input" type="text" password :adjust-position="true" placeholder="请输入新密码" v-model="newPwd" />
    </view>

    <view class="form-item">
      <text class="label label-placeholder"></text>
      <input class="input" type="text" password :adjust-position="true" placeholder="请再次输入新密码" v-model="confirmPwd" />
    </view>

    <button class="reset-btn" @tap="handleReset" :disabled="resetting">
      {{ resetting ? '重置中...' : '确认重置' }}
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
      resetting: false
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
        // 调用后端发送验证码接口
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

    // 重置密码
    async handleReset() {
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
        uni.showToast({ title: '请输入新密码', icon: 'none' })
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

      this.resetting = true
      uni.showLoading({ title: '重置中...' })

      try {
        // 调用后端重置密码接口
        await request({
          url: '/api/auth/reset-password',
          method: 'POST',
          data: {
            phone: this.phone,
            code: this.code,
            newPassword: this.newPwd,
            confirmPassword: this.confirmPwd
          }
        })

        uni.hideLoading()
        uni.showToast({ title: '密码重置成功', icon: 'success' })

        // 延迟返回登录页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)

      } catch (error) {
        uni.hideLoading()
        console.error('重置密码失败:', error)

        // 处理错误
        if (error.code === 400) {
          if (error.message && error.message.includes('验证码')) {
            uni.showToast({ title: '验证码错误或已过期', icon: 'none' })
          } else if (error.message && error.message.includes('不一致')) {
            uni.showToast({ title: '两次密码不一致', icon: 'none' })
          } else {
            uni.showToast({ title: error.message || '重置失败', icon: 'none' })
          }
        } else if (error.code === 404) {
          uni.showModal({
            title: '提示',
            content: '该手机号未注册，是否前往注册？',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: `/pages/auth/register/register?phone=${this.phone}`
                })
              }
            }
          })
        } else {
          uni.showToast({ title: error.message || '重置失败，请重试', icon: 'none' })
        }
      } finally {
        this.resetting = false
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
.reset-page {
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

.reset-btn {
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

.reset-btn:disabled {
  opacity: 0.6;
}
</style>