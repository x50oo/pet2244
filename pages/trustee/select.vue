<template>
  <view class="trustee-select-page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">选择托管人</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="input-wrap">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="搜索托管人姓名" v-model="keyword" @confirm="searchTrustee" />
      </view>
      <button class="search-btn" @tap="searchTrustee">搜索</button>
    </view>

    <!-- 分类标签栏 -->
    <view class="tab-bar">
      <text class="tab-item" :class="{ active: activeTab === 'all' }" @tap="switchTab('all')">全部</text>
      <text class="tab-item" :class="{ active: activeTab === 'rating' }" @tap="switchTab('rating')">评分最高</text>
      <text class="tab-item" :class="{ active: activeTab === 'distance' }" @tap="switchTab('distance')">离我最近</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 托管人列表 -->
    <view class="trustee-list" v-else>
      <view class="trustee-card" v-for="(item, index) in displayList" :key="item.id" @tap="selectTrustee(item)">
        <view class="card-header">
          <view class="avatar"><text class="avatar-text">👤</text></view>
          <view class="info">
            <view class="name-row">
              <text class="name">{{ item.realName || item.name }}</text>
              <text class="gender-icon" :class="item.gender === 1 ? 'male' : 'female'">
                {{ item.gender === 1 ? '♂' : '♀' }}
              </text>
            </view>
            <text class="experience">
              ⭐ {{ item.avgRating || 0 }}分 · {{ item.years || 0 }}年经验 
              <text v-if="item.distance"> · 距离 {{ item.distance }}km</text>
              <text v-else> · 距离未知</text>
            </text>
          </view>
        </view>
        <view class="card-footer">
          <text class="address">📍 {{ item.address || '未填写地址' }}</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="displayList.length === 0 && !loading">
        <text>暂无托管人</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      keyword: '',
      activeTab: 'all',
      loading: false,
      trusteeList: [],
      userLocation: null
    }
  },
  computed: {
    displayList() {
      let list = [...this.trusteeList]
      
      // 搜索过滤
      if (this.keyword) {
        list = list.filter(item => 
          (item.realName || item.name).includes(this.keyword)
        )
      }
      
      // 排序
      if (this.activeTab === 'rating') {
        list.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      } else if (this.activeTab === 'distance') {
        list.sort((a, b) => (a.distance || 999) - (b.distance || 999))
      }
      
      return list
    }
  },
  onLoad() {
    this.getUserLocation()
    this.loadTrusteeList()
  },
  methods: {
    // 获取用户位置
    getUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.userLocation = { lat: res.latitude, lng: res.longitude }
          this.calculateDistances()
        },
        fail: () => {
          console.log('获取位置失败，将不显示距离')
        }
      })
    },
    
    // 计算所有托管人的距离
    calculateDistances() {
      if (!this.userLocation) return
      
      this.trusteeList.forEach(trustee => {
        if (trustee.latitude && trustee.longitude) {
          trustee.distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            trustee.latitude,
            trustee.longitude
          )
        }
      })
      
      // 触发排序更新
      this.trusteeList = [...this.trusteeList]
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
      return (R * c).toFixed(1)
    },
    
    // 加载托管人列表
    async loadTrusteeList() {
      this.loading = true
      try {
        // 获取已认证通过的托管人列表
        const res = await request({
          url: '/api/foster/certifications?status=2&page=1&size=50',
          method: 'GET'
        })
        
        // 处理数据
        this.trusteeList = (res?.records || res || []).map(item => ({
          id: item.id,
          userId: item.userId,
          realName: item.realName,
          name: item.realName,
          gender: item.gender || 0,
          avgRating: item.avgRating || 0,
          years: item.years || 0,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          phone: item.phone,
          bio: item.bio || item.description,
          status: item.status
        }))
        
        // 计算距离
        if (this.userLocation) {
          this.calculateDistances()
        }
        
      } catch (error) {
        console.error('加载托管人列表失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 模拟数据
    useMockData() {
      this.trusteeList = [
        { id: 1, userId: 1, realName: '高能莉斯多', name: '高能莉斯多', gender: 0, avgRating: 4.8, years: 6, address: '小谷围嘿嘿小区', latitude: 23.076, longitude: 113.387, distance: 0.5 },
        { id: 2, userId: 2, realName: '张托管', name: '张托管', gender: 1, avgRating: 4.6, years: 3, address: '番禺区大学城路', latitude: 23.060, longitude: 113.385, distance: 1.2 },
        { id: 3, userId: 3, realName: '李托管', name: '李托管', gender: 0, avgRating: 4.9, years: 5, address: '番禺区新造镇', latitude: 23.050, longitude: 113.400, distance: 2.0 }
      ]
    },
    
    // 搜索
    searchTrustee() {
      // 搜索已在 computed 中实现
    },
    
    // 切换标签
    switchTab(tab) {
      this.activeTab = tab
    },
    
    // 选择托管人
    selectTrustee(trustee) {
      // 通过事件通道返回选中的托管人
      const eventChannel = this.getOpenerEventChannel()
      if (eventChannel) {
        eventChannel.emit('selectTrustee', {
          id: trustee.id,
          name: trustee.realName,
          phone: trustee.phone
        })
      }
      
      uni.showToast({ title: `已选择 ${trustee.realName}`, icon: 'success' })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    }
  }
}
</script>

<style scoped>
.trustee-select-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 40rpx;
}

/* 头部 */
.header {
  padding: 30rpx 30rpx 20rpx;
  background-color: #fff;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
}
.input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 50rpx;
  padding: 0 20rpx;
}
.search-icon {
  font-size: 30rpx;
  color: #999;
  margin-right: 10rpx;
}
.search-input {
  flex: 1;
  height: 70rpx;
  font-size: 28rpx;
}
.search-btn {
  width: 120rpx;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border-radius: 50rpx;
  font-size: 28rpx;
  border: none;
}
.search-btn::after {
  border: none;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 分类标签栏 */
.tab-bar {
  display: flex;
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 15rpx 10rpx;
  border-radius: 50rpx;
  gap: 10rpx;
}
.tab-item {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #666;
  padding: 10rpx 0;
  border-radius: 40rpx;
}
.tab-item.active {
  background-color: #FFE0A8;
  color: #D47836;
  font-weight: bold;
}

/* 托管人列表 */
.trustee-list {
  padding: 0 20rpx;
}
.trustee-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
}
.card-header {
  display: flex;
  gap: 20rpx;
  margin-bottom: 15rpx;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  font-size: 44rpx;
}
.info {
  flex: 1;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
}
.name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.gender-icon {
  font-size: 26rpx;
}
.gender-icon.male { color: #2196F3; }
.gender-icon.female { color: #E91E63; }
.experience {
  font-size: 24rpx;
  color: #999;
}
.card-footer {
  padding-top: 15rpx;
  border-top: 1rpx solid #eee;
}
.address {
  font-size: 24rpx;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}
</style>