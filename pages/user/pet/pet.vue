<template>
  <view class="pet-list-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">我的宠物</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 添加宠物按钮 -->
    <view class="add-pet-btn" @tap="addPet">
      <view class="plus-icon">+</view>
      <text class="btn-text">添加宠物</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 3. 宠物列表 -->
    <view class="pet-list" v-else>
      <view class="pet-item" v-for="pet in petList" :key="pet.id">
        <view class="pet-avatar">
          <image 
            v-if="pet.avatarUrl" 
            class="avatar-img" 
            :src="pet.avatarUrl" 
            mode="aspectFill" 
          />
          <text v-else class="avatar-text">🐾</text>
        </view>
        <view class="pet-info">
          <view class="name-row">
            <text class="pet-name">{{ pet.name }}</text>
            <text class="gender-icon" :class="pet.gender === 1 ? 'male' : 'female'">
              {{ pet.gender === 1 ? '♂' : '♀' }}
            </text>
          </view>
          <view class="info-row">
            <text class="category-tag">{{ getPetTypeText(pet.petType) }}</text>
            <text class="breed-text">{{ pet.breed }}</text>
          </view>
          <view class="status-tag" :class="getAuditStatusClass(pet.auditStatus)">
            {{ getAuditStatusText(pet.auditStatus) }}
          </view>
        </view>
        <view class="action-icons">
          <view class="action-icon" @tap="editPet(pet)">
            <text class="edit-icon">✎</text>
          </view>
          <view class="action-icon" @tap="deletePet(pet)">
            <text class="delete-icon">🗑️</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && petList.length === 0">
      <text>暂无宠物，点击上方添加</text>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      petList: [],
      loading: false
    }
  },
  onShow() {
    this.loadPetList()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 工具方法 ==========
    getPetTypeText(type) {
      const typeMap = { 
        'dog': '狗狗', 
        'cat': '猫咪', 
        'bird': '鸟类', 
        'rabbit': '兔子', 
        'hamster': '仓鼠', 
        'other': '其他' 
      }
      return typeMap[type] || '宠物'
    },
    
    getAuditStatusText(status) {
      const statusMap = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return statusMap[status] || '审核中'
    },
    
    getAuditStatusClass(status) {
      if (status === 1) return 'status-pending'
      if (status === 2) return 'status-pass'
      if (status === 3) return 'status-reject'
      return ''
    },
    
    // ========== 数据加载 ==========
    async loadPetList() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/pets/mine',
          method: 'GET'
        })
        this.petList = res || []
      } catch (error) {
        console.error('加载宠物列表失败', error)
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 模拟数据
    useMockData() {
      this.petList = [
        { id: 1, name: '布丁', gender: 0, petType: 'bird', breed: '虎皮鹦鹉', avatarUrl: '', auditStatus: 2 },
        { id: 2, name: '旺财', gender: 1, petType: 'dog', breed: '金毛', avatarUrl: '', auditStatus: 2 },
        { id: 3, name: '咪咪', gender: 0, petType: 'cat', breed: '布偶猫', avatarUrl: '', auditStatus: 1 },
        { id: 4, name: '豆豆', gender: 1, petType: 'dog', breed: '柯基', avatarUrl: '', auditStatus: 2 }
      ]
    },
    
    // ========== 操作 ==========
    addPet() {
      uni.navigateTo({
        url: '/pages/pet/add'
      })
    },
    
    editPet(pet) {
      uni.navigateTo({
        url: `/pages/user/pet/edit?id=${pet.id}`
      })
    },
    
    async deletePet(pet) {
      uni.showModal({
        title: '提示',
        content: `确定删除宠物「${pet.name}」吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中...' })
            try {
              await request({
                url: `/api/pets/${pet.id}`,
                method: 'DELETE'
              })
              uni.hideLoading()
              uni.showToast({ title: '删除成功', icon: 'success' })
              // 刷新列表
              await this.loadPetList()
            } catch (error) {
              uni.hideLoading()
              console.error('删除失败', error)
              uni.showToast({ title: error.message || '删除失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.pet-list-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
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

/* 2. 添加宠物按钮 */
.add-pet-btn {
  display: flex;
  align-items: center;
  background-color: #fff;
  margin: 20rpx;
  padding: 20rpx 25rpx;
  border-radius: 16rpx;
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

/* 3. 宠物列表 */
.pet-list {
  margin: 0 20rpx;
}
.pet-item {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  margin-bottom: 20rpx;
}
.pet-avatar {
  width: 80rpx;
  height: 80rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-text {
  font-size: 40rpx;
}
.pet-info {
  flex: 1;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
}
.pet-name {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}
.gender-icon {
  font-size: 26rpx;
}
.gender-icon.male {
  color: #2196F3;
}
.gender-icon.female {
  color: #E91E63;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
}
.category-tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  display: inline-block;
}
.breed-text {
  font-size: 22rpx;
  color: #666;
}
.status-tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
  display: inline-block;
}
.status-pending {
  background-color: #FFF3E0;
  color: #FF9800;
}
.status-pass {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.status-reject {
  background-color: #FFEBEE;
  color: #F44336;
}
.action-icons {
  display: flex;
  gap: 25rpx;
}
.action-icon {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-icon {
  font-size: 32rpx;
  color: #999;
}
.delete-icon {
  font-size: 32rpx;
  color: #E53935;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}
</style>