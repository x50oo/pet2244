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

    <!-- 2. 线索信息卡片 -->
    <view class="form-card" v-if="clueInfo">
      <!-- 关联帖子信息 -->
      <view class="post-info">
        <text class="post-title">关联寻宠：{{ postInfo?.petName || '未知' }}</text>
        <text class="post-location">{{ postInfo?.lostLocation || '' }}</text>
      </view>

      <!-- 线索图片 -->
      <image 
        v-if="clueInfo.images && clueInfo.images.length > 0" 
        class="clue-img" 
        :src="clueInfo.images[0]" 
        mode="aspectFill" 
        @tap="previewImage(clueInfo.images[0])" 
      />
      <view v-else class="clue-img-placeholder">
        <text>暂无图片</text>
      </view>

      <!-- 线索描述 -->
      <view class="desc white-bg">
        <text>{{ clueInfo.content || '暂无描述' }}</text>
      </view>

      <!-- 线索提供者信息 -->
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">提供者：</text>
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

      <!-- 位置信息卡片 -->
      <view class="info-card" v-if="clueInfo.latitude && clueInfo.longitude">
        <view class="location-row">
          <text class="loc-icon">📍</text>
          <text class="label">标记位置：</text>
          <text class="address">{{ clueInfo.locationName || '未知位置' }}</text>
          <view class="distance-tag" v-if="distance">
            <text>距离您：{{ distance }}km</text>
          </view>
        </view>

        <!-- 地图缩略图容器 -->
        <view class="map-container">
          <map
            class="map-component"
            :latitude="currentLat"
            :longitude="currentLng"
            :scale="currentZoom"
            :markers="markers"
            :show-location="true"
            @tap="openMap"
          ></map>
          <view class="map-controls">
            <view class="control-btn" @tap.stop="getUserLocation">
              <text class="btn-icon">📍</text>
            </view>
            <view class="control-btn" @tap.stop="zoomIn">
              <text class="btn-icon">+</text>
            </view>
            <view class="control-btn" @tap.stop="zoomOut">
              <text class="btn-icon">-</text>
            </view>
          </view>
        </view>

        <!-- 导航按钮 -->
        <button class="nav-btn" @tap="openMap">导航</button>
      </view>

      <!-- 审核状态 -->
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">审核状态：</text>
          <text class="status-text" :class="auditStatusClass">{{ auditStatusText }}</text>
        </view>
      </view>
    </view>

    <view class="loading-tip" v-else-if="!loading">
      <text>暂无待审核线索</text>
    </view>
    <view class="loading-tip" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 3. 底部操作栏 -->
    <view class="bottom-bar" v-if="clueInfo && clueInfo.auditStatus === 1">
      <view class="two-btns">
        <button class="action-btn reject" @tap="rejectAudit">驳回</button>
        <button class="action-btn pass" @tap="approveAudit">通过</button>
      </view>
      <button class="next-btn" @tap="nextAudit">下一个</button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      clueId: null,
      clueInfo: null,
      postInfo: null,
      
      // 地图相关
      currentLat: 23.076,
      currentLng: 113.387,
      currentZoom: 15,
      userLat: null,
      userLng: null,
      distance: null,
      
      markers: [],
      loading: false
    }
  },
  computed: {
    auditStatusText() {
      if (!this.clueInfo) return ''
      const statusMap = {
        1: '待审核',
        2: '已通过',
        3: '已驳回'
      }
      return statusMap[this.clueInfo.auditStatus] || '未知'
    },
    auditStatusClass() {
      if (!this.clueInfo) return ''
      if (this.clueInfo.auditStatus === 1) return 'status-pending'
      if (this.clueInfo.auditStatus === 2) return 'status-pass'
      if (this.clueInfo.auditStatus === 3) return 'status-reject'
      return ''
    }
  },
  onLoad(options) {
    // 有效 id：存在且不是 '0' 且不是 'null'
    if (options.id && options.id !== '0' && options.id !== 'null') {
      this.clueId = parseInt(options.id)
      this.loadClueDetail()
    } else {
      // 没有有效 id 时，加载第一个待审核线索
      this.loadFirstPendingClue()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 加载第一个待审核线索
    async loadFirstPendingClue() {
      this.loading = true
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=lost_pet_clue&status=1&page=1&size=1',
          method: 'GET'
        })
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const firstItem = res.records[0]
          this.clueId = firstItem.businessId
          this.loadClueDetail()
        } else {
          this.loading = false
          uni.showToast({ title: '暂无待审核线索', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        this.loading = false
        console.error('加载待审核列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 加载线索详情
    async loadClueDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/lost-pet/clues/${this.clueId}`,
          method: 'GET'
        })
        
        this.clueInfo = res
        this.postInfo = res.post || {}
        
        // 设置地图标记
        if (this.clueInfo.latitude && this.clueInfo.longitude) {
          this.currentLat = this.clueInfo.latitude
          this.currentLng = this.clueInfo.longitude
          this.markers = [{
            id: 1,
            latitude: this.clueInfo.latitude,
            longitude: this.clueInfo.longitude,
            title: this.clueInfo.locationName || '线索位置',
            iconPath: '/static/marker.png',
            width: 40,
            height: 40,
            callout: {
              content: this.clueInfo.locationName || '线索位置',
              color: '#D47836',
              fontSize: 14,
              borderRadius: 10,
              padding: 8,
              display: 'ALWAYS'
            }
          }]
        }
        
        // 获取用户位置计算距离
        this.getUserLocationForDistance()
        
      } catch (error) {
        console.error('加载失败:', error)
        uni.showToast({ title: error.message || '加载失败', icon: 'none' })
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 获取用户位置计算距离
    getUserLocationForDistance() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.userLat = res.latitude
          this.userLng = res.longitude
          if (this.clueInfo.latitude && this.clueInfo.longitude) {
            this.distance = this.calculateDistance(
              this.userLat, this.userLng,
              this.clueInfo.latitude, this.clueInfo.longitude
            ).toFixed(1)
          }
        },
        fail: () => {
          console.log('获取位置失败')
        }
      })
    },
    
    // 计算两点距离（公里）
    calculateDistance(lat1, lng1, lat2, lng2) {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      this.clueInfo = {
        id: this.clueId,
        content: '4.10号早上8:30左右在广外一食堂附近的树上看到过',
        images: ['/static/clue-pic.jpg'],
        contactName: '李女士',
        contactPhone: '139****0000',
        createTime: '2024-04-10 14:30:00',
        latitude: 23.076,
        longitude: 113.387,
        locationName: '广东外语外贸大学',
        auditStatus: 1,
        postId: 1
      }
      this.postInfo = {
        petName: '布丁',
        lostLocation: '番禺区贝岗商业街'
      }
      this.markers = [{
        id: 1,
        latitude: 23.076,
        longitude: 113.387,
        title: '广东外语外贸大学',
        iconPath: '/static/marker.png',
        width: 40,
        height: 40
      }]
    },
    
    // 预览图片
    previewImage(url) {
      if (url) {
        uni.previewImage({ urls: [url] })
      }
    },
    
    // 获取用户位置（地图控件）
    getUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.currentLat = res.latitude
          this.currentLng = res.longitude
          uni.showToast({ title: '定位成功', icon: 'success' })
        },
        fail: () => {
          uni.showToast({ title: '请授权位置权限', icon: 'none' })
        }
      })
    },
    
    zoomIn() {
      if (this.currentZoom < 18) this.currentZoom++
    },
    zoomOut() {
      if (this.currentZoom > 10) this.currentZoom--
    },
    
    openMap() {
      if (this.clueInfo.latitude && this.clueInfo.longitude) {
        uni.openLocation({
          latitude: this.clueInfo.latitude,
          longitude: this.clueInfo.longitude,
          name: this.clueInfo.locationName || '线索位置',
          scale: 15
        })
      }
    },
    
    // 审核通过
    approveAudit() {
      uni.showModal({
        title: '审核通过',
        content: '确定通过该线索吗？',
        success: async (res) => {
          if (res.confirm) {
            await this.submitAudit(2, null)
          }
        }
      })
    },
    
    // 驳回审核
    rejectAudit() {
      uni.navigateTo({
        url: `/pages/audit/reject/index?businessType=lost_pet_clue&businessId=${this.clueInfo.id}`,
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
          businessType: 'lost_pet_clue',
          businessId: this.clueInfo.id,
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
        uni.showToast({ 
          title: status === 2 ? '审核通过' : '已驳回', 
          icon: 'success' 
        })
        
        setTimeout(() => {
          this.nextAudit()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('审核失败:', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      }
    },
    
    // 下一个待审核线索
    async nextAudit() {
      uni.showLoading({ title: '加载下一个...' })
      
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=lost_pet_clue&status=1&page=1&size=1',
          method: 'GET'
        })
        
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const nextItem = res.records[0]
          uni.redirectTo({
            url: `/pages/clue/detail?id=${nextItem.businessId}`
          })
        } else {
          uni.showModal({
            title: '提示',
            content: '暂无更多待审核线索',
            showCancel: false,
            success: () => {
              uni.navigateBack()
            }
          })
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('获取下一个失败:', error)
        uni.showToast({ title: '暂无更多待审核', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    }
  }
}
</script>

<style scoped>
.clue-detail-page {
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
  background-color: #FFF9E6;
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

/* 关联帖子信息 */
.post-info {
  background-color: #FFE0A8;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}
.post-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #D47836;
  margin-bottom: 8rpx;
}
.post-location {
  font-size: 24rpx;
  color: #666;
}

/* 2. 线索信息卡片 */
.form-card {
  background-color: #FFEBCD;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.clue-img {
  width: 100%;
  height: 280rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  background-color: #ddd;
}
.clue-img-placeholder {
  width: 100%;
  height: 280rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.white-bg {
  background-color: #FFFFFF;
}
.desc {
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
}
.desc text {
  font-size: 28rpx;
  color: #D47836;
  line-height: 1.6;
}

/* 信息卡片 */
.info-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-top: 10rpx;
}
.info-row {
  display: flex;
  margin-bottom: 15rpx;
}
.info-label {
  width: 140rpx;
  font-size: 28rpx;
  color: #999;
}
.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

/* 位置行 */
.location-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}
.loc-icon {
  font-size: 32rpx;
}
.label {
  font-size: 30rpx;
  color: #D47836;
  font-weight: bold;
}
.address {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}
.distance-tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
}

/* 地图容器 */
.map-container {
  position: relative;
  width: 100%;
  height: 450rpx;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}
.map-component {
  width: 100%;
  height: 100%;
}
.map-controls {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  z-index: 10;
}
.control-btn {
  width: 70rpx;
  height: 70rpx;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}
.control-btn:active {
  background-color: #FFE0A8;
}
.btn-icon {
  font-size: 36rpx;
  font-weight: bold;
  color: #D47836;
}

/* 导航按钮 */
.nav-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: bold;
}
.nav-btn::after {
  border: none;
}

/* 审核状态 */
.status-text {
  font-size: 28rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  display: inline-block;
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

/* 加载提示 */
.loading-tip {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 3. 底部操作栏 */
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