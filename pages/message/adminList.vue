<template>
  <view class="message-page">
    <!-- 消息列表 -->
    <view class="message-list">
      <!-- 未读消息提示 -->
      <view class="unread-header" v-if="unreadCount > 0" @tap="markAllAsRead">
        <text class="unread-text">您有 {{ unreadCount }} 条未读消息</text>
        <text class="mark-read">全部已读</text>
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
      <view class="empty-state" v-if="chatList.length === 0 && !loading">
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
      <view class="tab-item" :class="{ active: currentTab === 'message' }" @tap="switchTab('message')">
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
      
      // 聊天列表（用户对话）
      chatList: [],
      
      // 未读数
      unreadCount: 0,
      totalUnread: 0,
      
      // WebSocket连接
      socketTask: null,
      
      // 定时刷新
      refreshTimer: null,
      
      // 当前管理员信息
      adminInfo: null
    }
  },
  onLoad() {
    this.adminInfo = uni.getStorageSync('userInfo')
    this.loadMessages()
    this.initWebSocket()
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
        await this.loadChatList()
        await this.loadUnreadCount()
      } catch (error) {
        console.error('加载消息失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 加载聊天列表（获取与管理员聊天的所有用户）
    async loadChatList() {
      try {
        // 获取所有与管理员相关的聊天会话
        // 注意：此接口需要后端提供，暂时使用 message 接口获取最近的聊天记录并按发送者分组
        const res = await request({
          url: '/api/messages?page=1&size=100',
          method: 'GET'
        }).catch(() => ({ records: [] }))
        
        const records = res?.records || []
        
        // 按发送者分组，获取最近的一条消息
        const userMap = new Map()
        records.forEach(msg => {
          const senderId = msg.senderId
          const receiverId = msg.receiverId
          // 管理员收到的消息（senderId 不是管理员）或 管理员发出的消息（receiverId 是管理员）
          if (senderId !== this.adminInfo?.userId) {
            // 用户发给管理员的消息
            if (!userMap.has(senderId) || new Date(msg.createTime) > new Date(userMap.get(senderId).lastTime)) {
              userMap.set(senderId, {
                id: senderId,
                userId: senderId,
                title: msg.senderName || `用户${senderId}`,
                avatar: msg.senderAvatar || '/static/default-avatar.png',
                lastMessage: msg.content,
                lastTime: msg.createTime,
                unreadCount: msg.isRead ? 0 : 1
              })
            }
          } else if (receiverId !== this.adminInfo?.userId) {
            // 管理员发给用户的消息
            if (!userMap.has(receiverId) || new Date(msg.createTime) > new Date(userMap.get(receiverId).lastTime)) {
              userMap.set(receiverId, {
                id: receiverId,
                userId: receiverId,
                title: msg.receiverName || `用户${receiverId}`,
                avatar: msg.receiverAvatar || '/static/default-avatar.png',
                lastMessage: msg.content,
                lastTime: msg.createTime,
                unreadCount: 0
              })
            }
          }
        })
        
        // 转换为数组并按最后消息时间排序
        this.chatList = Array.from(userMap.values()).sort((a, b) => 
          new Date(b.lastTime) - new Date(a.lastTime)
        )
        
      } catch (error) {
        console.log('加载聊天列表失败', error)
        this.chatList = []
      }
    },
    
    // 加载未读数量
    async loadUnreadCount() {
      try {
        const res = await request({
          url: '/api/messages/unread-count',
          method: 'GET'
        }).catch(() => ({ system: 0, service: 0 }))
        
        // 管理端只看服务通知（type=2）
        this.unreadCount = res?.service || 0
        this.totalUnread = this.unreadCount
        
        // 同时更新聊天列表中的未读数
        if (this.chatList.length > 0) {
          // 获取每个会话的未读数（需要后端提供接口）
          // 暂时先整体更新
        }
      } catch (error) {
        console.log('加载未读数失败', error)
        this.unreadCount = 0
        this.totalUnread = 0
      }
    },
    
    // 标记单条已读
    async markAsRead(id) {
      try {
        await request({
          url: `/api/messages/${id}/read`,
          method: 'PATCH'
        })
        // 更新本地状态
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
        await request({
          url: '/api/messages/read-all',
          method: 'PATCH',
          data: { type: 2 }  // 2=服务通知
        })
        
        // 更新本地状态
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
    
    // ========== WebSocket ==========
    initWebSocket() {
      const token = uni.getStorageSync('token')
      if (!token) {
        console.log('没有token，无法连接WebSocket')
        return
      }
      
      // 如果已有连接，先关闭
      if (this.socketTask) {
        this.closeWebSocket(() => {
          this.createWebSocket()
        })
      } else {
        this.createWebSocket()
      }
    },
    
    createWebSocket() {
      const token = uni.getStorageSync('token') || ''
      const cleanToken = token.replace('Bearer ', '')
      const wsUrl = `ws://192.168.129.49:8080/ws/chat?token=${cleanToken}`
      
      console.log('WebSocket连接地址:', wsUrl)
      
      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => console.log('WebSocket连接中...')
      })
      
      this.socketTask.onOpen(() => {
        console.log('WebSocket已连接')
        this.reconnectCount = 0
      })
      
      this.socketTask.onMessage((res) => {
        try {
          const data = JSON.parse(res.data)
          console.log('收到WebSocket消息:', data)
          this.handleNewMessage(data)
        } catch (e) {
          console.error('解析消息失败', e)
        }
      })
      
      this.socketTask.onError((err) => {
        console.error('WebSocket错误', err)
      })
      
      this.socketTask.onClose(() => {
        console.log('WebSocket已断开')
        this.reconnectWebSocket()
      })
    },
    
    reconnectWebSocket() {
      if (this.reconnectTimer) return
      if (this.reconnectCount >= 5) {
        console.log('重连次数超过5次，停止重连')
        return
      }
      this.reconnectTimer = setTimeout(() => {
        console.log(`第${this.reconnectCount + 1}次尝试重连WebSocket...`)
        this.reconnectCount++
        this.createWebSocket()
        this.reconnectTimer = null
      }, 3000)
    },
    
    handleNewMessage(message) {
      // 收到新消息，更新聊天列表
      const senderId = message.senderId
      const chat = this.chatList.find(c => c.userId === senderId)
      
      if (chat) {
        chat.lastMessage = message.content
        chat.lastTime = message.createTime
        chat.unreadCount = (chat.unreadCount || 0) + 1
      } else {
        // 新聊天，添加到列表
        this.chatList.unshift({
          id: senderId,
          userId: senderId,
          title: message.senderName || `用户${senderId}`,
          avatar: message.senderAvatar || '/static/default-avatar.png',
          lastMessage: message.content,
          lastTime: message.createTime,
          unreadCount: 1
        })
      }
      
      // 刷新未读数
      this.totalUnread++
      this.unreadCount++
      
      // 可选：显示新消息通知
      uni.showToast({
        title: '收到新消息',
        icon: 'none',
        duration: 2000
      })
    },
    
    closeWebSocket(callback) {
      if (this.socketTask) {
        this.socketTask.close({
          success: () => {
            console.log('WebSocket已关闭')
            this.socketTask = null
            if (callback) callback()
          },
          fail: () => {
            this.socketTask = null
            if (callback) callback()
          }
        })
      } else {
        if (callback) callback()
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
    goToChat(item) {
      // 跳转到管理端聊天页面
      uni.navigateTo({
        url: `/pages/message/adminChat?userId=${item.userId}&name=${item.title}`
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
      this.chatList = [
        { id: 1, userId: 1, title: '用户138****8000', avatar: '/static/default-avatar.png', lastMessage: '你好，请问托管还接吗？', lastTime: new Date().toISOString(), unreadCount: 1 },
        { id: 2, userId: 2, title: '哈哈宠物店', avatar: '/static/shop1.jpg', lastMessage: '好的，谢谢', lastTime: new Date(Date.now() - 3600000).toISOString(), unreadCount: 0 }
      ]
      this.unreadCount = 1
      this.totalUnread = 1
    },
    
    // ========== 底部导航 ==========
    switchTab(tab) {
      this.currentTab = tab
      if (tab === 'home') {
        uni.reLaunch({ url: '/pages/admin/index' })
      } else if (tab === 'message') {
        return  // 当前页面
      } else if (tab === 'mine') {
        uni.reLaunch({ url: '/pages/user/center/center' })
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
  min-width: 32rpx;
  height: 32rpx;
  background-color: #FF4444;
  border-radius: 16rpx;
  margin-left: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.unread-dot text {
  font-size: 20rpx;
  color: #fff;
  padding: 0 8rpx;
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