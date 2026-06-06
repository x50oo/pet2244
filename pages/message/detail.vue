<template>
  <view class="message-detail-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">消息详情</text>
      <view class="placeholder"></view>
    </view>

    <!-- 详情内容 -->
    <view class="detail-card" v-if="messageInfo.id">
      <text class="detail-title">{{ messageInfo.title }}</text>
      <text class="detail-time">{{ messageInfo.time }}</text>
      <view class="detail-content">
        <text>{{ messageInfo.content }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-else-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text>消息不存在或已被删除</text>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      messageId: null,
      messageInfo: {
        id: null,
        title: '',
        content: '',
        time: '',
        type: null,
        isRead: 0
      },
      loading: false
    }
  },
  onLoad(options) {
    console.log('接收参数:', options)
    
    // 获取消息ID
    if (options.id) {
      this.messageId = parseInt(options.id)
      this.loadMessageDetail()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  },
  methods: {
    goBack() {
      // 返回上一页，通知刷新消息列表
      const eventChannel = this.getOpenerEventChannel()
      if (eventChannel) {
        eventChannel.emit('messageRead', {
          messageId: this.messageId,
          isRead: true
        })
      }
      uni.navigateBack()
    },
    
    // 加载消息详情
    async loadMessageDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/messages/${this.messageId}`,
          method: 'GET'
        })
        
        this.messageInfo = {
          id: res.id,
          title: res.title,
          content: res.content,
          time: this.formatTime(res.createTime),
          type: res.type,
          isRead: res.isRead
        }
        
        // 自动标记已读
        if (this.messageInfo.isRead === 0) {
          this.markAsRead()
        }
        
      } catch (error) {
        console.error('加载消息详情失败', error)
        uni.showToast({ title: error.message || '加载失败', icon: 'none' })
        // 使用模拟数据
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 标记消息已读
    async markAsRead() {
      try {
        await request({
          url: `/api/messages/${this.messageId}/read`,
          method: 'PATCH'
        })
        this.messageInfo.isRead = 1
      } catch (error) {
        console.log('标记已读失败', error)
      }
    },
    
    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hour = date.getHours().toString().padStart(2, '0')
      const minute = date.getMinutes().toString().padStart(2, '0')
      
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      // 根据消息ID模拟数据
      const mockMessages = {
        1: {
          id: 1,
          title: '系统维护通知',
          content: '将于2026年5月25日凌晨2:00-4:00进行系统维护，届时部分功能可能无法使用，敬请谅解。',
          createTime: '2026-05-24T10:00:00',
          type: 1,
          isRead: 0
        },
        2: {
          id: 2,
          title: '版本更新通知',
          content: '宠物服务平台V2.0版本已上线，新增托管人评价功能，欢迎体验！',
          createTime: '2026-05-20T10:00:00',
          type: 1,
          isRead: 0
        },
        4: {
          id: 4,
          title: '托管单状态变更',
          content: '您的托管单「哈哈」已被托管人接单，请及时联系托管人确认服务时间。',
          createTime: '2026-05-23T10:00:00',
          type: 2,
          isRead: 0
        },
        5: {
          id: 5,
          title: '宠物档案审核通过',
          content: '您的宠物档案「布丁」已通过审核，现在可以在我的宠物中查看。',
          createTime: '2026-05-22T10:00:00',
          type: 2,
          isRead: 0
        }
      }
      
      const mock = mockMessages[this.messageId]
      if (mock) {
        this.messageInfo = {
          id: mock.id,
          title: mock.title,
          content: mock.content,
          time: this.formatTime(mock.createTime),
          type: mock.type,
          isRead: mock.isRead
        }
      } else {
        this.messageInfo = {
          id: this.messageId,
          title: '消息通知',
          content: '这是一条消息通知',
          time: this.formatTime(new Date().toISOString()),
          type: 2,
          isRead: 0
        }
      }
    }
  }
}
</script>

<style scoped>
.message-detail-page {
  min-height: 100vh;
  background-color: #FFF9E6;
}
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
.detail-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.detail-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}
.detail-time {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 30rpx;
}
.detail-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}
</style>