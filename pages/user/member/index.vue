<template>
  <view class="member-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">会员中心</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 2. 用户信息区 -->
      <view class="user-info">
        <view class="avatar">
          <image v-if="userInfo.avatarUrl" class="avatar-img" :src="userInfo.avatarUrl" mode="aspectFill" />
          <text v-else class="avatar-text">👤</text>
        </view>
        <view class="info">
          <view class="member-tag" v-if="memberStatus">
            <text class="tag-icon">💎</text>
            <text>{{ memberStatus.packageName || '会员' }}</text>
          </view>
          <view class="member-tag inactive" v-else>
            <text class="tag-icon">⭐</text>
            <text>非会员</text>
          </view>
          <view class="nickname">昵称：{{ userInfo.nickname || '未设置' }}</view>
          <view class="expire-info" v-if="memberStatus && memberStatus.status === 1">
            <text>有效期至：{{ memberStatus.endTime }}</text>
            <text class="days">剩余{{ memberStatus.remainingDays }}天</text>
          </view>
        </view>
      </view>

      <!-- 3. 会员套餐区 -->
      <view class="section">
        <view class="section-title">选择会员套餐</view>
        <view class="package-list">
          <view 
            class="package-wrapper" 
            v-for="(pkg, index) in packageList" 
            :key="pkg.id"
            :class="{ active: selectedIndex === index }"
            @tap="selectPackage(index)"
          >
            <view class="package-item">
              <view class="tag" v-if="pkg.tag">{{ pkg.tag }}</view>
              <text class="name">{{ pkg.name }}</text>
              <view class="price">
                <text class="current">¥{{ pkg.price }}</text>
                <text class="original" v-if="pkg.originalPrice">¥{{ pkg.originalPrice }}</text>
              </view>
              <text class="desc">{{ pkg.durationDays }}天 · {{ pkg.benefits }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 4. 开通按钮 -->
      <button class="open-btn" @tap="openMember" :disabled="subscribing">
        {{ subscribing ? '处理中...' : (selectedPackage ? selectedPackage.price : 0) + '元 立即开通' }}
      </button>

      <!-- 5. 会员专属福利区 -->
      <view class="section">
        <view class="section-title">会员专属福利</view>
        <view class="benefit-list">
          <view class="benefit-item" v-for="(item, index) in benefits" :key="index">
            <text>{{ item }}</text>
          </view>
        </view>
      </view>

      <!-- 6. 开通历史（可选） -->
      <view class="section" v-if="historyList.length > 0">
        <view class="section-title">开通记录</view>
        <view class="history-list">
          <view class="history-item" v-for="item in historyList" :key="item.id">
            <text class="history-name">{{ item.packageName }}</text>
            <text class="history-time">{{ item.startTime }} 至 {{ item.endTime }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false,
      subscribing: false,
      selectedIndex: 0,
      
      // 用户信息
      userInfo: {
        nickname: '',
        avatarUrl: '',
        phone: ''
      },
      
      // 会员状态
      memberStatus: null,
      
      // 套餐列表
      packageList: [],
      
      // 开通历史
      historyList: [],
      
      // 福利列表（可配置或从后端获取）
      benefits: [
        '无限次在线问诊',
        '商城购物9折',
        '专属客服优先',
        '寻宠加急推送'
      ]
    }
  },
  computed: {
    selectedPackage() {
      return this.packageList[this.selectedIndex]
    }
  },
  onShow() {
    this.loadData()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 数据加载 ==========
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadUserInfo(),
          this.loadMemberStatus(),
          this.loadPackages(),
          this.loadHistory()
        ])
      } catch (error) {
        console.error('加载数据失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 加载用户信息
    async loadUserInfo() {
      try {
        const res = await request({
          url: '/api/user/me',
          method: 'GET'
        })
        this.userInfo = {
          nickname: res.nickname,
          avatarUrl: res.avatarUrl,
          phone: res.phone
        }
      } catch (error) {
        console.log('加载用户信息失败', error)
      }
    },
    
    // 加载会员状态
    async loadMemberStatus() {
      try {
        const res = await request({
          url: '/api/member/status',
          method: 'GET'
        })
        if (res) {
          this.memberStatus = {
            ...res,
            endTime: this.formatDate(res.endTime)
          }
        }
      } catch (error) {
        console.log('加载会员状态失败', error)
      }
    },
    
    // 加载套餐列表
    async loadPackages() {
      try {
        const res = await request({
          url: '/api/member/packages',
          method: 'GET'
        })
        this.packageList = (res || []).map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          durationDays: pkg.durationDays,
          benefits: pkg.benefits,
          tag: this.getTagByDuration(pkg.durationDays)
        }))
      } catch (error) {
        console.log('加载套餐失败', error)
      }
    },
    
    // 加载开通历史
    async loadHistory() {
      try {
        const res = await request({
          url: '/api/member/history',
          method: 'GET'
        })
        this.historyList = (res || []).map(item => ({
          id: item.id,
          packageName: item.packageName,
          startTime: this.formatDate(item.startTime),
          endTime: this.formatDate(item.endTime)
        }))
      } catch (error) {
        console.log('加载历史失败', error)
      }
    },
    
    // 根据时长获取标签
    getTagByDuration(days) {
      if (days === 30) return '首月推荐'
      if (days === 365) return '首年优惠'
      return ''
    },
    
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    },
    
    // 模拟数据
    useMockData() {
      this.userInfo = {
        nickname: '无尽夏',
        avatarUrl: '',
        phone: '138****8000'
      }
      
      this.memberStatus = null
      
      this.packageList = [
        { id: 1, name: '月度会员', price: 29.9, durationDays: 30, benefits: '无限次在线问诊，商城9折', tag: '首月推荐' },
        { id: 2, name: '季度会员', price: 79.9, durationDays: 90, benefits: '无限次在线问诊，商城85折', tag: '' },
        { id: 3, name: '年度会员', price: 299, durationDays: 365, benefits: '无限次在线问诊，商城8折', tag: '首年优惠' }
      ]
      
      this.historyList = []
    },
    
    // 选择套餐
    selectPackage(index) {
      this.selectedIndex = index
    },
    
    // 开通会员
    async openMember() {
      if (!this.selectedPackage) {
        uni.showToast({ title: '请选择套餐', icon: 'none' })
        return
      }
      
      // 检查是否已是会员
      if (this.memberStatus && this.memberStatus.status === 1) {
        uni.showModal({
          title: '提示',
          content: '您已是会员，是否续费？',
          success: async (res) => {
            if (res.confirm) {
              await this.subscribe()
            }
          }
        })
        return
      }
      
      await this.subscribe()
    },
    
    // 执行开通
    async subscribe() {
      this.subscribing = true
      uni.showLoading({ title: '处理中...' })
      
      try {
        // 开通会员
        await request({
          url: '/api/member/subscribe',
          method: 'POST',
          data: {
            packageId: this.selectedPackage.id
          }
        })
        
        uni.hideLoading()
        uni.showToast({ title: '开通成功', icon: 'success' })
        
        // 刷新会员状态
        await this.loadMemberStatus()
        
      } catch (error) {
        uni.hideLoading()
        console.error('开通失败', error)
        
        if (error.code === 409) {
          uni.showToast({ title: '您已是会员，无需重复开通', icon: 'none' })
        } else {
          uni.showToast({ title: error.message || '开通失败', icon: 'none' })
        }
      } finally {
        this.subscribing = false
      }
    }
  }
}
</script>

<style scoped>
.member-page {
  min-height: 100vh;
  background-color: #FFF9E6;
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

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 2. 用户信息区 */
.user-info {
  display: flex;
  align-items: center;
  padding: 30rpx 40rpx;
  background-color: #fff;
  margin: 20rpx;
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
.info {
  flex: 1;
}
.member-tag {
  display: flex;
  align-items: center;
  gap: 5rpx;
  color: #FFC107;
  font-size: 26rpx;
  margin-bottom: 10rpx;
}
.member-tag.inactive {
  color: #999;
}
.tag-icon {
  font-size: 24rpx;
}
.nickname {
  font-size: 28rpx;
  color: #333;
  background-color: #E8F5E0;
  display: inline-block;
  padding: 5rpx 15rpx;
  border-radius: 20rpx;
}
.expire-info {
  font-size: 22rpx;
  color: #666;
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
}
.expire-info .days {
  color: #D47836;
  font-weight: bold;
}

/* 通用样式 */
.section {
  margin: 30rpx 20rpx;
}
.section-title {
  background-color: #FFE0A8;
  color: #D47836;
  text-align: center;
  padding: 12rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

/* 3. 会员套餐区 */
.package-list {
  display: flex;
  justify-content: space-between;
  gap: 15rpx;
}
.package-wrapper {
  flex: 1;
  position: relative;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}
.package-wrapper.active {
  box-shadow: 0 0 0 2rpx #D47836;
  background-color: #fff;
  border-radius: 16rpx;
}
.package-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx 10rpx;
  text-align: center;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}
.package-wrapper.active .package-item {
  box-shadow: 0 4rpx 12rpx rgba(212, 120, 54, 0.2);
}
.package-item .tag {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #FFE0A8;
  color: #D47836;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx 0 12rpx 0;
}
.package-item .name {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin: 25rpx 0 10rpx;
}
.package-item .price {
  margin-bottom: 10rpx;
}
.package-item .current {
  font-size: 36rpx;
  color: #D47836;
  font-weight: bold;
}
.package-item .original {
  font-size: 22rpx;
  color: #999;
  text-decoration: line-through;
  margin-left: 8rpx;
}
.package-item .desc {
  font-size: 20rpx;
  color: #999;
}

/* 4. 开通按钮 */
.open-btn {
  display: block;
  width: 60%;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 35rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin: 0 auto 40rpx;
}
.open-btn[disabled] {
  opacity: 0.6;
}
.open-btn::after {
  border: none;
}

/* 5. 会员专属福利区 */
.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}
.benefit-item {
  background-color: #fff;
  padding: 18rpx;
  text-align: center;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #D47836;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

/* 6. 开通历史 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}
.history-item {
  background-color: #fff;
  padding: 18rpx;
  border-radius: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.history-name {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}
.history-time {
  font-size: 22rpx;
  color: #999;
}
</style>