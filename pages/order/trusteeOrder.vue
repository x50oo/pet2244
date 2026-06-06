<template>
  <view class="trustee-order-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">{{ isAdmin ? '托管单审核' : '托管详情' }}</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="orderInfo">
      <!-- 2. 订单状态卡片 -->
      <view class="status-card" :class="getStatusClass(orderInfo.auditStatus)">
        <text class="status-text">{{ getAuditStatusText(orderInfo.auditStatus) }}</text>
        <text class="status-desc">{{ getAuditStatusDesc(orderInfo.auditStatus) }}</text>
      </view>

      <!-- 3. 轮播图区（宠物照片） -->
      <swiper class="banner" indicator-dots circular v-if="petImages.length > 0">
        <swiper-item v-for="(img, index) in petImages" :key="index">
          <image class="banner-img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>
      <view class="banner-placeholder" v-else>
        <text class="placeholder-text">🐕</text>
      </view>

      <!-- 4. 宠物信息卡片 -->
      <view class="pet-card" v-if="petInfo">
        <view class="pet-info">
          <image class="pet-avatar" :src="petInfo.avatarUrl || '/static/default-pet.png'" mode="aspectFill" />
          <view class="pet-details">
            <view class="name-row">
              <text class="pet-name">{{ petInfo.name }}</text>
              <text class="gender-icon" :class="petInfo.gender === 1 ? 'male' : 'female'">{{ petInfo.gender === 1 ? '♂' : '♀' }}</text>
            </view>
            <view class="tags">
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

      <!-- 5. 托管信息卡片 -->
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">托管标题：</text>
          <text class="info-value">{{ orderInfo.title || '无标题' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">托管类型：</text>
          <text class="info-value">{{ getFosterTypeText(orderInfo.fosterType) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">服务时间：</text>
          <text class="info-value">{{ orderInfo.startDate }} 至 {{ orderInfo.endDate }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">报酬：</text>
          <text class="info-value price">¥{{ orderInfo.dailyPrice }}/天</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系人：</text>
          <text class="info-value">{{ orderInfo.contactName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系电话：</text>
          <text class="info-value">{{ orderInfo.contactPhone }}</text>
        </view>
      </view>

      <!-- 6. 任务备注区 -->
      <view class="note-section">
        <view class="note-header">
          <text class="note-icon">📋</text>
          <text class="note-title">任务备注：</text>
        </view>
        <text class="note-text">{{ orderInfo.description || '暂无备注' }}</text>
      </view>

      <!-- 7. 宠物位置区 -->
      <view class="location-section" v-if="orderInfo.latitude && orderInfo.longitude">
        <view class="location-header">
          <text class="loc-icon">📍</text>
          <text class="label">宠物位置：</text>
          <text class="address">{{ orderInfo.location }}</text>
          <view class="distance-tag" v-if="distance">
            <text>距离您：{{ distance }}km</text>
          </view>
        </view>

        <view class="map-container" @tap="openNavigation">
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
        <button class="nav-btn" @tap="openNavigation">导航</button>
      </view>

      <!-- 8. 发布人信息 -->
      <view class="info-card" v-if="orderInfo.userName">
        <view class="info-row">
          <text class="info-label">发布人：</text>
          <text class="info-value">{{ orderInfo.userName }}</text>
        </view>
      </view>
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !orderInfo">
      <text>订单不存在</text>
    </view>

    <!-- 9. 底部操作栏（管理员审核时显示） -->
    <view class="bottom-bar" v-if="isAdmin && orderInfo && orderInfo.auditStatus === 1">
      <button class="action-btn reject" @tap="rejectAudit">驳回</button>
      <button class="action-btn pass" @tap="approveAudit">通过</button>
    </view>

    <!-- 底部操作栏（托管人接单时显示） -->
    <view class="bottom-bar" v-else-if="!isAdmin && orderInfo && orderInfo.auditStatus === 2 && orderInfo.status === 1">
      <button class="action-btn accept" @tap="acceptOrder">接单</button>
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
      loading: false,
      isExpanded: false,
      isAdmin: false,
      userLocation: null,
      distance: null,
      markers: []
    }
  },
  computed: {
    petImages() {
      if (!this.petInfo) return []
      return this.petInfo.photos || []
    }
  },
  onLoad(options) {
    if (options.id) {
      this.orderId = parseInt(options.id)
      // 判断当前用户角色
      const userInfo = uni.getStorageSync('userInfo')
      this.isAdmin = userInfo?.role === 1
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
    getAuditStatusText(status) {
      const map = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return map[status] || '未知'
    },

    getAuditStatusDesc(status) {
      const map = { 1: '等待管理员审核', 2: '审核已通过，可被接单', 3: '审核未通过' }
      return map[status] || ''
    },

    getStatusClass(status) {
      const map = { 1: 'status-pending', 2: 'status-pass', 3: 'status-reject' }
      return map[status] || ''
    },

    getFosterTypeText(type) {
      const map = { 'boarding': '寄养', 'feeding': '上门喂养', 'walking': '遛狗' }
      return map[type] || type || '未知'
    },

    getPetTypeText(type) {
      const typeMap = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' }
      return typeMap[type] || type || '宠物'
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

    // 模拟数据
    useMockData() {
      this.orderInfo = {
        id: this.orderId,
        petId: 1,
        petName: '哈哈',
        fosterType: 'boarding',
        title: '端午出门求照顾旺财',
        description: '嘿嘿嘿小区4楼203号房间，4.9晚上7.00遛狗、喂养，上传相关照片',
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        dailyPrice: 50,
        location: '广州嘿嘿嘿小区',
        latitude: 23.076,
        longitude: 113.387,
        contactName: '张先生',
        contactPhone: '138****8000',
        userName: '张先生',
        auditStatus: 1,
        status: 1
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
        photos: ['/static/dog1.jpg', '/static/dog2.jpg', '/static/dog3.jpg'],
        avatarUrl: '/static/dog1.jpg'
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
    openNavigation() {
      if (this.orderInfo && this.orderInfo.latitude && this.orderInfo.longitude) {
        uni.openLocation({
          latitude: this.orderInfo.latitude,
          longitude: this.orderInfo.longitude,
          name: this.orderInfo.location || '宠物位置',
          scale: 15
        })
      }
    },

    // 审核通过
    approveAudit() {
      uni.showModal({
        title: '审核通过',
        content: '确定通过该托管单吗？',
        success: async (res) => {
          if (res.confirm) {
            await this.submitAudit(2, null)
          }
        }
      })
    },

    // 审核驳回
    rejectAudit() {
      uni.navigateTo({
        url: `/pages/audit/reject/index?businessType=foster_order&businessId=${this.orderInfo.id}`,
        events: {
          acceptRejectReason: (data) => {
            this.submitAudit(3, data.reason)
          }
        }
      })
    },

    // 提交审核
    async submitAudit(status, reason) {
      uni.showLoading({ title: '提交中...' })

      try {
        const data = {
          businessType: 'foster_order',
          businessId: this.orderInfo.id,
          status: status
        }
        if (status === 3 && reason) {
          data.reason = reason
        }

        await request({
          url: '/api/admin/audits',
          method: 'POST',
          data: data
        })

        uni.hideLoading()
        uni.showToast({ title: status === 2 ? '审核通过' : '已驳回', icon: 'success' })

        setTimeout(() => {
          uni.navigateBack()
        }, 1500)

      } catch (error) {
        uni.hideLoading()
        console.error('审核失败', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      }
    },

    // 接单
    async acceptOrder() {
      uni.showModal({
        title: '接单确认',
        content: '确定要接这个托管单吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '接单中...' })
            try {
              await request({
                url: `/api/foster/orders/${this.orderId}/accept`,
                method: 'POST'
              })
              uni.hideLoading()
              uni.showToast({ title: '接单成功', icon: 'success' })
              setTimeout(() => {
                uni.navigateBack()
              }, 1500)
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '接单失败', icon: 'none' })
            }
          }
        }
      })
    },

    toggleExpand() {
      this.isExpanded = !this.isExpanded
    }
  }
}
</script>

<style scoped>
.trustee-order-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 150rpx;
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
.status-pass {
  background: linear-gradient(135deg, #C8E6C9, #E8F5E9);
}
.status-pass .status-text { color: #4CAF50; }
.status-reject {
  background: linear-gradient(135deg, #FFCDD2, #FFEBEE);
}
.status-reject .status-text { color: #f44336; }

/* 轮播图 */
.banner {
  height: 300rpx;
  width: calc(100% - 40rpx);
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}
.banner-placeholder {
  height: 300rpx;
  width: calc(100% - 40rpx);
  margin: 20rpx;
  border-radius: 16rpx;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-text {
  font-size: 80rpx;
}
.banner-img {
  width: 100%;
  height: 100%;
}

/* 宠物信息卡片 */
.pet-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.pet-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.pet-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #eee;
}
.pet-details {
  flex: 1;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
}
.pet-name {
  font-size: 34rpx;
  color: #333;
  font-weight: bold;
}
.gender-icon {
  font-size: 28rpx;
}
.gender-icon.male { color: #2196F3; }
.gender-icon.female { color: #E91E63; }
.tags {
  display: flex;
  gap: 15rpx;
}
.tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 6rpx 15rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}
.expand-btn {
  text-align: center;
  color: #D47836;
  font-size: 28rpx;
  padding: 15rpx 0 5rpx;
  border-top: 1rpx solid #eee;
  margin-top: 20rpx;
}

/* 展开后详细信息 */
.expanded-info {
  margin-top: 20rpx;
}
.info-item {
  margin-bottom: 20rpx;
  font-size: 28rpx;
}
.info-item .label {
  color: #666;
  width: 160rpx;
  display: inline-block;
}
.info-item .value {
  color: #333;
}
.intro-box {
  background-color: #E8F5E0;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-top: 10rpx;
}
.intro-box text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
}

/* 信息卡片 */
.info-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.info-row {
  display: flex;
  margin-bottom: 15rpx;
}
.info-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #999;
  flex-shrink: 0;
}
.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}
.info-value.price {
  color: #FF6600;
  font-weight: bold;
}

/* 任务备注 */
.note-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.note-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 15rpx;
}
.note-icon {
  font-size: 30rpx;
}
.note-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.note-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

/* 宠物位置 */
.location-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.location-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 20rpx;
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
}
.distance-tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 6rpx 15rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  margin-left: auto;
}

/* 地图 */
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

/* 底部操作栏req */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  gap: 20rpx;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  background-color: #fff;
}
.action-btn.reject {
  color: #E53935;
  border: 1rpx solid #E53935;
}
.action-btn.pass {
  color: #4CAF50;
  border: 1rpx solid #4CAF50;
}
.action-btn.accept {
  color: #D47836;
  border: 1rpx solid #D47836;
  background-color: #FFE0A8;
}
.action-btn::after {
  border: none;
}
</style>