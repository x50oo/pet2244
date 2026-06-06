<template>
  <view class="aftersale-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <text class="title">申请售后</text>
      <view class="close-btn" @tap="closeModal">
        <text class="close-icon">✕</text>
      </view>
    </view>

    <!-- 订单信息卡片 -->
    <view class="order-card" v-if="orderInfo">
      <text class="order-title">订单信息</text>
      <view class="order-row">
        <text class="order-label">订单号：</text>
        <text class="order-value">{{ orderInfo.orderNo }}</text>
      </view>
      <view class="order-row">
        <text class="order-label">商品：</text>
        <text class="order-value">{{ orderInfo.productName }}</text>
      </view>
      <view class="order-row">
        <text class="order-label">金额：</text>
        <text class="order-value">¥{{ orderInfo.amount }}</text>
      </view>
      <view class="order-row">
        <text class="order-label">下单时间：</text>
        <text class="order-value">{{ orderInfo.createTime }}</text>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 售后类型 -->
      <view class="type-section">
        <text class="section-label">售后类型</text>
        <view class="type-group">
          <view 
            class="type-item" 
            :class="{ active: aftersaleType === 'refund' }"
            @tap="aftersaleType = 'refund'"
          >
            <text>仅退款</text>
          </view>
          <view 
            class="type-item" 
            :class="{ active: aftersaleType === 'return' }"
            @tap="aftersaleType = 'return'"
          >
            <text>退货退款</text>
          </view>
          <view 
            class="type-item" 
            :class="{ active: aftersaleType === 'exchange' }"
            @tap="aftersaleType = 'exchange'"
          >
            <text>换货</text>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="contact-section">
        <text class="section-label">联系方式</text>
        <input 
          class="contact-input" 
          v-model="contactPhone" 
          placeholder="请输入联系电话" 
          type="number"
          maxlength="11"
        />
      </view>

      <!-- 添加图片按钮 -->
      <view class="upload-section">
        <text class="section-label">上传凭证</text>
        <view class="upload-area">
          <view class="upload-btn" @tap="chooseImage">
            <image v-if="!imageUrl" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
            <image v-else class="uploaded-img" :src="imageUrl" mode="aspectFill" />
            <text class="upload-text">{{ imageUrl ? '重新上传' : '添加图片' }}</text>
          </view>
        </view>
      </view>

      <!-- 问题描述文本域 -->
      <view class="desc-section">
        <text class="section-label">问题描述</text>
        <textarea 
          class="feedback-input" 
          v-model="description" 
          placeholder="请详细描述您遇到的问题"
          maxlength="500"
        />
        <text class="char-count">{{ description.length }}/500</text>
      </view>
    </view>

    <!-- 4. 底部提交按钮 -->
    <button class="submit-btn" @tap="submitAftersale" :disabled="submitting">
      {{ submitting ? '提交中...' : '申请' }}
    </button>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      orderId: null,
      orderInfo: null,
      
      aftersaleType: 'refund',
      contactPhone: '',
      description: '',
      imageUrl: '',
      uploadedImagePath: '',
      
      submitting: false
    }
  },
  onLoad(options) {
    if (options.orderId) {
      this.orderId = parseInt(options.orderId)
      this.loadOrderInfo()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
  },
  methods: {
    closeModal() {
      uni.navigateBack()
    },
    
    // 加载订单信息
    async loadOrderInfo() {
      try {
        // 根据订单类型调用不同接口
        // 如果是寄养订单
        const res = await request({
          url: `/api/boarding/orders/${this.orderId}`,
          method: 'GET'
        })
        this.orderInfo = {
          orderNo: res.orderNo,
          productName: `${res.shopName} - ${res.packageName}`,
          amount: res.totalPrice,
          createTime: this.formatDate(res.createTime)
        }
      } catch (error) {
        console.error('加载订单失败', error)
        // 使用模拟数据
        this.orderInfo = {
          orderNo: 'CAX' + Date.now(),
          productName: '宠物寄养服务',
          amount: 280,
          createTime: this.formatDate(new Date().toISOString())
        }
      }
    },
    
    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.imageUrl = tempFilePath
          // 上传图片到服务器
          await this.uploadImage(tempFilePath)
        }
      })
    },
    
    // 上传图片
    async uploadImage(filePath) {
      uni.showLoading({ title: '上传中...' })
      
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://localhost:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'general' },
          header: {
            'Authorization': `Bearer ${uni.getStorageSync('token')}`
          },
          success: (res) => {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              this.uploadedImagePath = data.data
              uni.hideLoading()
              uni.showToast({ title: '上传成功', icon: 'success' })
              resolve(data.data)
            } else {
              uni.hideLoading()
              uni.showToast({ title: '上传失败', icon: 'none' })
              reject(data)
            }
          },
          fail: (err) => {
            uni.hideLoading()
            uni.showToast({ title: '上传失败', icon: 'none' })
            reject(err)
          }
        })
      })
    },
    
    // 提交售后
    async submitAftersale() {
      // 表单验证
      if (!this.description.trim()) {
        uni.showToast({ title: '请填写问题描述', icon: 'none' })
        return
      }
      
      if (!this.contactPhone) {
        uni.showToast({ title: '请填写联系电话', icon: 'none' })
        return
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.contactPhone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '提交中...' })
      
      try {
        // 构建请求数据
        const data = {
          orderId: this.orderId,
          orderNo: this.orderInfo.orderNo,
          type: this.aftersaleType,
          contactPhone: this.contactPhone,
          content: this.description,
          images: this.uploadedImagePath ? [this.uploadedImagePath] : []
        }
        
        // 调用售后接口（如果后端没有专门的售后接口，可复用反馈接口）
        await request({
          url: '/api/user/feedback',
          method: 'POST',
          data: {
            content: `【售后】订单号：${this.orderInfo.orderNo}\n类型：${this.getTypeText()}\n问题：${this.description}`,
            images: this.uploadedImagePath ? [this.uploadedImagePath] : []
          }
        })
        
        uni.hideLoading()
        uni.showToast({ title: '售后申请提交成功', icon: 'success' })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交失败', error)
        uni.showToast({ title: error.message || '提交失败，请重试', icon: 'none' })
      } finally {
        this.submitting = false
      }
    },
    
    getTypeText() {
      const map = {
        refund: '仅退款',
        return: '退货退款',
        exchange: '换货'
      }
      return map[this.aftersaleType] || '售后'
    },
    
    formatDate(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.aftersale-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  display: flex;
  flex-direction: column;
}

/* 1. 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  background-color: #fff;
  position: relative;
}
.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.close-btn {
  position: absolute;
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
}
.close-icon {
  font-size: 40rpx;
  color: #999;
}

/* 订单卡片 */
.order-card {
  background-color: #fff;
  margin: 20rpx 40rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.order-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #D47836;
  display: block;
  margin-bottom: 15rpx;
}
.order-row {
  display: flex;
  margin-bottom: 10rpx;
}
.order-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #999;
}
.order-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

/* 表单区域 */
.form-section {
  flex: 1;
  background-color: #fff;
  margin: 0 40rpx 30rpx;
  border-radius: 16rpx;
  padding: 25rpx;
  display: flex;
  flex-direction: column;
}

/* 通用分区样式 */
.type-section,
.contact-section,
.upload-section,
.desc-section {
  margin-bottom: 30rpx;
}
.section-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

/* 售后类型选择 */
.type-group {
  display: flex;
  gap: 20rpx;
}
.type-item {
  flex: 1;
  text-align: center;
  padding: 15rpx 0;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #666;
}
.type-item.active {
  background-color: #FFE0A8;
  color: #D47836;
}

/* 联系方式输入 */
.contact-input {
  height: 70rpx;
  border: 1rpx solid #eee;
  border-radius: 40rpx;
  padding: 0 25rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
}

/* 上传图片 */
.upload-area {
  display: flex;
  justify-content: center;
}
.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  border: 1rpx dashed #ccc;
}
.upload-icon {
  width: 50rpx;
  height: 50rpx;
  opacity: 0.5;
}
.uploaded-img {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
  object-fit: cover;
}
.upload-text {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 问题描述 */
.feedback-input {
  width: 100%;
  height: 200rpx;
  font-size: 28rpx;
  color: #333;
  border: 1rpx solid #eee;
  border-radius: 16rpx;
  padding: 20rpx;
  background-color: #f9f9f9;
  box-sizing: border-box;
}
.char-count {
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 底部提交按钮 */
.submit-btn {
  width: 60%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: bold;
  margin: 20rpx auto 40rpx;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.submit-btn::after {
  border: none;
}
</style>