// utils/websocket.js
class WebSocketManager {
  constructor() {
    this.socketTask = null
    this.isConnected = false
    this.reconnectTimer = null
    this.messageHandlers = new Map() // 存储消息处理器
    this.pendingMessages = [] // 待发送消息队列
  }

  // 初始化连接
  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.socketTask) {
        resolve(true)
        return
      }

      const token = uni.getStorageSync('token')
      if (!token) {
        reject('未登录')
        return
      }

      // 根据环境选择协议
      const isDev = process.env.NODE_ENV === 'development'
      const protocol = isDev ? 'ws://' : 'wss://'
      const host = isDev ? 'localhost:8080' : 'your-domain.com'
      const wsUrl = `ws://192.168.129.49:8080/ws/chat?token=${token}`

      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('WebSocket 连接中...')
        }
      })

      this.socketTask.onOpen(() => {
        console.log('WebSocket 已连接')
        this.isConnected = true
        // 发送队列中的消息
        this.flushPendingMessages()
        resolve(true)
      })

      this.socketTask.onMessage((res) => {
        try {
          const data = JSON.parse(res.data)
          // 分发给注册的处理器
          this.dispatchMessage(data)
        } catch (e) {
          console.error('解析消息失败', e)
        }
      })

      this.socketTask.onError((err) => {
        console.error('WebSocket 错误', err)
        this.isConnected = false
        reject(err)
      })

      this.socketTask.onClose(() => {
        console.log('WebSocket 断开')
        this.isConnected = false
        this.socketTask = null
        // 自动重连
        this.scheduleReconnect()
      })
    })
  }

  // 注册消息处理器
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type).push(handler)
  }

  // 移除消息处理器
  offMessage(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // 分发消息
  dispatchMessage(data) {
    // 全局消息处理
    const handlers = this.messageHandlers.get('*') || []
    handlers.forEach(handler => handler(data))

    // 特定类型消息处理
    if (data.type && this.messageHandlers.has(data.type)) {
      this.messageHandlers.get(data.type).forEach(handler => handler(data))
    }
  }

  // 发送消息
  send(data) {
    if (!this.isConnected || !this.socketTask) {
      // 未连接时缓存消息
      this.pendingMessages.push(data)
      // 尝试重连
      this.connect().catch(console.error)
      return false
    }

    try {
      this.socketTask.send({
        data: JSON.stringify(data),
        fail: (err) => {
          console.error('发送失败', err)
          this.pendingMessages.push(data)
          return false
        }
      })
      return true
    } catch (e) {
      console.error('发送异常', e)
      return false
    }
  }

  // 发送队列中的消息
  flushPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const msg = this.pendingMessages.shift()
      this.send(msg)
    }
  }

  // 重连
  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      console.log('尝试重连 WebSocket')
      this.connect().catch(console.error)
    }, 5000)
  }

  // 关闭连接
  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
    this.isConnected = false
    this.pendingMessages = []
  }

  // 获取连接状态
  getStatus() {
    return this.isConnected
  }
}

// 导出单例
export default new WebSocketManager()