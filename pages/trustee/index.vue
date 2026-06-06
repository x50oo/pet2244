<template>
  <view class="trustee-page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="input-wrap">
        <view class="search-icon-wrap">
          <text class="search-icon">🔍</text>
        </view>
        <input class="search-input" placeholder="搜索托管人姓名" v-model="keyword" @confirm="searchTrustee" />
      </view>
      <button class="search-btn" @tap="searchTrustee">搜索</button>
    </view>

    <!-- 分类标签栏 -->
    <view class="tab-bar">
      <text class="tab-item" :class="{ active: activeTab === 'all' }" @tap="switchTab('all')">全部</text>
      <text class="tab-item" :class="{ active: activeTab === 'comprehensive' }" @tap="switchTab('comprehensive')">综合排序</text>
      <text class="tab-item" :class="{ active: activeTab === 'rating' }" @tap="switchTab('rating')">评分最高</text>
      <text class="tab-item" :class="{ active: activeTab === 'distance' }" @tap="switchTab('distance')">离我最近</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 托管人列表 -->
    <view class="trustee-list" v-else>
      <view class="trustee-card" v-for="(item, index) in displayList" :key="item.id" @tap="goToDetail(item.id)">
        <view class="card-header">
          <image class="avatar" :src="item.avatar || '/static/default-avatar.png'" mode="aspectFill" />
          <view class="info">
            <view class="name-row">
              <text class="name">{{ item.realName || item.name }}</text>
              <text class="status" :class="item.status === 2 ? 'active' : 'pending'">
                {{ item.status === 2 ? '接单中' : '待审核' }}
              </text>
            </view>
            <view class="rating-row">
              <text class="rating-star">⭐</text>
              <text class="rating-score">{{ item.avgRating || 0 }}</text>
              <text class="rating-unit">分</text>
              <text class="rating-sep">·</text>
              <text class="years">{{ item.years || 0 }}年经验</text>
              <text class="rating-sep">·</text>
              <text class="distance" v-if="item.distance">距你 {{ item.distance }}km</text>
              <text class="distance" v-else>距离未知</text>
            </view>
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
      } else if (this.activeTab === 'comprehensive') {
        // 综合排序：评分优先，其次距离
        list.sort((a, b) => {
          if ((b.avgRating || 0) !== (a.avgRating || 0)) {
            return (b.avgRating || 0) - (a.avgRating || 0)
          }
          return (a.distance || 999) - (b.distance || 999)
        })
      }
      
      return list
    }
  },
  onLoad() {
    this.loadTrusteeList()
    this.getUserLocation()
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
        // 获取已认证通过的托管人列表（需要后端支持分页）
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
          avatar: item.avatar || '/static/default-avatar.png',
          avgRating: item.avgRating || 0,
          years: item.years || 0,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          status: item.status || 2,
          bio: item.bio || item.description
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
        {
          id: 1,
          userId: 1,
          realName: '张托管',
          name: '张托管',
          avatar: '/static/avatar1.jpg',
          avgRating: 4.8,
          years: 3,
          address: '番禺区贝岗商业街',
          latitude: 23.076,
          longitude: 113.387,
          status: 2,
          distance: 0.5
        },
        {
          id: 2,
          userId: 2,
          realName: '李托管',
          name: '李托管',
          avatar: '/static/avatar2.jpg',
          avgRating: 4.6,
          years: 2,
          address: '番禺区大学城路',
          latitude: 23.060,
          longitude: 113.385,
          status: 2,
          distance: 1.2
        },
        {
          id: 3,
          userId: 3,
          realName: '王托管',
          name: '王托管',
          avatar: '/static/avatar3.jpg',
          avgRating: 0,
          years: 0,
          address: '番禺区小谷围街',
          latitude: 23.055,
          longitude: 113.380,
          status: 1,
          distance: 0.8
        }
      ]
      
      if (this.userLocation) {
        this.calculateDistances()
      }
    },
    
    // 搜索
    searchTrustee() {
      // 搜索已在 computed 中实现
    },
    
    // 切换标签
    switchTab(tab) {
      this.activeTab = tab
    },
    
    // 跳转详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/trustee/detail?id=${id}`
      })
    }
  }
}
</script>

<style scoped>
.trustee-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 40rpx;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: #FFF9E6;
}
.input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 50rpx;
  padding: 0 20rpx;
}
.search-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10rpx;
}
.search-icon {
  font-size: 32rpx;
  color: #D47836;
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
  border-radius: 50%;
  background-color: #eee;
  flex-shrink: 0;
}
.info {
  flex: 1;
}
.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}
.status.active {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.status.pending {
  background-color: #FFF2D6;
  color: #D47836;
}
.rating-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  flex-wrap: wrap;
}
.rating-star {
  font-size: 28rpx;
  color: #FF8C00;
}
.rating-score {
  font-size: 32rpx;
  font-weight: bold;
  color: #D47836;
}
.rating-unit {
  font-size: 24rpx;
  color: #D47836;
}
.rating-sep {
  font-size: 24rpx;
  color: #ccc;
  margin: 0 4rpx;
}
.years, .distance {
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