<template>
  <view class="pet-archive-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">宠物档案审核</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 宠物档案卡片 -->
    <view class="form-card" v-if="petInfo">
      <!-- 卡片头部 -->
      <view class="card-header">
        <text class="card-title">宠物档案</text>
        <image class="pet-avatar" :src="petInfo.avatarUrl || '/static/default-avatar.png'" mode="aspectFill" @tap="previewImage(petInfo.avatarUrl)" />
      </view>

      <!-- 昵称 -->
      <view class="form-item row-item">
        <text class="label">昵称：</text>
        <input class="input" v-model="petInfo.name" placeholder="请输入昵称" disabled />
      </view>

      <!-- 性别 -->
      <view class="form-item row-item">
        <text class="label">性别：</text>
        <view class="gender-group">
          <view class="radio-circle" :class="{ active: petInfo.gender === 1 }" @tap="petInfo.gender = 1"></view>
          <text class="gender-symbol male">♂</text>
          <view class="radio-circle" :class="{ active: petInfo.gender === 0 }" @tap="petInfo.gender = 0"></view>
          <text class="gender-symbol female">♀</text>
        </view>
        <text class="gender-value">{{ petInfo.gender === 1 ? '公' : petInfo.gender === 0 ? '母' : '未知' }}</text>
      </view>

      <!-- 类型 -->
      <view class="form-item row-item">
        <text class="label">类型：</text>
        <input class="input" v-model="petTypeText" placeholder="请输入类型" disabled />
      </view>

      <!-- 品种 -->
      <view class="form-item row-item">
        <text class="label">品种：</text>
        <input class="input" v-model="petInfo.breed" placeholder="请输入品种" disabled />
      </view>

      <!-- 出生日期 -->
      <view class="form-item row-item">
        <text class="label">出生日期：</text>
        <text class="value-text">{{ petInfo.birthDate || '未填写' }}</text>
      </view>

      <!-- 体重 -->
      <view class="form-item row-item">
        <text class="label">体重：</text>
        <text class="value-text">{{ petInfo.weight }} kg</text>
      </view>

      <!-- 健康状态 -->
      <view class="form-item">
        <text class="label">健康状态：</text>
        <text class="value-text">{{ petInfo.healthStatus || '未填写' }}</text>
      </view>

      <!-- 是否绝育 -->
      <view class="form-item">
        <text class="label">是否绝育：</text>
        <text class="value-text">{{ petInfo.sterilized ? '是' : '否' }}</text>
      </view>

      <!-- 是否注射疫苗 -->
      <view class="form-item">
        <text class="label">是否注射疫苗：</text>
        <text class="value-text">{{ petInfo.vaccinated ? '是' : '否' }}</text>
      </view>

      <!-- 宠物介绍 -->
      <view class="form-item">
        <text class="label">宠物介绍：</text>
        <text class="value-textarea">{{ petInfo.description || '未填写' }}</text>
      </view>

      <!-- 审核状态 -->
      <view class="form-item">
        <text class="label">审核状态：</text>
        <text class="status-text" :class="auditStatusClass">{{ auditStatusText }}</text>
      </view>
    </view>

    <view class="loading-tip" v-else-if="!loading">
      <text>暂无待审核宠物档案</text>
    </view>
    <view class="loading-tip" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 3. 底部操作栏 -->
    <view class="bottom-bar" v-if="petInfo && petInfo.auditStatus === 1">
      <view class="two-btns">
        <button class="action-btn reject" @tap="rejectAudit">驳回</button>
        <button class="action-btn pass" @tap="approveAudit">通过</button>
      </view>
      <button class="next-btn" @tap="nextAudit">下一个</button>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      petInfo: null,
      petId: null,
      loading: false
    }
  },
  computed: {
    auditStatusText() {
      if (!this.petInfo) return ''
      const statusMap = {
        1: '待审核',
        2: '已通过',
        3: '已驳回'
      }
      return statusMap[this.petInfo.auditStatus] || '未知'
    },
    auditStatusClass() {
      if (!this.petInfo) return ''
      if (this.petInfo.auditStatus === 1) return 'status-pending'
      if (this.petInfo.auditStatus === 2) return 'status-pass'
      if (this.petInfo.auditStatus === 3) return 'status-reject'
      return ''
    },
    petTypeText() {
      const map = {
        'dog': '狗狗',
        'cat': '猫咪',
        'bird': '鸟类',
        'rabbit': '兔子',
        'hamster': '仓鼠',
        'other': '其他'
      }
      return map[this.petInfo?.petType] || this.petInfo?.petType || '未知'
    }
  },
  onLoad(options) {
    // 有效 id：存在且不是 '0' 且不是 'null'
    if (options.id && options.id !== '0' && options.id !== 'null') {
      this.petId = options.id
      this.loadPetDetail()
    } else {
      // 没有有效 id 时，加载第一个待审核宠物档案
      this.loadFirstPendingPet()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 加载第一个待审核宠物档案
    async loadFirstPendingPet() {
      this.loading = true
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=pet_info&status=1&page=1&size=1',
          method: 'GET'
        })
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const firstItem = res.records[0]
          this.petId = firstItem.businessId
          this.loadPetDetail()
        } else {
          this.loading = false
          uni.showToast({ title: '暂无待审核宠物档案', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        this.loading = false
        console.error('加载待审核列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 加载宠物详情
    async loadPetDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/pets/${this.petId}`,
          method: 'GET'
        })
        this.petInfo = res
        console.log('宠物详情:', this.petInfo)
      } catch (error) {
        console.error('加载失败:', error)
        uni.showToast({ title: error.message || '加载失败', icon: 'none' })
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      this.petInfo = {
        id: this.petId,
        name: '布丁',
        gender: 0,
        petType: 'bird',
        breed: '虎皮鹦鹉',
        birthDate: '2025-01-01',
        weight: 1,
        healthStatus: '良好',
        sterilized: true,
        vaccinated: true,
        description: '这是一只蓝白色的鹦鹉，性格温和，喜欢与人互动。',
        avatarUrl: '/static/pet-avatar.jpg',
        auditStatus: 1
      }
    },
    
    // 预览图片
    previewImage(url) {
      if (url) {
        uni.previewImage({ urls: [url] })
      }
    },
    
    // 审核通过
    approveAudit() {
      uni.showModal({
        title: '审核通过',
        content: `确定通过 ${this.petInfo.name} 的宠物档案吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.submitAudit(2, null)
          }
        }
      })
    },
    
    // 驳回审核
    rejectAudit() {
      uni.navigateTo({
        url: `/pages/audit/reject/index?businessType=pet_info&businessId=${this.petInfo.id}`,
        events: {
          acceptRejectReason: (data) => {
            this.submitAudit(3, data.reason)
          }
        }
      })
    },
    
    // 提交审核
    async submitAudit(status, reason) {
      uni.showLoading({ title: '提交中...' })
      
      try {
        const data = {
          businessType: 'pet_info',
          businessId: this.petInfo.id,
          status: status
        }
        if (status === 3 && reason) {
          data.reason = reason
        }
        
        await request({
          url: '/api/admin/audits',
          method: 'POST',
          data: data
        })
        
        uni.hideLoading()
        uni.showToast({ 
          title: status === 2 ? '审核通过' : '已驳回', 
          icon: 'success' 
        })
        
        setTimeout(() => {
          this.nextAudit()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('审核失败:', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      }
    },
    
    // 下一个待审核
    async nextAudit() {
      uni.showLoading({ title: '加载下一个...' })
      
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=pet_info&status=1&page=1&size=1',
          method: 'GET'
        })
        
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const nextItem = res.records[0]
          uni.redirectTo({
            url: `/pages/audit/pet/index?id=${nextItem.businessId}`
          })
        } else {
          uni.showModal({
            title: '提示',
            content: '暂无更多待审核宠物档案',
            showCancel: false,
            success: () => {
              uni.navigateBack()
            }
          })
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('获取下一个失败:', error)
        uni.showToast({ title: '暂无更多待审核', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    }
  }
}
</script>

<style scoped>
.pet-archive-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 180rpx;
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

/* 2. 表单卡片 */
.form-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}
.card-header {
  text-align: center;
  margin-bottom: 30rpx;
}
.card-title {
  display: block;
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}
.pet-avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  margin: 0 auto;
  background-color: #eee;
}

/* 不换行样式 */
.row-item {
  display: flex;
  align-items: center;
  margin-bottom: 25rpx;
  flex-wrap: wrap;
}
.row-item .label {
  display: inline-block;
  width: 160rpx;
  margin-bottom: 0;
  flex-shrink: 0;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
.row-item .input {
  flex: 1;
}
.row-item .value-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
}

.form-item {
  margin-bottom: 25rpx;
}
.label {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}
.input {
  height: 70rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 15rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
}
.value-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}
.value-textarea {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  display: block;
  padding: 15rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
}

/* 性别组 */
.gender-group {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.gender-symbol {
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 16rpx;
}
.gender-symbol.male {
  color: #D47836;
}
.gender-symbol.female {
  color: #D47836;
}
.gender-value {
  font-size: 28rpx;
  color: #666;
  margin-left: 20rpx;
}

/* 空心圆按钮样式 */
.radio-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #ccc;
  background-color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.radio-circle.active {
  border-color: #D47836;
  background-color: #D47836;
  box-shadow: inset 0 0 0 4rpx #fff, 0 0 0 2rpx #D47836;
}
.radio-group {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.radio-text {
  font-size: 28rpx;
  color: #333;
  margin-right: 24rpx;
}

/* 审核状态 */
.status-text {
  font-size: 28rpx;
  padding: 8rpx 20rpx;
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

/* 加载提示 */
.loading-tip {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 3. 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.two-btns {
  display: flex;
  gap: 20rpx;
}
.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  background-color: #fff;
}
.action-btn.reject {
  color: #E53935;
  border: 1rpx solid #E53935;
}
.action-btn.pass {
  color: #4CAF50;
  border: 1rpx solid #4CAF50;
}
.next-btn {
  width: 60%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  background-color: #fff;
  color: #D47836;
  border: 1rpx solid #D47836;
  margin: 0 auto;
}
.action-btn::after, .next-btn::after {
  border: none;
}
</style>