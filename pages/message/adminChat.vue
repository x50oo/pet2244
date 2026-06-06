<template>
  <view class="admin-chat-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo.name }}</text>
        <view class="user-tag" v-if="userInfo.role === 'admin'">管理员</view>
        <view class="user-tag user" v-else>用户</view>
      </view>
      <view class="placeholder"></view>
    </view>

    <!-- 聊天内容区域 -->
    <scroll-view class="chat-content" scroll-y :scroll-into-view="scrollToView" scroll-with-animation>
      <view class="message-list">
        <view class="message-item" :class="msg.type === senderId ? 'send' : 'receive'" v-for="(msg, index) in chatMessages" :key="index" :id="'msg-' + index">
          <view class="message-time" v-if="showTime(index)">
            <text>{{ msg.time }}</text>
          </view>
          <view class="message-bubble">
            <view class="avatar">
              <text class="avatar-text">{{ msg.type === senderId ? '👤' : (userInfo.role === 'admin' ? '👨‍💼' : '👤') }}</text>
            </view>
            <view class="bubble" v-if="msg.content">
              <text>{{ msg.content }}</text>
            </view>
            <view class="bubble-image" v-if="msg.imageUrl">
              <image class="msg-image" :src="msg.imageUrl" mode="aspectFill" @tap="previewImage(msg.imageUrl)" />
            </view>
            <!-- 审核状态标记 -->
            <view class="audit-status" v-if="msg.businessType">
              <text class="status-badge" :class="msg.auditStatus">{{ getAuditStatusText(msg.auditStatus) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 快捷回复区（仅管理员显示） -->
    <view class="quick-reply" v-if="isAdmin">
      <scroll-view class="quick-scroll" scroll-x>
        <view class="quick-item" v-for="(reply, index) in quickReplies" :key="index" @tap="sendQuickReply(reply)">
          <text>{{ reply }}</text>
        </view>
      </scroll-view>
    </view>

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
      <view class="more-item" v-if="isAdmin" @tap="sendAuditNotice">
        <text class="more-icon">📋</text>
        <text class="more-text">审核通知</text>
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
      senderId: null,  // 当前登录用户ID
      
      // 聊天对象信息
      userInfo: {
        id: '',
        name: '',
        avatarText: '',
        role: 'user'
      },
      
      isAdmin: false,
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
      
      quickReplies: [
        '您好，请问有什么可以帮您？',
        '您的申请正在审核中，请耐心等待',
        '审核已通过，感谢您的配合',
        '您的资料不完整，请补充后再提交',
        '请提供更多信息以便我们审核'
      ],
      emojiList: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎']
    }
  },
  onLoad(options) {
    // 获取当前登录用户信息
    const currentUser = uni.getStorageSync('userInfo')
    this.currentUserId = currentUser?.userId
    this.isAdmin = currentUser?.role === 1
    
    // 聊天对象信息
    this.userInfo.id = parseInt(options.userId)
    this.userInfo.name = options.name || '对方'
    this.userInfo.role = this.isAdmin ? 'user' : 'admin'
    
    // 当前登录用户作为发送方
    this.senderId = this.currentUserId
    
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
          type: msg.senderId === this.currentUserId ? this.currentUserId : this.userInfo.id,
          content: msg.content,
          imageUrl: msg.imageUrl,
          time: this.formatTime(msg.createTime),
          isRead: msg.isRead,
          businessType: msg.businessType,
          auditStatus: msg.auditStatus
        }))
        
        if (isLoadMore) {
          this.chatMessages = [...formattedMessages.reverse(), ...this.chatMessages]
        } else {
          this.chatMessages = formattedMessages.reverse()
        }
        
        this.hasMore = records.length === 20
        this.page++
        
        // 滚动到底部
        this.$nextTick(() => {
          if (this.chatMessages.length > 0) {
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
        // 标记与当前用户的聊天为已读
        await request({
          url: `/api/messages/read-all`,
          method: 'PATCH',
          data: { receiverId: this.userInfo.id }
        })
      } catch (error) {
        console.log('标记已读失败', error)
      }
    },
    
    // ========== WebSocket ==========
    initWebSocket() {
      const token = uni.getStorageSync('token')
      if (!token) return
      
      const wsUrl = `ws://localhost:8080/ws/chat?token=${token}`
      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => console.log('WebSocket连接中...')
      })
      
      this.socketTask.onOpen(() => {
        console.log('WebSocket已连接')
      })
      
      this.socketTask.onMessage((res) => {
        const data = JSON.parse(res.data)
        // 收到消息，且发送者是当前聊天对象
        if (data.senderId === this.userInfo.id) {
          this.receiveMessage(data)
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
          // 消息发送成功，添加到列表
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
    
    closeWebSocket() {
      if (this.socketTask) {
        this.socketTask.close()
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
    
    sendQuickReply(reply) {
      this.inputText = reply
      this.sendTextMessage()
    },
    
    async uploadImage(filePath) {
      uni.showLoading({ title: '上传中...' })
      
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://localhost:8080/api/upload',
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
    
    // 发送审核通知
    async sendAuditNotice() {
      this.showMorePanel = false
      
      uni.showLoading({ title: '发送中...' })
      
      try {
        // 示例：发送审核通知消息
        const message = '您的申请正在审核中，请耐心等待。'
        
        // 先通过WebSocket发送
        this.sendMessage({
          content: message,
          imageUrl: null
        })
        
        // 同时可以调用业务接口
        uni.hideLoading()
        uni.showToast({ title: '通知已发送', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '发送失败', icon: 'none' })
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
      return prevMsg?.time !== currMsg?.time
    },
    
    getAuditStatusText(status) {
      const map = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
      }
      return map[status] || status
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
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    // 模拟数据
    useMockMessages() {
      this.chatMessages = [
        { type: 'receive', content: '您好，我的宠物档案审核需要多久？', time: '09:00' },
        { type: 'send', content: '您好，一般在1-2个工作日内完成审核', time: '09:05' },
        { type: 'receive', content: '好的，谢谢', time: '09:08' }
      ]
    }
  }
}
</script>

<style scoped>
.admin-chat-page {
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
  align-items: center;
  gap: 15rpx;
}
.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
.user-tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  font-size: 22rpx;
}
.user-tag.user {
  background-color: #E8F5E9;
  color: #4CAF50;
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
.audit-status {
  margin-top: 10rpx;
}
.status-badge {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}
.status-badge.pending {
  background-color: #FFF2D6;
  color: #D47836;
}
.status-badge.approved {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.status-badge.rejected {
  background-color: #FFEBEE;
  color: #E53935;
}

/* 快捷回复区 */
.quick-reply {
  background-color: #fff;
  padding: 15rpx 20rpx;
  border-top: 1rpx solid #eee;
}
.quick-scroll {
  white-space: nowrap;
}
.quick-item {
  display: inline-block;
  background-color: #FFF2D6;
  color: #D47836;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  margin-right: 15rpx;
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

/* 更多功能面板 request*/
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