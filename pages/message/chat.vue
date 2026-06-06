<template>
  <view class="chat-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo.name }}</text>
      </view>
      <view class="placeholder"></view>
    </view>

    <!-- 聊天内容区域 -->
    <scroll-view class="chat-content" scroll-y :scroll-into-view="scrollToView" scroll-with-animation>
      <view class="message-list">
        <view class="message-item" :class="msg.type === currentUserId ? 'send' : 'receive'" v-for="(msg, index) in chatMessages" :key="index" :id="'msg-' + index">
          <view class="message-time" v-if="showTime(index)">
            <text>{{ msg.time }}</text>
          </view>
          <view class="message-bubble">
            <view class="avatar">
              <text class="avatar-text">{{ msg.type === currentUserId ? '👤' : userInfo.avatarText }}</text>
            </view>
            <view class="bubble" v-if="msg.content">
              <text>{{ msg.content }}</text>
            </view>
            <view class="bubble-image" v-if="msg.imageUrl">
              <image class="msg-image" :src="msg.imageUrl" mode="aspectFill" @tap="previewImage(msg.imageUrl)" />
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 聊天输入框容器 -->
    <view class="input-container">
      <view class="icon-wrapper" @tap="onVoiceTap">
        <text class="icon">🎤</text>
      </view>
      <input class="text-input" v-model="inputText" placeholder="请输入内容" confirm-type="send" @confirm="sendTextMessage" />
      <view class="icon-wrapper" @tap="onEmojiTap">
        <text class="icon">😊</text>
      </view>
      <view class="icon-wrapper" @tap="onMoreTap">
        <text class="icon">➕</text>
      </view>
    </view>

    <!-- 表情面板 -->
    <view class="emoji-panel" v-if="showEmojiPanel">
      <view class="emoji-list">
        <view class="emoji-item" v-for="(emoji, index) in emojiList" :key="index" @tap="selectEmoji(emoji)">
          <text class="emoji-text">{{ emoji }}</text>
        </view>
      </view>
    </view>

    <!-- 更多功能面板 -->
    <view class="more-panel" v-if="showMorePanel">
      <view class="more-item" @tap="chooseImage">
        <text class="more-icon">📷</text>
        <text class="more-text">图片</text>
      </view>
      <view class="more-item" @tap="takePhoto">
        <text class="more-icon">📸</text>
        <text class="more-text">拍照</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      // 当前用户信息
      currentUserId: null,
      
      // 聊天对象信息
      userInfo: {
        id: '',
        name: '',
        avatarText: '',
        type: ''
      },
      
      chatMessages: [],
      inputText: '',
      scrollToView: '',
      showEmojiPanel: false,
      showMorePanel: false,
      page: 1,
      hasMore: true,
      loadingMore: false,
      
      // WebSocket
      socketTask: null,
      reconnectTimer: null,
      reconnectCount: 0,
      
      emojiList: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
    }
  },
  onLoad(options) {
    // 获取当前登录用户信息
    const currentUser = uni.getStorageSync('userInfo')
    this.currentUserId = currentUser?.userId
    
    // 聊天对象信息
    this.userInfo.id = parseInt(options.userId)
    this.userInfo.name = options.name || '对方'
    this.userInfo.type = options.type || 'user'
    
    // 设置头像文字
    this.setAvatarText()
    
    // 加载聊天记录
    this.loadMessages()
    
    // 初始化WebSocket
    this.initWebSocket()
    
    // 标记消息已读
    this.markMessagesAsRead()
  },
  onUnload() {
    this.closeWebSocket()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    setAvatarText() {
      const avatarMap = {
        'system': '🔔',
        'shop': '🏪',
        'trustee': '🐕',
        'user': '🐱',
        'seek': '🔍'
      }
      this.userInfo.avatarText = avatarMap[this.userInfo.type] || '🐱'
    },
    
    // ========== 聊天记录 ==========
    async loadMessages(isLoadMore = false) {
      if (this.loadingMore) return
      if (!isLoadMore) {
        this.page = 1
        this.hasMore = true
        this.chatMessages = []
      }
      if (!this.hasMore) return
      
      this.loadingMore = true
      
      try {
        // 获取与指定用户的聊天记录
        const res = await request({
          url: `/api/messages?receiverId=${this.userInfo.id}&page=${this.page}&size=20`,
          method: 'GET'
        })
        
        const records = res?.records || []
        const formattedMessages = records.map(msg => ({
          id: msg.id,
          type: msg.senderId,
          content: msg.content,
          imageUrl: msg.imageUrl,
          time: this.formatTime(msg.createTime),
          isRead: msg.isRead
        }))
        
        if (isLoadMore) {
          this.chatMessages = [...formattedMessages.reverse(), ...this.chatMessages]
        } else {
          this.chatMessages = formattedMessages.reverse()
        }
        
        this.hasMore = records.length === 20
        this.page++
        
        this.$nextTick(() => {
          if (this.chatMessages.length > 0 && !isLoadMore) {
            this.scrollToView = 'msg-' + (this.chatMessages.length - 1)
          }
        })
      } catch (error) {
        console.error('加载聊天记录失败', error)
        this.useMockMessages()
      } finally {
        this.loadingMore = false
      }
    },
    
    // 标记消息已读
    async markMessagesAsRead() {
      try {
        await request({
          url: `/api/messages/read-all`,
          method: 'PATCH',
          data: { 
            type: 2  // 2 = 服务通知（聊天消息）
          }
        })
      } catch (error) {
        console.log('标记已读失败', error)
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
      // 去掉 "Bearer " 前缀
      const cleanToken = token.replace('Bearer ', '')
      
      // 使用你的后端地址
      const wsUrl = `ws://192.168.129.49:8080/ws/chat?token=${cleanToken}`
      
      console.log('WebSocket连接地址:', wsUrl)
      
      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => console.log('WebSocket连接中...')
      })
      
      this.socketTask.onOpen(() => {
        console.log('WebSocket已连接')
        // 连接成功，重置重连计数
        this.reconnectCount = 0
      })
      
      this.socketTask.onMessage((res) => {
        try {
          const data = JSON.parse(res.data)
          console.log('收到WebSocket消息:', data)
          // 收到消息，且发送者是当前聊天对象
          if (data.senderId === this.userInfo.id) {
            this.receiveMessage(data)
          }
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
    
    // 重连WebSocket（带防抖和次数限制）
    reconnectWebSocket() {
      if (this.reconnectTimer) return
      
      // 限制重连次数
      if (this.reconnectCount >= 5) {
        console.log('重连次数超过5次，停止重连')
        return
      }
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`第${this.reconnectCount + 1}次尝试重连WebSocket...`)
        this.reconnectCount++
        this.createWebSocket()
        this.reconnectTimer = null
      }, 3000)  // 3秒后重连
    },
    
    // 发送消息
    sendMessage(message) {
      if (!this.socketTask || this.socketTask.readyState !== 1) {
        uni.showToast({ title: '连接中，请稍后再试', icon: 'none' })
        return false
      }
      
      const data = {
        type: message.imageUrl ? 'image' : 'text',
        receiverId: this.userInfo.id,
        content: message.content || '',
        imageUrl: message.imageUrl || null
      }
      
      this.socketTask.send({
        data: JSON.stringify(data),
        success: () => {
          this.chatMessages.push({
            id: Date.now(),
            type: this.currentUserId,
            content: message.content,
            imageUrl: message.imageUrl,
            time: this.getCurrentTime(),
            isRead: 0
          })
          this.$nextTick(() => {
            this.scrollToView = 'msg-' + (this.chatMessages.length - 1)
          })
        },
        fail: (err) => {
          console.error('发送失败', err)
          uni.showToast({ title: '发送失败', icon: 'none' })
        }
      })
      
      return true
    },
    
    // 接收消息
    receiveMessage(data) {
      this.chatMessages.push({
        id: data.id,
        type: data.senderId,
        content: data.content,
        imageUrl: data.imageUrl,
        time: this.formatTime(data.createTime),
        isRead: 0
      })
      this.$nextTick(() => {
        this.scrollToView = 'msg-' + (this.chatMessages.length - 1)
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
    
    // ========== 消息发送 ==========
    sendTextMessage() {
      if (!this.inputText.trim()) return
      
      this.sendMessage({
        content: this.inputText,
        imageUrl: null
      })
      
      this.inputText = ''
    },
    
    async uploadImage(filePath) {
      uni.showLoading({ title: '上传中...' })
      
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://192.168.129.49:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'chat' },
          header: {
            'Authorization': `Bearer ${uni.getStorageSync('token')}`
          },
          success: (res) => {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              resolve(data.data)
            } else {
              reject(data)
            }
          },
          fail: reject
        })
      })
    },
    
    async sendImage(filePath) {
      try {
        const imageUrl = await this.uploadImage(filePath)
        this.sendMessage({
          content: '[图片]',
          imageUrl: imageUrl
        })
        uni.hideLoading()
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '图片发送失败', icon: 'none' })
      }
    },
    
    // ========== 图片选择 ==========
    chooseImage() {
      this.showMorePanel = false
      uni.chooseImage({
        count: 1,
        success: (res) => {
          this.sendImage(res.tempFilePaths[0])
        }
      })
    },
    
    takePhoto() {
      this.showMorePanel = false
      uni.chooseImage({
        count: 1,
        sourceType: ['camera'],
        success: (res) => {
          this.sendImage(res.tempFilePaths[0])
        }
      })
    },
    
    previewImage(url) {
      uni.previewImage({ urls: [url] })
    },
    
    // ========== UI交互 ==========
    showTime(index) {
      if (index === 0) return true
      const prevMsg = this.chatMessages[index - 1]
      const currMsg = this.chatMessages[index]
      if (!prevMsg || !currMsg) return false
      return prevMsg.time !== currMsg.time
    },
    
    onVoiceTap() {
      uni.showToast({ title: '语音输入开发中', icon: 'none' })
    },
    
    onEmojiTap() {
      this.showEmojiPanel = !this.showEmojiPanel
      this.showMorePanel = false
    },
    
    onMoreTap() {
      this.showMorePanel = !this.showMorePanel
      this.showEmojiPanel = false
    },
    
    selectEmoji(emoji) {
      this.inputText += emoji
      this.showEmojiPanel = false
    },
    
    getCurrentTime() {
      const now = new Date()
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    },
    
    formatTime(timeStr) {
      if (!timeStr) return this.getCurrentTime()
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
      const today = new Date()
      if (date.toDateString() === today.toDateString()) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    // 模拟数据（后端不可用时）
    useMockMessages() {
      const mockMessages = {
        system: [
          { type: 'receive', content: '欢迎使用宠物服务平台！', time: '10:00' },
          { type: 'receive', content: '您的账号已注册成功，请完善个人信息。', time: '10:00' }
        ],
        shop: [
          { type: 'send', content: '你好，请问明天可以预约给狗狗洗澡吗？', time: '09:00' },
          { type: 'receive', content: '可以的，明天上午10点有空位', time: '09:02' }
        ],
        trustee: [
          { type: 'receive', content: '您好，我是托管人张托管', time: '昨天 08:00' },
          { type: 'send', content: '你好，我的狗狗哈哈需要托管3天', time: '昨天 08:05' }
        ],
        seek: [
          { type: 'receive', content: '你好，请问有看到我家布丁吗？', time: '昨天 14:00' },
          { type: 'send', content: '还没看到，有消息会通知你', time: '昨天 14:05' }
        ],
        user: [
          { type: 'receive', content: '你好，我是用户', time: '10:00' },
          { type: 'send', content: '你好', time: '10:01' }
        ]
      }
      this.chatMessages = mockMessages[this.userInfo.type] || mockMessages.user
    }
  }
}
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
}
.back-icon {
  font-size: 44rpx;
  color: #333;
}
.user-info {
  flex: 1;
  display: flex;
  justify-content: center;
}
.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
.placeholder {
  width: 44rpx;
}

/* 聊天内容区域 */
.chat-content {
  flex: 1;
  padding: 20rpx;
  padding-bottom: 30rpx;
}
.message-list {
  display: flex;
  flex-direction: column;
}
.message-item {
  margin-bottom: 25rpx;
}
.message-time {
  text-align: center;
  margin: 15px 0;
}
.message-time text {
  font-size: 24rpx;
  color: #999;
  background-color: rgba(0,0,0,0.05);
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
}
.message-bubble {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}
.message-item.send .message-bubble {
  flex-direction: row-reverse;
}
.message-item.send .bubble {
  background-color: #FFE0A8;
  color: #D47836;
}
.message-item.receive .bubble {
  background-color: #fff;
  color: #333;
}
.avatar {
  width: 70rpx;
  height: 70rpx;
  background-color: #FFF2D6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  font-size: 40rpx;
}
.bubble {
  max-width: 500rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  line-height: 1.4;
  word-wrap: break-word;
}
.bubble-image {
  margin-top: 10rpx;
}
.msg-image {
  max-width: 300rpx;
  max-height: 300rpx;
  border-radius: 12rpx;
}

/* 聊天输入框容器 */
.input-container {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 12rpx 20rpx;
  border-radius: 40rpx;
  border: 1rpx solid #D47836;
  margin: 20rpx;
}
.icon-wrapper {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  border-radius: 50%;
}
.icon {
  font-size: 36rpx;
}
.text-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  padding: 0 10rpx;
  height: 70rpx;
}

/* 表情面板 */
.emoji-panel {
  background-color: #fff;
  border-top: 1rpx solid #eee;
  padding: 20rpx;
  max-height: 400rpx;
  overflow-y: auto;
}
.emoji-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.emoji-item {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.emoji-text {
  font-size: 44rpx;
}

/* 更多功能面板 */
.more-panel {
  background-color: #fff;
  border-top: 1rpx solid #eee;
  padding: 20rpx;
  display: flex;
  gap: 30rpx;
}
.more-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  width: 100rpx;
}
.more-icon {
  font-size: 48rpx;
}
.more-text {
  font-size: 24rpx;
  color: #666;
}
</style>