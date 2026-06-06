<template>
  <view class="pet-find-publish-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">寻宠信息发布</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 2. 宠物档案选择区 -->
      <view class="pet-select-btn" @tap="selectPet">
        <view class="plus-icon">+</view>
        <text class="btn-text">选择宠物档案</text>
      </view>

      <!-- 已选宠物信息 -->
      <view class="selected-pet" v-if="selectedPet">
        <image class="selected-pet-avatar" :src="selectedPet.avatar || '/static/default-pet.png'" mode="aspectFill" />
        <view class="selected-pet-info">
          <text class="selected-pet-name">{{ selectedPet.name }}</text>
          <text class="selected-pet-type">{{ getPetTypeText(selectedPet.petType) }} · {{ selectedPet.breed }}</text>
        </view>
        <view class="change-pet" @tap="selectPet">更换</view>
      </view>

      <!-- 3. 信息补充区 -->
      <view class="info-section">
        <!-- 图片上传区 -->
        <view class="upload-area">
          <view class="upload-images" v-if="imageList.length > 0">
            <view class="upload-image-item" v-for="(img, index) in imageList" :key="index">
              <image class="upload-image" :src="img.url || img" mode="aspectFill" />
              <view class="delete-image" @tap.stop="deleteImage(index)">✕</view>
            </view>
          </view>
          <view class="upload-btn" v-if="imageList.length < 6" @tap="addImage">
            <text class="plus-icon-small">+</text>
            <text class="upload-text">添加图片</text>
          </view>
        </view>

        <!-- 补充描述文本域 -->
        <view class="desc-area">
          <text class="desc-label">补充描述：</text>
          <textarea class="desc-input" v-model="description" placeholder="请补充描述寻宠内容（如特征、走失经过等）" />
        </view>
      </view>

      <!-- 4. 标记地点区 -->
      <view class="location-section">
        <view class="section-header">
          <text class="header-icon">📍</text>
          <text class="header-title">标记地点</text>
        </view>

        <view class="location-info">
          <text class="loc-icon">📍</text>
          <text class="label">丢失位置：</text>
          <text class="address">{{ location.address || '点击选择位置' }}</text>
        </view>

        <view class="map-container" @tap="chooseLocation">
          <map
            class="map-component"
            :latitude="location.latitude || 23.076"
            :longitude="location.longitude || 113.387"
            :scale="15"
            :markers="markers"
            :show-location="true"
          ></map>
          <view class="map-tip">点击地图选择位置</view>
        </view>

        <button class="cancel-mark-btn" @tap="cancelLocation">取消标记</button>
      </view>

      <!-- 5. 悬赏金额设置区 -->
      <view class="reward-section">
        <text class="reward-label">设置悬赏金额：</text>
        <view class="input-group">
          <input class="reward-input" type="digit" v-model="bountyAmount" placeholder="请输入金额" />
          <text class="unit">元</text>
        </view>
      </view>

      <!-- 6. 底部提交按钮 -->
      <button class="submit-btn" @tap="submitPublish" :disabled="submitting">{{ submitting ? '发布中...' : '确认发布' }}</button>
    </template>

    <!-- 宠物选择弹窗 -->
    <view class="modal-overlay" v-if="showPetModal" @tap="closePetModal">
      <view class="pet-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择宠物</text>
          <view class="close-btn" @tap="closePetModal">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <view class="pet-list">
          <view class="pet-list-item" v-for="pet in petList" :key="pet.id" @tap="selectPetItem(pet)">
            <image class="pet-list-avatar" :src="pet.avatarUrl || '/static/default-pet.png'" mode="aspectFill" />
            <view class="pet-list-info">
              <view class="pet-list-name-row">
                <text class="pet-list-name">{{ pet.name }}</text>
                <text class="pet-list-gender" :class="pet.gender === 1 ? 'male' : 'female'">{{ pet.gender === 1 ? '♂' : '♀' }}</text>
              </view>
              <text class="pet-list-type">{{ getPetTypeText(pet.petType) }} · {{ pet.breed }}</text>
            </view>
          </view>
        </view>
        <view class="add-pet-btn" @tap="addNewPet">
          <text>+ 添加宠物</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      showPetModal: false,
      loading: false,
      submitting: false,
      
      // 宠物相关
      petList: [],
      selectedPet: null,
      
      // 表单数据
      description: '',
      bountyAmount: '',
      location: {
        address: '',
        latitude: 23.076,
        longitude: 113.387
      },
      markers: [],
      
      // 图片列表（本地预览 + 服务器URL）
      imageList: [],
      uploadedImages: []
    }
  },
  onLoad() {
    this.loadPetList()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 工具方法 ==========
    getPetTypeText(type) {
      const map = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' }
      return map[type] || '宠物'
    },
    
    getPetIcon(type) {
      const map = { 'dog': '🐕', 'cat': '🐱', 'bird': '🐦', 'rabbit': '🐰', 'hamster': '🐹', 'other': '🐾' }
      return map[type] || '🐾'
    },
    
    // ========== 加载数据 ==========
    async loadPetList() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/pets/mine',
          method: 'GET'
        })
        // 只显示审核通过的宠物
        this.petList = (res || []).filter(pet => pet.auditStatus === 2)
      } catch (error) {
        console.error('加载宠物列表失败', error)
        this.useMockPetData()
      } finally {
        this.loading = false
      }
    },
    
    // 模拟数据
    useMockPetData() {
      this.petList = [
        { id: 1, name: '布丁', gender: 0, petType: 'bird', breed: '虎皮鹦鹉', avatarUrl: '/static/bird-avatar.jpg', auditStatus: 2 },
        { id: 2, name: '旺财', gender: 1, petType: 'dog', breed: '金毛', avatarUrl: '/static/pet2.jpg', auditStatus: 2 }
      ]
    },
    
    // ========== 宠物选择 ==========
    selectPet() {
      if (this.petList.length === 0) {
        uni.showModal({
          title: '提示',
          content: '暂无宠物档案，请先添加宠物',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/pet/add' })
            }
          }
        })
        return
      }
      this.showPetModal = true
    },
    
    closePetModal() {
      this.showPetModal = false
    },
    
    selectPetItem(pet) {
      this.selectedPet = pet
      this.closePetModal()
      uni.showToast({ title: `已选择${pet.name}`, icon: 'success' })
    },
    
    addNewPet() {
      this.closePetModal()
      uni.navigateTo({ url: '/pages/pet/add' })
    },
    
    // ========== 图片上传 ==========
    // 修改 addImage 方法中的上传逻辑
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
            }
          }
          
          uni.hideLoading()
          uni.showToast({ title: '上传成功', icon: 'success' })
        }
      })
    },
    
    // 修改 uploadImage 方法，添加 formData
    async uploadImage(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://localhost:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'lostpet' },  // ← 添加这一行
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
    
    deleteImage(index) {
      this.imageList.splice(index, 1)
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
          this.updateMarker()
        },
        fail: () => {
          uni.showToast({ title: '选择位置失败', icon: 'none' })
        }
      })
    },
    
    updateMarker() {
      if (this.location.latitude && this.location.longitude) {
        this.markers = [{
          id: 1,
          latitude: this.location.latitude,
          longitude: this.location.longitude,
          title: '丢失位置',
          callout: {
            content: this.location.address,
            color: '#D47836',
            fontSize: 14,
            borderRadius: 10,
            padding: 8,
            display: 'ALWAYS'
          }
        }]
      }
    },
    
    cancelLocation() {
      this.location = {
        address: '',
        latitude: 23.076,
        longitude: 113.387
      }
      this.markers = []
      uni.showToast({ title: '已取消标记', icon: 'none' })
    },
    
    // ========== 发布提交 ==========
    async submitPublish() {
      // 表单验证
      if (!this.selectedPet) {
        uni.showToast({ title: '请先选择宠物', icon: 'none' })
        return
      }
      
      if (this.imageList.length === 0) {
        uni.showToast({ title: '请上传宠物图片', icon: 'none' })
        return
      }
      
      if (!this.location.address) {
        uni.showToast({ title: '请标记丢失位置', icon: 'none' })
        return
      }
      
      if (!this.bountyAmount || parseFloat(this.bountyAmount) <= 0) {
        uni.showToast({ title: '请设置悬赏金额', icon: 'none' })
        return
      }
      
      if (!this.description.trim()) {
        uni.showToast({ title: '请填写补充描述', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '发布中...' })
      
      try {
        // 获取所有图片URL
        const photos = this.imageList.map(img => img.url || img)
        const userInfo = uni.getStorageSync('userInfo')
        
        const data = {
          petId: this.selectedPet.id,
          petName: this.selectedPet.name,
          petType: this.selectedPet.petType,
          breed: this.selectedPet.breed,
          gender: this.selectedPet.gender,
          sterilized: this.selectedPet.sterilized || false,
          vaccinated: this.selectedPet.vaccinated || false,
          lostLocation: this.location.address,
          latitude: this.location.latitude,
          longitude: this.location.longitude,
          lostDate: new Date().toISOString().split('T')[0],
          title: `寻${this.getPetTypeText(this.selectedPet.petType)} - ${this.selectedPet.name}`,
          description: this.description,
          photos: photos,
          contactPhone: userInfo?.phone || '',
          contactName: userInfo?.nickname || '',
          bountyAmount: parseFloat(this.bountyAmount)
        }
        
        await request({
          url: '/api/lost-pet/posts',
          method: 'POST',
          data: data
        })
        
        uni.hideLoading()
        uni.showToast({ title: '发布成功，等待审核', icon: 'success' })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('发布失败', error)
        uni.showToast({ title: error.message || '发布失败，请重试', icon: 'none' })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.pet-find-publish-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
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

/* 2. 宠物档案选择区 */
.pet-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  background-color: #fff;
  margin: 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.plus-icon {
  width: 60rpx;
  height: 60rpx;
  background-color: #FFC107;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 40rpx;
}
.btn-text {
  font-size: 30rpx;
  color: #D47836;
  font-weight: bold;
}

/* 已选宠物 */
.selected-pet {
  display: flex;
  align-items: center;
  gap: 15rpx;
  background-color: #FFF2D6;
  margin: -10rpx 20rpx 20rpx;
  padding: 15rpx;
  border-radius: 16rpx;
}
.selected-pet-avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background-color: #eee;
}
.selected-pet-info {
  flex: 1;
}
.selected-pet-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}
.selected-pet-type {
  font-size: 22rpx;
  color: #666;
}
.change-pet {
  font-size: 24rpx;
  color: #D47836;
  padding: 8rpx 16rpx;
  background-color: #fff;
  border-radius: 20rpx;
}

/* 3. 信息补充区 */
.info-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 25rpx;
}
.upload-images {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.upload-image-item {
  position: relative;
  width: 140rpx;
  height: 140rpx;
}
.upload-image {
  width: 100%;
  height: 100%;
  border-radius: 10rpx;
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
  width: 140rpx;
  height: 140rpx;
  border: 2rpx dashed #ccc;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.plus-icon-small {
  font-size: 40rpx;
  color: #999;
}
.upload-text {
  font-size: 22rpx;
  color: #999;
}
.desc-area {
  display: flex;
  flex-direction: column;
}
.desc-label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-bottom: 10rpx;
}
.desc-input {
  width: 100%;
  height: 160rpx;
  border: none;
  background-color: #FFF9E6;
  border-radius: 10rpx;
  padding: 15rpx;
  font-size: 26rpx;
}

/* 4. 标记地点区 */
.location-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-bottom: 20rpx;
}
.header-icon {
  font-size: 32rpx;
}
.header-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.location-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 20rpx;
}
.loc-icon {
  font-size: 28rpx;
}
.label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.address {
  font-size: 26rpx;
  color: #666;
}
.map-container {
  position: relative;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
}
.map-component {
  width: 100%;
  height: 300rpx;
}
.map-tip {
  position: absolute;
  bottom: 15rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  pointer-events: none;
}
.cancel-mark-btn {
  width: 100%;
  height: 70rpx;
  background-color: #fff;
  border: 1rpx solid #ccc;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #E53935;
}
.cancel-mark-btn::after {
  border: none;
}

/* 5. 悬赏金额设置区 */
.reward-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.reward-label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-bottom: 15rpx;
  display: block;
}
.input-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
  border-bottom: 1rpx solid #eee;
  padding-bottom: 10rpx;
}
.reward-input {
  flex: 1;
  height: 60rpx;
  text-align: right;
  font-size: 32rpx;
  font-weight: bold;
  color: #FF6600;
}
.unit {
  font-size: 28rpx;
  color: #D47836;
}

/* 6. 底部提交按钮 */
.submit-btn {
  width: 80%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 30rpx;
  margin: 0 auto;
  display: block;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.submit-btn::after {
  border: none;
}

/* 宠物选择弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.pet-modal {
  width: 80%;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx;
  border-bottom: 1rpx solid #eee;
}
.modal-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}
.close-icon {
  font-size: 36rpx;
  color: #999;
}
.pet-list {
  max-height: 500rpx;
  overflow-y: auto;
}
.pet-list-item {
  display: flex;
  align-items: center;
  padding: 15rpx 20rpx;
  gap: 15rpx;
  border-bottom: 1rpx solid #eee;
}
.pet-list-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #eee;
}
.pet-list-info {
  flex: 1;
}
.pet-list-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 4rpx;
}
.pet-list-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}
.pet-list-gender {
  font-size: 22rpx;
}
.pet-list-gender.male { color: #2196F3; }
.pet-list-gender.female { color: #E91E63; }
.pet-list-type {
  font-size: 22rpx;
  color: #666;
}
.add-pet-btn {
  text-align: center;
  padding: 20rpx;
  background-color: #FFF2D6;
  color: #D47836;
  font-size: 26rpx;
}
</style>