<template>
  <view class="message-page">
    <!-- 消息列表 -->
    <view class="message-list">
      <!-- 未读消息提示 -->
      <view class="unread-header" v-if="unreadCount > 0" @tap="markAllAsRead">
        <text class="unread-text">您有 {{ unreadCount }} 条未读消息</text>
        <text class="mark-read">全部已读</text>
      </view>

      <!-- 系统/服务通知分组 -->
      <view class="section" v-if="noticeList.length > 0">
        <view class="section-title">通知</view>
        <view class="message-item" v-for="item in noticeList" :key="item.id" @tap="goToNoticeDetail(item)">
          <view class="avatar-wrapper">
            <image v-if="item.type === 1" class="system-icon" src="/static/system-notice.png" mode="aspectFit" />
            <image v-else class="system-icon" src="/static/service-notice.png" mode="aspectFit" />
          </view>
          <view class="content-wrapper">
            <view class="top-row">
              <text class="title">{{ item.type === 1 ? '系统通知' : '服务通知' }}</text>
              <text class="time">{{ formatTime(item.createTime) }}</text>
            </view>
            <text class="preview">{{ item.title || item.content }}</text>
          </view>
          <view class="unread-dot" v-if="!item.isRead"></view>
        </view>
      </view>

      <!-- 聊天消息分组 -->
      <view class="section" v-if="chatList.length > 0">
        <view class="section-title">聊天</view>
        <view class="message-item" v-for="item in chatList" :key="item.id" @tap="goToChat(item)">
          <view class="avatar-wrapper">
            <image class="avatar" :src="item.avatar || '/static/default-avatar.png'" mode="aspectFill" />
          </view>
          <view class="content-wrapper">
            <view class="top-row">
              <text class="title">{{ item.title }}</text>
              <text class="time">{{ formatTime(item.lastTime) }}</text>
            </view>
            <text class="preview">{{ item.lastMessage }}</text>
          </view>
          <view class="unread-dot" v-if="item.unreadCount > 0">
            <text>{{ item.unreadCount > 99 ? '99+' : item.unreadCount }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="noticeList.length === 0 && chatList.length === 0 && !loading">
        <text>暂无消息</text>
      </view>

      <view class="loading-state" v-if="loading">
        <text>加载中...</text>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: currentTab === 'home' }" @tap="switchTab('home')">
        <image class="tab-icon" :src="currentTab === 'home' ? '/static/tabbar/home-active.png' : '/static/tabbar/home.png'" mode="aspectFit" />
        <text>首页</text>
      </view>
      <view class="tab-item" :class="{ active: currentTab === 'health' }" @tap="switchTab('health')">
        <image class="tab-icon" :src="currentTab === 'health' ? '/static/tabbar/health-active.png' : '/static/tabbar/health.png'" mode="aspectFit" />
        <text>健康</text>
      </view>
      <view class="tab-item" :class="{ active: currentTab === 'publish' }" @tap="switchTab('publish')">
        <image class="tab-icon add-icon" src="/static/tabbar/add-active.png" mode="aspectFit" />
        <text>发布</text>
      </view>
      <view class="tab-item active" :class="{ active: currentTab === 'message' }" @tap="switchTab('message')">
        <image class="tab-icon" :src="currentTab === 'message' ? '/static/tabbar/message-active.png' : '/static/tabbar/message.png'" mode="aspectFit" />
        <text>消息</text>
        <view class="tab-badge" v-if="totalUnread > 0">{{ totalUnread > 99 ? '99+' : totalUnread }}</view>
      </view>
      <view class="tab-item" :class="{ active: currentTab === 'mine' }" @tap="switchTab('mine')">
        <image class="tab-icon" :src="currentTab === 'mine' ? '/static/tabbar/user-active.png' : '/static/tabbar/user.png'" mode="aspectFit" />
        <text>个人中心</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      currentTab: 'message',
      loading: false,
      
      // 通知列表（系统通知 + 服务通知）
      noticeList: [],
      // 聊天列表（用户对话）
      chatList: [],
      
      // 未读数
      unreadCount: 0,
      totalUnread: 0,
      
      // WebSocket连接
      socketTask: null,
      
      // 定时刷新
      refreshTimer: null
    }
  },
  onLoad() {
    this.loadMessages()
    // 微信小程序不支持 ws://localhost，暂时禁用 WebSocket
    // 等后端部署到 https 环境后再启用
    // this.initWebSocket()
  },
  onShow() {
    this.loadMessages()
    this.startRefreshTimer()
  },
  onHide() {
    this.stopRefreshTimer()
  },
  onUnload() {
    this.closeWebSocket()
    this.stopRefreshTimer()
  },
  methods: {
    // ========== 消息加载 ==========
    async loadMessages() {
      this.loading = true
      try {
        await Promise.all([
          this.loadNoticeMessages(),
          this.loadUnreadCount()
        ])
        this.loadChatList()
      } catch (error) {
        console.error('加载消息失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 加载通知消息
    async loadNoticeMessages() {
      try {
        // 获取系统通知 (type=1) - 加上 /api 前缀
        const systemRes = await request({
          url: '/api/messages?type=1&page=1&size=50',
          method: 'GET'
        }).catch(() => ({ records: [] }))
        
        // 获取服务通知 (type=2) - 加上 /api 前缀
        const serviceRes = await request({
          url: '/api/messages?type=2&page=1&size=50',
          method: 'GET'
        }).catch(() => ({ records: [] }))
        
        const systemList = (systemRes?.records || []).map(item => ({
          ...item,
          type: 1
        }))
        const serviceList = (serviceRes?.records || []).map(item => ({
          ...item,
          type: 2
        }))
        
        // 合并并按时间排序
        this.noticeList = [...systemList, ...serviceList].sort((a, b) => 
          new Date(b.createTime) - new Date(a.createTime)
        )
      } catch (error) {
        console.log('加载通知失败', error)
      }
    },
    
    // 加载未读数量
    async loadUnreadCount() {
      try {
        // 加上 /api 前缀
        const res = await request({
          url: '/api/messages/unread-count',
          method: 'GET'
        }).catch(() => ({ system: 0, service: 0 }))
        
        this.unreadCount = (res?.system || 0) + (res?.service || 0)
        this.totalUnread = this.unreadCount
      } catch (error) {
        console.log('加载未读数失败', error)
        this.unreadCount = 0
        this.totalUnread = 0
      }
    },
    
    // 加载聊天列表（需要后端提供聊天会话接口）
    loadChatList() {
      // TODO: 后端提供聊天会话列表接口后替换
      // 目前使用模拟数据
      this.chatList = [
        {
          id: 3,
          userId: 1,
          title: '黑熊',
          avatar: '/static/avatar1.jpg',
          lastMessage: '【图片】',
          lastTime: new Date().toISOString(),
          unreadCount: 0
        },
        {
          id: 4,
          userId: 2,
          title: '哈哈宠物店',
          avatar: '/static/shop1.jpg',
          lastMessage: '好的',
          lastTime: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 0
        }
      ]
    },
    
    // 标记单条已读
    async markAsRead(id) {
      try {
        // 加上 /api 前缀
        await request({
          url: `/api/messages/${id}/read`,
          method: 'PATCH'
        })
        // 更新本地状态
        const notice = this.noticeList.find(n => n.id === id)
        if (notice) notice.isRead = 1
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        this.totalUnread = this.unreadCount
      } catch (error) {
        console.log('标记已读失败', error)
      }
    },
    
    // 全部已读
    async markAllAsRead() {
      uni.showLoading({ title: '处理中...' })
      try {
        // 加上 /api 前缀
        await request({
          url: '/api/messages/read-all',
          method: 'PATCH',
          data: { type: 0 }  // 0=全部
        })
        
        // 更新本地状态
        this.noticeList.forEach(item => { item.isRead = 1 })
        this.unreadCount = 0
        this.totalUnread = 0
        
        uni.hideLoading()
        uni.showToast({ title: '全部已读', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        console.log('全部已读失败', error)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    
    // ========== WebSocket（暂时禁用，等后端部署到 https） ==========
    initWebSocket() {
      const token = uni.getStorageSync('token')
      if (!token) return
      
      // 微信小程序必须使用 wss://，不能使用 ws://localhost
      // 等后端部署到正式环境后，将地址改为 wss://your-domain.com/ws/chat?token=${token}
      const wsUrl = `wss://your-domain.com/ws/chat?token=${token}`
      
      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => console.log('WebSocket连接中...')
      })
      
      this.socketTask.onOpen(() => {
        console.log('WebSocket已连接')
      })
      
      this.socketTask.onMessage((res) => {
        try {
          const data = JSON.parse(res.data)
          this.handleNewMessage(data)
        } catch (e) {
          console.error('解析消息失败', e)
        }
      })
      
      this.socketTask.onError((err) => {
        console.log('WebSocket错误', err)
      })
      
      this.socketTask.onClose(() => {
        console.log('WebSocket已断开')
        setTimeout(() => this.initWebSocket(), 5000)
      })
    },
    
    handleNewMessage(message) {
      // 收到新消息，更新聊天列表
      const chat = this.chatList.find(c => c.userId === message.senderId)
      if (chat) {
        chat.lastMessage = message.content
        chat.lastTime = message.createTime
        chat.unreadCount = (chat.unreadCount || 0) + 1
        this.totalUnread++
      } else {
        // 新聊天，添加到列表
        this.chatList.unshift({
          id: message.senderId,
          userId: message.senderId,
          title: `用户${message.senderId}`,
          avatar: '/static/default-avatar.png',
          lastMessage: message.content,
          lastTime: message.createTime,
          unreadCount: 1
        })
      }
      
      // 刷新未读数
      this.totalUnread++
    },
    
    closeWebSocket() {
      if (this.socketTask) {
        this.socketTask.close()
      }
    },
    
    // ========== 定时刷新 ==========
    startRefreshTimer() {
      this.refreshTimer = setInterval(() => {
        this.loadUnreadCount()
      }, 30000) // 30秒刷新一次未读数
    },
    
    stopRefreshTimer() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    
    // ========== 跳转 ==========
    goToNoticeDetail(item) {
      // 标记已读
      if (!item.isRead) {
        this.markAsRead(item.id)
      }
      // 跳转到通知详情页
      uni.navigateTo({
        url: `/pages/message/detail?id=${item.id}&type=${item.type}`
      })
    },
    
    goToChat(item) {
      const userInfo = uni.getStorageSync('userInfo')
      const isAdmin = userInfo?.role === 1
      
      // 选择聊天页面
      const chatPage = isAdmin ? '/pages/message/adminChat' : '/pages/message/chat'
      
      uni.navigateTo({
        url: `${chatPage}?userId=${item.userId}&name=${item.title}`
      })
    },
    
    // ========== 工具方法 ==========
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000)
        return minutes < 1 ? '刚刚' : `${minutes}分钟前`
      }
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        return `${hours}小时前`
      }
      if (diff < 604800000) {
        const days = Math.floor(diff / 86400000)
        return `${days}天前`
      }
      return `${date.getMonth() + 1}/${date.getDate()}`
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      this.noticeList = [
        { id: 1, type: 1, title: '系统通知', content: '新版本已上线，赶紧更新...', createTime: new Date().toISOString(), isRead: 0 },
        { id: 2, type: 2, title: '服务通知', content: '您的托管订单已完成', createTime: new Date(Date.now() - 3600000).toISOString(), isRead: 0 }
      ]
      this.unreadCount = 2
      this.totalUnread = 2
      this.chatList = [
        { id: 3, userId: 1, title: '黑熊', avatar: '/static/avatar1.jpg', lastMessage: '【图片】', lastTime: new Date().toISOString(), unreadCount: 0 },
        { id: 4, userId: 2, title: '哈哈宠物店', avatar: '/static/shop1.jpg', lastMessage: '好的', lastTime: new Date(Date.now() - 3600000).toISOString(), unreadCount: 0 }
      ]
    },
    
  // ========== 底部导航 ==========
  switchTab(tab) {
    this.currentTab = tab
    if (tab === 'home') {
      uni.reLaunch({ url: '/pages/home/index' })
    } else if (tab === 'health') {
      uni.reLaunch({ url: '/pages/health/index' })
    } else if (tab === 'publish') {
      // 发布按钮 - 显示选择菜单
      uni.showActionSheet({
        itemList: ['发布寻宠', '发布托管'],
        success: (res) => {
          if (res.tapIndex === 0) {
            uni.navigateTo({ url: '/pages/seek/publish' })
          } else if (res.tapIndex === 1) {
            uni.navigateTo({ url: '/pages/foster/publish' })
          }
        }
      })
    } else if (tab === 'message') {
      return  // 当前页面
    } else if (tab === 'mine') {
      uni.reLaunch({ url: '/pages/user/profile/index' })
    }
  }
  }
}
</script>

<style scoped>
.message-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 未读头部 */
.unread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #FFF9E6;
  border-bottom: 1rpx solid #eee;
}
.unread-text {
  font-size: 26rpx;
  color: #D47836;
}
.mark-read {
  font-size: 24rpx;
  color: #999;
}

/* 分组 */
.section {
  background-color: #fff;
  margin-top: 20rpx;
}
.section-title {
  padding: 20rpx 30rpx;
  font-size: 26rpx;
  color: #999;
  background-color: #f5f5f5;
  border-bottom: 1rpx solid #eee;
}

/* 消息列表 */
.message-list {
  background-color: #fff;
}
.message-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
}
.avatar-wrapper {
  margin-right: 20rpx;
  flex-shrink: 0;
}
.system-icon {
  width: 60rpx;
  height: 60rpx;
}
.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #eee;
}
.content-wrapper {
  flex: 1;
}
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}
.time {
  font-size: 22rpx;
  color: #999;
}
.preview {
  font-size: 26rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.unread-dot {
  width: 16rpx;
  height: 16rpx;
  background-color: #FF4444;
  border-radius: 50%;
  margin-left: 10rpx;
}
.unread-dot text {
  font-size: 20rpx;
  color: #fff;
  background-color: #FF4444;
  border-radius: 20rpx;
  padding: 2rpx 8rpx;
  position: absolute;
  right: 20rpx;
  top: 20rpx;
}

/* 空状态 */
.empty-state, .loading-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 底部导航栏 */
.tab-bar {
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
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5rpx;
  color: #666;
  position: relative;
}
.tab-icon {
  width: 44rpx;
  height: 44rpx;
}
.tab-item text:last-child {
  font-size: 22rpx;
}
.tab-item.active {
  color: #D47836;
}
.add-icon {
  background-color: #D47836;
  border-radius: 50%;
  padding: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(212, 120, 54, 0.3);
}
.tab-badge {
  position: absolute;
  top: -8rpx;
  right: -15rpx;
  background-color: #FF4444;
  color: #fff;
  font-size: 20rpx;
  border-radius: 20rpx;
  padding: 2rpx 8rpx;
  min-width: 30rpx;
  text-align: center;
}
</style>