<template>
  <view class="truster-detail-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">托管人详情</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="trusteeInfo">
      <!-- 2. 托管人信息卡片 -->
      <view class="truster-card">
        <view class="card-header">
          <view class="avatar">
            <text class="avatar-text">👤</text>
          </view>
          <view class="info">
            <view class="name-row">
              <text class="name">{{ trusteeInfo.realName || trusteeInfo.name }}</text>
              <text class="gender-icon" :class="trusteeInfo.gender === 1 ? 'male' : 'female'">
                {{ trusteeInfo.gender === 1 ? '♂' : '♀' }}
              </text>
              <view class="score">综合评分：{{ avgRating }}</view>
            </view>
            <view class="experience-tag">{{ trusteeInfo.years || 0 }}年养宠经验</view>
            <view class="location-row">
              <text class="loc-icon">📍</text>
              <text class="address">{{ trusteeInfo.address || '未填写' }}</text>
              <text class="distance" v-if="distance">距离 {{ distance }}km</text>
            </view>
          </view>
        </view>
        <view class="bio">
          <text>{{ trusteeInfo.bio || '这个人很懒，还没有填写自我介绍~' }}</text>
        </view>
      </view>

      <!-- 3. 认证状态 -->
      <view class="status-card">
        <text class="status-label">认证状态：</text>
        <text class="status-value" :class="getStatusClass(trusteeInfo.status)">
          {{ getStatusText(trusteeInfo.status) }}
        </text>
      </view>

      <!-- 4. 选择按钮（选择场景显示） -->
      <button class="select-btn" @tap="selectTrustee" v-if="showSelectBtn">选择</button>

      <!-- 5. 托管评价区 -->
      <view class="review-section" v-if="commentList.length > 0">
        <view class="section-header">
          <text class="header-title">托管评价</text>
        </view>
        <view class="review-list">
          <view class="review-item" v-for="(comment, index) in commentList" :key="index">
            <view class="user-avatar">
              <text>👤</text>
            </view>
            <view class="review-info">
              <text class="reviewer-name">{{ comment.userName }}</text>
              <text class="comment-score">评分：{{ comment.rating }}⭐</text>
              <text class="content">{{ comment.content }}</text>
              <text class="comment-time">{{ comment.time }}</text>
            </view>
          </view>
          <view class="no-more" v-if="commentList.length === 0">
            <text>暂无评价</text>
          </view>
        </view>
      </view>

      <!-- 暂无评价 -->
      <view class="review-section" v-else>
        <view class="section-header">
          <text class="header-title">托管评价</text>
        </view>
        <view class="empty-comment">
          <text>暂无评价</text>
        </view>
      </view>
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !trusteeInfo">
      <text>托管人不存在</text>
    </view>

    <!-- 5. 底部操作栏 -->
    <view class="action-bar" v-if="trusteeInfo && !showSelectBtn">
      <view class="edit-icon" @tap="editProfile" v-if="isOwner">
        <text>✎</text>
      </view>
      <button class="contact-btn" @tap="contactTrustee">联系托管人</button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      trusteeId: null,
      trusteeInfo: null,
      commentList: [],
      loading: false,
      showSelectBtn: false,  // 是否显示选择按钮
      isOwner: false,
      userLocation: null,
      distance: null,
      avgRating: 0
    }
  },
  onLoad(options) {
    if (options.id) {
      this.trusteeId = parseInt(options.id)
      this.showSelectBtn = options.select === 'true' || false
      this.loadTrusteeDetail()
      this.getUserLocation()
      
      // 判断是否是本人
      const userInfo = uni.getStorageSync('userInfo')
      this.isOwner = userInfo?.userId === this.trusteeId
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 工具方法 ==========
    getStatusText(status) {
      const map = { 1: '待审核', 2: '已认证', 3: '已驳回' }
      return map[status] || '未知'
    },
    
    getStatusClass(status) {
      const map = { 1: 'status-pending', 2: 'status-pass', 3: 'status-reject' }
      return map[status] || ''
    },
    
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        if (hours < 1) return '刚刚'
        return `${hours}小时前`
      }
      const days = Math.floor(diff / 86400000)
      if (days < 7) return `${days}天前`
      return `${date.getMonth() + 1}/${date.getDate()}`
    },
    
    // 获取用户位置
    getUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.userLocation = { lat: res.latitude, lng: res.longitude }
          this.calculateDistance()
        },
        fail: () => {
          console.log('获取位置失败')
        }
      })
    },
    
    // 计算距离
    calculateDistance() {
      if (!this.userLocation || !this.trusteeInfo?.latitude || !this.trusteeInfo?.longitude) return
      
      const R = 6371
      const dLat = (this.trusteeInfo.latitude - this.userLocation.lat) * Math.PI / 180
      const dLng = (this.trusteeInfo.longitude - this.userLocation.lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.userLocation.lat * Math.PI / 180) * Math.cos(this.trusteeInfo.latitude * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      this.distance = (R * c).toFixed(1)
    },
    
    // ========== 数据加载 ==========
    async loadTrusteeDetail() {
      this.loading = true
      try {
        // 获取托管人认证详情
        const res = await request({
          url: `/api/foster/certifications/${this.trusteeId}`,
          method: 'GET'
        })
        
        this.trusteeInfo = {
          id: res.id,
          userId: res.userId,
          realName: res.realName,
          name: res.realName,
          gender: res.gender || 0,
          years: res.years || 0,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude,
          bio: res.bio || res.description,
          status: res.status,
          phone: res.phone
        }
        
        this.calculateDistance()
        
        // 加载评价
        await this.loadReviews()
        
      } catch (error) {
        console.error('加载托管人详情失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 加载评价
    async loadReviews() {
      try {
        const res = await request({
          url: `/api/reviews?businessType=foster_certification&businessId=${this.trusteeId}`,
          method: 'GET'
        })
        
        this.commentList = (res || []).map(review => ({
          id: review.id,
          userName: review.userName || '匿名用户',
          rating: review.rating,
          content: review.content,
          time: this.formatTime(review.createTime)
        }))
        
        // 计算平均评分
        if (this.commentList.length > 0) {
          const total = this.commentList.reduce((sum, c) => sum + c.rating, 0)
          this.avgRating = (total / this.commentList.length).toFixed(1)
        }
        
      } catch (error) {
        console.log('加载评价失败', error)
      }
    },
    
    // 模拟数据
    useMockData() {
      this.trusteeInfo = {
        id: this.trusteeId,
        userId: this.trusteeId,
        realName: '高能莉斯多',
        name: '高能莉斯多',
        gender: 0,
        years: 6,
        address: '小谷围嘿嘿小区',
        latitude: 23.076,
        longitude: 113.387,
        bio: '本职工作是做新媒体运营，时间相对灵活，周末和节假日全天在家。养猫7年，帮朋友照顾过布偶、暹罗、银渐层，也代遛过柯基和柴犬。',
        status: 2,
        phone: '138****8888'
      }
      
      this.commentList = [
        { id: 1, userName: '嚯嚯', rating: 4.5, content: '挺好的', time: '2天前' }
      ]
      this.avgRating = 4.5
      this.calculateDistance()
    },
    
    // ========== 操作 ==========
    selectTrustee() {
      // 通过事件通道返回选中的托管人
      const eventChannel = this.getOpenerEventChannel()
      if (eventChannel) {
        eventChannel.emit('selectTrustee', {
          id: this.trusteeInfo.id,
          name: this.trusteeInfo.realName,
          phone: this.trusteeInfo.phone
        })
      }
      
      uni.showToast({ title: `已选择 ${this.trusteeInfo.realName}`, icon: 'success' })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    },
    
    editProfile() {
      uni.navigateTo({
        url: `/pages/trustee/edit?id=${this.trusteeInfo.id}`
      })
    },
    
    contactTrustee() {
      uni.navigateTo({
        url: `/pages/message/chat?userId=${this.trusteeInfo.userId}&name=${this.trusteeInfo.realName}&type=trustee`
      })
    }
  }
}
</script>

<style scoped>
.truster-detail-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 80rpx;
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

/* 加载/空状态 */
.loading-state, .empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 2. 托管人信息卡片 */
.truster-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.card-header {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  font-size: 56rpx;
}
.info {
  flex: 1;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
  flex-wrap: wrap;
}
.name {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}
.gender-icon {
  font-size: 26rpx;
}
.gender-icon.male { color: #2196F3; }
.gender-icon.female { color: #E91E63; }
.score {
  font-size: 26rpx;
  color: #D47836;
  margin-left: auto;
}
.experience-tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 5rpx 12rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  display: inline-block;
  margin-bottom: 10rpx;
}
.location-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #666;
}
.loc-icon {
  font-size: 24rpx;
}
.address {
  flex: 1;
}
.distance {
  color: #4CAF50;
}
.bio {
  background-color: #FFF2CC;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #D47836;
  line-height: 1.6;
}

/* 3. 认证状态卡片 */
.status-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 20rpx 30rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status-label {
  font-size: 26rpx;
  color: #666;
}
.status-value {
  font-size: 26rpx;
  padding: 4rpx 20rpx;
  border-radius: 30rpx;
}
.status-pending {
  background-color: #FFF3E0;
  color: #FF9800;
}
.status-pass {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.status-reject {
  background-color: #FFEBEE;
  color: #F44336;
}

/* 4. 选择按钮 */
.select-btn {
  width: 80%;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  margin: 20rpx auto;
  display: block;
}
.select-btn::after {
  border: none;
}

/* 5. 托管评价区 */
.review-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}
.section-header {
  text-align: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #eee;
}
.header-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.review-list {
  padding: 20rpx;
}
.review-item {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}
.user-avatar {
  width: 70rpx;
  height: 70rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}
.review-info {
  flex: 1;
}
.reviewer-name {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 5rpx;
}
.comment-score {
  font-size: 24rpx;
  color: #D47836;
  display: block;
  margin-bottom: 8rpx;
}
.content {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 5rpx;
}
.comment-time {
  font-size: 20rpx;
  color: #999;
}
.empty-comment {
  text-align: center;
  padding: 60rpx;
  color: #999;
  font-size: 26rpx;
}
.no-more {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 20rpx 0;
}

/* 6. 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background-color: #fff;
  margin: 0;
  padding: 15rpx 30rpx;
  gap: 20rpx;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(15rpx + env(safe-area-inset-bottom));
}
.edit-icon {
  width: 50rpx;
  height: 50rpx;
  background-color: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
}
.contact-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
}
.contact-btn::after {
  border: none;
}
</style>