<template>
  <view class="pet-board-publish-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">托管信息发布</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 2. 基础信息选择区 -->
      <view class="select-btns">
        <view class="pet-select-btn" @tap="togglePetList">
          <view class="plus-icon">+</view>
          <text class="btn-text">选择宠物档案</text>
          <text class="arrow-icon">{{ showPetList ? '▲' : '▼' }}</text>
        </view>

        <!-- 托管类型选择 -->
        <view class="foster-type-select">
          <text class="type-label">托管类型：</text>
          <view class="type-group">
            <view 
              class="type-item" 
              :class="{ active: fosterType === 'boarding' }"
              @tap="fosterType = 'boarding'"
            >
              <text>寄养</text>
            </view>
            <view 
              class="type-item" 
              :class="{ active: fosterType === 'feeding' }"
              @tap="fosterType = 'feeding'"
            >
              <text>上门喂养</text>
            </view>
            <view 
              class="type-item" 
              :class="{ active: fosterType === 'walking' }"
              @tap="fosterType = 'walking'"
            >
              <text>遛狗</text>
            </view>
          </view>
        </view>

        <view class="truster-select-btn" @tap="goToTrusteeList">
          <view class="plus-icon">+</view>
          <text class="btn-text">指定托管人</text>
        </view>
      </view>

      <!-- 宠物档案下拉列表 -->
      <transition name="slide-down">
        <view class="pet-dropdown" v-if="showPetList">
          <view class="pet-dropdown-header">
            <text class="dropdown-title">选择宠物</text>
          </view>
          <scroll-view class="pet-dropdown-scroll" scroll-y>
            <view class="pet-dropdown-item" v-for="pet in petList" :key="pet.id" @tap="selectPetItem(pet)">
              <view class="pet-avatar"><text>🐾</text></view>
              <view class="pet-info">
                <text class="pet-name">{{ pet.name }}</text>
                <text class="pet-gender" :class="pet.gender === 1 ? 'male' : 'female'">{{ pet.gender === 1 ? '♂' : '♀' }}</text>
              </view>
              <view class="pet-tag">{{ getPetTypeText(pet.petType) }}</view>
            </view>
          </scroll-view>
        </view>
      </transition>

      <!-- 已选宠物信息 -->
      <view class="selected-pet" v-if="selectedPet">
        <view class="selected-pet-avatar"><text>🐾</text></view>
        <view class="selected-pet-info">
          <text class="selected-pet-name">{{ selectedPet.name }}</text>
          <text class="selected-pet-type">{{ getPetTypeText(selectedPet.petType) }} · {{ selectedPet.breed }}</text>
        </view>
        <view class="change-pet" @tap="togglePetList">更换</view>
      </view>

      <!-- 3. 任务补充区 -->
      <view class="info-section">
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

        <view class="note-area">
          <view class="note-header">
            <text class="note-icon">📋</text>
            <text class="note-label">任务备注：</text>
          </view>
          <textarea class="note-input" v-model="description" placeholder="请补充描述任务内容（如遛狗时间、喂养要求等）" />
        </view>
      </view>

      <!-- 4. 服务时间 -->
      <view class="order-section">
        <view class="section-header" @tap="showDatePicker">
          <text class="header-title">服务时间</text>
          <text class="date-value">{{ startDate }} 至 {{ endDate }}</text>
          <text class="arrow-icon">▼</text>
        </view>
      </view>

      <!-- 5. 标记地点区 -->
      <view class="location-section">
        <view class="section-header">
          <text class="header-icon">📍</text>
          <text class="header-title">标记地点</text>
        </view>

        <view class="location-info">
          <text class="loc-icon">📍</text>
          <text class="label">任务位置：</text>
          <text class="address">{{ location.address || '点击地图选择位置' }}</text>
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
      </view>

      <!-- 6. 酬金设置区 -->
      <view class="reward-section">
        <text class="reward-label">设置酬金：</text>
        <view class="input-group">
          <input class="reward-input" type="digit" v-model="dailyPrice" placeholder="请输入酬金" />
          <text class="unit">元/天</text>
        </view>
      </view>

      <!-- 7. 底部提交按钮 -->
      <button class="submit-btn" @tap="submitPublish" :disabled="submitting">
        {{ submitting ? '发布中...' : '确认发布' }}
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
      showPetList: false,
      
      // 表单数据
      selectedPet: null,
      fosterType: 'boarding',  // boarding, feeding, walking
      assignedTrusteeId: null,
      description: '',
      startDate: '',
      endDate: '',
      dailyPrice: '',
      
      // 位置
      location: {
        address: '',
        latitude: null,
        longitude: null
      },
      markers: [],
      
      // 图片
      imageList: [],
      uploadedImages: [],
      
      // 宠物列表
      petList: []
    }
  },
  onLoad() {
    this.initDates()
    this.loadPetList()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    initDates() {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      this.startDate = this.formatDate(today)
      this.endDate = this.formatDate(tomorrow)
    },
    
    formatDate(date) {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    },
    
    // ========== 工具方法 ==========
    getPetTypeText(type) {
      const map = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' }
      return map[type] || '宠物'
    },
    
    getFosterTypeText() {
      const map = { 'boarding': '寄养', 'feeding': '上门喂养', 'walking': '遛狗' }
      return map[this.fosterType] || '寄养'
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
    
    useMockPetData() {
      this.petList = [
        { id: 1, name: '布丁', gender: 0, petType: 'bird', breed: '虎皮鹦鹉', auditStatus: 2 },
        { id: 2, name: '旺财', gender: 1, petType: 'dog', breed: '金毛', auditStatus: 2 }
      ]
    },
    
    // ========== 宠物选择 ==========
    togglePetList() {
      this.showPetList = !this.showPetList
    },
    
    selectPetItem(pet) {
      this.selectedPet = pet
      this.showPetList = false
      uni.showToast({ title: `已选择 ${pet.name}`, icon: 'success' })
    },
    
    goToTrusteeList() {
      uni.navigateTo({
        url: '/pages/trustee/select',
        events: {
          selectTrustee: (data) => {
            this.assignedTrusteeId = data.id
            uni.showToast({ title: `已指定托管人`, icon: 'success' })
          }
        }
      })
    },
    
    // ========== 日期选择 ==========
    showDatePicker() {
      // 简化处理，实际应使用日期选择器组件
      uni.showModal({
        title: '选择服务时间',
        content: '请使用日期选择器',
        success: () => {}
      })
    },
    
    // ========== 图片上传 ==========
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
    
    // 修改 uploadImage 方法
    async uploadImage(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://localhost:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'foster' },  // ← 添加这一行
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
          title: '任务位置',
          callout: {
            content: this.location.address,
            color: '#D47836',
            fontSize: 14,
            display: 'ALWAYS'
          }
        }]
      }
    },
    
    // ========== 提交发布 ==========
    async submitPublish() {
      // 表单验证
      if (!this.selectedPet) {
        uni.showToast({ title: '请选择宠物', icon: 'none' })
        return
      }
      
      if (!this.description.trim()) {
        uni.showToast({ title: '请填写任务备注', icon: 'none' })
        return
      }
      
      if (!this.location.address) {
        uni.showToast({ title: '请标记任务位置', icon: 'none' })
        return
      }
      
      if (!this.dailyPrice || parseFloat(this.dailyPrice) <= 0) {
        uni.showToast({ title: '请设置酬金', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '发布中...' })
      
      try {
        const userInfo = uni.getStorageSync('userInfo')
        const photos = this.imageList.map(img => img.url || img)
        
        const data = {
          petId: this.selectedPet.id,
          petName: this.selectedPet.name,
          petType: this.selectedPet.petType,
          breed: this.selectedPet.breed,
          gender: this.selectedPet.gender,
          sterilized: this.selectedPet.sterilized || false,
          vaccinated: this.selectedPet.vaccinated || false,
          fosterType: this.fosterType,
          startDate: this.startDate,
          endDate: this.endDate,
          location: this.location.address,
          latitude: this.location.latitude,
          longitude: this.location.longitude,
          title: `${this.getFosterTypeText()} - ${this.selectedPet.name}`,
          description: this.description,
          photos: photos,
          dailyPrice: parseFloat(this.dailyPrice),
          contactPhone: userInfo?.phone || '',
          contactName: userInfo?.nickname || ''
        }
        
        // 如果指定了托管人
        if (this.assignedTrusteeId) {
          data.assignedTrusteeId = this.assignedTrusteeId
        }
        
        await request({
          url: '/api/foster/orders',
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
.pet-board-publish-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
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

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 选择按钮区 */
.select-btns {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin: 20rpx;
}
.pet-select-btn, .truster-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  background-color: #fff;
  padding: 20rpx;
  border-radius: 16rpx;
  position: relative;
}
.pet-select-btn .arrow-icon {
  position: absolute;
  right: 30rpx;
  font-size: 28rpx;
  color: #D47836;
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

/* 托管类型选择 */
.foster-type-select {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 16rpx;
}
.type-label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-right: 20rpx;
}
.type-group {
  display: flex;
  gap: 15rpx;
  margin-top: 15rpx;
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

/* 宠物下拉列表 */
.pet-dropdown {
  background-color: #fff;
  margin: -10rpx 20rpx 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.pet-dropdown-header {
  padding: 15rpx 20rpx;
  background-color: #FFF2D6;
  border-bottom: 1rpx solid #eee;
}
.dropdown-title {
  font-size: 26rpx;
  color: #D47836;
  font-weight: bold;
}
.pet-dropdown-scroll {
  max-height: 400rpx;
}
.pet-dropdown-item {
  display: flex;
  align-items: center;
  padding: 15rpx 20rpx;
  gap: 15rpx;
  border-bottom: 1rpx solid #eee;
}
.pet-avatar {
  width: 70rpx;
  height: 70rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}
.pet-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.pet-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.pet-gender {
  font-size: 24rpx;
}
.pet-gender.male { color: #2196F3; }
.pet-gender.female { color: #E91E63; }
.pet-tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 5rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  white-space: nowrap;
}

/* 滑动动画 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter, .slide-down-leave-to {
  transform: translateY(-20rpx);
  opacity: 0;
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
  background-color: #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
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

/* 信息补充区 */
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
.note-area {
  display: flex;
  flex-direction: column;
}
.note-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
}
.note-icon {
  font-size: 30rpx;
}
.note-label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.note-input {
  width: 100%;
  height: 160rpx;
  border: 1rpx solid #eee;
  background-color: #fff;
  border-radius: 10rpx;
  padding: 15rpx;
  font-size: 26rpx;
}

/* 服务时间 */
.order-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.date-value {
  font-size: 26rpx;
  color: #666;
}
.arrow-icon {
  font-size: 28rpx;
  color: #D47836;
}

/* 位置区 */
.location-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.location-section .section-header {
  justify-content: center;
  margin-bottom: 20rpx;
}
.header-icon {
  font-size: 32rpx;
  margin-right: 10rpx;
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
  flex: 1;
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

/* 酬金区 */
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
  background-color: #fff;
  border: none;
}
.unit {
  font-size: 28rpx;
  color: #D47836;
}

/* 提交按钮 */
.submit-btn {
  width: 80%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 30rpx;
  margin: 20rpx auto;
  display: block;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.submit-btn::after {
  border: none;
}
</style>