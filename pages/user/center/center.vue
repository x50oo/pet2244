<template>
  <view class="admin-profile-page">
    <!-- 1. 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar">
        <image 
          v-if="userInfo.avatarUrl" 
          class="avatar-img" 
          :src="userInfo.avatarUrl" 
          mode="aspectFill" 
        />
        <text v-else class="avatar-text">👤</text>
      </view>
      <view class="user-info">
        <view class="role-tag admin">管理员</view>
        <view class="nickname">昵称：{{ userInfo.nickname || '未设置' }}</view>
        <view class="phone">手机号：{{ userInfo.phone || '未绑定' }}</view>
        <view class="contact" v-if="userInfo.contact">联系方式：{{ userInfo.contact }}</view>
        <view class="address" v-if="userInfo.address">地址：{{ userInfo.address }}</view>
      </view>
      <view class="edit-btn" @tap="editProfile">
        <text class="edit-icon">✎</text>
      </view>
    </view>

    <!-- 2. 功能入口（管理员） -->
    <view class="function-item" @tap="goToHistoryAudit">
      <text class="func-icon">📋</text>
      <text class="func-text">历史审核</text>
    </view>

    <!-- 3. 设置与操作区 -->
    <view class="setting-item" @tap="goToMoreSetting">更多设置</view>
    <view class="logout-btn" @tap="logout">退出登录</view>

    <!-- 4. 底部Tab栏 -->
    <view class="tabbar">
      <view class="tabbar-item" :class="{ active: currentTab === 'home' }" @tap="switchTab('home')">
        <image class="tabbar-icon" :src="currentTab === 'home' ? '/static/tabbar/home-active.png' : '/static/tabbar/home.png'" mode="aspectFit" />
        <text class="tabbar-text">首页</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'message' }" @tap="switchTab('message')">
        <image class="tabbar-icon" :src="currentTab === 'message' ? '/static/tabbar/message-active.png' : '/static/tabbar/message.png'" mode="aspectFit" />
        <text class="tabbar-text">消息</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'profile' }" @tap="switchTab('profile')">
        <image class="tabbar-icon" :src="currentTab === 'profile' ? '/static/tabbar/user-active.png' : '/static/tabbar/user.png'" mode="aspectFit" />
        <text class="tabbar-text">个人中心</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      currentTab: 'profile',
      userInfo: {
        userId: null,
        nickname: '',
        phone: '',
        avatarUrl: '',
        contact: '',
        address: '',
        role: 1
      },
      loading: false
    }
  },
  onShow() {
    this.loadUserInfo()
  },
  methods: {
    // 加载用户信息
    async loadUserInfo() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/user/me',
          method: 'GET'
        })
        
        this.userInfo = {
          userId: res.userId,
          nickname: res.nickname,
          phone: res.phone,
          avatarUrl: res.avatarUrl,
          contact: res.contact || '',
          address: res.address || '',
          role: 1
        }
        
      } catch (error) {
        console.error('加载用户信息失败', error)
        const storedUser = uni.getStorageSync('userInfo')
        if (storedUser) {
          this.userInfo = {
            userId: storedUser.userId,
            nickname: storedUser.nickname,
            phone: storedUser.phone,
            avatarUrl: storedUser.avatarUrl,
            contact: storedUser.contact || '',
            address: storedUser.address || '',
            role: 1
          }
        }
      } finally {
        this.loading = false
      }
    },
    
    // 切换底部Tab
    switchTab(tab) {
      this.currentTab = tab
      if (tab === 'home') {
        uni.reLaunch({ url: '/pages/admin/index' })
      } else if (tab === 'message') {
        uni.reLaunch({ url: '/pages/message/adminList' })
      } else if (tab === 'profile') {
        return
      }
    },
    
    // 编辑资料
    editProfile() {
      uni.navigateTo({
        url: '/pages/user/profile/edit'
      })
    },
    
    // 历史审核
    goToHistoryAudit() {
      uni.navigateTo({
        url: '/pages/audit/history'
      })
    },
    
    // 更多设置
    goToMoreSetting() {
      uni.navigateTo({
        url: '/pages/user/setting/setting'
      })
    },
    
    // 退出登录
    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorageSync()
            uni.reLaunch({
              url: '/pages/splash/splash'
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.admin-profile-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
}

/* 1. 用户信息卡片 */
.user-card {
  display: flex;
  align-items: center;
  background-color: #FFF9CC;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 20rpx;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  background-color: #B3D8FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-text {
  font-size: 56rpx;
}
.user-info {
  flex: 1;
}
.role-tag {
  padding: 6rpx 15rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  display: inline-block;
  margin-bottom: 10rpx;
}
.role-tag.admin {
  background-color: #B3D8FF;
  color: #3377FF;
}
.nickname {
  background-color: #D6EFC7;
  color: #52734D;
  padding: 10rpx 15rpx;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.phone {
  font-size: 24rpx;
  color: #666;
  padding: 0 15rpx;
  margin-bottom: 4rpx;
  display: block;
}
.contact {
  font-size: 22rpx;
  color: #666;
  padding: 0 15rpx;
  margin-bottom: 4rpx;
  display: block;
}
.address {
  font-size: 22rpx;
  color: #666;
  padding: 0 15rpx;
  display: block;
}
.edit-btn {
  width: 60rpx;
  height: 60rpx;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-icon {
  font-size: 32rpx;
  color: #D47836;
}

/* 2. 功能入口（管理员） */
.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #FFF6E6;
  margin: 40rpx auto;
  padding: 30rpx;
  border-radius: 30rpx;
  width: 60%;
}
.func-icon {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}
.func-text {
  font-size: 28rpx;
  color: #D47836;
}

/* 3. 设置与操作区 */
.setting-item {
  background-color: #FFF9E6;
  padding: 25rpx 0;
  text-align: center;
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  border-top: 1rpx solid #eee;
  border-bottom: 1rpx solid #eee;
}
.logout-btn {
  background-color: #F5D7B0;
  padding: 25rpx 0;
  text-align: center;
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-top: 40rpx;
}

/* 4. 底部Tab栏 */
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #FFF9CC;
  padding: 15rpx 0;
  padding-bottom: calc(15rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #eee;
}
.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5rpx;
}
.tabbar-icon {
  width: 44rpx;
  height: 44rpx;
}
.tabbar-text {
  font-size: 22rpx;
  color: #666;
}
.tabbar-item.active .tabbar-text {
  color: #D47836;
}
</style>