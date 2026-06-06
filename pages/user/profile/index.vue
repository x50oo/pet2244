<template>
  <view class="profile-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">个人中心</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 用户信息卡片 -->
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
        <view class="tags">
          <view class="member-tag" v-if="isMember">
            <text class="tag-icon">💎</text>
            <text>会员</text>
          </view>
          <view class="role-tag" v-if="isTrustee">
            <text>托管人</text>
          </view>
        </view>
        <view class="nickname">昵称：{{ userInfo.nickname || '未设置' }}</view>
        <view class="phone">手机号：{{ userInfo.phone || '未绑定' }}</view>
        <view class="contact" v-if="userInfo.contact">联系方式：{{ userInfo.contact }}</view>
        <view class="address" v-if="userInfo.address">地址：{{ userInfo.address }}</view>
      </view>
      <view class="edit-btn" @tap="editProfile">
        <text class="edit-icon">✎</text>
      </view>
    </view>

    <!-- 3. 功能入口区 -->
    <view class="function-section">
      <view class="func-item" v-for="item in functions" :key="item.id" @tap="handleFuncClick(item)">
        <image class="func-icon" :src="item.icon" mode="aspectFit" />
        <text class="func-text">{{ item.name }}</text>
      </view>
    </view>

    <!-- 4. 会员中心按钮 -->
    <view class="member-btn" @tap="goToMemberCenter">
      <text class="btn-icon">💎</text>
      <text>会员中心</text>
    </view>

    <!-- 5. 列表菜单项 -->
    <view class="menu-section">
      <view class="menu-item" v-for="(item, index) in menuList" :key="index" :class="{ logout: item.isLogout }" @tap="handleMenuClick(item)">
        <text class="menu-text">{{ item.name }}</text>
      </view>
    </view>

    <!-- 6. 底部Tab栏 -->
    <view class="tabbar">
      <view class="tabbar-item" :class="{ active: currentTab === 'home' }" @tap="switchTab('home')">
        <image class="tabbar-icon" :src="currentTab === 'home' ? '/static/tabbar/home-active.png' : '/static/tabbar/home.png'" mode="aspectFit" />
        <text class="tabbar-text">首页</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'health' }" @tap="switchTab('health')">
        <image class="tabbar-icon" :src="currentTab === 'health' ? '/static/tabbar/health-active.png' : '/static/tabbar/health.png'" mode="aspectFit" />
        <text class="tabbar-text">健康</text>
      </view>
      <view class="tabbar-item add-btn" @tap="switchTab('publish')">
        <image class="tabbar-icon add-icon" src="/static/tabbar/add-active.png" mode="aspectFit" />
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
      loading: false,
      
      // 用户信息
      userInfo: {
        userId: null,
        nickname: '',
        phone: '',
        avatarUrl: '',
        contact: '',
        address: '',
        role: 0
      },
      
      // 状态
      isMember: false,
      isTrustee: false,
      
      // 功能入口
      functions: [
        { id: 1, name: '我的宠物', icon: '/static/pet-icon.png', path: '/pages/user/pet/pet' },
        { id: 2, name: '我的订单', icon: '/static/order-icon.png', path: '/pages/user/order/order' },
        { id: 3, name: '我的寻宠', icon: '/static/seek-icon.png', path: '/pages/user/seek/seek' }
      ],
      
      // 菜单列表
      menuList: [
        { name: '成为托管人', path: '/pages/trustee/apply' },
        { name: '店铺入驻', path: '/pages/shop/apply' },
        { name: '更多设置', path: '/pages/user/setting/setting' },
        { name: '问题反馈', path: '/pages/user/feedback/feedback' },
        { name: '退出登录', isLogout: true }
      ]
    }
  },
  onShow() {
    this.loadUserInfo()
    this.loadMemberStatus()
    this.loadTrusteeStatus()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 数据加载 ==========
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
          role: res.role || 0
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
            role: storedUser.role || 0
          }
        }
      } finally {
        this.loading = false
      }
    },
    
    // 加载会员状态
    async loadMemberStatus() {
      try {
        const res = await request({
          url: '/api/member/status',
          method: 'GET'
        })
        this.isMember = res && res.status === 1
      } catch (error) {
        console.log('加载会员状态失败', error)
        this.isMember = false
      }
    },
    
    // 加载托管人状态
    async loadTrusteeStatus() {
      try {
        const res = await request({
          url: '/api/foster/certifications/mine',
          method: 'GET'
        })
        this.isTrustee = res && res.status === 2
      } catch (error) {
        console.log('加载托管人状态失败', error)
        this.isTrustee = false
      }
    },
    
    // ========== 页面跳转 ==========
    editProfile() {
      uni.navigateTo({
        url: '/pages/user/profile/edit'
      })
    },
    
    // 功能入口点击处理
    handleFuncClick(item) {
      if (item.path) {
        uni.navigateTo({ url: item.path })
      } else {
        uni.showToast({ title: '功能开发中', icon: 'none' })
      }
    },
    
    goToMemberCenter() {
      uni.navigateTo({
        url: '/pages/user/member/index'
      })
    },
    
    handleMenuClick(item) {
      if (item.isLogout) {
        this.logout()
      } else if (item.path) {
        uni.navigateTo({ url: item.path })
      } else {
        uni.showToast({ title: `${item.name}开发中`, icon: 'none' })
      }
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
    },
    
    // 底部Tab切换
    switchTab(tab) {
      this.currentTab = tab
      if (tab === 'home') {
        uni.reLaunch({ url: '/pages/home/index' })
      } else if (tab === 'health') {
        uni.reLaunch({ url: '/pages/health/index' })
      } else if (tab === 'publish') {
        uni.showActionSheet({
          itemList: ['发布寻宠', '发布托管'],
          success: (res) => {
            if (res.tapIndex === 0) uni.navigateTo({ url: '/pages/seek/publish' })
            else if (res.tapIndex === 1) uni.navigateTo({ url: '/pages/foster/publish' })
          }
        })
      } else if (tab === 'message') {
        uni.reLaunch({ url: '/pages/message/list/list' })
      } else if (tab === 'profile') {
        return
      }
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
}

/* 顶部导航栏 */
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

/* 用户信息卡片 */
.user-card {
  display: flex;
  align-items: center;
  background-color: #FFF9CC;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 20rpx;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
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
  font-size: 50rpx;
}
.user-info {
  flex: 1;
}
.tags {
  display: flex;
  gap: 10rpx;
  margin-bottom: 10rpx;
  flex-wrap: wrap;
}
.member-tag {
  display: flex;
  align-items: center;
  gap: 5rpx;
  color: #FFC107;
  font-size: 24rpx;
  background-color: #fff;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
}
.tag-icon {
  font-size: 20rpx;
}
.role-tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}
.nickname {
  font-size: 26rpx;
  color: #333;
  background-color: #E8F5E0;
  display: inline-block;
  padding: 6rpx 12rpx;
  border-radius: 10rpx;
  margin-bottom: 8rpx;
}
.phone {
  font-size: 22rpx;
  color: #666;
  padding: 0 12rpx;
  margin-bottom: 4rpx;
  display: block;
}
.contact {
  font-size: 22rpx;
  color: #666;
  padding: 0 12rpx;
  margin-bottom: 4rpx;
  display: block;
}
.address {
  font-size: 22rpx;
  color: #666;
  padding: 0 12rpx;
  display: block;
}
.edit-btn {
  width: 50rpx;
  height: 50rpx;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-icon {
  font-size: 28rpx;
  color: #D47836;
}

/* 功能入口区 */
.function-section {
  display: flex;
  justify-content: space-around;
  margin: 20rpx;
  gap: 15rpx;
}
.func-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  background-color: #FFF9CC;
  padding: 15rpx;
  border-radius: 16rpx;
  flex: 1;
}
.func-icon {
  width: 48rpx;
  height: 48rpx;
}
.func-text {
  font-size: 24rpx;
  color: #D47836;
}

/* 会员中心按钮 */
.member-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 20rpx;
  padding: 20rpx;
  margin: 0 20rpx 30rpx;
  font-size: 28rpx;
  font-weight: bold;
}
.btn-icon {
  font-size: 36rpx;
}

/* 列表菜单项 */
.menu-section {
  background-color: #fff;
  margin: 0 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}
.menu-item {
  padding: 25rpx;
  text-align: center;
  border-bottom: 1rpx solid #eee;
  font-size: 28rpx;
  color: #333;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item.logout {
  background-color: #F9E0C7;
  color: #333;
}

/* 底部Tab栏 */
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
.add-btn {
  position: relative;
  top: -16rpx;
}
.add-icon {
  background-color: #D47836;
  border-radius: 50%;
  padding: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(212, 120, 54, 0.3);
}
</style>