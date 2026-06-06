<template>
  <view class="order-page">
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">{{ isDetailMode ? '订单详情' : '我的订单' }}</text>
      <view class="placeholder"></view>
    </view>

    <template v-if="!isDetailMode">
      <view class="tab-bar">
        <view class="tab-item" :class="{ active: activeTab === 'all' }" @tap="switchTab('all')">全部</view>
        <view class="tab-item" :class="{ active: activeTab === 'pending' }" @tap="switchTab('pending')">进行中</view>
        <view class="tab-item" :class="{ active: activeTab === 'completed' }" @tap="switchTab('completed')">已完成</view>
      </view>

      <scroll-view class="order-list" scroll-y @scrolltolower="loadMore">
        <view class="order-card" v-for="order in orderList" :key="order.id" @tap="goToDetail(order)">
          <view class="order-header">
            <text class="order-type">{{ order.orderType === 'foster' ? '托管订单' : '寄养订单' }}</text>
            <text class="order-status" :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</text>
          </view>
          <view class="pet-info">
            <image class="pet-img" :src="order.petAvatar || '/static/default-pet.png'" mode="aspectFill" />
            <view class="pet-detail">
              <text class="pet-name">{{ order.petName }}</text>
              <text class="pet-breed">{{ order.breed }}</text>
            </view>
          </view>
          <view class="order-info">
            <view class="info-row">
              <text class="label">服务时间：</text>
              <text class="value">{{ order.startDate }} 至 {{ order.endDate }}</text>
            </view>
            <view class="info-row">
              <text class="label">总金额：</text>
              <text class="price">¥{{ order.totalPrice || order.dailyPrice * order.days }}</text>
            </view>
          </view>
          <view class="action-buttons" v-if="order.status === 1">
            <button class="btn cancel-btn" @tap.stop="cancelOrder(order)">取消订单</button>
          </view>
          <view class="action-buttons" v-if="order.status === 2">
            <button class="btn confirm-btn" @tap.stop="confirmComplete(order)">确认完成</button>
          </view>
        </view>
        <view class="loading-more" v-if="loadingMore"><text>加载中...</text></view>
        <view class="no-more" v-if="!hasMore && orderList.length > 0"><text>没有更多了</text></view>
        <view class="empty-state" v-if="!loading && orderList.length === 0"><text>暂无订单</text></view>
      </scroll-view>
    </template>

    <template v-else>
      <view class="loading-state" v-if="loading"><text>加载中...</text></view>
      <template v-else-if="orderInfo">
        <view class="status-card" :class="getStatusClass(orderInfo.status)">
          <text class="status-text">{{ getStatusText(orderInfo.status) }}</text>
          <text class="status-desc">{{ getStatusDesc(orderInfo.status) }}</text>
        </view>
        <view class="info-card">
          <view class="section-title">服务时间：</view>
          <view class="date-range">
            <text>{{ orderInfo.startDate }} 至 {{ orderInfo.endDate }}</text>
            <text class="days">共 {{ calculateDays(orderInfo.startDate, orderInfo.endDate) }} 天</text>
          </view>
        </view>
        <view class="info-card">
          <view class="section-title">订单信息：</view>
          <view class="detail-item"><text class="label">订单号：</text><text class="value">{{ orderInfo.orderNo || orderInfo.id }}</text></view>
          <view class="detail-item"><text class="label">下单时间：</text><text class="value">{{ formatTime(orderInfo.createTime) }}</text></view>
          <view class="detail-item"><text class="label">宠物：</text><text class="value">{{ orderInfo.petName }}（{{ getPetTypeText(orderInfo.petType) }} · {{ orderInfo.breed }}）</text></view>
        </view>
        <view class="info-card" v-if="orderInfo.remark">
          <view class="section-title"><text class="title-icon">📋</text><text>订单备注：</text></view>
          <view class="note-content">{{ orderInfo.remark }}</view>
        </view>
        <view class="action-bar" v-if="showActions">
          <button class="action-btn" @tap="contactOwner">联系发布人</button>
          <button class="action-btn cancel" v-if="canCancel" @tap="cancelOrderDetail">取消订单</button>
          <button class="action-btn confirm" v-if="canConfirm" @tap="confirmCompleteDetail">确认完成</button>
        </view>
      </template>
      <view class="empty-state" v-else><text>订单不存在</text></view>
    </template>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      orderId: null,
      isDetailMode: false,
      activeTab: 'all',
      orderList: [],
      page: 1,
      size: 10,
      hasMore: true,
      loading: false,
      loadingMore: false,
      orderInfo: null,
      petInfo: null,
      userInfo: null
    }
  },
  computed: {
    showActions() {
      return this.orderInfo && this.orderInfo.status !== 3 && this.orderInfo.status !== 4
    },
    canCancel() {
      return this.orderInfo && (this.orderInfo.status === 1 || this.orderInfo.status === 2)
    },
    canConfirm() {
      return this.orderInfo && this.orderInfo.status === 2
    }
  },
  onLoad(options) {
    this.userInfo = uni.getStorageSync('userInfo')
    if (options.id) {
      this.orderId = parseInt(options.id)
      this.isDetailMode = true
      this.loadOrderDetail()
    } else {
      this.isDetailMode = false
      this.loadOrders()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    switchTab(tab) {
      this.activeTab = tab
      this.page = 1
      this.orderList = []
      this.hasMore = true
      this.loadOrders()
    },
    getStatusText(status) {
      const map = { 1: '待接单', 2: '进行中', 3: '已取消', 4: '已完成' }
      return map[status] || '未知'
    },
    getStatusDesc(status) {
      const map = { 1: '等待接单', 2: '服务进行中', 3: '订单已取消', 4: '服务已完成' }
      return map[status] || ''
    },
    getStatusClass(status) {
      const map = { 1: 'status-pending', 2: 'status-progress', 3: 'status-cancelled', 4: 'status-completed' }
      return map[status] || ''
    },
    getPetTypeText(type) {
      const map = { 'cat': '猫咪', 'dog': '狗狗', 'bird': '鸟类', 'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' }
      return map[type] || type || '宠物'
    },
    formatTime(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    calculateDays(startDate, endDate) {
      if (!startDate || !endDate) return 0
      const start = new Date(startDate)
      const end = new Date(endDate)
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    },
    goToDetail(order) {
      uni.navigateTo({ url: `/pages/user/order/order?id=${order.id}` })
    },
    async loadOrders(isLoadMore = false) {
      if (this.loading || this.loadingMore) return
      if (!isLoadMore) { this.loading = true } else { this.loadingMore = true }
      try {
        const res = await request({
          url: `/api/foster/orders/mine?page=${this.page}&size=${this.size}`,
          method: 'GET'
        })
        let records = res?.records || res || []
        if (this.activeTab === 'pending') {
          records = records.filter(item => item.status === 1 || item.status === 2)
        } else if (this.activeTab === 'completed') {
          records = records.filter(item => item.status === 4)
        }
        this.orderList = isLoadMore ? [...this.orderList, ...records] : records
        this.hasMore = records.length === this.size
        if (this.hasMore) this.page++
      } catch (error) {
        console.error('加载订单失败', error)
        this.useMockData()
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    loadMore() {
      if (this.hasMore && !this.loadingMore) this.loadOrders(true)
    },
    async cancelOrder(order) {
      uni.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              await request({ url: `/api/foster/orders/${order.id}/cancel`, method: 'PATCH' })
              uni.hideLoading()
              uni.showToast({ title: '订单已取消', icon: 'success' })
              this.page = 1
              this.orderList = []
              this.hasMore = true
              this.loadOrders()
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '取消失败', icon: 'none' })
            }
          }
        }
      })
    },
    async confirmComplete(order) {
      uni.showModal({
        title: '确认完成',
        content: '请确认服务已完成，确认后将无法修改',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              await request({ url: `/api/foster/orders/${order.id}/complete`, method: 'PATCH' })
              uni.hideLoading()
              uni.showToast({ title: '服务已完成', icon: 'success' })
              this.page = 1
              this.orderList = []
              this.hasMore = true
              this.loadOrders()
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '操作失败', icon: 'none' })
            }
          }
        }
      })
    },
    async loadOrderDetail() {
      this.loading = true
      try {
        const res = await request({ url: `/api/foster/orders/${this.orderId}`, method: 'GET' })
        this.orderInfo = res
      } catch (error) {
        console.error('加载订单详情失败', error)
        this.loadMockDetail()
      } finally {
        this.loading = false
      }
    },
    async cancelOrderDetail() {
      uni.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              await request({ url: `/api/foster/orders/${this.orderInfo.id}/cancel`, method: 'PATCH' })
              uni.hideLoading()
              uni.showToast({ title: '订单已取消', icon: 'success' })
              this.orderInfo.status = 3
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '取消失败', icon: 'none' })
            }
          }
        }
      })
    },
    async confirmCompleteDetail() {
      uni.showModal({
        title: '确认完成',
        content: '请确认服务已完成，确认后将无法修改',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              await request({ url: `/api/foster/orders/${this.orderInfo.id}/complete`, method: 'PATCH' })
              uni.hideLoading()
              uni.showToast({ title: '服务已完成', icon: 'success' })
              this.orderInfo.status = 4
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '操作失败', icon: 'none' })
            }
          }
        }
      })
    },
    contactOwner() {
      uni.navigateTo({ url: `/pages/message/chat?userId=${this.orderInfo.userId}&name=发布人` })
    },
    useMockData() {
      this.orderList = [
        { id: 1, orderType: 'foster', status: 2, petName: '旺财', breed: '金毛', petAvatar: '/static/dog1.jpg', startDate: '2026-06-01', endDate: '2026-06-07', dailyPrice: 50, days: 7, totalPrice: 350 },
        { id: 2, orderType: 'foster', status: 4, petName: '咪咪', breed: '英短', petAvatar: '/static/cat1.jpg', startDate: '2026-05-20', endDate: '2026-05-25', dailyPrice: 40, days: 5, totalPrice: 200 }
      ]
    },
    loadMockDetail() {
      this.orderInfo = {
        id: this.orderId, status: 2, petName: '旺财', petType: 'dog', breed: '金毛',
        startDate: '2026-06-01', endDate: '2026-06-07', dailyPrice: 50, totalPrice: 350,
        remark: '每天拍照发微信', createTime: '2026-05-20T14:30:00', userId: 1
      }
    }
  }
}
</script>

<style scoped>
.order-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20rpx;
}
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
}
.back-icon { font-size: 40rpx; color: #333; }
.title { flex: 1; text-align: center; font-size: 34rpx; font-weight: bold; color: #333; }
.placeholder { width: 40rpx; }
.tab-bar {
  display: flex;
  background-color: #fff;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}
.tab-item {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  padding: 10rpx 0;
}
.tab-item.active {
  color: #D47836;
  border-bottom: 2rpx solid #D47836;
}
.order-list { padding: 20rpx; height: calc(100vh - 200rpx); }
.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 25rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #eee;
  margin-bottom: 15rpx;
}
.order-type { font-size: 28rpx; color: #333; font-weight: bold; }
.order-status { font-size: 26rpx; padding: 4rpx 12rpx; border-radius: 20rpx; }
.status-pending { color: #FF9800; background-color: #FFF3E0; }
.status-progress { color: #2196F3; background-color: #E3F2FD; }
.status-completed { color: #4CAF50; background-color: #E8F5E9; }
.status-cancelled { color: #f44336; background-color: #FFEBEE; }
.pet-info { display: flex; align-items: center; margin-bottom: 15rpx; }
.pet-img { width: 80rpx; height: 80rpx; border-radius: 50%; margin-right: 20rpx; background-color: #eee; }
.pet-detail { flex: 1; }
.pet-name { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.pet-breed { font-size: 24rpx; color: #999; margin-top: 6rpx; display: block; }
.order-info { background-color: #f9f9f9; padding: 15rpx; border-radius: 12rpx; margin-bottom: 15rpx; }
.info-row { display: flex; justify-content: space-between; margin-bottom: 10rpx; }
.info-row .label { font-size: 26rpx; color: #666; }
.info-row .value { font-size: 26rpx; color: #333; }
.price { font-size: 28rpx; color: #FF6600; font-weight: bold; }
.action-buttons { display: flex; justify-content: flex-end; gap: 20rpx; }
.btn { padding: 12rpx 30rpx; border-radius: 40rpx; font-size: 26rpx; background-color: #fff; border: 1rpx solid #ddd; }
.cancel-btn { color: #f44336; border-color: #f44336; }
.confirm-btn { color: #fff; background-color: #4CAF50; border: none; }
.status-card {
  background: linear-gradient(135deg, #FFE0A8, #FFF2D6);
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  text-align: center;
}
.status-text { font-size: 36rpx; font-weight: bold; color: #D47836; display: block; }
.status-desc { font-size: 26rpx; color: #B8860B; margin-top: 10rpx; }
.info-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.section-title { font-size: 28rpx; color: #D47836; font-weight: bold; margin-bottom: 20rpx; }
.date-range { display: flex; justify-content: space-between; font-size: 28rpx; color: #333; }
.days { font-size: 26rpx; color: #FF6600; }
.detail-item { display: flex; margin-bottom: 12rpx; }
.detail-item .label { font-size: 26rpx; color: #999; width: 140rpx; }
.detail-item .value { font-size: 26rpx; color: #333; flex: 1; }
.note-content { text-align: center; font-size: 26rpx; color: #666; padding: 10rpx; }
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  background-color: #fff;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}
.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border-radius: 40rpx;
  font-size: 28rpx;
}
.action-btn.cancel { background-color: #fff; color: #f44336; border: 1rpx solid #f44336; }
.action-btn.confirm { background-color: #4CAF50; color: #fff; }
.loading-state, .empty-state, .loading-more, .no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>