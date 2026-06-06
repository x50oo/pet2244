<template>
  <view class="admin-home">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="input-wrap">
        <input class="search-input" placeholder="请输入搜索内容" v-model="keyword" @confirm="handleSearch" />
      </view>
      <button class="search-btn" @tap="handleSearch">搜索</button>
    </view>

    <!-- 轮播广告位 -->
    <swiper class="banner" indicator-dots circular autoplay interval="3000" v-if="bannerList.length > 0">
      <swiper-item v-for="(item, index) in bannerList" :key="index">
        <view class="banner-item">
          <image class="banner-img" :src="item.imageUrl" mode="aspectFill" v-if="item.imageUrl" />
          <view class="banner-placeholder" v-else>{{ item.text || '轮播图' }}</view>
        </view>
      </swiper-item>
    </swiper>
    <view class="banner-placeholder-full" v-else>暂无轮播图</view>

    <!-- 功能图标区 -->
    <view class="func-grid">
      <view class="func-item" v-for="(item, index) in funcList" :key="index" @tap="goFunc(item.path, item.name)">
        <view class="icon-card">
          <image class="icon-img" :src="item.icon" mode="aspectFit"></image>
          <text class="name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 定位+广场标题+标签栏 -->
    <view class="location-bar">
      <text class="location-text">📍 {{ locationName || '获取位置中...' }}</text>
    </view>
    <view class="title-bar">广场</view>
    <view class="tab-bar">
      <text class="tab-item" :class="{ active: activeTab === 'all' }" @tap="switchTab('all')">全部</text>
      <text class="tab-item" :class="{ active: activeTab === 'seek' }" @tap="switchTab('seek')">寻宠</text>
      <text class="tab-item" :class="{ active: activeTab === 'trust' }" @tap="switchTab('trust')">托管单</text>
    </view>

    <!-- 内容卡片流 -->
    <view class="card-grid" v-if="!loading">
      <view class="card-item" v-for="(item, index) in filteredList" :key="index" @tap="goToDetail(item)">
        <view class="card-img-wrap">
          <image class="card-img" :src="item.img || '/static/default-pet.png'" mode="aspectFill" />
          <view class="tag reward" v-if="item.type === 'seek'">悬赏: ¥{{ item.reward || 0 }}</view>
          <view class="tag reward" v-else>报酬: ¥{{ item.reward || 0 }}/天</view>
        </view>
        <view class="card-info">
          <view class="card-title">{{ item.type === 'seek' ? '寻宠' : '托管单' }}</view>
          <view class="card-desc">
            <text class="pet-name">{{ item.petName }}</text>
            <text class="pet-type">{{ getPetTypeText(item.petType) }}</text>
          </view>
          <view class="card-location">
            <text>📍 {{ item.location || item.lostLocation }}</text>
          </view>
          <view class="card-time" v-if="item.type === 'trust'">
            <text>🕐 {{ item.startDate }} 至 {{ item.endDate }}</text>
          </view>
          <view class="card-audit" v-if="item.auditStatus">
            <text class="audit-tag" :class="getAuditClass(item.auditStatus)">{{ getAuditText(item.auditStatus) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>
    <view class="empty-state" v-if="!loading && filteredList.length === 0">
      <text>暂无{{ activeTab === 'all' ? '内容' : (activeTab === 'seek' ? '寻宠' : '托管单') }}</text>
    </view>

    <!-- 底部Tab栏 -->
    <view class="tabbar">
      <view class="tabbar-item" :class="{ active: currentTab === 'home' }" @tap="switchTabbar('home')">
        <image class="tabbar-icon" :src="currentTab === 'home' ? '/static/tabbar/home-active.png' : '/static/tabbar/home.png'" mode="aspectFit" />
        <text class="tabbar-text">首页</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'message' }" @tap="switchTabbar('message')">
        <image class="tabbar-icon" :src="currentTab === 'message' ? '/static/tabbar/message-active.png' : '/static/tabbar/message.png'" mode="aspectFit" />
        <text class="tabbar-text">消息</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'mine' }" @tap="switchTabbar('mine')">
        <image class="tabbar-icon" :src="currentTab === 'mine' ? '/static/tabbar/user-active.png' : '/static/tabbar/user.png'" mode="aspectFit" />
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
      currentTab: 'home',
      activeTab: 'all',
      keyword: '',
      loading: false,
      locationName: '获取位置中...',
      
      bannerList: [],
      seekList: [],
      fosterList: [],
      
      funcList: [
        { name: '宠物店管理', icon: '/static/shop.png', path: '/pages/shop/list/list' },
        { name: '店铺入驻审核', icon: '/static/check.png', path: '/pages/audit/shop/index' },
        { name: '托管人管理', icon: '/static/manage.png', path: '/pages/trustee/index' },
        { name: '托管人资质审核', icon: '/static/audit.png', path: '/pages/audit/trustee/index' },
        { name: '宠物档案审核', icon: '/static/file.png', path: '/pages/audit/pet/index' },
        { name: '用户资料审核', icon: '/static/user.png', path: '/pages/audit/user/index' },
        { name: '线索审核', icon: '/static/line.png', path: '/pages/clue/detail' },
        { name: '服务状态变更', icon: '/static/status.png', path: '/pages/service/status' }
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
    this.getLocation()
  },
  onShow() {
    this.loadData()
  },
  methods: {
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
    
    async loadBanners() {
      try {
        const res = await request({ url: '/api/banners', method: 'GET' })
        console.log('轮播图原始数据:', res)
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
        this.bannerList = banners.filter(item => item.status === 1 || item.status === undefined)
        console.log('轮播图最终数据:', this.bannerList)
      } catch (error) {
        console.log('轮播图接口失败:', error)
        this.bannerList = []
      }
    },
    
    async loadSeekList() {
      try {
        const res = await request({ url: '/api/lost-pet/posts?page=1&size=20', method: 'GET' })
        console.log('寻宠列表原始数据:', res)
        let records = []
        if (res && Array.isArray(res.records)) {
          records = res.records
        } else if (Array.isArray(res)) {
          records = res
        } else if (res && res.data && Array.isArray(res.data.records)) {
          records = res.data.records
        } else {
          records = []
        }
        this.seekList = records.map(item => ({
          id: item.id,
          petName: item.petName,
          petType: item.petType,
          breed: item.breed,
          gender: item.gender,
          lostLocation: item.lostLocation,
          reward: item.bountyAmount || 0,
          views: item.views || 0,
          auditStatus: item.auditStatus,
          img: item.photos && item.photos.length > 0 ? item.photos[0] : '/static/default-pet.png'
        }))
        console.log('处理后的寻宠列表数量:', this.seekList.length)
      } catch (error) {
        console.log('寻宠列表接口失败:', error)
        this.seekList = []
      }
    },
    
    async loadFosterList() {
      try {
        const res = await request({ url: '/api/foster/orders?page=1&size=20', method: 'GET' })
        console.log('托管列表原始数据:', res)
        let records = []
        if (res && Array.isArray(res.records)) {
          records = res.records
        } else if (Array.isArray(res)) {
          records = res
        } else if (res && res.data && Array.isArray(res.data.records)) {
          records = res.data.records
        } else {
          records = []
        }
        this.fosterList = records.map(item => ({
          id: item.id,
          petName: item.petName,
          petType: item.petType,
          breed: item.breed,
          gender: item.gender,
          location: item.location,
          reward: item.dailyPrice || 0,
          startDate: item.startDate,
          endDate: item.endDate,
          auditStatus: item.auditStatus,
          views: item.views || 0,
          img: item.photos && item.photos.length > 0 ? item.photos[0] : '/static/default-pet.png'
        }))
        console.log('处理后的托管列表数量:', this.fosterList.length)
      } catch (error) {
        console.log('托管列表接口失败:', error)
        this.fosterList = []
      }
    },
    
    getLocation() {
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
    
    useMockData() {
      this.bannerList = [
        { imageUrl: '/static/banner1.jpg' },
        { imageUrl: '/static/banner2.jpg' },
        { imageUrl: '/static/banner3.jpg' }
      ]
      this.seekList = [
        { id: 1, petName: '布丁', petType: 'cat', breed: '英短', gender: 0, lostLocation: '番禺区贝岗商业街', reward: 150, views: 25, auditStatus: 2, img: '/static/pet1.jpg' },
        { id: 2, petName: '旺财', petType: 'dog', breed: '金毛', gender: 1, lostLocation: '番禺区大学城路', reward: 200, views: 32, auditStatus: 1, img: '/static/pet2.jpg' }
      ]
      this.fosterList = [
        { id: 3, petName: '哈哈', petType: 'dog', breed: '泰迪', gender: 1, location: '番禺区贝岗商业街', reward: 15, startDate: '2024-04-09', endDate: '2024-04-12', views: 45, auditStatus: 2, img: '/static/dog1.jpg' },
        { id: 4, petName: '豆豆', petType: 'dog', breed: '柯基', gender: 1, location: '番禺区大学城路', reward: 20, startDate: '2024-04-10', endDate: '2024-04-13', views: 38, auditStatus: 1, img: '/static/dog2.jpg' }
      ]
    },
    
    getPetTypeText(type) {
      const map = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': '兔类', 'hamster': '仓鼠', 'other': '其他' }
      return map[type] || type || '宠物'
    },
    
    getAuditText(status) {
      const map = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return map[status] || ''
    },
    
    getAuditClass(status) {
      if (status === 1) return 'audit-pending'
      if (status === 2) return 'audit-pass'
      if (status === 3) return 'audit-reject'
      return ''
    },
    
    switchTab(tab) {
      this.activeTab = tab
    },
    
    switchTabbar(tab) {
      this.currentTab = tab
      if (tab === 'home') return
      if (tab === 'message') {
        // 跳转到管理员聊天页面
        uni.reLaunch({ url: '/pages/message/adminList' })
      }
      if (tab === 'mine') {
        uni.reLaunch({ url: '/pages/user/center/center' })
      }
    },
    
    async handleSearch() {
      if (!this.keyword.trim()) {
        uni.showToast({ title: '请输入搜索内容', icon: 'none' })
        return
      }
      try {
        await request({ url: `/api/search?keyword=${encodeURIComponent(this.keyword)}&type=all`, method: 'GET' })
        uni.navigateTo({ url: `/pages/search/result?keyword=${this.keyword}` })
      } catch (error) {
        console.log('搜索失败:', error)
        uni.showToast({ title: `搜索：${this.keyword}`, icon: 'none' })
      }
    },
    
    goFunc(path, name) {
      console.log('跳转:', path, name)
      
      if (!path) {
        uni.showToast({ title: `${name}功能开发中`, icon: 'none' })
        return
      }
      
      // 需要传 id 参数的页面（先传 0，页面会自己加载第一个）
      const needIdPages = [
        '/pages/audit/shop/index',
        '/pages/audit/trustee/index',
        '/pages/audit/pet/index',
        '/pages/audit/user/index',
        '/pages/clue/detail',
        '/pages/service/status'
      ]
      
      const needId = needIdPages.some(page => path.includes(page))
      let finalPath = path
      if (needId) {
        finalPath = `${path}?id=0`
      }
      
      uni.navigateTo({
        url: finalPath,
        fail: (err) => {
          console.error('跳转失败:', err)
          uni.showToast({ title: `${name}页面开发中`, icon: 'none' })
        }
      })
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
.admin-home {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
}
.search-bar { display: flex; align-items: center; gap: 20rpx; padding: 20rpx; }
.input-wrap { flex: 1; background-color: #fff; border-radius: 50rpx; padding: 0 20rpx; }
.search-input { flex: 1; height: 70rpx; font-size: 28rpx; }
.search-btn { width: 120rpx; height: 70rpx; background-color: #FFE0A8; color: #D47836; border-radius: 50rpx; font-size: 28rpx; }
.banner { height: 250rpx; margin: 20rpx; border-radius: 16rpx; overflow: hidden; }
.banner-placeholder-full { height: 250rpx; margin: 20rpx; background-color: #eee; display: flex; align-items: center; justify-content: center; border-radius: 16rpx; color: #999; }
.banner-item { width: 100%; height: 100%; background-color: #ddd; display: flex; align-items: center; justify-content: center; }
.banner-img { width: 100%; height: 100%; }
.banner-placeholder { color: #999; font-size: 28rpx; }
.func-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20rpx; padding: 20rpx 20rpx; background-color: #FFF2D6; margin: 20rpx; border-radius: 20rpx; justify-items: center; }
.func-item { display: flex; justify-content: center; width: 100%; }
.icon-card { width: 120rpx; height: 120rpx; background-color: #fff; border-radius: 35%; padding: 18rpx 8rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx; }
.icon-img { width: 60rpx; height: 60rpx; object-fit: contain; }
.name { font-size: 18rpx; color: #D47836; text-align: center; line-height: 1.2; }
.location-bar { padding: 20rpx 40rpx; background-color: #fff; margin: 20rpx; border-radius: 8rpx; }
.location-text { font-size: 26rpx; color: #666; }
.title-bar { text-align: center; font-size: 32rpx; font-weight: bold; color: #333; margin: 20rpx 0; }
.tab-bar { display: flex; justify-content: center; gap: 40rpx; margin-bottom: 20rpx; }
.tab-item { font-size: 28rpx; color: #666; padding: 10rpx 20rpx; border-radius: 20rpx; }
.tab-item.active { background-color: #FFE0A8; color: #D47836; }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx; padding: 0 20rpx; }
.card-item { background-color: #fff; border-radius: 12rpx; overflow: hidden; }
.card-img-wrap { position: relative; }
.card-img { width: 100%; height: 200rpx; background-color: #eee; }
.tag { position: absolute; top: 10rpx; right: 10rpx; font-size: 24rpx; padding: 4rpx 10rpx; border-radius: 10rpx; }
.tag.reward { background-color: #FF6600; color: #fff; }
.card-info { padding: 15rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 8rpx; }
.card-desc { display: flex; align-items: center; gap: 10rpx; font-size: 24rpx; color: #666; margin-bottom: 8rpx; }
.pet-type { background-color: #FFE0A8; color: #D47836; padding: 2rpx 8rpx; border-radius: 10rpx; }
.card-location, .card-time { font-size: 22rpx; color: #999; margin-top: 6rpx; }
.card-audit { margin-top: 8rpx; }
.audit-tag { font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 8rpx; }
.audit-pending { background-color: #FFF3E0; color: #FF9800; }
.audit-pass { background-color: #E8F5E9; color: #4CAF50; }
.audit-reject { background-color: #FFEBEE; color: #f44336; }
.loading-state, .empty-state { text-align: center; padding: 60rpx; color: #999; font-size: 28rpx; }
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
  border-top: 1rpx solid #eee;
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
</style>