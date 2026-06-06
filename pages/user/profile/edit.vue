<template>
  <view class="edit-profile-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">编辑资料</text>
      <view class="placeholder"></view>
    </view>

    <!-- 表单内容 -->
    <view class="form-container">
      <!-- 头像 -->
      <view class="form-item avatar-item" @tap="uploadAvatar">
        <text class="label">头像：</text>
        <view class="avatar-wrapper">
          <image 
            v-if="avatarUrl" 
            class="avatar-img" 
            :src="avatarUrl" 
            mode="aspectFill" 
          />
          <text v-else class="avatar-placeholder">📷</text>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="form-item">
        <text class="label">昵称：</text>
        <input 
          class="input-box" 
          v-model="form.nickname" 
          placeholder="请输入" 
          placeholder-class="placeholder-style"
        />
      </view>

      <!-- 联系方式 -->
      <view class="form-item">
        <text class="label">联系方式：</text>
        <input 
          class="input-box" 
          v-model="form.contact" 
          placeholder="请输入默认联系电话" 
          placeholder-class="placeholder-style"
        />
      </view>

      <!-- 地址 -->
      <view class="form-item">
        <text class="label">地址：</text>
        <input 
          class="input-box" 
          v-model="form.address" 
          placeholder="请输入默认地址" 
          placeholder-class="placeholder-style"
        />
      </view>
    </view>

    <!-- 完成按钮 -->
    <view class="btn-wrapper">
      <button class="submit-btn" @tap="saveProfile" :disabled="submitting">
        {{ submitting ? '保存中...' : '完成' }}
      </button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      submitting: false,
      avatarUrl: '',
      uploadedAvatarUrl: '',
      
      form: {
        nickname: '',
        contact: '',
        address: ''
      }
    }
  },
  onLoad() {
    this.loadUserInfo()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 加载用户信息
    async loadUserInfo() {
      try {
        const res = await request({
          url: '/api/user/me',
          method: 'GET'
        })
        
        this.form.nickname = res.nickname || ''
        this.form.contact = res.contact || ''
        this.form.address = res.address || ''
        this.avatarUrl = res.avatarUrl || ''
        this.uploadedAvatarUrl = res.avatarUrl || ''
      } catch (error) {
        console.error('加载用户信息失败', error)
        // 从本地存储获取
        const storedUser = uni.getStorageSync('userInfo')
        if (storedUser) {
          this.form.nickname = storedUser.nickname || ''
          this.form.contact = storedUser.contact || ''
          this.form.address = storedUser.address || ''
          this.avatarUrl = storedUser.avatarUrl || ''
          this.uploadedAvatarUrl = storedUser.avatarUrl || ''
        }
      }
    },
    
    // 上传头像
    async uploadAvatar() {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.avatarUrl = tempFilePath
          
          uni.showLoading({ title: '上传中...' })
          try {
            const uploadedUrl = await this.uploadToServer(tempFilePath)
            this.uploadedAvatarUrl = uploadedUrl
            uni.hideLoading()
            uni.showToast({ title: '上传成功', icon: 'success' })
          } catch (error) {
            uni.hideLoading()
            console.error('上传失败', error)
            uni.showToast({ title: '上传失败', icon: 'none' })
            // 恢复原头像
            this.avatarUrl = this.uploadedAvatarUrl
          }
        }
      })
    },
    
    // 上传到服务器
    async uploadToServer(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://192.168.129.49:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'avatar' },
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
    
    // 保存资料
    async saveProfile() {
      this.submitting = true
      uni.showLoading({ title: '保存中...' })
      
      try {
        await request({
          url: '/api/user/profile',
          method: 'PUT',
          data: {
            nickname: this.form.nickname,
            avatarUrl: this.uploadedAvatarUrl,
            contact: this.form.contact,
            address: this.form.address
          }
        })
        
        uni.hideLoading()
        uni.showToast({ title: '保存成功，等待审核', icon: 'success' })
        
        // 更新本地存储的用户信息
        const storedUser = uni.getStorageSync('userInfo')
        if (storedUser) {
          storedUser.nickname = this.form.nickname
          storedUser.avatarUrl = this.uploadedAvatarUrl
          storedUser.contact = this.form.contact
          storedUser.address = this.form.address
          uni.setStorageSync('userInfo', storedUser)
        }
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('保存失败', error)
        uni.showToast({ 
          title: error.message || '保存失败', 
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
.edit-profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 100rpx;
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

/* 表单容器 */
.form-container {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 0 30rpx;
}

/* 表单项 */
.form-item {
  display: flex;
  align-items: center;
  min-height: 100rpx;
  border-bottom: 1rpx solid #eee;
  padding: 20rpx 0;
}
.form-item:last-child {
  border-bottom: none;
}

/* 头像项 */
.avatar-item {
  justify-content: space-between;
}

.label {
  font-size: 30rpx;
  color: #333;
  width: 160rpx;
  flex-shrink: 0;
}

.input-box {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  padding: 10rpx 0;
}

.placeholder-style {
  color: #ccc;
  font-size: 28rpx;
}

/* 头像 */
.avatar-wrapper {
  width: 100rpx;
  height: 100rpx;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  font-size: 50rpx;
  color: #999;
}

/* 完成按钮 */
.btn-wrapper {
  margin: 60rpx 30rpx;
}
.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}
.submit-btn::after {
  border: none;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
</style>