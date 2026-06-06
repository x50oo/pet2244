<template>
  <view class="shop-detail-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">宠物店详情</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="shopInfo">
      <!-- 2. 轮播图区 -->
      <swiper class="shop-banner" indicator-dots circular>
        <swiper-item v-for="(img, index) in shopInfo.photos" :key="index">
          <image class="banner-img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <!-- 3. 店铺信息卡片 -->
      <view class="shop-info-card">
        <view class="shop-name-row">
          <text class="shop-name">{{ shopInfo.name }}</text>
          <view class="rating" v-if="shopInfo.avgRating">
            <text class="stars">⭐ {{ shopInfo.avgRating }}</text>
          </view>
        </view>
        <view class="shop-address">
          <text>📍 {{ shopInfo.address }}</text>
        </view>
        <view class="shop-tags" v-if="shopInfo.tags && shopInfo.tags.length">
          <text class="tag" v-for="(tag, idx) in shopInfo.tags" :key="idx">{{ tag }}</text>
        </view>
      </view>

      <!-- 4. 营业信息 -->
      <view class="info-section">
        <view class="section-title">营业信息</view>
        <view class="info-row">
          <text class="label">联系电话</text>
          <text class="value phone" @tap="callPhone">{{ shopInfo.phone }}</text>
        </view>
        <view class="info-row">
          <text class="label">店铺地址</text>
          <text class="value">{{ shopInfo.address }}</text>
        </view>
      </view>

      <!-- 5. 服务项目（套餐） -->
      <view class="info-section" v-if="packageList.length > 0">
        <view class="section-title">服务项目</view>
        <view class="service-list">
          <view class="service-item" v-for="(service, idx) in packageList" :key="idx">
            <view class="service-info">
              <text class="service-name">{{ service.name }}</text>
              <text class="service-desc" v-if="service.description">{{ service.description }}</text>
            </view>
            <text class="service-price">¥{{ service.price }}</text>
          </view>
        </view>
      </view>

      <!-- 6. 店铺位置区 -->
      <view class="location-section">
        <view class="location-header">
          <text class="loc-icon">📍</text>
          <text class="label">店铺位置：</text>
          <text class="address">{{ shopInfo.address }}</text>
        </view>

        <view class="map-container" @tap="openNavigation">
          <map
            class="map-component"
            :latitude="shopInfo.latitude || 23.076"
            :longitude="shopInfo.longitude || 113.387"
            :scale="15"
            :markers="markers"
            :show-location="true"
          ></map>
          <view class="map-tip">点击地图打开导航</view>
        </view>
        <button class="nav-btn" @tap="openNavigation">导航</button>
      </view>

      <!-- 7. 用户评价 -->
      <view class="info-section" v-if="commentList.length > 0">
        <view class="section-title">
          <text>用户评价</text>
          <text class="more" @tap="viewAllComments">查看全部 ></text>
        </view>
        <view class="comment-item" v-for="(comment, idx) in commentList.slice(0, 2)" :key="idx">
          <view class="comment-user">
            <text class="user-name">{{ comment.userName }}</text>
            <view class="comment-rating">
              <text class="stars">⭐ {{ comment.rating }}</text>
            </view>
          </view>
          <text class="comment-time">{{ comment.time }}</text>
          <text class="comment-content">{{ comment.content }}</text>
        </view>
      </view>
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !shopInfo">
      <text>店铺不存在</text>
    </view>

    <!-- 8. 底部操作栏 -->
    <view class="bottom-bar" v-if="shopInfo">
      <view class="contact-btn" @tap="contactShop">
        <text>💬 联系商家</text>
      </view>
      <view class="book-btn" @tap="bookService">
        <text>立即预约</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      shopId: null,
      shopInfo: null,
      packageList: [],
      commentList: [],
      loading: false,
      markers: []
    }
  },
  onLoad(options) {
    if (options.id) {
      this.shopId = parseInt(options.id)
      this.loadShopDetail()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 数据加载 ==========
    async loadShopDetail() {
      this.loading = true
      try {
        // 获取店铺详情
        const res = await request({
          url: `/api/boarding/shops/${this.shopId}`,
          method: 'GET'
        })
        
        this.shopInfo = {
          id: res.id,
          name: res.name,
          address: res.address,
          phone: this.maskPhone(res.phone),
          photos: res.photos || ['/static/shop-default.jpg'],
          description: res.description,
          latitude: res.latitude,
          longitude: res.longitude,
          avgRating: res.avgRating || 0,
          status: res.status
        }
        
        // 设置地图标记
        if (res.latitude && res.longitude) {
          this.markers = [{
            id: 1,
            latitude: res.latitude,
            longitude: res.longitude,
            title: this.shopInfo.name,
            callout: {
              content: this.shopInfo.address,
              color: '#D47836',
              fontSize: 14,
              display: 'ALWAYS'
            }
          }]
        }
        
        // 获取服务套餐（只显示审核通过的）
        if (res.packages && res.packages.length) {
          this.packageList = res.packages.filter(p => p.auditStatus === 2)
        }
        
        // 获取店铺评价
        await this.loadReviews()
        
      } catch (error) {
        console.error('加载店铺详情失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 加载评价
    async loadReviews() {
      try {
        const res = await request({
          url: `/api/reviews?businessType=boarding_shop&businessId=${this.shopId}`,
          method: 'GET'
        })
        
        this.commentList = (res || []).map(review => ({
          id: review.id,
          userName: review.userName || '匿名用户',
          rating: review.rating,
          content: review.content,
          time: this.formatTime(review.createTime),
          images: review.images
        }))
        
        // 计算平均评分
        if (this.commentList.length > 0) {
          const total = this.commentList.reduce((sum, c) => sum + c.rating, 0)
          this.shopInfo.avgRating = (total / this.commentList.length).toFixed(1)
        }
        
      } catch (error) {
        console.log('加载评价失败', error)
      }
    },
    
    // 手机号脱敏
    maskPhone(phone) {
      if (!phone) return '未提供'
      if (phone.length === 11) {
        return phone.substring(0, 3) + '****' + phone.substring(7)
      }
      return phone
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
    
    // 模拟数据
    useMockData() {
      this.shopInfo = {
        id: this.shopId,
        name: '嘻嘻宠物店',
        rating: 4.8,
        address: '番禺区贝岗商业街101号',
        phone: '138****8888',
        latitude: 23.076,
        longitude: 113.387,
        photos: ['/static/shop-banner1.jpg', '/static/shop-banner2.jpg', '/static/shop-banner3.jpg'],
        avgRating: 4.8
      }
      
      this.packageList = [
        { id: 1, name: '宠物洗澡', price: 48, description: '温和洗护，吹干梳理' },
        { id: 2, name: '宠物美容', price: 88, description: '精修造型，剃毛修剪' },
        { id: 3, name: '宠物寄养', price: 68, description: '每日遛狗，定时喂食' },
        { id: 4, name: '疫苗注射', price: 120, description: '正规疫苗，专业注射' }
      ]
      
      this.commentList = [
        { id: 1, userName: '小明', rating: 5, content: '服务很好，环境干净，下次还会来！', time: '2天前' },
        { id: 2, userName: '小红', rating: 4.5, content: '美容师很专业，狗狗变漂亮了~', time: '5天前' }
      ]
      
      this.markers = [{
        id: 1,
        latitude: 23.076,
        longitude: 113.387,
        title: '嘻嘻宠物店',
        callout: { content: '番禺区贝岗商业街101号', color: '#D47836', fontSize: 14, display: 'ALWAYS' }
      }]
    },
    
    // ========== 操作 ==========
    callPhone() {
      if (this.shopInfo.phone && this.shopInfo.phone !== '****') {
        uni.makePhoneCall({
          phoneNumber: this.shopInfo.phone
        })
      } else {
        uni.showToast({ title: '电话号码不可用', icon: 'none' })
      }
    },
    
    openNavigation() {
      if (this.shopInfo.latitude && this.shopInfo.longitude) {
        uni.openLocation({
          latitude: this.shopInfo.latitude,
          longitude: this.shopInfo.longitude,
          name: this.shopInfo.name,
          address: this.shopInfo.address,
          scale: 15
        })
      }
    },
    
    contactShop() {
      uni.navigateTo({
        url: `/pages/message/chat?userId=${this.shopInfo.id}&name=${this.shopInfo.name}&type=shop`
      })
    },
    
    bookService() {
      uni.navigateTo({
        url: `/pages/shop/order/order?shopId=${this.shopId}`
      })
    },
    
    viewAllComments() {
      uni.navigateTo({
        url: `/pages/shop/comments?shopId=${this.shopId}`
      })
    }
  }
}
</script>

<style scoped>
.shop-detail-page {
  min-height: 100vh;
  background-color: #FFF9E6;
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

/* 2. 轮播图区 */
.shop-banner {
  height: 350rpx;
  width: calc(100% - 40rpx);
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}
.banner-img {
  width: 100%;
  height: 100%;
}

/* 3. 店铺信息卡片 */
.shop-info-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.shop-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}
.shop-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}
.rating {
  font-size: 28rpx;
  color: #FF8C00;
}
.shop-address {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 15rpx;
}
.shop-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.tag {
  font-size: 24rpx;
  color: #D47836;
  background-color: #FFF2D6;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

/* 4. 信息区块 */
.info-section {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.more {
  font-size: 24rpx;
  color: #999;
  font-weight: normal;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #eee;
}
.info-row .label {
  font-size: 28rpx;
  color: #666;
}
.info-row .value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
}
.info-row .phone {
  color: #D47836;
}

/* 5. 服务列表 */
.service-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}
.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #eee;
}
.service-info {
  flex: 1;
}
.service-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
}
.service-desc {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}
.service-price {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}

/* 6. 店铺位置区 */
.location-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.location-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}
.loc-icon {
  font-size: 28rpx;
}
.location-header .label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.address {
  font-size: 26rpx;
  color: #666;
  flex: 1;
}

/* 在线地图组件 */
.map-container {
  position: relative;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}
.map-component {
  width: 100%;
  height: 350rpx;
}
.map-tip {
  position: absolute;
  bottom: 20rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  pointer-events: none;
}
.nav-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 30rpx;
}
.nav-btn::after {
  border: none;
}

/* 7. 评价 */
.comment-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}
.comment-user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.user-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}
.comment-rating {
  font-size: 24rpx;
  color: #FF8C00;
}
.comment-time {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 10rpx;
  display: block;
}
.comment-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

/* 8. 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.contact-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background-color: #f5f5f5;
  color: #D47836;
  border-radius: 50rpx;
  font-size: 28rpx;
}
.book-btn {
  flex: 2;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background-color: #FFE0A8;
  color: #D47836;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: bold;
}
</style>