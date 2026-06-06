<template>
  <view class="pet-edit-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">{{ isEditMode ? '编辑宠物档案' : '添加宠物档案' }}</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 表单卡片 -->
    <view class="form-card" v-else>
      <!-- 2. 宠物头像区 -->
      <view class="header-section">
        <text class="section-title">宠物档案</text>
        <view class="avatar-wrapper" @tap="uploadAvatar">
          <view class="pet-avatar">
            <image 
              v-if="avatarUrl" 
              class="avatar-img" 
              :src="avatarUrl" 
              mode="aspectFill" 
            />
            <text v-else class="avatar-text">🐾</text>
          </view>
          <view class="camera-icon">
            <text class="camera-text">📷</text>
          </view>
        </view>
      </view>

      <!-- 3. 基础信息表单 -->
      <view class="form-section">
        <view class="form-item row-item">
          <text class="label">昵称：</text>
          <input class="input-box" v-model="petForm.name" placeholder="请输入昵称" />
        </view>

        <!-- 性别 -->
        <view class="form-item row-item">
          <text class="label">性别：</text>
          <view class="radio-group">
            <label class="radio-item" @tap="petForm.gender = 0">
              <view class="custom-radio" :class="{ checked: petForm.gender === 0 }">
                <view class="radio-inner" v-if="petForm.gender === 0"></view>
              </view>
              <text class="gender-symbol female">♀</text>
            </label>
            <label class="radio-item" @tap="petForm.gender = 1">
              <view class="custom-radio" :class="{ checked: petForm.gender === 1 }">
                <view class="radio-inner" v-if="petForm.gender === 1"></view>
              </view>
              <text class="gender-symbol male">♂</text>
            </label>
          </view>
        </view>

        <view class="form-item row-item">
          <text class="label">类型：</text>
          <picker :range="petTypeOptions" @change="onPetTypeChange">
            <view class="picker-input">{{ petTypeOptions[petTypeIndex] || '请选择类型' }}</view>
          </picker>
        </view>

        <view class="form-item row-item">
          <text class="label">品种：</text>
          <input class="input-box" v-model="petForm.breed" placeholder="请输入品种" />
        </view>

        <view class="form-item row-item">
          <text class="label">出生日期：</text>
          <picker mode="date" :value="petForm.birthDate" @change="onBirthdayChange">
            <view class="picker-input">{{ petForm.birthDate || '请选择出生日期' }}</view>
          </picker>
        </view>

        <view class="form-item row-item">
          <text class="label">体重：</text>
          <view class="weight-group">
            <input class="input-box weight-input" type="digit" v-model="weightStr" placeholder="体重" />
            <text class="unit">kg</text>
          </view>
        </view>
      </view>

      <!-- 4. 健康信息表单 -->
      <view class="form-section">
        <view class="form-item row-item">
          <text class="label">健康状态：</text>
          <view class="radio-group-inline">
            <label class="radio-item" @tap="petForm.healthStatus = '疾病'">
              <view class="custom-radio" :class="{ checked: petForm.healthStatus === '疾病' }">
                <view class="radio-inner" v-if="petForm.healthStatus === '疾病'"></view>
              </view>
              <text>疾病</text>
            </label>
            <label class="radio-item" @tap="petForm.healthStatus = '良好'">
              <view class="custom-radio" :class="{ checked: petForm.healthStatus === '良好' }">
                <view class="radio-inner" v-if="petForm.healthStatus === '良好'"></view>
              </view>
              <text>良好</text>
            </label>
          </view>
        </view>

        <view class="form-item row-item">
          <text class="label">是否绝育：</text>
          <view class="radio-group-inline">
            <label class="radio-item" @tap="petForm.sterilized = true">
              <view class="custom-radio" :class="{ checked: petForm.sterilized === true }">
                <view class="radio-inner" v-if="petForm.sterilized === true"></view>
              </view>
              <text>是</text>
            </label>
            <label class="radio-item" @tap="petForm.sterilized = false">
              <view class="custom-radio" :class="{ checked: petForm.sterilized === false }">
                <view class="radio-inner" v-if="petForm.sterilized === false"></view>
              </view>
              <text>否</text>
            </label>
          </view>
        </view>

        <view class="form-item row-item">
          <text class="label">是否注射疫苗：</text>
          <view class="radio-group-inline">
            <label class="radio-item" @tap="petForm.vaccinated = true">
              <view class="custom-radio" :class="{ checked: petForm.vaccinated === true }">
                <view class="radio-inner" v-if="petForm.vaccinated === true"></view>
              </view>
              <text>是</text>
            </label>
            <label class="radio-item" @tap="petForm.vaccinated = false">
              <view class="custom-radio" :class="{ checked: petForm.vaccinated === false }">
                <view class="radio-inner" v-if="petForm.vaccinated === false"></view>
              </view>
              <text>否</text>
            </label>
          </view>
        </view>
      </view>

      <!-- 5. 宠物介绍文本域 -->
      <view class="form-item">
        <text class="label">宠物介绍：</text>
        <textarea class="textarea-box" v-model="petForm.description" placeholder="请输入宠物介绍" />
      </view>
    </view>

    <!-- 6. 底部提交按钮 -->
    <button class="submit-btn" @tap="savePet" :disabled="submitting">
      {{ submitting ? '保存中...' : '完成' }}
    </button>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      petId: null,
      loading: false,
      submitting: false,
      isEditMode: false,
      
      // 表单数据
      petForm: {
        name: '',
        gender: 0,
        petType: 'dog',
        breed: '',
        birthDate: '',
        weight: null,
        healthStatus: '良好',
        sterilized: false,
        vaccinated: false,
        description: '',
        avatarUrl: ''
      },
      
      // UI辅助
      weightStr: '',
      petTypeOptions: ['狗狗', '猫咪', '鸟类', '兔子', '仓鼠', '其他'],
      petTypeMap: { '狗狗': 'dog', '猫咪': 'cat', '鸟类': 'bird', '兔子': 'rabbit', '仓鼠': 'hamster', '其他': 'other' },
      petTypeReverseMap: { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': 'rabbit', 'hamster': '仓鼠', 'other': '其他' },
      petTypeIndex: 0,
      
      // 头像
      avatarUrl: '',
      uploadedAvatarUrl: '',
      avatarFile: null
    }
  },
  onLoad(options) {
    if (options.id) {
      // 有 id → 编辑模式
      this.petId = parseInt(options.id)
      this.isEditMode = true
      this.loadPetDetail()
    } else {
      // 没有 id → 新增模式
      this.petId = null
      this.isEditMode = false
      this.initEmptyForm()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 初始化空表单（新增模式）
    initEmptyForm() {
      this.petForm = {
        name: '',
        gender: 0,
        petType: 'dog',
        breed: '',
        birthDate: '',
        weight: null,
        healthStatus: '良好',
        sterilized: false,
        vaccinated: false,
        description: '',
        avatarUrl: ''
      }
      this.weightStr = ''
      this.avatarUrl = ''
      this.uploadedAvatarUrl = ''
      this.petTypeIndex = 0  // 默认狗狗
    },
    
    // ========== 数据加载 ==========
    async loadPetDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/pets/${this.petId}`,
          method: 'GET'
        })
        
        // 填充表单
        this.petForm = {
          name: res.name || '',
          gender: res.gender,
          petType: res.petType || 'dog',
          breed: res.breed || '',
          birthDate: res.birthDate || '',
          weight: res.weight,
          healthStatus: res.healthStatus || '良好',
          sterilized: res.sterilized,
          vaccinated: res.vaccinated,
          description: res.description || '',
          avatarUrl: res.avatarUrl || ''
        }
        
        this.weightStr = res.weight ? res.weight.toString() : ''
        this.avatarUrl = res.avatarUrl || ''
        this.uploadedAvatarUrl = res.avatarUrl || ''
        
        // 设置类型索引
        const typeName = this.petTypeReverseMap[res.petType] || '其他'
        const index = this.petTypeOptions.indexOf(typeName)
        this.petTypeIndex = index >= 0 ? index : 5  // 5 = 其他
        
      } catch (error) {
        console.error('加载宠物详情失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 模拟数据（仅用于测试）
    useMockData() {
      this.petForm = {
        name: '布丁',
        gender: 0,
        petType: 'bird',
        breed: '虎皮鹦鹉',
        birthDate: '2024-05-15',
        weight: 4.2,
        healthStatus: '良好',
        sterilized: true,
        vaccinated: true,
        description: '这是一只蓝白色的鹦鹉，性格温顺，喜欢与人互动。',
        avatarUrl: ''
      }
      this.weightStr = '4.2'
      this.petTypeIndex = 2 // 鸟类
    },
    
    // ========== 表单事件 ==========
    onBirthdayChange(e) {
      this.petForm.birthDate = e.detail.value
    },
    
    onPetTypeChange(e) {
      this.petTypeIndex = parseInt(e.detail.value)
      const typeName = this.petTypeOptions[this.petTypeIndex]
      this.petForm.petType = this.petTypeMap[typeName]
    },
    
    // ========== 头像上传 ==========
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
            this.avatarUrl = this.petForm.avatarUrl
          }
        }
      })
    },
    
    async uploadToServer(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://192.168.129.49:8080/api/upload',
          filePath: filePath,
          name: 'file',
          formData: { category: 'pet' },
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
    
    // ========== 保存宠物 ==========
    async savePet() {
      // 表单验证
      if (!this.petForm.name || !this.petForm.name.trim()) {
        uni.showToast({ title: '请输入昵称', icon: 'none' })
        return
      }
      
      if (!this.petForm.breed || !this.petForm.breed.trim()) {
        uni.showToast({ title: '请输入品种', icon: 'none' })
        return
      }
      
      if (!this.petForm.birthDate) {
        uni.showToast({ title: '请选择出生日期', icon: 'none' })
        return
      }
      
      if (!this.weightStr || parseFloat(this.weightStr) <= 0) {
        uni.showToast({ title: '请输入有效体重', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '保存中...' })
      
      try {
        const data = {
          name: this.petForm.name.trim(),
          gender: this.petForm.gender,
          petType: this.petForm.petType,
          breed: this.petForm.breed.trim(),
          birthDate: this.petForm.birthDate,
          weight: parseFloat(this.weightStr) || 0,
          healthStatus: this.petForm.healthStatus,
          sterilized: this.petForm.sterilized,
          vaccinated: this.petForm.vaccinated,
          description: this.petForm.description || '',
          avatarUrl: this.uploadedAvatarUrl
        }
        
        let url, method
        if (this.petId) {
          // 编辑模式：PUT /api/pets/{id}
          url = `/api/pets/${this.petId}`
          method = 'PUT'
        } else {
          // 新增模式：POST /api/pets
          url = `/api/pets`
          method = 'POST'
        }
        
        await request({
          url: url,
          method: method,
          data: data
        })
        
        uni.hideLoading()
        uni.showToast({ 
          title: this.petId ? '保存成功，等待审核' : '添加成功，等待审核', 
          icon: 'success' 
        })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('保存失败', error)
        uni.showToast({ title: error.message || '保存失败', icon: 'none' })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.pet-edit-page {
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

/* 表单卡片 */
.form-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

/* 2. 宠物头像区 */
.header-section {
  text-align: center;
  margin-bottom: 40rpx;
}
.section-title {
  font-size: 32rpx;
  color: #D47836;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}
.avatar-wrapper {
  position: relative;
  display: inline-block;
}
.pet-avatar {
  width: 120rpx;
  height: 120rpx;
  background-color: #FFF2CC;
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
.avatar-text {
  font-size: 56rpx;
}
.camera-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(0,0,0,0.5);
  border-radius: 50%;
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.camera-text {
  font-size: 20rpx;
  color: #fff;
}

/* 表单项 */
.form-section {
  margin-bottom: 30rpx;
  border-bottom: 1rpx solid #eee;
  padding-bottom: 20rpx;
}
.form-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.form-item {
  margin-bottom: 25rpx;
}
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
.label {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 15rpx;
}
.input-box {
  flex: 1;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 26rpx;
  background-color: #f9f9f9;
}
.picker-input {
  flex: 1;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 26rpx;
  background-color: #f9f9f9;
}

/* 体重输入 */
.weight-group {
  display: flex;
  align-items: center;
  flex: 1;
}
.weight-input {
  flex: 1;
  margin-right: 15rpx;
}
.unit {
  font-size: 26rpx;
  color: #666;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 40rpx;
}
.radio-group-inline {
  display: flex;
  gap: 40rpx;
  flex: 1;
}
.radio-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: #333;
}
.custom-radio {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.custom-radio.checked {
  border-color: #D47836;
}
.radio-inner {
  width: 20rpx;
  height: 20rpx;
  background-color: #D47836;
  border-radius: 50%;
}
.gender-symbol {
  font-size: 32rpx;
}
.gender-symbol.male {
  color: #2196F3;
}
.gender-symbol.female {
  color: #E91E63;
}

/* 宠物介绍文本域 */
.textarea-box {
  width: 100%;
  height: 150rpx;
  background-color: #E8F5E0;
  border: none;
  border-radius: 10rpx;
  padding: 15rpx;
  font-size: 26rpx;
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
  font-weight: bold;
  margin: 40rpx auto;
  display: block;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.submit-btn::after {
  border: none;
}
</style>