<template>
  <view class="lost-pet-detail-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">寻宠详情</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="postInfo">
      <!-- 2. 宠物轮播图 -->
      <swiper class="pet-swiper" indicator-dots circular>
        <swiper-item v-for="(img, index) in petImages" :key="index">
          <image class="swiper-img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <!-- 3. 宠物档案卡片 -->
      <view class="info-card" v-if="petInfo">
        <view class="pet-archive">
          <view class="pet-avatar"><text>{{ getPetIcon(petInfo.petType) }}</text></view>
          <view class="pet-info">
            <text class="pet-title">宠物档案</text>
            <view class="pet-name-row">
              <text class="pet-name">{{ petInfo.name }}</text>
              <text class="gender-icon" :class="petInfo.gender === 1 ? 'male' : 'female'">
                {{ petInfo.gender === 1 ? '♂' : '♀' }}
              </text>
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

      <!-- 4. 丢失位置卡片 -->
      <view class="info-card">
        <view class="section-title">
          <text class="title-icon">📍</text>
          <text>丢失位置：</text>
          <text class="address">{{ postInfo.lostLocation }}</text>
          <text class="distance" v-if="distance">距离您：{{ distance }}km</text>
        </view>
        <view class="map-container" @tap="startNav">
          <map
            class="map-component"
            :latitude="postInfo.latitude || 23.076"
            :longitude="postInfo.longitude || 113.387"
            :scale="15"
            :markers="markers"
            :show-location="true"
          ></map>
          <view class="map-tip">点击地图打开导航</view>
        </view>
        <button class="nav-btn" @tap="startNav">导航</button>
      </view>

      <!-- 5. 补充描述卡片 -->
      <view class="info-card">
        <view class="section-title">补充描述：</view>
        <view class="desc-content">{{ postInfo.description || '暂无' }}</view>
      </view>

      <!-- 6. 悬赏信息 -->
      <view class="info-card">
        <view class="section-title">悬赏：</view>
        <view class="reward-info">
          <text class="amount">¥{{ postInfo.bountyAmount || 0 }}</text>
        </view>
      </view>

      <!-- 7. 状态信息 -->
      <view class="info-card">
        <view class="status-info">
          <text class="section-title">状态：</text>
          <text class="status-text" :class="postInfo.status === 1 ? 'looking' : 'found'">
            {{ postInfo.status === 1 ? '寻找中' : '已找到' }}
          </text>
          <button class="switch-btn" @tap="switchStatus">切换状态</button>
        </view>
      </view>

      <!-- 8. 审核状态 -->
      <view class="info-card">
        <view class="status-info">
          <text class="section-title">审核状态：</text>
          <text class="audit-text" :class="getAuditStatusClass(postInfo.auditStatus)">
            {{ getAuditStatusText(postInfo.auditStatus) }}
          </text>
        </view>
      </view>
    </template>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading && !postInfo">
      <text>寻宠信息不存在</text>
    </view>

    <!-- 9. 底部操作栏（仅发布者可见） -->
    <view class="action-bar" v-if="postInfo && isOwner">
      <view class="action-icon" @tap="editPost">
        <text class="icon-text">✎</text>
      </view>
      <view class="action-icon" @tap="deletePost">
        <text class="icon-text">🗑️</text>
      </view>
      <button class="clue-btn" @tap="relatedClues">相关线索</button>
      <view class="action-icon" @tap="sharePost">
        <text class="icon-text">📤</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      postId: null,
      postInfo: null,
      petInfo: null,
      loading: false,
      isExpanded: false,
      isOwner: false,
      userLocation: null,
      distance: null,
      markers: []
    }
  },
  computed: {
    petImages() {
      if (this.postInfo?.photos && this.postInfo.photos.length > 0) {
        return this.postInfo.photos
      }
      if (this.petInfo?.photos && this.petInfo.photos.length > 0) {
        return this.petInfo.photos
      }
      return ['/static/default-pet.png']
    }
  },
  onLoad(options) {
    if (options.id) {
      this.postId = parseInt(options.id)
      this.loadPostDetail()
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
    
    // ========== 工具方法 ==========
    getPetTypeText(type) {
      const map = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' }
      return map[type] || '宠物'
    },
    
    getPetIcon(type) {
      const map = { 'dog': '🐕', 'cat': '🐱', 'bird': '🐦', 'rabbit': '🐰', 'hamster': '🐹', 'other': '🐾' }
      return map[type] || '🐾'
    },
    
    getAuditStatusText(status) {
      const map = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return map[status] || '未知'
    },
    
    getAuditStatusClass(status) {
      if (status === 1) return 'audit-pending'
      if (status === 2) return 'audit-pass'
      if (status === 3) return 'audit-reject'
      return ''
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
      if (!this.userLocation || !this.postInfo?.latitude || !this.postInfo?.longitude) return
      
      const R = 6371
      const dLat = (this.postInfo.latitude - this.userLocation.lat) * Math.PI / 180
      const dLng = (this.postInfo.longitude - this.userLocation.lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.userLocation.lat * Math.PI / 180) * Math.cos(this.postInfo.latitude * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      this.distance = (R * c).toFixed(1)
    },
    
    // ========== 数据加载 ==========
    async loadPostDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/lost-pet/posts/${this.postId}`,
          method: 'GET'
        })
        
        this.postInfo = res
        
        // 判断是否是发布者
        const userInfo = uni.getStorageSync('userInfo')
        this.isOwner = userInfo?.userId === res.userId
        
        // 设置地图标记
        if (res.latitude && res.longitude) {
          this.markers = [{
            id: 1,
            latitude: res.latitude,
            longitude: res.longitude,
            title: '丢失位置',
            callout: {
              content: res.lostLocation,
              color: '#D47836',
              fontSize: 14,
              display: 'ALWAYS'
            }
          }]
          this.calculateDistance()
        }
        
        // 加载关联的宠物详情
        if (res.petId) {
          await this.loadPetDetail(res.petId)
        }
        
      } catch (error) {
        console.error('加载寻宠详情失败', error)
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
      this.postInfo = {
        id: this.postId,
        petId: 1,
        petName: '布丁',
        lostLocation: '广东外语外贸大学',
        latitude: 23.076,
        longitude: 113.387,
        description: '4.9号晚上17：35从厂内二食堂二楼飞出，蓝白色羽毛，脚上有红色脚环。',
        bountyAmount: 150,
        status: 1,
        auditStatus: 2,
        contactName: '张先生',
        contactPhone: '138****8000',
        photos: ['/static/parrot.jpg', '/static/parrot2.jpg'],
        userId: 1,
        createTime: '2024-04-09T17:35:00'
      }
      
      this.petInfo = {
        id: 1,
        name: '布丁',
        petType: 'bird',
        breed: '虎皮鹦鹉',
        gender: 0,
        birthDate: '2024-05-15',
        healthStatus: '良好',
        weight: 4.2,
        sterilized: true,
        vaccinated: true,
        description: '这是一只蓝白色的鹦鹉，性格温顺。',
        photos: ['/static/parrot.jpg']
      }
      
      this.markers = [{
        id: 1,
        latitude: 23.076,
        longitude: 113.387,
        title: '丢失位置',
        callout: { content: '广东外语外贸大学', color: '#D47836', fontSize: 14, display: 'ALWAYS' }
      }]
      
      const userInfo = uni.getStorageSync('userInfo')
      this.isOwner = userInfo?.userId === 1
    },
    
    // ========== 操作 ==========
    toggleExpand() {
      this.isExpanded = !this.isExpanded
    },
    
    startNav() {
      if (this.postInfo && this.postInfo.latitude && this.postInfo.longitude) {
        uni.openLocation({
          latitude: this.postInfo.latitude,
          longitude: this.postInfo.longitude,
          name: this.postInfo.lostLocation,
          scale: 15
        })
      }
    },
    
    // 切换状态
    async switchStatus() {
      const newStatus = this.postInfo.status === 1 ? 2 : 1
      const statusText = newStatus === 1 ? '寻找中' : '已找到'
      
      uni.showModal({
        title: '提示',
        content: `确定将状态切换为「${statusText}」吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '更新中...' })
            try {
              await request({
                url: `/api/lost-pet/posts/${this.postId}/status`,
                method: 'PATCH',
                data: { status: newStatus }
              })
              this.postInfo.status = newStatus
              uni.hideLoading()
              uni.showToast({ title: `已切换为${statusText}`, icon: 'success' })
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '操作失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    // 删除帖子
    async deletePost() {
      uni.showModal({
        title: '提示',
        content: '确定删除该寻宠信息吗？删除后不可恢复。',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中...' })
            try {
              await request({
                url: `/api/lost-pet/posts/${this.postId}`,
                method: 'DELETE'
              })
              uni.hideLoading()
              uni.showToast({ title: '已删除', icon: 'success' })
              setTimeout(() => {
                uni.navigateBack()
              }, 1500)
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '删除失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    // 编辑
    editPost() {
      uni.navigateTo({
        url: `/pages/seek/edit?id=${this.postId}`
      })
    },
    
    // 相关线索
    relatedClues() {
      uni.navigateTo({
        url: `/pages/seek/clue?postId=${this.postId}`
      })
    },
    
    // 分享
    sharePost() {
      uni.showToast({ title: '分享功能开发中', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.lost-pet-detail-page {
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

/* 2. 宠物轮播图 */
.pet-swiper {
  height: 350rpx;
  width: 100%;
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

/* 3. 宠物档案 */
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

/* 展开后的详细信息 */
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

/* 4. 丢失位置 */
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

/* 5. 补充描述 */
.desc-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

/* 6. 悬赏信息 */
.reward-info {
  display: flex;
  align-items: center;
  justify-content: center;
}
.amount {
  font-size: 40rpx;
  color: #FF6600;
  font-weight: bold;
}

/* 7. 状态信息 */
.status-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10rpx;
}
.status-info .section-title {
  margin-bottom: 0;
}
.status-text {
  font-size: 28rpx;
  font-weight: bold;
  flex: 1;
}
.status-text.looking {
  color: #E53935;
}
.status-text.found {
  color: #4CAF50;
}
.switch-btn {
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 30rpx;
  padding: 8rpx 20rpx;
  font-size: 26rpx;
}
.switch-btn::after {
  border: none;
}

/* 审核状态 */
.audit-text {
  font-size: 28rpx;
  padding: 4rpx 16rpx;
  border-radius: 30rpx;
}
.audit-pending {
  background-color: #FFF3E0;
  color: #FF9800;
}
.audit-pass {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.audit-reject {
  background-color: #FFEBEE;
  color: #F44336;
}

/* 8. 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: #fff;
  padding: 15rpx 25rpx;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(15rpx + env(safe-area-inset-bottom));
}
.action-icon {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-text {
  font-size: 32rpx;
  color: #666;
}
.clue-btn {
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 30rpx;
  padding: 10rpx 30rpx;
  font-size: 26rpx;
}
.clue-btn::after {
  border: none;
}
</style>