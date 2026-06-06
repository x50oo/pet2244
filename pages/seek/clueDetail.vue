<template>
  <view class="clue-detail-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">线索审核</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="clueInfo">
      <!-- 2. 审核状态卡片 -->
      <view class="status-card" :class="getAuditStatusClass(clueInfo.auditStatus)">
        <text class="status-text">{{ getAuditStatusText(clueInfo.auditStatus) }}</text>
        <text class="status-desc">{{ getAuditStatusDesc(clueInfo.auditStatus) }}</text>
      </view>

      <!-- 3. 线索照片 -->
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

      <!-- 4. 线索描述 -->
      <view class="desc-card">
        <text class="desc-text">{{ clueInfo.content || clueInfo.description }}</text>
      </view>

      <!-- 5. 提供者信息卡片 -->
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

      <!-- 7. 标记位置卡片 -->
      <view class="location-card" v-if="clueInfo.latitude && clueInfo.longitude">
        <view class="section-title">
          <text class="title-icon">📍</text>
          <text>标记位置：</text>
          <text class="address">{{ clueInfo.locationName || clueInfo.address || '未知位置' }}</text>
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
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !clueInfo">
      <text>线索不存在</text>
    </view>

    <!-- 8. 底部操作栏（管理员审核用） -->
    <view class="action-bar" v-if="clueInfo && clueInfo.auditStatus === 1">
      <button class="action-btn reject" @tap="rejectAudit">驳回</button>
      <button class="action-btn pass" @tap="approveAudit">通过</button>
      <button class="action-btn next" @tap="nextAudit">下一个</button>
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
      loading: false,
      markers: []
    }
  },
  onLoad(options) {
    if (options.id) {
      this.clueId = parseInt(options.id)
      this.loadClueDetail()
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
      const map = { 
        1: '等待管理员审核', 
        2: '审核已通过，将对发布者可见', 
        3: '审核未通过，已通知提供者' 
      }
      return map[status] || ''
    },
    
    getAuditStatusClass(status) {
      const map = { 1: 'status-pending', 2: 'status-pass', 3: 'status-reject' }
      return map[status] || ''
    },
    
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    // ========== 数据加载 ==========
    async loadClueDetail() {
      this.loading = true
      try {
        // 获取线索详情（需要后端提供）
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
          auditStatus: res.auditStatus || 1,
          postId: res.postId
        }
        
        // 加载关联的寻宠帖子
        if (res.postId) {
          await this.loadPostDetail(res.postId)
        }
        
        // 设置地图标记
        if (res.latitude && res.longitude) {
          this.markers = [{
            id: 1,
            latitude: res.latitude,
            longitude: res.longitude,
            title: '线索位置',
            callout: {
              content: res.locationName || '线索位置',
              color: '#D47836',
              fontSize: 14,
              display: 'ALWAYS'
            }
          }]
        }
        
      } catch (error) {
        console.error('加载线索详情失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    async loadPostDetail(postId) {
      try {
        const res = await request({
          url: `/api/lost-pet/posts/${postId}`,
          method: 'GET'
        })
        this.postInfo = res
      } catch (error) {
        console.error('加载帖子详情失败', error)
      }
    },
    
    // 模拟数据
    useMockData() {
      this.postInfo = {
        id: 1,
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
        auditStatus: 1,
        postId: 1
      }
      
      this.markers = [{
        id: 1,
        latitude: 23.076,
        longitude: 113.387,
        title: '线索位置',
        callout: { content: '广东外语外贸大学', color: '#D47836', fontSize: 14, display: 'ALWAYS' }
      }]
    },
    
    // ========== 审核操作 ==========
    // 审核通过
    approveAudit() {
      uni.showModal({
        title: '审核通过',
        content: '确定通过该线索吗？通过后将对寻宠发布者可见。',
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
          status: status  // 2=通过, 3=驳回
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
        
        // 自动加载下一个
        setTimeout(() => {
          this.nextAudit()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('审核失败', error)
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
          // 跳转到下一个
          uni.redirectTo({
            url: `/pages/seek/clueDetail?id=${nextItem.businessId}`
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
        console.error('获取下一个失败', error)
        uni.showToast({ title: '暂无更多待审核', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    },
    
    // ========== 其他操作 ==========
    previewImage(url) {
      if (url) {
        uni.previewImage({ urls: [url] })
      }
    },
    
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
    
    goToPost() {
      uni.navigateTo({
        url: `/pages/seek/detail?id=${this.postInfo.id}`
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

/* 审核状态卡片 */
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

/* 2. 线索照片 */
.clue-img {
  width: 90%;
  height: 300rpx;
  border-radius: 16rpx;
  display: block;
  margin: 30rpx auto;
  background-color: #eee;
}
.clue-img-placeholder {
  width: 90%;
  height: 300rpx;
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

/* 5. 底部操作栏 - 管理端审核用 */
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
  border-radius: 40rpx;
  font-size: 28rpx;
  background-color: #fff;
}
.action-btn.pass {
  background-color: #4CAF50;
  color: #fff;
}
.action-btn.reject {
  background-color: #fff;
  color: #f44336;
  border: 1rpx solid #f44336;
}
.action-btn.next {
  background-color: #FFE0A8;
  color: #D47836;
}
.action-btn::after {
  border: none;
}
</style>