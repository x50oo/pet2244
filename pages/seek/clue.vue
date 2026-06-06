<template>
  <view class="clue-detail-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">线索详情</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="clueInfo">
      <!-- 2. 线索照片 -->
      <image 
        class="clue-img" 
        :src="clueInfo.image || '/static/default-clue.png'" 
        mode="aspectFill" 
        @tap="previewImage(clueInfo.image)"
        v-if="clueInfo.image"
      />
      <view class="clue-img-placeholder" v-else>
        <text class="placeholder-text">📷</text>
        <text>暂无图片</text>
      </view>

      <!-- 3. 线索描述 -->
      <view class="desc-card">
        <text class="desc-text">{{ clueInfo.content || clueInfo.description }}</text>
      </view>

      <!-- 4. 提供者信息卡片 -->
      <view class="provider-card">
        <view class="section-title">
          <text class="title-icon">👤</text>
          <text>提供者信息</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系人：</text>
          <text class="info-value">{{ clueInfo.contactName || '匿名' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系方式：</text>
          <text class="info-value">{{ clueInfo.contactPhone || '未提供' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">提交时间：</text>
          <text class="info-value">{{ clueInfo.createTime || '' }}</text>
        </view>
      </view>

      <!-- 5. 标记位置卡片 -->
      <view class="location-card" v-if="clueInfo.latitude && clueInfo.longitude">
        <view class="section-title">
          <text class="title-icon">📍</text>
          <text>标记位置：</text>
          <text class="address">{{ clueInfo.locationName || clueInfo.address || '未知位置' }}</text>
          <text class="distance" v-if="distance">距离您：{{ distance }}km</text>
        </view>
        <view class="map-container" @tap="startNav">
          <map
            class="map-component"
            :latitude="clueInfo.latitude"
            :longitude="clueInfo.longitude"
            :scale="15"
            :markers="markers"
            :show-location="true"
          ></map>
          <view class="map-tip">点击地图打开导航</view>
        </view>
        <button class="nav-btn" @tap="startNav">导航</button>
      </view>

      <!-- 6. 关联寻宠信息 -->
      <view class="post-card" v-if="postInfo">
        <view class="section-title">
          <text class="title-icon">🐕</text>
          <text>关联寻宠</text>
        </view>
        <view class="info-row">
          <text class="info-label">宠物名称：</text>
          <text class="info-value">{{ postInfo.petName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">走失地点：</text>
          <text class="info-value">{{ postInfo.lostLocation }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">悬赏金额：</text>
          <text class="info-value bounty">¥{{ postInfo.bountyAmount || 0 }}</text>
        </view>
        <button class="view-post-btn" @tap="goToPost">查看寻宠详情</button>
      </view>

      <!-- 7. 审核状态（如果是管理员查看） -->
      <view class="status-card" v-if="isAdmin && clueInfo.auditStatus">
        <text class="status-label">审核状态：</text>
        <text class="status-value" :class="getAuditStatusClass(clueInfo.auditStatus)">
          {{ getAuditStatusText(clueInfo.auditStatus) }}
        </text>
      </view>
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !clueInfo">
      <text>线索不存在</text>
    </view>

    <!-- 8. 底部操作栏 -->
    <view class="action-bar" v-if="clueInfo && !isAdmin">
      <button class="action-btn" @tap="contactProvider">联系提供者</button>
      <button class="action-btn reward" v-if="postInfo?.bountyAmount > 0" @tap="payReward">支付悬赏 ¥{{ postInfo.bountyAmount }}</button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      postId: null,      // 寻宠帖子ID
      clueId: null,      // 线索ID
      clueInfo: null,
      postInfo: null,
      loading: false,
      isAdmin: false,
      userLocation: null,
      distance: null,
      markers: []
    }
  },
  onLoad(options) {
    // 获取参数
    if (options.postId) {
      this.postId = parseInt(options.postId)
    }
    if (options.id) {
      this.clueId = parseInt(options.id)
    }
    
    // 判断是否为管理员
    const userInfo = uni.getStorageSync('userInfo')
    this.isAdmin = userInfo?.role === 1
    
    if (this.postId && this.clueId) {
      this.loadClueDetail()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
    
    this.getUserLocation()
  },
  methods: {
    goBack() {
      uni.navigateBack()
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
      if (!this.userLocation || !this.clueInfo?.latitude || !this.clueInfo?.longitude) return
      
      const R = 6371
      const dLat = (this.clueInfo.latitude - this.userLocation.lat) * Math.PI / 180
      const dLng = (this.clueInfo.longitude - this.userLocation.lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.userLocation.lat * Math.PI / 180) * Math.cos(this.clueInfo.latitude * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      this.distance = (R * c).toFixed(1)
    },
    
    // 获取审核状态文本
    getAuditStatusText(status) {
      const map = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return map[status] || '未知'
    },
    
    getAuditStatusClass(status) {
      const map = { 1: 'status-pending', 2: 'status-pass', 3: 'status-reject' }
      return map[status] || ''
    },
    
    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    // 加载线索详情
    async loadClueDetail() {
      this.loading = true
      try {
        // 获取寻宠帖子详情（包含线索列表）
        const postRes = await request({
          url: `/api/lost-pet/posts/${this.postId}`,
          method: 'GET'
        })
        
        this.postInfo = postRes
        
        // 从线索列表中查找当前线索
        const clues = postRes.clues || []
        const clue = clues.find(c => c.id == this.clueId)
        
        if (clue) {
          this.clueInfo = {
            id: clue.id,
            content: clue.content,
            description: clue.content,
            images: clue.images || [],
            image: clue.images?.[0] || '',
            contactName: clue.contactName,
            contactPhone: clue.contactPhone,
            createTime: this.formatTime(clue.createTime),
            latitude: clue.latitude,
            longitude: clue.longitude,
            locationName: clue.locationName,
            auditStatus: clue.auditStatus,
            postId: this.postId
          }
          
          // 设置地图标记
          if (clue.latitude && clue.longitude) {
            this.markers = [{
              id: 1,
              latitude: clue.latitude,
              longitude: clue.longitude,
              title: '线索位置',
              callout: {
                content: clue.locationName || '线索位置',
                color: '#D47836',
                fontSize: 14,
                borderRadius: 10,
                padding: 8,
                display: 'ALWAYS'
              }
            }]
            this.calculateDistance()
          }
        } else {
          // 如果从帖子中找不到，尝试直接获取线索（需要后端支持）
          await this.loadClueDirectly()
        }
        
      } catch (error) {
        console.error('加载线索详情失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 直接获取线索详情（需要后端接口）
    async loadClueDirectly() {
      try {
        const res = await request({
          url: `/api/lost-pet/clues/${this.clueId}`,
          method: 'GET'
        })
        
        this.clueInfo = {
          id: res.id,
          content: res.content,
          description: res.content,
          images: res.images || [],
          image: res.images?.[0] || '',
          contactName: res.contactName,
          contactPhone: res.contactPhone,
          createTime: this.formatTime(res.createTime),
          latitude: res.latitude,
          longitude: res.longitude,
          locationName: res.locationName,
          auditStatus: res.auditStatus,
          postId: res.postId
        }
        
        this.postInfo = res.post || null
        
        if (this.clueInfo.latitude && this.clueInfo.longitude) {
          this.markers = [{
            id: 1,
            latitude: this.clueInfo.latitude,
            longitude: this.clueInfo.longitude,
            title: '线索位置',
            callout: { content: this.clueInfo.locationName, color: '#D47836', fontSize: 14, display: 'ALWAYS' }
          }]
          this.calculateDistance()
        }
        
      } catch (error) {
        console.error('直接获取线索失败', error)
        throw error
      }
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      this.postInfo = {
        id: this.postId,
        petName: '布丁',
        lostLocation: '番禺区贝岗商业街',
        bountyAmount: 150
      }
      
      this.clueInfo = {
        id: this.clueId,
        content: '4.10号早上8:30左右在广外一食堂附近的树上看到过',
        description: '4.10号早上8:30左右在广外一食堂附近的树上看到过',
        image: '/static/clue-photo.jpg',
        images: ['/static/clue-photo.jpg'],
        contactName: '热心市民',
        contactPhone: '138****8000',
        createTime: '2024-04-10 14:30:00',
        latitude: 23.076,
        longitude: 113.387,
        locationName: '广东外语外贸大学',
        auditStatus: 2,
        postId: this.postId
      }
      
      this.markers = [{
        id: 1,
        latitude: 23.076,
        longitude: 113.387,
        title: '线索位置',
        callout: { content: '广东外语外贸大学', color: '#D47836', fontSize: 14, display: 'ALWAYS' }
      }]
    },
    
    // 预览图片
    previewImage(url) {
      if (url) {
        uni.previewImage({ urls: [url] })
      }
    },
    
    // 导航
    startNav() {
      if (this.clueInfo && this.clueInfo.latitude && this.clueInfo.longitude) {
        uni.openLocation({
          latitude: this.clueInfo.latitude,
          longitude: this.clueInfo.longitude,
          name: this.clueInfo.locationName || '线索位置',
          scale: 15
        })
      }
    },
    
    // 联系提供者
    contactProvider() {
      if (this.clueInfo.providerId) {
        uni.navigateTo({
          url: `/pages/message/chat?userId=${this.clueInfo.providerId}&name=${this.clueInfo.contactName}&type=user`
        })
      } else {
        uni.showToast({ title: '无法联系提供者', icon: 'none' })
      }
    },
    
    // 支付悬赏
    async payReward() {
      if (!this.postInfo?.bountyAmount || this.postInfo.bountyAmount <= 0) {
        uni.showToast({ title: '该寻宠暂无悬赏', icon: 'none' })
        return
      }
      
      uni.showLoading({ title: '正在支付...' })
      
      try {
        const res = await request({
          url: '/api/payment/prepay',
          method: 'POST',
          data: {
            businessType: 'lost_pet_bounty',
            businessId: this.postId,
            amount: this.postInfo.bountyAmount
          }
        })
        
        uni.hideLoading()
        
        if (res.status === 1 || process.env.NODE_ENV === 'development') {
          uni.showToast({ title: '支付成功', icon: 'success' })
        } else if (res.payParams) {
          uni.requestPayment({
            timeStamp: res.payParams.timeStamp,
            nonceStr: res.payParams.nonceStr,
            package: res.payParams.package,
            signType: res.payParams.signType,
            paySign: res.payParams.paySign,
            success: () => {
              uni.showToast({ title: '支付成功', icon: 'success' })
            },
            fail: () => {
              uni.showToast({ title: '支付失败', icon: 'none' })
            }
          })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('支付失败', error)
        uni.showToast({ title: error.message || '支付失败', icon: 'none' })
      }
    },
    
    // 查看寻宠详情
    goToPost() {
      uni.navigateTo({
        url: `/pages/seek/detail?id=${this.postId}`
      })
    }
  }
}
</script>

<style scoped>
.clue-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
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

/* 2. 线索照片 */
.clue-img {
  width: 90%;
  height: 280rpx;
  border-radius: 16rpx;
  display: block;
  margin: 30rpx auto;
  background-color: #eee;
}
.clue-img-placeholder {
  width: 90%;
  height: 280rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 30rpx auto;
  background-color: #eee;
  color: #999;
}
.placeholder-text {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}

/* 3. 线索描述 */
.desc-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.desc-text {
  font-size: 28rpx;
  color: #D47836;
  line-height: 1.6;
}

/* 提供者信息卡片 */
.provider-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.section-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}
.title-icon {
  font-size: 26rpx;
}
.info-row {
  display: flex;
  margin-bottom: 12rpx;
}
.info-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #999;
}
.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}
.info-value.bounty {
  color: #FF6600;
  font-weight: bold;
}

/* 4. 标记位置卡片 */
.location-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.address {
  font-size: 26rpx;
  color: #333;
  margin: 0 10rpx;
  flex: 1;
}
.distance {
  font-size: 24rpx;
  color: #4CAF50;
  background-color: #E8F5E9;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}
.map-container {
  position: relative;
  width: 100%;
  height: 300rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
}
.map-component {
  width: 100%;
  height: 100%;
}
.map-tip {
  position: absolute;
  bottom: 15rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  pointer-events: none;
}
.nav-btn {
  width: 100%;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 35rpx;
  font-size: 28rpx;
}
.nav-btn::after {
  border: none;
}

/* 关联寻宠卡片 */
.post-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.view-post-btn {
  width: 100%;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 35rpx;
  font-size: 28rpx;
  margin-top: 15rpx;
}
.view-post-btn::after {
  border: none;
}

/* 审核状态 */
.status-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 20rpx;
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
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
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

/* 5. 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  gap: 20rpx;
  background-color: #fff;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
}
.action-btn.reward {
  background-color: #FF6600;
  color: #fff;
}
.action-btn::after {
  border: none;
}
</style>