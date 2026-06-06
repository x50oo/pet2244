<template>
  <view class="feedback-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">问题反馈</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 表单区域 -->
    <view class="form-section">
      <!-- 问题描述文本域 -->
      <textarea 
        class="feedback-input" 
        v-model="content" 
        placeholder="请输入所遇到的问题并提交"
        maxlength="500"
      />
      <view class="char-count">{{ content.length }}/500</view>

      <!-- 3. 图片上传区域（支持多图） -->
      <view class="upload-area">
        <view class="upload-images" v-if="imageList.length > 0">
          <view class="upload-image-item" v-for="(img, index) in imageList" :key="index">
            <image class="uploaded-img" :src="img.url || img" mode="aspectFill" />
            <view class="delete-image" @tap.stop="deleteImage(index)">✕</view>
          </view>
        </view>
        <view class="upload-btn" v-if="imageList.length < 6" @tap="addImage">
          <image class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
          <text class="upload-text">添加图片</text>
        </view>
      </view>

      <!-- 4. 提交反馈按钮 -->
      <button class="submit-btn" @tap="submitFeedback" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交反馈' }}
      </button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      content: '',
      imageList: [],      // 图片列表 { url, isRemote? }
      uploadedImages: [], // 已上传的图片URL
      submitting: false
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 添加图片
    addImage() {
      const maxCount = 6 - this.imageList.length
      if (maxCount <= 0) {
        uni.showToast({ title: '最多上传6张图片', icon: 'none' })
        return
      }
      
      uni.chooseImage({
        count: maxCount,
        success: async (res) => {
          uni.showLoading({ title: '上传中...' })
          
          for (const filePath of res.tempFilePaths) {
            try {
              const uploadedUrl = await this.uploadImage(filePath)
              this.imageList.push({ url: uploadedUrl, localPath: filePath })
              this.uploadedImages.push(uploadedUrl)
            } catch (error) {
              console.error('上传失败', error)
              uni.showToast({ title: '部分图片上传失败', icon: 'none' })
            }
          }
          
          uni.hideLoading()
          if (res.tempFilePaths.length > 0) {
            uni.showToast({ title: '上传成功', icon: 'success' })
          }
        }
      })
    },
    
    // 上传图片到服务器
    // 修改 uploadImage 方法
    async uploadImage(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://localhost:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'general' },  // ← 添加这一行
          header: { 'Authorization': `Bearer ${uni.getStorageSync('token')}` },
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
    
    // 删除图片
    deleteImage(index) {
      this.imageList.splice(index, 1)
    },
    
    // 提交反馈
    async submitFeedback() {
      // 表单验证
      if (!this.content.trim()) {
        uni.showToast({ title: '请填写反馈内容', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '提交中...' })
      
      try {
        // 获取所有图片URL
        const images = this.imageList.map(img => img.url || img)
        
        const data = {
          content: this.content.trim(),
          images: images
        }
        
        await request({
          url: '/api/user/feedback',
          method: 'POST',
          data: data
        })
        
        uni.hideLoading()
        uni.showToast({ title: '反馈提交成功', icon: 'success' })
        
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
    }
  }
}
</script>

<style scoped>
.feedback-page {
  min-height: 100vh;
  background-color: #FFF9E6;
}

/* 1. 顶部导航栏 */
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

/* 表单区域 */
.form-section {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 问题输入框 */
.feedback-input {
  width: 100%;
  height: 250rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 25rpx;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  border: 1rpx solid #eee;
  box-sizing: border-box;
}
.char-count {
  width: 100%;
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-bottom: 40rpx;
}

/* 图片上传区域 */
.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 60rpx;
  width: 100%;
}
.upload-images {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.upload-image-item {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}
.uploaded-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  background-color: #eee;
}
.delete-image {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 36rpx;
  height: 36rpx;
  background-color: #E53935;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
}
.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  background-color: #fff;
  border-radius: 12rpx;
  border: 1rpx dashed #ccc;
}
.upload-icon {
  width: 50rpx;
  height: 50rpx;
  opacity: 0.5;
}
.upload-text {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 提交按钮 */
.submit-btn {
  width: 80%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: bold;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.submit-btn::after {
  border: none;
}
</style>