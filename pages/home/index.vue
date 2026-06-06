<template>
  <view class="home-page">
    <!-- 1. 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="请输入搜索内容" v-model="keyword" @confirm="searchContent" />
      </view>
      <button class="search-btn" @tap="searchContent">搜索</button>
    </view>

    <!-- 2. 轮播广告区 -->
    <swiper class="banner" autoplay circular indicator-dots v-if="bannerList.length > 0">
      <swiper-item v-for="(item, index) in bannerList" :key="index">
        <image class="banner-img" :src="item.imageUrl" mode="aspectFill" />
      </swiper-item>
    </swiper>
    <view class="banner-placeholder" v-else>
      <text class="placeholder-text">暂无轮播图</text>
    </view>

    <!-- 3. 功能入口区 -->
    <view class="func-outer">
      <view class="func-grid">
        <view class="func-item" v-for="(item, index) in functions" :key="index" @tap="goToFunc(item.path)">
          <view class="func-card">
            <image class="func-icon" :src="item.icon" mode="aspectFit" />
            <text class="func-text">{{ item.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 4. 广场列表区 -->
    <view class="square-section">
      <view class="square-header">
        <text class="loc-icon">📍</text>
        <text class="location">{{ locationName || '获取位置中...' }}</text>
        <text class="title">广场</text>
      </view>
      <view class="tab-bar">
        <text class="tab-item" :class="{ active: activeTab === 'all' }" @tap="switchTab('all')">全部</text>
        <text class="tab-item" :class="{ active: activeTab === 'seek' }" @tap="switchTab('seek')">寻宠</text>
        <text class="tab-item" :class="{ active: activeTab === 'trust' }" @tap="switchTab('trust')">托管单</text>
      </view>
      <view class="list-container" v-if="!loading">
        <view class="list-card" v-for="(item, index) in filteredList" :key="index" @tap="goToDetail(item)">
          <image class="card-img" :src="item.img || '/static/default-pet.png'" mode="aspectFill" />
          <view class="reward-tag" v-if="item.type === 'seek'">悬赏：¥{{ item.reward }}</view>
          <view class="reward-tag" v-else>报酬：¥{{ item.reward }}/天</view>
          <view class="card-info">
            <text class="card-title">{{ item.type === 'seek' ? '寻宠' : '托管单' }}</text>
            <view class="pet-basic">
              <text class="pet-name">{{ item.petName }}</text>
              <text class="gender-icon">{{ item.gender === 1 ? '♂' : '♀' }}</text>
              <view class="tags">
                <text class="tag">{{ getPetTypeText(item.petType) }}</text>
                <text class="tag">{{ item.breed }}</text>
              </view>
            </view>
            <text class="service-text" v-if="item.type === 'trust'">{{ item.startDate }} 至 {{ item.endDate }}</text>
            <view class="location-row">
              <text class="loc-icon">📍</text>
              <text class="address">{{ item.location || item.lostLocation }}</text>
              <text class="views">👁️ {{ item.views || 0 }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="loading-tip" v-if="loading">加载中...</view>
      <view class="empty-tip" v-if="!loading && filteredList.length === 0">暂无数据</view>
    </view>

    <!-- 5. 底部Tab栏 -->
    <view class="tabbar">
      <view class="tabbar-item" :class="{ active: currentTab === 'home' }" @tap="switchTabbar('home')">
        <image class="tabbar-icon" :src="currentTab === 'home' ? '/static/tabbar/home-active.png' : '/static/tabbar/home.png'" mode="aspectFit" />
        <text class="tabbar-text">首页</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'health' }" @tap="switchTabbar('health')">
        <image class="tabbar-icon" :src="currentTab === 'health' ? '/static/tabbar/health-active.png' : '/static/tabbar/health.png'" mode="aspectFit" />
        <text class="tabbar-text">健康</text>
      </view>
      <view class="tabbar-item add-btn" @tap="switchTabbar('publish')">
        <image class="tabbar-icon add-icon" src="/static/tabbar/add-active.png" mode="aspectFit" />
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'message' }" @tap="switchTabbar('message')">
        <image class="tabbar-icon" :src="currentTab === 'message' ? '/static/tabbar/message-active.png' : '/static/tabbar/message.png'" mode="aspectFit" />
        <text class="tabbar-text">消息</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'profile' }" @tap="switchTabbar('profile')">
        <image class="tabbar-icon" :src="currentTab === 'profile' ? '/static/tabbar/user-active.png' : '/static/tabbar/user.png'" mode="aspectFit" />
        <text class="tabbar-text">个人中心</text>
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
      currentTab: 'home',
      loading: false,
      locationName: '获取位置中...',
      
      // 后端数据
      bannerList: [],
      seekList: [],
      fosterList: [],
      
      // 功能入口
      functions: [
        { icon: '/static/find-pet.png', name: '寻宠', path: '/pages/seek/publish' },
        { icon: '/static/symptom.png', name: '症状自查', path: '/pages/health/symptom' },
        { icon: '/static/shop-rent.png', name: '宠物店寄养', path: '/pages/shop/list/list' },
        { icon: '/static/help.png', name: '邻里互助托管', path: '/pages/foster/publish' }
      ]
    }
  },
  computed: {
    filteredList() {
      if (this.activeTab === 'all') {
        const seekWithType = this.seekList.map(item => ({ ...item, type: 'seek' }))
        const fosterWithType = this.fosterList.map(item => ({ ...item, type: 'trust' }))
        return [...seekWithType, ...fosterWithType]
      }
      if (this.activeTab === 'seek') {
        return this.seekList.map(item => ({ ...item, type: 'seek' }))
      }
      if (this.activeTab === 'trust') {
        return this.fosterList.map(item => ({ ...item, type: 'trust' }))
      }
      return []
    }
  },
  onLoad() {
    this.loadData()
    this.getUserLocation()
  },
  methods: {
    // 获取宠物类型中文显示
    getPetTypeText(type) {
      const map = {
        'dog': '犬类', 'cat': '猫类', 'bird': '鸟类',
        'rabbit': '兔类', 'hamster': '仓鼠', 'other': '其他'
      }
      return map[type] || type || '宠物'
    },
    
    // 获取用户位置
    getUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.locationName = `${res.latitude.toFixed(2)}, ${res.longitude.toFixed(2)}`
        },
        fail: () => {
          this.locationName = '广州市'
        }
      })
    },
    
    // 加载首页数据
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadBanners(),
          this.loadSeekList(),
          this.loadFosterList()
        ])
      } catch (error) {
        console.error('加载首页数据失败:', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 加载轮播图
    async loadBanners() {
      try {
        const res = await request({
          url: '/api/banners',
          method: 'GET'
        })
        console.log('轮播图原始响应:', res)
        
        // 处理不同的返回格式
        let banners = []
        if (Array.isArray(res)) {
          banners = res
        } else if (res && Array.isArray(res.data)) {
          banners = res.data
        } else if (res && res.records) {
          banners = res.records
        } else {
          banners = []
        }
        
        // 过滤出上架的轮播图 (status === 1)
        this.bannerList = banners.filter(item => item.status === 1 || item.status === undefined)
        console.log('处理后的轮播图:', this.bannerList)
      } catch (error) {
        console.log('轮播图接口失败:', error)
        this.bannerList = []
      }
    },
    
    // 加载寻宠列表
    async loadSeekList() {
      try {
        const res = await request({
          url: '/api/lost-pet/posts?page=1&size=10',
          method: 'GET'
        })
        console.log('寻宠列表原始响应:', res)
        
        // 处理不同的返回格式
        let records = []
        if (res && Array.isArray(res.records)) {
          records = res.records
        } else if (Array.isArray(res)) {
          records = res
        } else if (res && Array.isArray(res.data)) {
          records = res.data
        } else if (res && res.data && Array.isArray(res.data.records)) {
          records = res.data.records
        } else {
          records = []
        }
        
        this.seekList = records.map(item => ({
          id: item.id,
          petName: item.petName || '未知宠物',
          petType: item.petType || 'other',
          breed: item.breed || '未知品种',
          gender: item.gender !== undefined ? item.gender : 0,
          lostLocation: item.lostLocation || item.location || '未知位置',
          reward: item.bountyAmount || 0,
          views: item.views || 0,
          img: item.photos && item.photos.length > 0 ? item.photos[0] : '/static/default-pet.png'
        }))
        console.log('处理后的寻宠列表数量:', this.seekList.length)
      } catch (error) {
        console.log('寻宠列表接口失败:', error)
        this.seekList = []
      }
    },
    
    // 加载托管列表
    async loadFosterList() {
      try {
        const res = await request({
          url: '/api/foster/orders?page=1&size=10',
          method: 'GET'
        })
        console.log('托管列表原始响应:', res)
        
        // 处理不同的返回格式
        let records = []
        if (res && Array.isArray(res.records)) {
          records = res.records
        } else if (Array.isArray(res)) {
          records = res
        } else if (res && Array.isArray(res.data)) {
          records = res.data
        } else if (res && res.data && Array.isArray(res.data.records)) {
          records = res.data.records
        } else {
          records = []
        }
        
        this.fosterList = records.map(item => ({
          id: item.id,
          petName: item.petName || '未知宠物',
          petType: item.petType || 'other',
          breed: item.breed || '未知品种',
          gender: item.gender !== undefined ? item.gender : 0,
          location: item.location || '未知位置',
          reward: item.dailyPrice || 0,
          startDate: item.startDate || '',
          endDate: item.endDate || '',
          views: item.views || 0,
          img: item.photos && item.photos.length > 0 ? item.photos[0] : '/static/default-pet.png'
        }))
        console.log('处理后的托管列表数量:', this.fosterList.length)
      } catch (error) {
        console.log('托管列表接口失败:', error)
        this.fosterList = []
      }
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      console.log('使用模拟数据')
      this.bannerList = [
        { imageUrl: '/static/banner1.jpg', status: 1 },
        { imageUrl: '/static/banner2.jpg', status: 1 },
        { imageUrl: '/static/banner3.jpg', status: 1 }
      ]
      
      this.seekList = [
        { id: 1, petName: '布丁', petType: 'bird', breed: '虎皮鹦鹉', gender: 0, lostLocation: '番禺区贝岗商业街', reward: 150, views: 25, img: '/static/pet1.jpg' },
        { id: 2, petName: '旺财', petType: 'dog', breed: '金毛', gender: 1, lostLocation: '番禺区大学城路', reward: 200, views: 32, img: '/static/pet2.jpg' }
      ]
      
      this.fosterList = [
        { id: 3, petName: '哈哈', petType: 'dog', breed: '泰迪', gender: 1, location: '番禺区贝岗商业街', reward: 15, startDate: '2024-04-09', endDate: '2024-04-12', views: 45, img: '/static/dog1.jpg' },
        { id: 4, petName: '豆豆', petType: 'dog', breed: '柯基', gender: 1, location: '番禺区大学城路', reward: 20, startDate: '2024-04-10', endDate: '2024-04-13', views: 38, img: '/static/dog2.jpg' }
      ]
    },
    
    // 搜索
    async searchContent() {
      if (!this.keyword.trim()) {
        uni.showToast({ title: '请输入搜索内容', icon: 'none' })
        return
      }
      
      try {
        await request({
          url: `/api/search?keyword=${encodeURIComponent(this.keyword)}&type=all`,
          method: 'GET'
        })
        uni.navigateTo({
          url: `/pages/search/result?keyword=${this.keyword}`
        })
      } catch (error) {
        console.log('搜索失败:', error)
        uni.showToast({ title: '搜索：' + this.keyword, icon: 'none' })
      }
    },
    
    switchTab(tab) {
      this.activeTab = tab
    },
    
    switchTabbar(tab) {
      this.currentTab = tab
      if (tab === 'home') return
      if (tab === 'health') { uni.reLaunch({ url: '/pages/health/index' }); return }
      if (tab === 'publish') {
        uni.showActionSheet({
          itemList: ['发布寻宠', '发布托管'],
          success: (res) => {
            if (res.tapIndex === 0) uni.navigateTo({ url: '/pages/seek/publish' })
            else if (res.tapIndex === 1) uni.navigateTo({ url: '/pages/foster/publish' })
          }
        })
        return
      }
      if (tab === 'message') { uni.reLaunch({ url: '/pages/message/list/list' }); return }
      if (tab === 'profile') { uni.reLaunch({ url: '/pages/user/profile/index' }); return }
    },
    
    goToFunc(path) {
      if (!path) {
        uni.showToast({ title: '功能开发中', icon: 'none' })
        return
      }
      uni.navigateTo({ url: path })
    },
    
    goToDetail(item) {
      if (item.type === 'seek') {
        uni.navigateTo({ url: `/pages/seek/detail?id=${item.id}` })
      } else {
        uni.navigateTo({ url: `/pages/order/trusteeOrder?id=${item.id}` })
      }
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 20rpx;
  gap: 15rpx;
}
.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1rpx solid #D47836;
  border-radius: 30rpx;
  padding: 15rpx 20rpx;
  background-color: #fff;
}
.search-icon {
  font-size: 30rpx;
  margin-right: 10rpx;
  color: #999;
}
.search-btn {
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 30rpx;
  padding: 15rpx 30rpx;
  font-size: 28rpx;
}
.search-btn::after {
  border: none;
}

.banner {
  height: 300rpx;
  width: 100%;
  margin-bottom: 20rpx;
}
.banner-placeholder {
  height: 300rpx;
  width: 100%;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}
.placeholder-text {
  font-size: 28rpx;
  color: #999;
}
.banner-img {
  width: 100%;
  height: 100%;
}

.func-outer {
  background-color: #FFF2D6;
  margin: 20rpx;
  padding: 20rpx 20rpx;
  border-radius: 20rpx;
}
.func-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15rpx;
  justify-items: center;
}
.func-item {
  display: flex;
  justify-content: center;
  width: 100%;
}
.func-card {
  width: 140rpx;
  background-color: #fff;
  border-radius: 35%;
  padding: 20rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}
.func-icon {
  width: 80rpx;
  height: 80rpx;
}
.func-text {
  font-size: 22rpx;
  color: #D47836;
  text-align: center;
  line-height: 1.2;
}

.square-section {
  background-color: #fff;
  margin: 0 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}
.square-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}
.square-header .loc-icon {
  font-size: 24rpx;
  margin-right: 10rpx;
}
.location {
  font-size: 24rpx;
  color: #666;
  flex: 1;
}
.square-header .title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}
.tab-bar {
  display: flex;
  justify-content: space-around;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #eee;
}
.tab-item {
  font-size: 26rpx;
  color: #666;
  padding: 10rpx 20rpx;
}
.tab-item.active {
  color: #D47836;
  border-bottom: 2rpx solid #D47836;
}
.list-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  padding: 15rpx;
}
.list-card {
  width: 48%;
  background-color: #fff;
  border-radius: 10rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.card-img {
  width: 100%;
  height: 200rpx;
  background-color: #eee;
}
.reward-tag {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background-color: #FFE0A8;
  color: #D47836;
  padding: 5rpx 10rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
}
.card-info {
  padding: 15rpx;
}
.card-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #D47836;
  margin-bottom: 10rpx;
}
.pet-basic {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
  flex-wrap: wrap;
}
.pet-name {
  font-size: 24rpx;
  color: #333;
  font-weight: bold;
}
.gender-icon {
  font-size: 22rpx;
  color: #FF69B4;
}
.tags {
  display: flex;
  gap: 8rpx;
}
.tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 3rpx 8rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
}
.service-text {
  font-size: 22rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}
.location-row {
  display: flex;
  align-items: center;
  gap: 5rpx;
  margin-top: 8rpx;
}
.location-row .loc-icon {
  font-size: 20rpx;
}
.address {
  font-size: 22rpx;
  color: #666;
  flex: 1;
}
.views {
  font-size: 20rpx;
  color: #999;
}
.loading-tip, .empty-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #FFF9CC;
  padding: 15rpx 0;
  padding-bottom: calc(15rpx + env(safe-area-inset-bottom));
}
.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5rpx;
}
.tabbar-icon {
  width: 44rpx;
  height: 44rpx;
}
.tabbar-text {
  font-size: 22rpx;
  color: #666;
}
.tabbar-item.active .tabbar-text {
  color: #D47836;
}
.add-btn {
  position: relative;
  top: -20rpx;
}
.add-btn .tabbar-icon {
  width: 60rpx;
  height: 60rpx;
}
.add-icon {
  background-color: #D47836;
  border-radius: 50%;
  padding: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(212, 120, 54, 0.3);
}
</style>