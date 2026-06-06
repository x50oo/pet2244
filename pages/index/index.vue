<template>
  <view class="container">
    <view class="search-bar">
      <input type="text" placeholder="搜索宠物店、托管单..." v-model="keyword" @confirm="search" />
      <button @click="search" size="mini" type="primary">搜索</button>
    </view>

    <view class="menu-grid">
      <view class="menu-item" @click="goTo('/pages/seek/publish')">
        <view class="icon">🔍</view>
        <text>发布寻宠</text>
      </view>
      <view class="menu-item" @click="goTo('/pages/foster/orders')">
        <view class="icon">🏠</view>
        <text>托管广场</text>
      </view>
      <view class="menu-item" @click="goTo('/pages/shop/list')">
        <view class="icon">🏪</view>
        <text>宠物店</text>
      </view>
      <view class="menu-item" @click="goTo('/pages/pet/add')">
        <view class="icon">🐱</view>
        <text>添加宠物</text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">📢 最新寻宠</view>
      <view class="seek-item" v-for="item in seekList" :key="item.id" @click="goToDetail(item.id)">
        <view class="seek-info">
          <text class="seek-name">{{ item.petName }}</text>
          <text class="seek-time">{{ item.formattedTime }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="empty-tip" v-if="seekList.length === 0 && !loading">
        <text>暂无寻宠信息</text>
      </view>
      <view class="loading-tip" v-if="loading">
        <text>加载中...</text>
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
      seekList: [],
      loading: false
    }
  },
  onLoad() {
    this.loadSeekList()
  },
  onShow() {
    // 每次显示时刷新列表
    this.loadSeekList()
  },
  methods: {
    // 加载寻宠列表
    async loadSeekList() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/lost-pet/posts?page=1&size=10',
          method: 'GET'
        })
        
        const records = res?.records || []
        this.seekList = records.map(item => ({
          id: item.id,
          petName: `${item.petName} - ${item.lostLocation || '未知位置'}`,
          createTime: item.createTime,
          formattedTime: this.formatTime(item.createTime)
        }))
      } catch (error) {
        console.error('加载寻宠列表失败', error)
        // 使用模拟数据
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 格式化时间显示
    formatTime(timeStr) {
      if (!timeStr) return '未知时间'
      const now = new Date()
      const time = new Date(timeStr)
      const diff = now - time
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (hours < 1) return '刚刚'
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`
      return time.toLocaleDateString()
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      this.seekList = [
        { id: 1, petName: '小花猫 - 在小区走失', formattedTime: '2小时前' },
        { id: 2, petName: '金毛犬 - 公园走丢', formattedTime: '昨天' }
      ]
    },
    
    // 搜索
    async search() {
      if (!this.keyword.trim()) {
        uni.showToast({ title: '请输入搜索内容', icon: 'none' })
        return
      }
      
      try {
        const res = await request({
          url: `/api/search?keyword=${encodeURIComponent(this.keyword)}&type=all`,
          method: 'GET'
        })
        
        // 跳转到搜索结果页
        uni.navigateTo({
          url: `/pages/search/result?keyword=${this.keyword}`
        })
      } catch (error) {
        console.error('搜索失败', error)
        uni.showToast({ title: '搜索功能开发中', icon: 'none' })
      }
    },
    
    // 跳转页面
    goTo(url) {
      if (!url) {
        uni.showToast({ title: '功能开发中', icon: 'none' })
        return
      }
      uni.navigateTo({
        url,
        fail: (err) => {
          console.log('跳转失败', err)
          uni.showToast({ title: '页面开发中', icon: 'none' })
        }
      })
    },
    
    // 跳转详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/seek/detail?id=${id}`
      })
    }
  }
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }
.search-bar { display: flex; gap: 20rpx; background: white; padding: 20rpx; border-radius: 50rpx; margin-bottom: 30rpx; }
.search-bar input { flex: 1; height: 70rpx; padding: 0 20rpx; background: #f5f5f5; border-radius: 35rpx; font-size: 28rpx; }
.search-bar button { height: 70rpx; line-height: 70rpx; background: #FF6B6B; color: white; }
.menu-grid { display: flex; justify-content: space-around; background: white; padding: 30rpx; border-radius: 20rpx; margin-bottom: 30rpx; }
.menu-item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; }
.icon { width: 80rpx; height: 80rpx; background: #FF6B6B20; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; }
.menu-item text { font-size: 24rpx; color: #666; }
.section { background: white; border-radius: 20rpx; padding: 20rpx; }
.section-title { font-weight: bold; font-size: 32rpx; margin-bottom: 20rpx; }
.seek-item { display: flex; justify-content: space-between; align-items: center; padding: 20rpx; border-bottom: 1rpx solid #eee; }
.seek-info { display: flex; flex-direction: column; gap: 8rpx; }
.seek-name { font-size: 30rpx; }
.seek-time { font-size: 24rpx; color: #999; }
.arrow { font-size: 36rpx; color: #ccc; }
.empty-tip, .loading-tip { text-align: center; padding: 40rpx; color: #999; font-size: 28rpx; }
</style>