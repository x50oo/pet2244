<template>
  <view class="reject-page">
    <!-- 顶部导航栏：只有标题 + 右边叉叉 -->
    <view class="nav-bar">
      <text class="title">填写驳回理由</text>
      <view class="close-btn" @tap="closePage">
        <text class="close-icon">✕</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="form-card">
      <!-- 图片上传区 -->
      <view class="upload-area" @tap="chooseImage">
        <image v-if="!uploadedImageUrl" class="upload-icon" src="/static/upload.png" mode="aspectFit" />
        <image v-else class="uploaded-img" :src="uploadedImageUrl" mode="aspectFill" />
        <text class="upload-text">{{ uploadedImageUrl ? '重新上传' : '添加图片' }}</text>
      </view>

      <!-- 文本输入区 -->
      <textarea class="reason-input" placeholder="请输入驳回理由" v-model="reason" />
      
      <!-- 提示信息 -->
      <view class="tip-text">
        <text>驳回后将通知用户重新提交</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button class="publish-btn" @tap="submitReject" :disabled="submitting">
        {{ submitting ? '提交中...' : '确认驳回' }}
      </button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      // 审核参数
      businessType: '',      // 业务类型: boarding_shop, pet_info, foster_certification等
      businessId: null,      // 业务ID
      
      // 表单数据
      reason: '',
      uploadedImageUrl: '',  // 本地预览地址
      uploadedImagePath: '', // 上传后的服务器地址
      
      // UI状态
      submitting: false
    }
  },
  onLoad(options) {
    // 接收上一页传递的参数
    console.log('接收参数:', options)
    
    if (options.businessType) {
      this.businessType = options.businessType
    }
    if (options.businessId) {
      this.businessId = parseInt(options.businessId)
    }
    
    // 如果没有传递必要参数，提示错误
    if (!this.businessType || !this.businessId) {
      uni.showModal({
        title: '参数错误',
        content: '缺少必要的审核参数',
        showCancel: false,
        success: () => {
          uni.navigateBack()
        }
      })
    }
  },
  methods: {
    // 关闭页面
    closePage() {
      uni.navigateBack()
    },
    
    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.uploadedImageUrl = tempFilePath
          // 上传图片到服务器
          this.uploadImage(tempFilePath)
        },
        fail: (err) => {
          console.log('选择图片失败:', err)
          uni.showToast({ title: '选择图片失败', icon: 'none' })
        }
      })
    },
    
    // 上传图片到服务器
    async uploadImage(filePath) {
      uni.showLoading({ title: '上传中...' })
      
      try {
        // 上传文件
        const uploadRes = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: 'http://localhost:8080/api/upload',
            filePath: filePath,
            name: 'file',
            formData: {
              category: 'audit'
            },
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
        
        this.uploadedImagePath = uploadRes
        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
        
      } catch (error) {
        uni.hideLoading()
        console.error('上传失败:', error)
        uni.showToast({ title: '图片上传失败', icon: 'none' })
        // 清除本地预览图
        this.uploadedImageUrl = ''
      }
    },
    
    // 提交驳回
    async submitReject() {
      // 验证驳回理由
      if (!this.reason.trim()) {
        uni.showToast({ title: '请填写驳回理由', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '提交中...' })
      
      try {
        // 构建请求参数
        const requestData = {
          businessType: this.businessType,
          businessId: this.businessId,
          status: 3,  // 3=驳回
          reason: this.reason.trim()
        }
        
        // 如果有上传图片，添加图片URL
        if (this.uploadedImagePath) {
          requestData.images = [this.uploadedImagePath]
        }
        
        console.log('提交审核:', requestData)
        
        // 调用审核接口
        const res = await request({
          url: '/api/admin/audits',
          method: 'POST',
          data: requestData
        })
        
        uni.hideLoading()
        uni.showToast({ title: '驳回成功', icon: 'success' })
        
        // 获取事件通道，通知上一页刷新
        const eventChannel = this.getOpenerEventChannel()
        if (eventChannel) {
          eventChannel.emit('acceptRejectReason', {
            success: true,
            reason: this.reason,
            businessId: this.businessId
          })
        }
        
        // 延迟返回
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交失败:', error)
        uni.showToast({ 
          title: error.message || '提交失败，请重试', 
          icon: 'none' 
        })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.reject-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
}

/* 顶部导航栏：标题居中 + 右边叉叉 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20rpx 30rpx;
  background-color: #fff;
}
.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}
.close-btn {
  position: absolute;
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-icon {
  font-size: 40rpx;
  color: #D47836;
  font-weight: bold;
}

/* 表单卡片 */
.form-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}

/* 图片上传区 */
.upload-area {
  width: 150rpx;
  height: 150rpx;
  border: 1rpx dashed #999;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}
.upload-icon {
  width: 60rpx;
  height: 60rpx;
  margin-bottom: 10rpx;
}
.uploaded-img {
  width: 130rpx;
  height: 130rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}
.upload-text {
  font-size: 24rpx;
  color: #999;
}

/* 文本输入区 - 加高 */
.reason-input {
  width: 100%;
  height: 400rpx;
  border: 1rpx solid #eee;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #f9f9f9;
  box-sizing: border-box;
}

/* 提示信息 */
.tip-text {
  margin-top: 20rpx;
  text-align: center;
}
.tip-text text {
  font-size: 24rpx;
  color: #999;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.publish-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 30rpx;
}
.publish-btn[disabled] {
  opacity: 0.6;
}
.publish-btn::after {
  border: none;
}
</style>