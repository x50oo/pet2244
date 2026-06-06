<template>
  <view class="trust-detail-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">托管详情</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="orderInfo">
      <!-- 2. 订单状态卡片 -->
      <view class="status-card" :class="getStatusClass(orderInfo.status)">
        <text class="status-text">{{ getStatusText(orderInfo.status) }}</text>
        <text class="status-desc">{{ getStatusDesc(orderInfo.status) }}</text>
      </view>

      <!-- 3. 宠物轮播图 -->
      <swiper class="pet-swiper" indicator-dots circular v-if="petImages.length > 0">
        <swiper-item v-for="(img, index) in petImages" :key="index">
          <image class="swiper-img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>
      <view class="pet-swiper-placeholder" v-else>
        <text class="placeholder-text">🐕</text>
      </view>

      <!-- 4. 宠物档案卡片 -->
      <view class="info-card" v-if="petInfo">
        <view class="pet-archive">
          <view class="pet-avatar"><text>🐕</text></view>
          <view class="pet-info">
            <text class="pet-title">宠物档案</text>
            <view class="pet-name-row">
              <text class="pet-name">{{ petInfo.name }}</text>
              <text class="gender-icon" :class="petInfo.gender === 1 ? 'male' : 'female'">{{ petInfo.gender === 1 ? '♂' : '♀' }}</text>
            </view>
            <view class="pet-tags">
              <text class="tag">{{ getPetTypeText(petInfo.petType) }}</text>
              <text class="tag">{{ petInfo.breed }}</text>
            </view>
          </view>
        </view>
        <view class="expand-btn" @tap="toggleExpand">
          <text>{{ isExpanded ? '收起 ▲' : '展开 ▼' }}</text>
        </view>

        <!-- 展开后的详细信息 -->
        <view class="expanded-info" v-if="isExpanded">
          <view class="info-item">
            <text class="label">出生日期：</text>
            <text class="value">{{ petInfo.birthDate || '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="label">健康状态：</text>
            <text class="value">{{ petInfo.healthStatus || '良好' }}</text>
          </view>
          <view class="info-item">
            <text class="label">体重：</text>
            <text class="value">{{ petInfo.weight ? petInfo.weight + 'kg' : '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="label">是否绝育：</text>
            <text class="value">{{ petInfo.sterilized ? '是' : '否' }}</text>
          </view>
          <view class="info-item">
            <text class="label">是否注射疫苗：</text>
            <text class="value">{{ petInfo.vaccinated ? '是' : '否' }}</text>
          </view>
          <view class="info-item">
            <text class="label">宠物介绍：</text>
            <view class="intro-box">
              <text>{{ petInfo.description || '暂无介绍' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 5. 任务备注卡片 -->
      <view class="info-card">
        <view class="section-title">
          <text class="title-icon">📋</text>
          <text>任务备注：</text>
        </view>
        <view class="note-content">{{ orderInfo.description || '暂无备注' }}</view>
      </view>

      <!-- 6. 服务时间卡片 -->
      <view class="info-card">
        <view class="section-title">
          <text class="title-icon">📅</text>
          <text>服务时间：</text>
        </view>
        <view class="date-range">
          <text>{{ orderInfo.startDate }} 至 {{ orderInfo.endDate }}</text>
          <text class="days">共 {{ calculateDays(orderInfo.startDate, orderInfo.endDate) }} 天</text>
        </view>
      </view>

      <!-- 7. 宠物位置卡片 -->
      <view class="info-card" v-if="orderInfo.latitude && orderInfo.longitude">
        <view class="section-title">
          <text class="title-icon">📍</text>
          <text>宠物位置：</text>
          <text class="address">{{ orderInfo.location || '未知位置' }}</text>
          <text class="distance" v-if="distance">距离您：{{ distance }}km</text>
        </view>
        <view class="map-container" @tap="startNav">
          <map
            class="map-component"
            :latitude="orderInfo.latitude"
            :longitude="orderInfo.longitude"
            :scale="15"
            :markers="markers"
            :show-location="true"
          ></map>
          <view class="map-tip">点击地图打开导航</view>
        </view>
        <button class="nav-btn" @tap="startNav">导航</button>
      </view>

      <!-- 8. 报酬信息 -->
      <view class="info-card">
        <view class="reward-info">
          <text class="label">报酬：</text>
          <text class="amount">¥{{ orderInfo.dailyPrice || orderInfo.totalPrice }}</text>
          <text class="unit" v-if="orderInfo.dailyPrice">/天</text>
        </view>
      </view>

      <!-- 9. 服务凭证（如果是接单人查看） -->
      <view class="info-card" v-if="isTrustee && orderInfo.status === 2">
        <view class="section-title">
          <text class="title-icon">📎</text>
          <text>服务凭证</text>
        </view>
        <view class="service-record" v-if="serviceRecord">
          <view class="record-photos" v-if="serviceRecord.photos && serviceRecord.photos.length">
            <image 
              v-for="(photo, idx) in serviceRecord.photos" 
              :key="idx"
              class="record-photo" 
              :src="photo" 
              mode="aspectFill"
              @tap="previewImage(photo)"
            />
          </view>
          <text class="record-note">{{ serviceRecord.note || '无备注' }}</text>
          <text class="record-status" :class="serviceRecord.status === 2 ? 'confirmed' : 'pending'">
            {{ serviceRecord.status === 2 ? '已确认' : '待确认' }}
          </text>
        </view>
        <view v-else-if="isTrustee && orderInfo.status === 2" class="upload-record">
          <button class="upload-btn" @tap="uploadServiceRecord">上传服务凭证</button>
        </view>
      </view>
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !orderInfo">
      <text>订单不存在</text>
    </view>

    <!-- 10. 底部操作栏 -->
    <view class="action-bar" v-if="orderInfo">
      <button class="action-btn" @tap="contactOwner">联系宠物主人</button>
      <button class="action-btn cancel" v-if="canCancel" @tap="cancelOrder">取消订单</button>
      <button class="action-btn complete" v-if="canComplete" @tap="completeOrder">完成服务</button>
      <button class="action-btn aftersale" v-if="canAftersale" @tap="applyAfterSales">申请售后</button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      orderId: null,
      orderInfo: null,
      petInfo: null,
      serviceRecord: null,
      loading: false,
      isExpanded: false,
      isTrustee: false,  // 当前用户是否是接单人
      userLocation: null,
      distance: null,
      markers: []
    }
  },
  computed: {
    petImages() {
      if (!this.petInfo) return []
      // 如果有宠物照片数组则使用，否则返回默认占位
      return this.petInfo.photos || []
    },
    canCancel() {
      return this.orderInfo && (this.orderInfo.status === 1 || this.orderInfo.status === 2) && this.isTrustee
    },
    canComplete() {
      return this.orderInfo && this.orderInfo.status === 2 && this.isTrustee
    },
    canAftersale() {
      return this.orderInfo && this.orderInfo.status === 3 && !this.isTrustee
    }
  },
  onLoad(options) {
    if (options.id) {
      this.orderId = parseInt(options.id)
      // 判断当前用户角色
      const userInfo = uni.getStorageSync('userInfo')
      this.isTrustee = userInfo?.role === 'trustee' || false
      this.loadOrderDetail()
      this.getUserLocation()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 状态映射 ==========
    getStatusText(status) {
      const map = { 
        1: '待接单', 
        2: '进行中', 
        3: '已完成', 
        4: '已取消',
        5: '待审核'
      }
      return map[status] || '未知'
    },
    
    getStatusDesc(status) {
      const map = { 
        1: '等待托管人接单', 
        2: '服务进行中', 
        3: '服务已完成', 
        4: '订单已取消',
        5: '等待管理员审核'
      }
      return map[status] || ''
    },
    
    getStatusClass(status) {
      const map = { 
        1: 'status-pending', 
        2: 'status-confirmed', 
        3: 'status-completed', 
        4: 'status-cancelled',
        5: 'status-pending'
      }
      return map[status] || ''
    },
    
    getPetTypeText(type) {
      const typeMap = { 
        'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 
        'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' 
      }
      return typeMap[type] || type || '宠物'
    },
    
    calculateDays(startDate, endDate) {
      if (!startDate || !endDate) return 0
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      return diff + 1
    },
    
    // 获取用户位置（计算距离）
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
    
    calculateDistance() {
      if (!this.userLocation || !this.orderInfo?.latitude || !this.orderInfo?.longitude) return
      
      const R = 6371
      const dLat = (this.orderInfo.latitude - this.userLocation.lat) * Math.PI / 180
      const dLng = (this.orderInfo.longitude - this.userLocation.lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.userLocation.lat * Math.PI / 180) * Math.cos(this.orderInfo.latitude * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      this.distance = (R * c).toFixed(1)
    },
    
    // ========== 数据加载 ==========
    async loadOrderDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/foster/orders/${this.orderId}`,
          method: 'GET'
        })
        
        this.orderInfo = res
        
        // 设置地图标记
        if (res.latitude && res.longitude) {
          this.markers = [{
            id: 1,
            latitude: res.latitude,
            longitude: res.longitude,
            title: '宠物位置',
            callout: {
              content: res.location || '宠物位置',
              color: '#D47836',
              fontSize: 14,
              borderRadius: 10,
              padding: 8,
              display: 'ALWAYS'
            }
          }]
          this.calculateDistance()
        }
        
        // 加载宠物详情
        if (res.petId) {
          await this.loadPetDetail(res.petId)
        }
        
        // 加载服务凭证
        await this.loadServiceRecord()
        
      } catch (error) {
        console.error('加载订单详情失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    async loadPetDetail(petId) {
      try {
        const res = await request({
          url: `/api/pets/${petId}`,
          method: 'GET'
        })
        this.petInfo = res
      } catch (error) {
        console.error('加载宠物详情失败', error)
      }
    },
    
    async loadServiceRecord() {
      if (!this.isTrustee) return
      try {
        const res = await request({
          url: `/api/foster/orders/${this.orderId}/service-record`,
          method: 'GET'
        })
        this.serviceRecord = res
      } catch (error) {
        console.log('无服务凭证', error)
      }
    },
    
    // 模拟数据
    useMockData() {
      this.orderInfo = {
        id: this.orderId,
        petId: 1,
        petName: '哈哈',
        petType: 'dog',
        breed: '泰迪',
        status: 2,
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        location: '广州嘿嘿嘿小区',
        latitude: 23.076,
        longitude: 113.387,
        dailyPrice: 150,
        description: '嘿嘿嘿小区4楼203号房间，4.9晚上7.00遛狗、喂养，上传相关照片'
      }
      
      this.petInfo = {
        id: 1,
        name: '哈哈',
        petType: 'dog',
        breed: '泰迪',
        gender: 1,
        birthDate: '2025-10-07',
        healthStatus: '良好',
        weight: 3.5,
        sterilized: true,
        vaccinated: true,
        description: '这是一只棕色卷毛的泰迪，性格活泼，喜欢与人互动。',
        photos: ['/static/teddy.jpg', '/static/teddy2.jpg', '/static/teddy3.jpg']
      }
      
      this.markers = [{
        id: 1,
        latitude: 23.076,
        longitude: 113.387,
        title: '宠物位置',
        callout: { content: '广州嘿嘿嘿小区', color: '#D47836', fontSize: 14, display: 'ALWAYS' }
      }]
    },
    
    // ========== 操作 ==========
    startNav() {
      if (this.orderInfo && this.orderInfo.latitude && this.orderInfo.longitude) {
        uni.openLocation({
          latitude: this.orderInfo.latitude,
          longitude: this.orderInfo.longitude,
          name: this.orderInfo.location || '宠物位置',
          scale: 15
        })
      }
    },
    
    contactOwner() {
      uni.navigateTo({
        url: `/pages/message/chat?userId=${this.orderInfo.userId}&name=宠物主人&type=user`
      })
    },
    
    async cancelOrder() {
      uni.showModal({
        title: '取消订单',
        content: '确定要取消这个托管订单吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              await request({
                url: `/api/foster/orders/${this.orderId}/cancel`,
                method: 'PATCH'
              })
              uni.hideLoading()
              uni.showToast({ title: '订单已取消', icon: 'success' })
              this.orderInfo.status = 4
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '取消失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    async completeOrder() {
      uni.showModal({
        title: '完成服务',
        content: '确认已完成服务吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              await request({
                url: `/api/foster/orders/${this.orderId}/complete`,
                method: 'PATCH'
              })
              uni.hideLoading()
              uni.showToast({ title: '服务已完成', icon: 'success' })
              this.orderInfo.status = 3
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '操作失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    uploadServiceRecord() {
      uni.navigateTo({
        url: `/pages/foster/service-record?orderId=${this.orderId}`
      })
    },
    
    applyAfterSales() {
      uni.navigateTo({
        url: `/pages/order/afterSales?orderId=${this.orderId}`
      })
    },
    
    previewImage(url) {
      if (url) {
        uni.previewImage({ urls: [url] })
      }
    },
    
    toggleExpand() {
      this.isExpanded = !this.isExpanded
    }
  }
}
</script>

<style scoped>
.trust-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
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

/* 加载/空状态 */
.loading-state, .empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 状态卡片 */
.status-card {
  background: linear-gradient(135deg, #FFE0A8, #FFF2D6);
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  text-align: center;
}
.status-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #D47836;
  display: block;
}
.status-desc {
  font-size: 26rpx;
  color: #B8860B;
  margin-top: 10rpx;
}
.status-pending { background: linear-gradient(135deg, #FFE0A8, #FFF2D6); }
.status-confirmed { background: linear-gradient(135deg, #C8E6C9, #E8F5E9); }
.status-confirmed .status-text { color: #4CAF50; }
.status-completed { background: linear-gradient(135deg, #BBDEFB, #E3F2FD); }
.status-completed .status-text { color: #2196F3; }
.status-cancelled { background: linear-gradient(135deg, #FFCDD2, #FFEBEE); }
.status-cancelled .status-text { color: #f44336; }

/* 宠物轮播图 */
.pet-swiper {
  height: 350rpx;
  width: 100%;
}
.pet-swiper-placeholder {
  height: 350rpx;
  width: 100%;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-text {
  font-size: 80rpx;
}
.swiper-img {
  width: 100%;
  height: 100%;
}

/* 通用卡片样式 */
.info-card {
  background-color: #fff;
  margin: 20rpx;
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

/* 宠物档案 */
.pet-archive {
  display: flex;
  align-items: center;
}
.pet-avatar {
  width: 100rpx;
  height: 100rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 44rpx;
}
.pet-info {
  flex: 1;
}
.pet-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.pet-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}
.pet-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.gender-icon {
  font-size: 24rpx;
}
.gender-icon.male { color: #2196F3; }
.gender-icon.female { color: #E91E63; }
.pet-tags {
  display: flex;
  gap: 12rpx;
}
.tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.expand-btn {
  text-align: center;
  margin-top: 20rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #eee;
}
.expand-btn text {
  font-size: 26rpx;
  color: #D47836;
}

.expanded-info {
  margin-top: 20rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #eee;
}
.info-item {
  margin-bottom: 15rpx;
}
.info-item .label {
  font-size: 26rpx;
  color: #666;
  width: 160rpx;
  display: inline-block;
}
.info-item .value {
  font-size: 26rpx;
  color: #333;
}
.intro-box {
  background-color: #E8F5E0;
  padding: 15rpx;
  border-radius: 10rpx;
  margin-top: 8rpx;
}
.intro-box text {
  font-size: 24rpx;
  color: #333;
  line-height: 1.5;
}

/* 任务备注 */
.note-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

/* 服务时间 */
.date-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}
.days {
  font-size: 26rpx;
  color: #FF6600;
}

/* 地图 */
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

/* 报酬信息 */
.reward-info {
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.reward-info .label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-right: 20rpx;
}
.reward-info .amount {
  font-size: 40rpx;
  color: #FF6600;
  font-weight: bold;
}
.reward-info .unit {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

/* 服务凭证 */
.service-record {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}
.record-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.record-photo {
  width: 150rpx;
  height: 150rpx;
  border-radius: 12rpx;
  background-color: #eee;
}
.record-note {
  font-size: 26rpx;
  color: #666;
}
.record-status {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  align-self: flex-start;
}
.record-status.pending {
  background-color: #FFF3E0;
  color: #FF9800;
}
.record-status.confirmed {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.upload-record {
  display: flex;
  justify-content: center;
}
.upload-btn {
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 40rpx;
  padding: 15rpx 30rpx;
  font-size: 26rpx;
}

/* 底部操作栏 */
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
.action-btn.cancel {
  background-color: #fff;
  color: #f44336;
  border: 1rpx solid #f44336;
}
.action-btn.complete {
  background-color: #4CAF50;
  color: #fff;
}
.action-btn.aftersale {
  background-color: #fff;
  color: #FF9800;
  border: 1rpx solid #FF9800;
}
.action-btn::after {
  border: none;
}
</style>