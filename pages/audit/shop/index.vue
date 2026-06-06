<template>
  <view class="shop-approve-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">店铺入驻审核</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 店铺信息表单区 -->
    <view class="form-card" v-if="shopInfo">
      <!-- 店铺头像 - 居中 -->
      <view class="form-item avatar-item">
        <image class="avatar" :src="shopInfo.avatar || '/static/default-shop.png'" mode="aspectFill" @tap="previewImage(shopInfo.avatar)" />
        <text class="avatar-tip">店铺头像</text>
      </view>

      <!-- 店铺名称 -->
      <view class="form-item row-item">
        <text class="label">店铺名称：</text>
        <text class="value-text">{{ shopInfo.name }}</text>
      </view>

      <!-- 联系方式 -->
      <view class="form-item row-item">
        <text class="label">联系方式：</text>
        <text class="value-text">{{ shopInfo.phone }}</text>
      </view>

      <!-- 经营地址 -->
      <view class="form-item row-item">
        <text class="label">经营地址：</text>
        <text class="value-text">{{ shopInfo.address }}</text>
      </view>

      <!-- 店铺简介 -->
      <view class="form-item">
        <text class="label">店铺简介：</text>
        <text class="value-textarea">{{ shopInfo.description || '暂无简介' }}</text>
      </view>

      <!-- 店铺照片 -->
      <view class="form-item" v-if="shopInfo.photos && shopInfo.photos.length">
        <text class="label">店铺照片：</text>
        <view class="photo-list">
          <image 
            v-for="(photo, idx) in shopInfo.photos" 
            :key="idx"
            class="photo-img" 
            :src="photo" 
            mode="aspectFill" 
            @tap="previewImage(photo)"
          />
        </view>
      </view>

      <!-- 审核状态 -->
      <view class="form-item">
        <text class="label">审核状态：</text>
        <text class="status-text" :class="auditStatusClass">{{ auditStatusText }}</text>
      </view>
    </view>

    <view class="loading-tip" v-else-if="!loading">
      <text>暂无待审核店铺</text>
    </view>
    <view class="loading-tip" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 3. 底部操作栏 -->
    <view class="bottom-bar" v-if="shopInfo && shopInfo.status === 1">
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
      shopInfo: null,
      shopId: null,
      loading: false
    }
  },
  computed: {
    auditStatusText() {
      if (!this.shopInfo) return ''
      const statusMap = {
        1: '待审核',
        2: '已通过',
        3: '已驳回'
      }
      return statusMap[this.shopInfo.status] || '未知'
    },
    auditStatusClass() {
      if (!this.shopInfo) return ''
      if (this.shopInfo.status === 1) return 'status-pending'
      if (this.shopInfo.status === 2) return 'status-pass'
      if (this.shopInfo.status === 3) return 'status-reject'
      return ''
    }
  },
  onLoad(options) {
    // 有效 id：存在且不是 '0' 且不是 'null'
    if (options.id && options.id !== '0' && options.id !== 'null') {
      this.shopId = parseInt(options.id)
      this.loadShopDetail()
    } else {
      // 没有有效 id 时，加载第一个待审核店铺
      this.loadFirstPendingShop()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 加载第一个待审核店铺
    async loadFirstPendingShop() {
      this.loading = true
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=boarding_shop&status=1&page=1&size=1',
          method: 'GET'
        })
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const firstItem = res.records[0]
          this.shopId = firstItem.businessId
          this.loadShopDetail()
        } else {
          this.loading = false
          uni.showToast({ title: '暂无待审核店铺', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        this.loading = false
        console.error('加载待审核列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 加载店铺详情
    async loadShopDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/boarding/shops/${this.shopId}`,
          method: 'GET'
        })
        
        // 转换数据格式
        this.shopInfo = {
          id: res.id,
          name: res.name,
          phone: res.phone,
          address: res.address,
          description: res.description,
          photos: res.photos || [],
          avatar: res.photos?.[0] || '/static/default-shop.png',
          status: res.status || 1
        }
        
        console.log('店铺详情:', this.shopInfo)
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
      this.shopInfo = {
        id: this.shopId,
        name: '哈哈宠物店',
        phone: '138****8888',
        address: '番禺区贝岗商业街101号',
        description: '专业宠物服务，用心呵护每一个毛孩子',
        photos: ['/static/shop-avatar.jpg', '/static/business-license.jpg'],
        avatar: '/static/shop-avatar.jpg',
        status: 1
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
        content: `确定通过 ${this.shopInfo.name} 的入驻申请吗？`,
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
        url: `/pages/audit/reject/index?businessType=boarding_shop&businessId=${this.shopInfo.id}`,
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
          businessType: 'boarding_shop',
          businessId: this.shopInfo.id,
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
        
        // 自动加载下一个
        setTimeout(() => {
          this.nextAudit()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('审核失败:', error)
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      }
    },
    
    // 下一个待审核店铺
    async nextAudit() {
      uni.showLoading({ title: '加载下一个...' })
      
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=boarding_shop&status=1&page=1&size=1',
          method: 'GET'
        })
        
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const nextItem = res.records[0]
          // 跳转到下一个
          uni.redirectTo({
            url: `/pages/audit/shop/index?id=${nextItem.businessId}`
          })
        } else {
          uni.showModal({
            title: '提示',
            content: '暂无更多待审核店铺',
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
.shop-approve-page {
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
.form-item {
  margin-bottom: 30rpx;
}
.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: bold;
}

/* 不换行样式 */
.row-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.row-item .label {
  display: inline-block;
  width: 160rpx;
  margin-bottom: 0;
  flex-shrink: 0;
}
.row-item .value-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
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

/* 头像居中 */
.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background-color: #eee;
}
.avatar-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

/* 照片列表 */
.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.photo-img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
  background-color: #eee;
  border: 1rpx solid #ddd;
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
  font-size: 30rpx;
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
  font-size: 30rpx;
  background-color: #fff;
  color: #D47836;
  border: 1rpx solid #D47836;
  margin: 0 auto;
}
.action-btn::after, .next-btn::after {
  border: none;
}
</style>