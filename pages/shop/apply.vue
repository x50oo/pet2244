<template>
  <view class="shop-entry-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">店铺入驻</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 已有申请提示 -->
    <view class="existing-tip" v-else-if="existingShop">
      <text class="tip-icon">🏪</text>
      <text class="tip-text">您已提交入驻申请</text>
      <text class="tip-desc">当前状态：{{ getShopStatusText(existingShop.status) }}</text>
      <button class="view-shop-btn" @tap="viewMyShop">查看我的店铺</button>
    </view>

    <template v-else>
      <!-- 表单卡片 -->
      <view class="form-card">
        <!-- 2. 店铺信息区 -->
        <view class="section">
          <!-- 店铺头像 -->
          <view class="form-item">
            <text class="label">店铺头像：</text>
            <view class="upload-btn" @tap="uploadAvatar">
              <image v-if="!avatarImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
              <image v-else class="uploaded-img" :src="avatarImg" mode="aspectFill" />
              <text class="upload-text">{{ avatarImg ? '重新上传' : '上传图片' }}</text>
            </view>
          </view>

          <!-- 店铺名称 -->
          <view class="form-item row-item">
            <text class="label">店铺名称：</text>
            <input class="input-box" v-model="formData.name" placeholder="请输入店铺名称" />
          </view>

          <!-- 联系方式 -->
          <view class="form-item row-item">
            <text class="label">联系方式：</text>
            <input class="input-box" v-model="formData.phone" placeholder="请输入联系电话" type="number" maxlength="11" />
          </view>

          <!-- 经营地址 -->
          <view class="form-item row-item">
            <text class="label">经营地址：</text>
            <input class="input-box" v-model="formData.address" placeholder="请输入实体店地址" />
          </view>

          <!-- 位置选择 -->
          <view class="form-item">
            <text class="label">店铺位置：</text>
            <view class="location-btn" @tap="chooseLocation">
              <text class="loc-icon">📍</text>
              <text class="loc-text">{{ location.address || '点击选择店铺位置' }}</text>
            </view>
          </view>

          <!-- 店铺简介 -->
          <view class="form-item">
            <text class="label">店铺简介：</text>
            <textarea class="textarea-box" v-model="formData.description" placeholder="请输入主营业务、特色服务介绍" />
          </view>
        </view>

        <!-- 3. 资质上传区 -->
        <view class="section">
          <view class="form-item">
            <text class="label">店铺营业执照：</text>
            <view class="upload-btn" @tap="uploadLicense">
              <image v-if="!licenseImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
              <image v-else class="uploaded-img" :src="licenseImg" mode="aspectFill" />
              <text class="upload-text">{{ licenseImg ? '重新上传' : '上传图片' }}</text>
            </view>
          </view>

          <view class="form-item">
            <text class="label">法人身份证：</text>
            <view class="upload-btn" @tap="uploadIdCard">
              <image v-if="!idCardImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
              <image v-else class="uploaded-img" :src="idCardImg" mode="aspectFill" />
              <text class="upload-text">{{ idCardImg ? '重新上传' : '上传图片' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 4. 底部提交按钮 -->
      <button class="submit-btn" @tap="submitApplication" :disabled="submitting">
        {{ submitting ? '提交中...' : '完成' }}
      </button>
    </template>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false,
      submitting: false,
      existingShop: null,
      
      // 表单数据
      formData: {
        name: '',
        phone: '',
        address: '',
        description: '',
        latitude: null,
        longitude: null,
        photos: []
      },
      
      // 图片本地路径
      avatarImg: '',
      licenseImg: '',
      idCardImg: '',
      
      // 已上传的图片URL
      uploadedAvatarUrl: '',
      uploadedLicenseUrl: '',
      uploadedIdCardUrl: '',
      
      // 位置信息
      location: {
        address: '',
        latitude: null,
        longitude: null
      }
    }
  },
  onLoad() {
    this.checkExistingApplication()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 工具方法 ==========
    getShopStatusText(status) {
      const map = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return map[status] || '未知'
    },
    
    // ========== 检查已有申请 ==========
    async checkExistingApplication() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/boarding/shops/mine',
          method: 'GET'
        })
        if (res && res.length > 0) {
          this.existingShop = res[0]
        }
      } catch (error) {
        console.log('检查已有申请失败', error)
      } finally {
        this.loading = false
      }
    },
    
    // ========== 图片上传 ==========
    uploadImage(type) {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this[type + 'Img'] = tempFilePath
          
          // 上传到服务器
          uni.showLoading({ title: '上传中...' })
          try {
            const uploadedUrl = await this.uploadToServer(tempFilePath)
            this[type + 'Url'] = uploadedUrl
            uni.hideLoading()
            uni.showToast({ title: '上传成功', icon: 'success' })
          } catch (error) {
            uni.hideLoading()
            console.error('上传失败', error)
            uni.showToast({ title: '上传失败', icon: 'none' })
            this[type + 'Img'] = ''
          }
        }
      })
    },
    
    // 修改 uploadToServer 方法
    async uploadToServer(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://localhost:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'boarding' },  // ← 添加这一行
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
    
    uploadAvatar() {
      this.uploadImage('avatar')
    },
    uploadLicense() {
      this.uploadImage('license')
    },
    uploadIdCard() {
      this.uploadImage('idCard')
    },
    
    // ========== 位置选择 ==========
    chooseLocation() {
      uni.chooseLocation({
        success: (res) => {
          this.location = {
            address: res.name || res.address,
            latitude: res.latitude,
            longitude: res.longitude
          }
          this.formData.address = this.location.address
          this.formData.latitude = this.location.latitude
          this.formData.longitude = this.location.longitude
        },
        fail: () => {
          uni.showToast({ title: '选择位置失败', icon: 'none' })
        }
      })
    },
    
    // ========== 提交申请 ==========
    async submitApplication() {
      // 表单验证
      if (!this.avatarImg) {
        uni.showToast({ title: '请上传店铺头像', icon: 'none' })
        return
      }
      if (!this.formData.name) {
        uni.showToast({ title: '请输入店铺名称', icon: 'none' })
        return
      }
      if (!this.formData.phone) {
        uni.showToast({ title: '请输入联系方式', icon: 'none' })
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      if (!this.formData.address) {
        uni.showToast({ title: '请输入经营地址', icon: 'none' })
        return
      }
      if (!this.formData.latitude || !this.formData.longitude) {
        uni.showToast({ title: '请选择店铺位置', icon: 'none' })
        return
      }
      if (!this.licenseImg) {
        uni.showToast({ title: '请上传营业执照', icon: 'none' })
        return
      }
      if (!this.idCardImg) {
        uni.showToast({ title: '请上传法人身份证', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '提交中...' })
      
      try {
        // 收集所有图片URL
        const photos = [this.uploadedAvatarUrl, this.uploadedLicenseUrl, this.uploadedIdCardUrl].filter(Boolean)
        
        const data = {
          name: this.formData.name,
          address: this.formData.address,
          phone: this.formData.phone,
          description: this.formData.description,
          photos: photos,
          latitude: this.formData.latitude,
          longitude: this.formData.longitude
        }
        
        await request({
          url: '/api/boarding/shops',
          method: 'POST',
          data: data
        })
        
        uni.hideLoading()
        uni.showToast({ title: '申请已提交，等待审核', icon: 'success' })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交失败', error)
        
        if (error.code === 409) {
          uni.showToast({ title: '您已提交过入驻申请', icon: 'none' })
        } else {
          uni.showToast({ title: error.message || '提交失败，请重试', icon: 'none' })
        }
      } finally {
        this.submitting = false
      }
    },
    
    viewMyShop() {
      if (this.existingShop && this.existingShop.id) {
        uni.navigateTo({
          url: `/pages/shop/detail/detail?id=${this.existingShop.id}`
        })
      }
    }
  }
}
</script>

<style scoped>
.shop-entry-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80rpx;
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

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 已有申请提示 */
.existing-tip {
  background-color: #fff;
  margin: 20rpx;
  padding: 60rpx 40rpx;
  border-radius: 20rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.tip-icon {
  font-size: 80rpx;
}
.tip-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #D47836;
}
.tip-desc {
  font-size: 26rpx;
  color: #666;
}
.view-shop-btn {
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 40rpx;
  padding: 15rpx 40rpx;
  font-size: 28rpx;
  margin-top: 20rpx;
}
.view-shop-btn::after {
  border: none;
}

/* 表单卡片 */
.form-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

/* 表单项 */
.form-item {
  margin-bottom: 30rpx;
}

/* 同行样式 */
.row-item {
  display: flex;
  align-items: center;
}
.row-item .label {
  display: inline-block;
  width: 160rpx;
  margin-bottom: 0;
  flex-shrink: 0;
}
.row-item .input-box {
  flex: 1;
}

.label {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 15rpx;
}
.input-box {
  width: 100%;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 26rpx;
  background-color: #f9f9f9;
}
.textarea-box {
  width: 100%;
  height: 150rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 26rpx;
  background-color: #f9f9f9;
}

/* 位置选择按钮 */
.location-btn {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 15rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  border: 1rpx solid #ddd;
}
.loc-icon {
  font-size: 32rpx;
}
.loc-text {
  font-size: 26rpx;
  color: #666;
  flex: 1;
}

/* 上传按钮 */
.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 140rpx;
  height: 140rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  border: 1rpx dashed #ccc;
  margin-top: 10rpx;
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

/* 底部提交按钮 */
.submit-btn {
  width: 80%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 30rpx;
  margin: 40rpx auto;
  display: block;
  font-weight: bold;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.submit-btn::after {
  border: none;
}
</style>