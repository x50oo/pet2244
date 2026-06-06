<template>
  <view class="settings-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">更多设置</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 设置分组1 -->
    <view class="setting-group">
      <view class="setting-item" @tap="goToPersonalInfo">
        <text class="item-title">个人信息</text>
        <text class="arrow-icon">›</text>
      </view>
      <view class="setting-item" @tap="goToAddress">
        <text class="item-title">收货地址</text>
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <!-- 3. 设置分组2 -->
    <view class="setting-group">
      <view class="setting-item" @tap="goToAccountSecurity">
        <text class="item-title">账号安全</text>
        <view class="right-area">
          <text class="tag-text" :class="authStatusClass">{{ authStatusText }}</text>
          <text class="arrow-icon">›</text>
        </view>
      </view>
      <view class="setting-item" @tap="goToPrivacySetting">
        <text class="item-title">隐私设置</text>
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <!-- 4. 设置分组3 -->
    <view class="setting-group">
      <view class="setting-item" @tap="goToPaymentSetting">
        <text class="item-title">支付设置</text>
        <text class="arrow-icon">›</text>
      </view>
      <view class="setting-item" @tap="goToNotificationSetting">
        <text class="item-title">消息通知</text>
        <text class="arrow-icon">›</text>
      </view>
      <view class="setting-item" @tap="goToGeneralSetting">
        <text class="item-title">通用设置</text>
        <text class="arrow-icon">›</text>
      </view>
      <view class="setting-item" @tap="clearCache">
        <text class="item-title">清理缓存</text>
        <view class="right-area">
          <text class="cache-size">{{ cacheSize }}</text>
          <text class="arrow-icon">›</text>
        </view>
      </view>
    </view>

    <!-- 5. 关于我们 -->
    <view class="setting-group">
      <view class="setting-item" @tap="goToAbout">
        <text class="item-title">关于我们</text>
        <text class="arrow-icon">›</text>
      </view>
      <view class="setting-item" @tap="goToUserAgreement">
        <text class="item-title">用户协议</text>
        <text class="arrow-icon">›</text>
      </view>
      <view class="setting-item" @tap="goToPrivacyPolicy">
        <text class="item-title">隐私政策</text>
        <text class="arrow-icon">›</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      cacheSize: '计算中...',
      authStatus: null,  // 1:未认证, 2:认证中, 3:已认证
      authStatusText: '加载中...',
      authStatusClass: ''
    }
  },
  onShow() {
    this.getCacheSize()
    this.getAuthStatus()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 获取缓存大小 ==========
    getCacheSize() {
      // #ifdef MP-WEIXIN
      // 小程序获取缓存大小
      try {
        const res = uni.getStorageInfoSync()
        const size = (res.currentSize / 1024).toFixed(1)
        this.cacheSize = `${size}KB`
      } catch (e) {
        this.cacheSize = '0KB'
      }
      // #endif
      
      // #ifdef APP-PLUS
      plus.cache.calculate((size) => {
        this.cacheSize = (size / 1024 / 1024).toFixed(1) + 'MB'
      })
      // #endif
    },
    
    // ========== 获取实名认证状态 ==========
    async getAuthStatus() {
      try {
        // 尝试获取实名认证状态
        const res = await request({
          url: '/api/user/auth-status',
          method: 'GET'
        })
        
        if (res && res.status === 2) {
          this.authStatus = 3
          this.authStatusText = '已认证'
          this.authStatusClass = 'auth-pass'
        } else if (res && res.status === 1) {
          this.authStatus = 2
          this.authStatusText = '认证中'
          this.authStatusClass = 'auth-pending'
        } else {
          this.authStatus = 1
          this.authStatusText = '未认证'
          this.authStatusClass = 'auth-none'
        }
      } catch (error) {
        console.log('获取认证状态失败', error)
        this.authStatus = 1
        this.authStatusText = '未认证'
        this.authStatusClass = 'auth-none'
      }
    },
    
    // ========== 清理缓存 ==========
    clearCache() {
      uni.showModal({
        title: '提示',
        content: `确定清理缓存吗？当前缓存大小：${this.cacheSize}`,
        success: (res) => {
          if (res.confirm) {
            // #ifdef MP-WEIXIN
            try {
              // 清除存储，保留token和userInfo
              const token = uni.getStorageSync('token')
              const userInfo = uni.getStorageSync('userInfo')
              uni.clearStorageSync()
              if (token) uni.setStorageSync('token', token)
              if (userInfo) uni.setStorageSync('userInfo', userInfo)
              this.cacheSize = '0KB'
            } catch (e) {
              console.log('清理失败', e)
            }
            // #endif
            
            // #ifdef APP-PLUS
            plus.cache.clear(() => {
              this.cacheSize = '0MB'
              uni.showToast({ title: '缓存已清理', icon: 'success' })
            })
            // #endif
            
            uni.showToast({ title: '缓存已清理', icon: 'success' })
          }
        }
      })
    },
    
    // ========== 页面跳转 ==========
    goToPersonalInfo() {
      uni.navigateTo({
        url: '/pages/user/profile/index'
      })
    },
    
    goToAddress() {
      uni.navigateTo({
        url: '/pages/user/address/index'
      })
    },
    
    goToAccountSecurity() {
      uni.navigateTo({
        url: '/pages/user/security/index'
      })
    },
    
    goToPrivacySetting() {
      uni.navigateTo({
        url: '/pages/user/privacy/index'
      })
    },
    
    goToPaymentSetting() {
      uni.showToast({ title: '支付设置开发中', icon: 'none' })
    },
    
    goToNotificationSetting() {
      uni.showToast({ title: '消息通知设置开发中', icon: 'none' })
    },
    
    goToGeneralSetting() {
      uni.showToast({ title: '通用设置开发中', icon: 'none' })
    },
    
    goToAbout() {
      uni.navigateTo({
        url: '/pages/about/index'
      })
    },
    
    goToUserAgreement() {
      uni.navigateTo({
        url: '/pages/common/webview?title=用户协议&url=/agreement/user'
      })
    },
    
    goToPrivacyPolicy() {
      uni.navigateTo({
        url: '/pages/common/webview?title=隐私政策&url=/agreement/privacy'
      })
    }
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

/* 1. 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
}
.back-icon {
  font-size: 40rpx;
  color: #333;
}
.title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}
.placeholder {
  width: 40rpx;
}

/* 设置分组 */
.setting-group {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);
}
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}
.setting-item:last-child {
  border-bottom: none;
}
.item-title {
  font-size: 28rpx;
  color: #333;
}
.right-area {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.tag-text {
  font-size: 24rpx;
}
.tag-text.auth-none {
  color: #999;
}
.tag-text.auth-pending {
  color: #FF9800;
}
.tag-text.auth-pass {
  color: #4CAF50;
}
.cache-size {
  font-size: 24rpx;
  color: #999;
}
.arrow-icon {
  font-size: 36rpx;
  color: #ccc;
}
</style>