<template>
  <view class="lost-pet-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">我的寻宠</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 标签切换栏 -->
    <view class="tab-bar">
      <text class="tab-item" :class="{ active: currentTab === 'all' }" @tap="switchTab('all')">全部</text>
      <text class="tab-item" :class="{ active: currentTab === 'looking' }" @tap="switchTab('looking')">寻找中</text>
      <text class="tab-item" :class="{ active: currentTab === 'found' }" @tap="switchTab('found')">已找到</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 3. 寻宠卡片列表 -->
    <view class="card-list" v-else>
      <view class="pet-card" v-for="pet in filteredList" :key="pet.id" @tap="goToDetail(pet.id)">
        <view class="card-image">
          <image class="pet-img" :src="pet.image" mode="aspectFill" />
          <view class="reward-tag">悬赏：¥{{ pet.bountyAmount }}</view>
        </view>
        <view class="card-content">
          <view class="status-row">
            <text class="card-title">寻宠</text>
            <text class="status-tag" :class="pet.status === 1 ? 'looking' : 'found'">
              {{ pet.status === 1 ? '寻找中' : '已找到' }}
            </text>
          </view>
          <view class="pet-info">
            <text class="pet-name">{{ pet.petName }}</text>
            <text class="gender-icon" :class="pet.gender === 1 ? 'male' : 'female'">
              {{ pet.gender === 1 ? '♂' : '♀' }}
            </text>
            <view class="tags">
              <text class="tag">{{ getPetTypeText(pet.petType) }}</text>
              <text class="tag">{{ pet.breed }}</text>
            </view>
          </view>
          <view class="location-info">
            <text class="info-icon">📍</text>
            <text class="address">{{ pet.lostLocation }}</text>
            <view class="view-count">
              <text class="info-icon">👁️</text>
              <text>{{ pet.views || 0 }}</text>
            </view>
          </view>
          <text class="distance" v-if="pet.distance">距离 {{ pet.distance }}km</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && filteredList.length === 0">
      <text>暂无寻宠信息</text>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      currentTab: 'all',
      petList: [],
      loading: false,
      userLocation: null
    }
  },
  computed: {
    filteredList() {
      if (this.currentTab === 'all') {
        return this.petList
      } else if (this.currentTab === 'looking') {
        return this.petList.filter(pet => pet.status === 1)
      } else if (this.currentTab === 'found') {
        return this.petList.filter(pet => pet.status === 2)
      }
      return []
    }
  },
  onShow() {
    this.loadPetList()
    this.getUserLocation()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 工具方法 ==========
    getPetTypeText(type) {
      const typeMap = { 
        'dog': '狗狗', 
        'cat': '猫咪', 
        'bird': '鸟类', 
        'rabbit': '兔子', 
        'hamster': '仓鼠', 
        'other': '其他' 
      }
      return typeMap[type] || '宠物'
    },
    
    // 获取用户位置
    getUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.userLocation = { lat: res.latitude, lng: res.longitude }
          this.calculateDistances()
        },
        fail: () => {
          console.log('获取位置失败')
        }
      })
    },
    
    // 计算所有帖子的距离
    calculateDistances() {
      if (!this.userLocation) return
      
      this.petList.forEach(pet => {
        if (pet.latitude && pet.longitude) {
          pet.distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            pet.latitude,
            pet.longitude
          )
        }
      })
      
      // 触发视图更新
      this.petList = [...this.petList]
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
    
    // ========== 数据加载 ==========
    async loadPetList() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/lost-pet/posts/mine',
          method: 'GET'
        })
        
        this.petList = (res || []).map(item => ({
          id: item.id,
          petName: item.petName,
          petType: item.petType,
          breed: item.breed,
          gender: item.gender,
          lostLocation: item.lostLocation,
          latitude: item.latitude,
          longitude: item.longitude,
          bountyAmount: item.bountyAmount || 0,
          status: item.status,
          views: item.views || 0,
          image: item.photos?.[0] || '/static/default-pet.png',
          createTime: item.createTime
        }))
        
        // 计算距离
        if (this.userLocation) {
          this.calculateDistances()
        }
        
      } catch (error) {
        console.error('加载寻宠列表失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 模拟数据
    useMockData() {
      this.petList = [
        {
          id: 1,
          petName: '布丁',
          petType: 'bird',
          breed: '虎皮鹦鹉',
          gender: 0,
          lostLocation: '广东外语外贸大学',
          latitude: 23.076,
          longitude: 113.387,
          bountyAmount: 150,
          status: 1,
          views: 25,
          image: '/static/pet1.jpg'
        },
        {
          id: 2,
          petName: '旺财',
          petType: 'dog',
          breed: '金毛',
          gender: 1,
          lostLocation: '番禺区大学城路',
          latitude: 23.060,
          longitude: 113.385,
          bountyAmount: 200,
          status: 1,
          views: 32,
          image: '/static/pet2.jpg'
        },
        {
          id: 3,
          petName: '咪咪',
          petType: 'cat',
          breed: '布偶',
          gender: 0,
          lostLocation: '番禺区小谷围街',
          latitude: 23.055,
          longitude: 113.380,
          bountyAmount: 300,
          status: 2,
          views: 45,
          image: '/static/pet3.jpg'
        }
      ]
      
      if (this.userLocation) {
        this.calculateDistances()
      }
    },
    
    // ========== UI交互 ==========
    switchTab(tab) {
      this.currentTab = tab
    },
    
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/user/seek/detail?id=${id}`
      })
    }
  }
}
</script>

<style scoped>
.lost-pet-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
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

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 2. 标签切换栏 */
.tab-bar {
  display: flex;
  background-color: #fff;
  padding: 15rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}
.tab-item {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  padding: 10rpx 0;
  position: relative;
}
.tab-item.active {
  color: #D47836;
  font-weight: bold;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -15rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #D47836;
  border-radius: 2rpx;
}

/* 3. 寻宠卡片列表 */
.card-list {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  justify-content: space-between;
}
.pet-card {
  width: 48%;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.card-image {
  position: relative;
  height: 200rpx;
}
.pet-img {
  width: 100%;
  height: 100%;
  background-color: #eee;
}
.reward-tag {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background-color: #FFE0A8;
  color: #D47836;
  font-size: 22rpx;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
}
.card-content {
  padding: 15rpx;
}
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}
.card-title {
  font-size: 26rpx;
  color: #D47836;
  font-weight: bold;
}
.status-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}
.status-tag.looking {
  background-color: #FFEBEE;
  color: #E53935;
}
.status-tag.found {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.pet-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 10rpx;
  flex-wrap: wrap;
}
.pet-name {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}
.gender-icon {
  font-size: 22rpx;
}
.gender-icon.male {
  color: #2196F3;
}
.gender-icon.female {
  color: #E91E63;
}
.tags {
  display: flex;
  gap: 8rpx;
}
.tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
}
.location-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: #666;
  margin-bottom: 8rpx;
}
.info-icon {
  font-size: 20rpx;
}
.address {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.view-count {
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.distance {
  font-size: 22rpx;
  color: #4CAF50;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}
</style>