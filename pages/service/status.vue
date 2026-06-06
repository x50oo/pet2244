<template>
  <view class="service-status-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">服务凭证确认</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="orderInfo && serviceRecord">
      <!-- 2. 托管单信息卡片 -->
      <view class="order-card">
        <view class="order-header">
          <text class="order-title">托管订单</text>
          <text class="price">¥{{ orderInfo.dailyPrice }}/天</text>
        </view>

        <view class="pet-info">
          <view class="pet-basic">
            <text class="pet-name">{{ orderInfo.petName }}</text>
            <text class="gender-icon" :class="orderInfo.gender === 1 ? 'male' : 'female'">
              {{ orderInfo.gender === 1 ? '♂' : '♀' }}
            </text>
            <view class="tags">
              <text class="tag">{{ getPetTypeText(orderInfo.petType) }}</text>
              <text class="tag">{{ orderInfo.breed }}</text>
            </view>
          </view>
          <button class="detail-btn" @tap="viewOrderDetail">查看订单详情</button>
        </view>

        <view class="service-item">
          <text class="service-icon">🐾</text>
          <text class="service-text">{{ orderInfo.description || '暂无备注' }}</text>
        </view>

        <view class="location-item">
          <text class="loc-icon">📍</text>
          <text class="address">{{ orderInfo.location || '未知位置' }}</text>
        </view>
      </view>

      <!-- 3. 服务状态卡片 -->
      <view class="status-card">
        <text class="status-label">服务状态：</text>
        <text class="status-value" :class="getStatusClass(orderInfo.status)">
          {{ getStatusText(orderInfo.status) }}
        </text>
      </view>

      <!-- 4. 任务凭证区 -->
      <view class="proof-section">
        <view class="section-header">
          <text class="section-title">服务凭证</text>
          <text class="record-status" :class="serviceRecord.status === 2 ? 'confirmed' : 'pending'">
            {{ serviceRecord.status === 2 ? '已确认' : '待确认' }}
          </text>
        </view>
        
        <view class="proof-images" v-if="serviceRecord.photos && serviceRecord.photos.length">
          <image 
            class="proof-img" 
            v-for="(img, idx) in serviceRecord.photos" 
            :key="idx"
            :src="img" 
            mode="aspectFill" 
            @tap="previewImage(img)" 
          />
        </view>
        <view class="proof-placeholder" v-else>
          <text>暂无凭证图片</text>
        </view>
        
        <text class="proof-text">{{ serviceRecord.note || '无备注说明' }}</text>
        <text class="proof-time">提交时间：{{ serviceRecord.createTime }}</text>
      </view>

      <!-- 5. 确认信息（如果已确认） -->
      <view class="confirm-info" v-if="serviceRecord.status === 2">
        <text class="confirm-icon">✓</text>
        <text class="confirm-text">宠物主人已确认服务完成</text>
      </view>
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !orderInfo">
      <text>暂无待确认服务凭证</text>
    </view>

    <!-- 6. 底部操作栏（仅宠物主人且待确认时显示） -->
    <view class="bottom-bar" v-if="isOwner && serviceRecord && serviceRecord.status === 1">
      <view class="two-btns">
        <button class="action-btn reject" @tap="rejectRecord">驳回</button>
        <button class="action-btn pass" @tap="confirmRecord">确认完成</button>
      </view>
      <button class="next-btn" @tap="nextRecord">下一个</button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      orderId: null,
      recordId: null,
      orderInfo: null,
      serviceRecord: null,
      loading: false,
      isOwner: false
    }
  },
  onLoad(options) {
    // 有效 id：存在且不是 '0' 且不是 'null'
    if (options.orderId && options.orderId !== '0' && options.orderId !== 'null') {
      this.orderId = parseInt(options.orderId)
      this.loadData()
      this.checkUserRole()
    } else {
      // 没有有效 id 时，加载第一个待确认服务凭证
      this.loadFirstPendingRecord()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 工具方法 ==========
    getPetTypeText(type) {
      const map = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' }
      return map[type] || '宠物'
    },
    
    getStatusText(status) {
      const map = { 1: '待接单', 2: '进行中', 3: '已完成', 4: '已取消' }
      return map[status] || '未知'
    },
    
    getStatusClass(status) {
      const map = { 1: 'status-pending', 2: 'status-progress', 3: 'status-completed', 4: 'status-cancelled' }
      return map[status] || ''
    },
    
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    // ========== 加载第一个待确认服务凭证 ==========
    async loadFirstPendingRecord() {
      this.loading = true
      uni.showLoading({ title: '加载中...' })
      try {
        // 获取第一个进行中且有服务凭证的订单
        // 注意：此接口需要后端提供，暂时使用模拟逻辑
        // 实际应调用：/api/admin/audits?businessType=foster_service_record&status=1&page=1&size=1
        
        // 模拟数据
        setTimeout(() => {
          uni.hideLoading()
          this.useMockData()
          this.loading = false
        }, 500)
        
        // 真实接口调用（等后端提供后启用）
        /*
        const res = await request({
          url: '/api/admin/audits?businessType=foster_service_record&status=1&page=1&size=1',
          method: 'GET'
        })
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const firstItem = res.records[0]
          this.orderId = firstItem.businessId
          this.loadData()
        } else {
          this.loading = false
          uni.showToast({ title: '暂无待确认服务凭证', icon: 'none' })
        }
        */
        
      } catch (error) {
        uni.hideLoading()
        this.loading = false
        console.error('加载待确认列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 检查用户角色
    checkUserRole() {
      const userInfo = uni.getStorageSync('userInfo')
      // 判断是否是宠物主人
      if (this.orderInfo) {
        this.isOwner = userInfo?.userId === this.orderInfo.userId
      }
    },
    
    // ========== 数据加载 ==========
    async loadData() {
      this.loading = true
      try {
        // 获取托管订单详情
        const orderRes = await request({
          url: `/api/foster/orders/${this.orderId}`,
          method: 'GET'
        })
        this.orderInfo = orderRes
        
        // 判断是否是宠物主人
        const userInfo = uni.getStorageSync('userInfo')
        this.isOwner = userInfo?.userId === orderRes.userId
        
        // 获取服务凭证
        const recordRes = await request({
          url: `/api/foster/orders/${this.orderId}/service-record`,
          method: 'GET'
        })
        this.serviceRecord = {
          ...recordRes,
          createTime: this.formatTime(recordRes.createTime)
        }
        
      } catch (error) {
        console.error('加载数据失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 模拟数据
    useMockData() {
      this.orderInfo = {
        id: this.orderId || 1,
        petName: '哈哈',
        petType: 'dog',
        breed: '泰迪',
        gender: 1,
        dailyPrice: 15,
        description: '4.9晚上7.00遛狗、喂养，上传相关照片',
        location: '广州嘿嘿嘿小区',
        status: 2,
        userId: 1
      }
      
      this.serviceRecord = {
        id: 1,
        orderId: this.orderId || 1,
        photos: ['/static/dog1.jpg', '/static/dog2.jpg'],
        note: '狗狗很开心，已完成所有要求，按时遛狗并喂食。',
        status: 1,
        createTime: '2024-04-10 18:30:00'
      }
      
      const userInfo = uni.getStorageSync('userInfo')
      this.isOwner = userInfo?.userId === 1
    },
    
    // ========== 操作 ==========
    viewOrderDetail() {
      uni.navigateTo({
        url: `/pages/order/trustDetail?id=${this.orderId}`
      })
    },
    
    previewImage(url) {
      if (url) {
        uni.previewImage({ urls: [url] })
      }
    },
    
    // 确认服务凭证
    async confirmRecord() {
      uni.showModal({
        title: '确认完成',
        content: '请确认服务已完成，确认后将无法修改。',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '确认中...' })
            try {
              await request({
                url: `/api/foster/orders/service-records/${this.serviceRecord.id}/confirm`,
                method: 'PATCH'
              })
              
              uni.hideLoading()
              uni.showToast({ title: '已确认完成', icon: 'success' })
              this.serviceRecord.status = 2
              
              setTimeout(() => {
                this.nextRecord()
              }, 1500)
              
            } catch (error) {
              uni.hideLoading()
              console.error('确认失败', error)
              uni.showToast({ title: error.message || '操作失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    // 驳回（需要填写理由）
    rejectRecord() {
      uni.navigateTo({
        url: `/pages/audit/reject/index?businessType=foster_service_record&businessId=${this.serviceRecord.id}`,
        events: {
          acceptRejectReason: async (data) => {
            await this.submitReject(data.reason)
          }
        }
      })
    },
    
    async submitReject(reason) {
      uni.showLoading({ title: '提交中...' })
      try {
        await request({
          url: `/api/foster/orders/service-records/${this.serviceRecord.id}/reject`,
          method: 'PATCH',
          data: { reason: reason }
        })
        
        uni.hideLoading()
        uni.showToast({ title: '已驳回', icon: 'success' })
        
        setTimeout(() => {
          this.nextRecord()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('驳回失败', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      }
    },
    
    // 下一个待确认凭证
    async nextRecord() {
      uni.showLoading({ title: '加载下一个...' })
      
      try {
        // 需要后端提供获取下一个待确认凭证的接口
        // 暂时使用模拟逻辑
        setTimeout(() => {
          uni.hideLoading()
          uni.showModal({
            title: '提示',
            content: '暂无更多待确认凭证',
            showCancel: false,
            success: () => {
              uni.navigateBack()
            }
          })
        }, 500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('获取下一个失败:', error)
        uni.showToast({ title: '暂无更多待确认', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    }
  }
}
</script>

<style scoped>
.service-status-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 180rpx;
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

/* 2. 托管单信息卡片 */
.order-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.order-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #D47836;
}
.price {
  font-size: 34rpx;
  font-weight: bold;
  color: #FF6600;
}
.pet-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.pet-basic {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.pet-name {
  font-size: 28rpx;
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
  gap: 10rpx;
}
.tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 4rpx 15rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}
.detail-btn {
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  padding: 8rpx 20rpx;
  font-size: 24rpx;
}
.detail-btn::after {
  border: none;
}
.service-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 15rpx;
}
.service-icon {
  font-size: 28rpx;
}
.service-text {
  font-size: 26rpx;
  color: #666;
}
.location-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.loc-icon {
  font-size: 28rpx;
}
.address {
  font-size: 26rpx;
  color: #666;
}

/* 3. 服务状态卡片 */
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
  font-size: 28rpx;
  color: #666;
}
.status-value {
  font-size: 28rpx;
  font-weight: bold;
  padding: 6rpx 20rpx;
  border-radius: 30rpx;
}
.status-pending {
  background-color: #FFF3E0;
  color: #FF9800;
}
.status-progress {
  background-color: #E3F2FD;
  color: #2196F3;
}
.status-completed {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.status-cancelled {
  background-color: #FFEBEE;
  color: #f44336;
}

/* 4. 任务凭证区 */
.proof-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}
.section-header {
  background-color: #FFE0A8;
  padding: 15rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #D47836;
}
.record-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.record-status.pending {
  background-color: #FFF3E0;
  color: #FF9800;
}
.record-status.confirmed {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.proof-images {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
}
.proof-img {
  width: 48%;
  height: 250rpx;
  border-radius: 10rpx;
  background-color: #eee;
}
.proof-placeholder {
  padding: 60rpx;
  text-align: center;
  color: #999;
}
.proof-text {
  display: block;
  padding: 20rpx;
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  background-color: #FFFFFF;
}
.proof-time {
  display: block;
  padding: 0 20rpx 20rpx;
  font-size: 24rpx;
  color: #999;
  text-align: right;
}

/* 5. 确认信息 */
.confirm-info {
  background-color: #E8F5E9;
  margin: 0 20rpx 20rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}
.confirm-icon {
  font-size: 36rpx;
  color: #4CAF50;
}
.confirm-text {
  font-size: 28rpx;
  color: #4CAF50;
}

/* 6. 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  z-index: 100;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.two-btns {
  display: flex;
  gap: 20rpx;
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
.next-btn {
  width: 60%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  background-color: #fff;
  color: #D47836;
  border: 1rpx solid #D47836;
  margin: 0 auto;
}
.action-btn::after, .next-btn::after {
  border: none;
}
</style>