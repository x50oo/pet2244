<template>
  <view class="user-info-audit-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">用户资料审核</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 用户信息卡片 -->
    <view class="form-card" v-if="userInfo">
      <!-- 头像 - 居中（待审核头像） -->
      <view class="avatar-item">
        <image class="avatar" :src="userInfo.pendingAvatar || userInfo.currentAvatar" mode="aspectFill" @tap="previewImage(userInfo.pendingAvatar || userInfo.currentAvatar)" />
        <text class="avatar-tip" v-if="userInfo.pendingAvatar">待审核头像</text>
      </view>

      <!-- 头像对比（如果有待审核头像） -->
      <view class="compare-section" v-if="userInfo.pendingAvatar && userInfo.currentAvatar">
        <text class="compare-title">头像对比</text>
        <view class="compare-row">
          <view class="compare-item">
            <image class="compare-avatar" :src="userInfo.currentAvatar" mode="aspectFill" />
            <text class="compare-label">当前头像</text>
          </view>
          <text class="arrow">→</text>
          <view class="compare-item">
            <image class="compare-avatar" :src="userInfo.pendingAvatar" mode="aspectFill" />
            <text class="compare-label">待审核头像</text>
          </view>
        </view>
      </view>

      <!-- 昵称对比 -->
      <view class="form-item">
        <text class="label">昵称修改：</text>
        <view class="compare-row-text">
          <view class="old-value">
            <text class="old-label">原昵称：</text>
            <text class="old-text">{{ userInfo.currentNickname || '未设置' }}</text>
          </view>
          <view class="new-value" v-if="userInfo.pendingNickname">
            <text class="new-label">新昵称：</text>
            <text class="new-text">{{ userInfo.pendingNickname }}</text>
          </view>
          <text class="no-change" v-else>无修改</text>
        </view>
      </view>

      <!-- 联系方式（只读） -->
      <view class="form-item row-item">
        <text class="label">联系方式：</text>
        <text class="value-text">{{ userInfo.phone || '未填写' }}</text>
      </view>

      <!-- 地址（只读） -->
      <view class="form-item row-item">
        <text class="label">地址：</text>
        <text class="value-text">{{ userInfo.address || '未填写' }}</text>
      </view>

      <!-- 审核状态 -->
      <view class="form-item">
        <text class="label">审核状态：</text>
        <text class="status-text" :class="auditStatusClass">{{ auditStatusText }}</text>
      </view>
    </view>

    <view class="loading-tip" v-else-if="!loading">
      <text>暂无待审核用户资料</text>
    </view>
    <view class="loading-tip" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 3. 底部操作栏 -->
    <view class="bottom-bar" v-if="userInfo && userInfo.auditStatus === 1">
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
      userInfo: null,
      userId: null,
      loading: false
    }
  },
  computed: {
    auditStatusText() {
      if (!this.userInfo) return ''
      const statusMap = {
        1: '待审核',
        2: '已通过',
        3: '已驳回'
      }
      return statusMap[this.userInfo.auditStatus] || '未知'
    },
    auditStatusClass() {
      if (!this.userInfo) return ''
      if (this.userInfo.auditStatus === 1) return 'status-pending'
      if (this.userInfo.auditStatus === 2) return 'status-pass'
      if (this.userInfo.auditStatus === 3) return 'status-reject'
      return ''
    }
  },
  onLoad(options) {
    // 有效 id：存在且不是 '0' 且不是 'null'
    if (options.id && options.id !== '0' && options.id !== 'null') {
      this.userId = parseInt(options.id)
      this.loadUserDetail()
    } else {
      // 没有有效 id 时，加载第一个待审核用户资料
      this.loadFirstPendingUser()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 加载第一个待审核用户资料
    async loadFirstPendingUser() {
      this.loading = true
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=user_profile&status=1&page=1&size=1',
          method: 'GET'
        })
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const firstItem = res.records[0]
          this.userId = firstItem.businessId
          this.loadUserDetail()
        } else {
          this.loading = false
          uni.showToast({ title: '暂无待审核用户资料', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        this.loading = false
        console.error('加载待审核列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 加载用户资料详情
    async loadUserDetail() {
      this.loading = true
      try {
        // 需要后端提供管理员获取用户资料审核详情的接口
        const res = await request({
          url: `/api/admin/user-profiles/${this.userId}`,
          method: 'GET'
        }).catch(() => null)
        
        if (res) {
          this.userInfo = this.transformUserData(res)
        } else {
          this.useMockData()
        }
        console.log('用户资料:', this.userInfo)
      } catch (error) {
        console.error('加载失败:', error)
        uni.showToast({ title: error.message || '加载失败', icon: 'none' })
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 转换用户数据格式
    transformUserData(data) {
      return {
        id: data.id,
        userId: data.userId,
        currentNickname: data.currentNickname,
        currentAvatar: data.currentAvatar,
        pendingNickname: data.pendingNickname,
        pendingAvatar: data.pendingAvatar,
        phone: data.phone,
        address: data.address,
        auditStatus: data.auditStatus || 1
      }
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      this.userInfo = {
        id: this.userId,
        userId: this.userId,
        currentNickname: '小明',
        currentAvatar: '/static/user-avatar.jpg',
        pendingNickname: '小明同学',
        pendingAvatar: '/static/user-avatar-new.jpg',
        phone: '138****1111',
        address: '番禺区贝岗商业街101号',
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
      let content = '确定通过该用户的资料审核吗？'
      if (this.userInfo.pendingNickname) {
        content = `确定通过昵称「${this.userInfo.pendingNickname}」的修改吗？`
      }
      
      uni.showModal({
        title: '审核通过',
        content: content,
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
        url: `/pages/audit/reject/index?businessType=user_profile&businessId=${this.userInfo.id}`,
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
          businessType: 'user_profile',
          businessId: this.userInfo.id,
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
    
    // 下一个待审核用户资料
    async nextAudit() {
      uni.showLoading({ title: '加载下一个...' })
      
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=user_profile&status=1&page=1&size=1',
          method: 'GET'
        })
        
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const nextItem = res.records[0]
          uni.redirectTo({
            url: `/pages/audit/user/index?id=${nextItem.businessId}`
          })
        } else {
          uni.showModal({
            title: '提示',
            content: '暂无更多待审核用户资料',
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
.user-info-audit-page {
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

/* 头像居中 */
.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}
.avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  background-color: #eee;
}
.avatar-tip {
  font-size: 24rpx;
  color: #D47836;
  margin-top: 10rpx;
}

/* 对比区域 */
.compare-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}
.compare-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}
.compare-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30rpx;
}
.compare-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.compare-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background-color: #eee;
}
.compare-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
.arrow {
  font-size: 40rpx;
  color: #D47836;
}

/* 昵称对比 */
.compare-row-text {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 12rpx;
}
.old-value {
  margin-bottom: 15rpx;
}
.old-label {
  font-size: 26rpx;
  color: #999;
}
.old-text {
  font-size: 28rpx;
  color: #666;
  text-decoration: line-through;
  margin-left: 10rpx;
}
.new-value {
  margin-top: 10rpx;
  padding-top: 10rpx;
  border-top: 1rpx dashed #ddd;
}
.new-label {
  font-size: 26rpx;
  color: #D47836;
}
.new-text {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  margin-left: 10rpx;
}
.no-change {
  font-size: 26rpx;
  color: #999;
}

/* 不换行样式 */
.row-item {
  display: flex;
  align-items: center;
  margin-bottom: 25rpx;
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
  margin-bottom: 12rpx;
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