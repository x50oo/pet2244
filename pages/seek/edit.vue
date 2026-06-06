<template>
  <view class="edit-lost-pet-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">修改寻宠信息</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 2. 切换宠物档案按钮 -->
      <view class="card-btn" @tap="switchPet">
        <view class="plus-icon">+</view>
        <text class="btn-text">切换宠物档案</text>
      </view>

      <!-- 3. 宠物档案卡片 -->
      <view class="info-card">
        <view class="pet-archive">
          <view class="pet-avatar"><text>{{ getPetIcon(selectedPet.petType) }}</text></view>
          <view class="pet-info">
            <text class="pet-title">宠物档案</text>
            <view class="pet-name-row">
              <text class="pet-name">{{ selectedPet.name }}</text>
              <text class="gender-icon" :class="selectedPet.gender === 1 ? 'male' : 'female'">{{ selectedPet.gender === 1 ? '♂' : '♀' }}</text>
            </view>
            <view class="pet-tags">
              <text class="tag">{{ getPetTypeText(selectedPet.petType) }}</text>
              <text class="tag">{{ selectedPet.breed }}</text>
            </view>
          </view>
        </view>
        <view class="expand-btn" @tap="toggleExpand">
          <text>{{ isExpanded ? '收起 ▲' : '展开 ▼' }}</text>
        </view>

        <!-- 展开后的详细信息 -->
        <view class="expanded-info" v-if="isExpanded">
          <view class="info-item">
            <text class="label">出生日期：</text>
            <text class="value">{{ selectedPet.birthDate || '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="label">健康状态：</text>
            <text class="value">{{ selectedPet.healthStatus || '良好' }}</text>
          </view>
          <view class="info-item">
            <text class="label">体重：</text>
            <text class="value">{{ selectedPet.weight ? selectedPet.weight + 'kg' : '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="label">是否绝育：</text>
            <text class="value">{{ selectedPet.sterilized ? '是' : '否' }}</text>
          </view>
          <view class="info-item">
            <text class="label">是否注射疫苗：</text>
            <text class="value">{{ selectedPet.vaccinated ? '是' : '否' }}</text>
          </view>
          <view class="info-item">
            <text class="label">宠物介绍：</text>
            <view class="intro-box">
              <text>{{ selectedPet.description || '暂无介绍' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 4. 图片上传区 -->
      <view class="upload-area">
        <view class="add-img-btn" @tap="addImage">
          <text class="plus-icon-big">+</text>
          <text class="add-text">添加图片</text>
        </view>
        <view class="image-list" v-if="imageList.length > 0">
          <view class="image-item" v-for="(img, index) in imageList" :key="index">
            <image class="uploaded-img" :src="img.url || img" mode="aspectFill" />
            <view class="delete-img" @tap.stop="deleteImage(index)">✕</view>
          </view>
        </view>
      </view>

      <!-- 5. 补充描述文本域 -->
      <view class="desc-section">
        <text class="section-title">补充描述：</text>
        <textarea class="desc-textarea" v-model="formData.description" placeholder="请补充描述寻宠内容" />
      </view>

      <!-- 6. 标记地点卡片（带实时地图） -->
      <view class="location-card">
        <view class="mark-btn" @tap="chooseLocation">
          <text class="mark-icon">📍</text>
          <text class="mark-text">标记地点</text>
        </view>

        <view class="map-container">
          <map
            class="map-component"
            :latitude="location.latitude"
            :longitude="location.longitude"
            :scale="15"
            :markers="markers"
            :show-location="true"
            @tap="chooseLocation"
          ></map>
          <view class="map-tip">点击地图选择位置</view>
        </view>

        <view class="location-info" v-if="location.address">
          <text class="loc-icon">📍</text>
          <text class="label">选中位置：</text>
          <text class="address">{{ location.address }}</text>
        </view>

        <button class="cancel-btn" @tap="cancelLocation" v-if="location.address">取消标记</button>
      </view>

      <!-- 7. 悬赏金额设置 -->
      <view class="reward-section">
        <text class="section-title">设置悬赏金额：</text>
        <view class="reward-input">
          <input class="input" type="digit" v-model="formData.bountyAmount" placeholder="请输入金额" />
          <text class="unit">元</text>
        </view>
      </view>

      <!-- 8. 底部提交按钮 -->
      <button class="submit-btn" @tap="submitForm" :disabled="submitting">{{ submitting ? '提交中...' : '确认修改' }}</button>
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
          <view class="pet-list-item" v-for="pet in petList" :key="pet.id" @tap="selectPet(pet)">
            <view class="pet-list-avatar"><text>{{ getPetIcon(pet.petType) }}</text></view>
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
      postId: null,
      loading: false,
      submitting: false,
      isExpanded: false,
      showPetModal: false,
      
      // 宠物列表
      petList: [],
      selectedPet: null,
      
      // 表单数据
      formData: {
        description: '',
        bountyAmount: '',
        lostLocation: '',
        latitude: null,
        longitude: null,
        photos: []
      },
      
      // 图片列表（本地预览 + 服务器URL）
      imageList: [],
      
      // 位置信息
      location: {
        address: '',
        latitude: null,
        longitude: null
      },
      
      markers: [],
      
      // 已上传的图片URL列表
      uploadedImages: []
    }
  },
  onLoad(options) {
    if (options.id) {
      this.postId = parseInt(options.id)
      this.loadData()
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
    }
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
    
    // ========== 数据加载 ==========
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadPostDetail(),
          this.loadPetList()
        ])
      } catch (error) {
        console.error('加载数据失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    async loadPostDetail() {
      const res = await request({
        url: `/api/lost-pet/posts/${this.postId}`,
        method: 'GET'
      })
      
      this.formData = {
        description: res.description || '',
        bountyAmount: res.bountyAmount || '',
        lostLocation: res.lostLocation,
        latitude: res.latitude,
        longitude: res.longitude,
        photos: res.photos || []
      }
      
      // 设置图片列表
      this.imageList = (res.photos || []).map(url => ({ url, isRemote: true }))
      this.uploadedImages = [...(res.photos || [])]
      
      // 设置位置
      if (res.latitude && res.longitude) {
        this.location = {
          address: res.lostLocation,
          latitude: res.latitude,
          longitude: res.longitude
        }
        this.updateMarker()
      }
      
      // 设置选中的宠物
      if (res.petId) {
        // 宠物详情将在宠物列表加载后匹配
      }
    },
    
    async loadPetList() {
      const res = await request({
        url: '/api/pets/mine',
        method: 'GET'
      })
      this.petList = res || []
      
      // 如果有宠物，默认选中第一个
      if (this.petList.length > 0 && !this.selectedPet) {
        this.selectedPet = this.petList[0]
      }
    },
    
    // 模拟数据
    useMockData() {
      this.petList = [
        { id: 1, name: '布丁', gender: 0, petType: 'bird', breed: '虎皮鹦鹉', birthDate: '2024-05-15', healthStatus: '良好', weight: 4.2, sterilized: true, vaccinated: true, description: '蓝白色鹦鹉，性格温顺' },
        { id: 2, name: '旺财', gender: 1, petType: 'dog', breed: '金毛', birthDate: '2023-01-15', healthStatus: '健康', weight: 28, sterilized: false, vaccinated: true, description: '性格温顺的金毛' }
      ]
      this.selectedPet = this.petList[0]
      
      this.formData = {
        description: '4.9号晚上17：35从厂内二食堂二楼飞出，蓝白色羽毛，脚上有红色脚环。',
        bountyAmount: 150,
        lostLocation: '广东外语外贸大学',
        latitude: 23.076,
        longitude: 113.387,
        photos: ['/static/parrot.jpg']
      }
      
      this.imageList = [{ url: '/static/parrot.jpg', isRemote: true }]
      this.uploadedImages = ['/static/parrot.jpg']
      this.location = { address: '广东外语外贸大学', latitude: 23.076, longitude: 113.387 }
      this.updateMarker()
    },
    
    // ========== 宠物选择 ==========
    switchPet() {
      this.showPetModal = true
    },
    
    closePetModal() {
      this.showPetModal = false
    },
    
    selectPet(pet) {
      this.selectedPet = pet
      this.closePetModal()
      uni.showToast({ title: `已切换到${pet.name}`, icon: 'success' })
    },
    
    addNewPet() {
      this.closePetModal()
      uni.navigateTo({ url: '/pages/pet/add' })
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
              this.imageList.push({ url: uploadedUrl, isRemote: false })
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
      // 如果删除的是已上传的图片，需要从uploadedImages中移除
      // 注意：这里简化处理，提交时会重新构建图片列表
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
          this.formData.lostLocation = this.location.address
          this.formData.latitude = this.location.latitude
          this.formData.longitude = this.location.longitude
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
      this.location = { address: '', latitude: null, longitude: null }
      this.formData.lostLocation = ''
      this.formData.latitude = null
      this.formData.longitude = null
      this.markers = []
      uni.showToast({ title: '已清除位置', icon: 'none' })
    },
    
    // ========== 提交表单 ==========
    async submitForm() {
      // 表单验证
      if (!this.selectedPet) {
        uni.showToast({ title: '请选择宠物', icon: 'none' })
        return
      }
      
      if (!this.formData.description) {
        uni.showToast({ title: '请填写补充描述', icon: 'none' })
        return
      }
      
      if (!this.formData.lostLocation) {
        uni.showToast({ title: '请标记丢失位置', icon: 'none' })
        return
      }
      
      if (!this.formData.bountyAmount || this.formData.bountyAmount <= 0) {
        uni.showToast({ title: '请设置悬赏金额', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '提交中...' })
      
      try {
        // 获取所有图片URL
        const photos = this.imageList.map(img => img.url || img)
        
        const data = {
          petId: this.selectedPet.id,
          petName: this.selectedPet.name,
          petType: this.selectedPet.petType,
          breed: this.selectedPet.breed,
          gender: this.selectedPet.gender,
          sterilized: this.selectedPet.sterilized,
          vaccinated: this.selectedPet.vaccinated,
          lostLocation: this.formData.lostLocation,
          latitude: this.formData.latitude,
          longitude: this.formData.longitude,
          lostDate: new Date().toISOString().split('T')[0],
          title: `寻${this.getPetTypeText(this.selectedPet.petType)} - ${this.selectedPet.name}`,
          description: this.formData.description,
          photos: photos,
          contactPhone: uni.getStorageSync('userInfo')?.phone || '',
          contactName: uni.getStorageSync('userInfo')?.nickname || '',
          bountyAmount: parseFloat(this.formData.bountyAmount)
        }
        
        await request({
          url: `/api/lost-pet/posts/${this.postId}`,
          method: 'PUT',
          data: data
        })
        
        uni.hideLoading()
        uni.showToast({ title: '修改成功，等待审核', icon: 'success' })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交失败', error)
        uni.showToast({ title: error.message || '修改失败，请重试', icon: 'none' })
      } finally {
        this.submitting = false
      }
    },
    
    toggleExpand() {
      this.isExpanded = !this.isExpanded
    }
  }
}
</script>

<style scoped>
.edit-lost-pet-page {
  min-height: 100vh;
  background-color: #f5f5f5;
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

/* 2. 切换宠物档案按钮 */
.card-btn {
  background-color: #fff;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
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
  font-size: 36rpx;
  margin-right: 20rpx;
}
.btn-text {
  font-size: 30rpx;
  color: #D47836;
  font-weight: bold;
}

/* 3. 宠物档案卡片 */
.info-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.pet-archive {
  display: flex;
  align-items: center;
}
.pet-avatar {
  width: 100rpx;
  height: 100rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 44rpx;
}
.pet-info {
  flex: 1;
}
.pet-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.pet-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}
.pet-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.gender-icon {
  font-size: 24rpx;
}
.gender-icon.male { color: #2196F3; }
.gender-icon.female { color: #E91E63; }
.pet-tags {
  display: flex;
  gap: 12rpx;
}
.tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}
.expand-btn {
  text-align: center;
  margin-top: 20rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #eee;
}
.expand-btn text {
  font-size: 26rpx;
  color: #D47836;
}

/* 展开后的详细信息 */
.expanded-info {
  margin-top: 20rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #eee;
}
.info-item {
  margin-bottom: 15rpx;
}
.info-item .label {
  font-size: 26rpx;
  color: #666;
  width: 160rpx;
  display: inline-block;
}
.info-item .value {
  font-size: 26rpx;
  color: #333;
}
.intro-box {
  background-color: #E8F5E0;
  padding: 15rpx;
  border-radius: 10rpx;
  margin-top: 8rpx;
}
.intro-box text {
  font-size: 24rpx;
  color: #333;
  line-height: 1.5;
}

/* 4. 图片上传区 */
.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  padding: 0 20rpx 20rpx;
}
.add-img-btn {
  width: 120rpx;
  height: 120rpx;
  background-color: #f9f9f9;
  border: 1rpx dashed #ccc;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.plus-icon-big {
  font-size: 40rpx;
  color: #999;
}
.add-text {
  font-size: 22rpx;
  color: #999;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.image-item {
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
.delete-img {
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

/* 5. 补充描述文本域 */
.desc-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.section-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-bottom: 15rpx;
  display: block;
}
.desc-textarea {
  width: 100%;
  min-height: 120rpx;
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  padding: 10rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
}

/* 6. 标记地点卡片 */
.location-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.mark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-bottom: 20rpx;
  padding: 12rpx;
  background-color: #FFF2D6;
  border-radius: 40rpx;
}
.mark-icon {
  font-size: 28rpx;
}
.mark-text {
  font-size: 28rpx;
  color: #D47836;
}
.map-container {
  position: relative;
  width: 100%;
  height: 350rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
}
.map-component {
  width: 100%;
  height: 100%;
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
.location-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 15rpx;
  padding: 15rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}
.loc-icon {
  font-size: 26rpx;
}
.label {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.address {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}
.cancel-btn {
  width: 100%;
  background-color: #fff;
  color: #E53935;
  border: 1rpx solid #E53935;
  border-radius: 30rpx;
  padding: 12rpx;
  font-size: 26rpx;
  margin-top: 15rpx;
}
.cancel-btn::after {
  border: none;
}

/* 7. 悬赏金额设置 */
.reward-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.reward-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-bottom: 1rpx solid #eee;
  padding-bottom: 10rpx;
}
.input {
  font-size: 36rpx;
  color: #FF6600;
  font-weight: bold;
  text-align: center;
  width: 150rpx;
}
.unit {
  font-size: 30rpx;
  color: #D47836;
}

/* 8. 底部提交按钮 */
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
  margin: 20px auto;
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
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
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