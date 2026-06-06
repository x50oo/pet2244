<template>
  <view class="audit-history-page">
    <!-- 顶部导航栏 - 加返回按钮 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">历史审核</text>
      <view class="placeholder"></view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: activeTab === 'all' }" @tap="switchTab('all')">全部</view>
      <view class="tab-item" :class="{ active: activeTab === 'pass' }" @tap="switchTab('pass')">已通过</view>
      <view class="tab-item" :class="{ active: activeTab === 'reject' }" @tap="switchTab('reject')">已驳回</view>
    </view>

    <!-- 业务类型筛选 -->
    <view class="type-filter">
      <scroll-view class="type-scroll" scroll-x>
        <view class="type-list">
          <view 
            class="type-item" 
            :class="{ active: businessType === '' }" 
            @tap="filterByType('')"
          >全部</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'boarding_shop' }" 
            @tap="filterByType('boarding_shop')"
          >店铺入驻审核</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'foster_certification' }" 
            @tap="filterByType('foster_certification')"
          >托管人资质审核</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'pet_info' }" 
            @tap="filterByType('pet_info')"
          >宠物档案审核</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'lost_pet_post' }" 
            @tap="filterByType('lost_pet_post')"
          >寻宠帖子审核</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'foster_order' }" 
            @tap="filterByType('foster_order')"
          >托管帖子审核</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'lost_pet_clue' }" 
            @tap="filterByType('lost_pet_clue')"
          >线索审核</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'boarding_package' }" 
            @tap="filterByType('boarding_package')"
          >套餐审核</view>
          <view 
            class="type-item" 
            :class="{ active: businessType === 'user_profile' }" 
            @tap="filterByType('user_profile')"
          >用户资料审核</view>
        </view>
      </scroll-view>
    </view>

    <!-- 审核列表 -->
    <scroll-view class="audit-list" scroll-y @scrolltolower="loadMore">
      <view class="audit-card" v-for="item in auditList" :key="item.id" @tap="goToDetail(item)">
        <view class="card-header">
          <text class="type-name">{{ getBusinessTypeName(item.businessType) }}</text>
          <text class="status-tag" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</text>
        </view>
        <view class="card-content">
          <view class="info-row">
            <text class="label">审核内容：</text>
            <text class="value">{{ getContentPreview(item) }}</text>
          </view>
          <view class="info-row" v-if="item.reason">
            <text class="label">驳回理由：</text>
            <text class="value reject-reason">{{ item.reason }}</text>
          </view>
          <view class="info-row">
            <text class="label">提交时间：</text>
            <text class="value">{{ formatTime(item.createTime) }}</text>
          </view>
          <view class="info-row">
            <text class="label">审核时间：</text>
            <text class="value">{{ formatTime(item.auditTime) }}</text>
          </view>
        </view>
      </view>

      <view class="loading-more" v-if="loadingMore">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && auditList.length > 0">
        <text>没有更多了</text>
      </view>
      <view class="empty-state" v-if="!loading && auditList.length === 0">
        <text>暂无审核记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      activeTab: 'all',
      businessType: '',
      auditList: [],
      page: 1,
      size: 20,
      hasMore: true,
      loading: false,
      loadingMore: false,
      
      businessTypeMap: {
        'boarding_shop': '店铺入驻审核',
        'foster_certification': '托管人资质审核',
        'pet_info': '宠物档案审核',
        'lost_pet_post': '寻宠帖子审核',
        'foster_order': '托管帖子审核',
        'lost_pet_clue': '线索审核',
        'boarding_package': '套餐审核',
        'user_profile': '用户资料审核'
      }
    }
  },
  onLoad() {
    this.loadAuditList()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    getBusinessTypeName(type) {
      return this.businessTypeMap[type] || type || '未知'
    },
    
    getStatusText(status) {
      const map = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return map[status] || '未知'
    },
    
    getStatusClass(status) {
      if (status === 2) return 'status-pass'
      if (status === 3) return 'status-reject'
      return ''
    },
    
    getContentPreview(item) {
      if (item.businessType === 'boarding_shop') {
        return item.data?.name || '店铺入驻申请'
      }
      if (item.businessType === 'foster_certification') {
        return item.data?.realName || '托管人认证申请'
      }
      if (item.businessType === 'pet_info') {
        return item.data?.name || '宠物档案'
      }
      if (item.businessType === 'lost_pet_post') {
        return item.data?.title || item.data?.petName || '寻宠帖子'
      }
      if (item.businessType === 'foster_order') {
        return item.data?.title || item.data?.petName || '托管订单'
      }
      if (item.businessType === 'lost_pet_clue') {
        return item.data?.content || '线索'
      }
      if (item.businessType === 'boarding_package') {
        return item.data?.name || '套餐'
      }
      if (item.businessType === 'user_profile') {
        return item.data?.nickname || '用户资料'
      }
      return '审核记录'
    },
    
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    switchTab(tab) {
      this.activeTab = tab
      this.resetAndReload()
    },
    
    filterByType(type) {
      this.businessType = type
      this.resetAndReload()
    },
    
    resetAndReload() {
      this.page = 1
      this.auditList = []
      this.hasMore = true
      this.loadAuditList()
    },
    
    async loadAuditList(isLoadMore = false) {
      if (this.loading || this.loadingMore) return
      
      if (!isLoadMore) {
        this.loading = true
      } else {
        this.loadingMore = true
      }
      
      try {
        let status = ''
        if (this.activeTab === 'pass') {
          status = 2
        } else if (this.activeTab === 'reject') {
          status = 3
        }
        
        let url = `/api/admin/audits?page=${this.page}&size=${this.size}`
        if (status) {
          url += `&status=${status}`
        }
        if (this.businessType) {
          url += `&businessType=${this.businessType}`
        }
        
        const res = await request({
          url: url,
          method: 'GET'
        })
        
        const records = res?.records || []
        
        if (isLoadMore) {
          this.auditList = [...this.auditList, ...records]
        } else {
          this.auditList = records
        }
        
        this.hasMore = records.length === this.size
        if (this.hasMore) this.page++
        
      } catch (error) {
        console.error('加载审核列表失败', error)
        this.useMockData()
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    
    loadMore() {
      if (this.hasMore && !this.loadingMore) {
        this.loadAuditList(true)
      }
    },
    
    goToDetail(item) {
      const detailPages = {
        'boarding_shop': '/pages/audit/shop/index',
        'foster_certification': '/pages/audit/trustee/index',
        'pet_info': '/pages/audit/pet/index',
        'lost_pet_post': '/pages/audit/seek/index',
        'foster_order': '/pages/audit/foster/index',
        'lost_pet_clue': '/pages/clue/detail',
        'boarding_package': '/pages/audit/package/index',
        'user_profile': '/pages/audit/user/index'
      }
      
      const page = detailPages[item.businessType]
      if (page) {
        uni.navigateTo({
          url: `${page}?id=${item.businessId}`
        })
      } else {
        uni.showToast({ title: '详情页面开发中', icon: 'none' })
      }
    },
    
    useMockData() {
      this.auditList = [
        {
          id: 1,
          businessType: 'boarding_shop',
          businessId: 1,
          status: 2,
          reason: null,
          createTime: '2026-06-01T10:00:00',
          auditTime: '2026-06-02T14:30:00',
          data: { name: '宠爱之家宠物店' }
        },
        {
          id: 2,
          businessType: 'foster_certification',
          businessId: 2,
          status: 3,
          reason: '身份信息不清晰，请重新上传',
          createTime: '2026-06-03T09:00:00',
          auditTime: '2026-06-04T11:00:00',
          data: { realName: '张三' }
        }
      ]
    }
  }
}
</script>

<style scoped>
.audit-history-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20rpx;
}

/* 顶部导航栏 - 加返回按钮样式 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
}
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-icon {
  font-size: 44rpx;
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
  width: 60rpx;
}

/* Tab 栏 */
.tab-bar {
  display: flex;
  background-color: #fff;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}
.tab-item {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  padding: 10rpx 0;
}
.tab-item.active {
  color: #D47836;
  border-bottom: 2rpx solid #D47836;
}

/* 业务类型筛选 */
.type-filter {
  background-color: #fff;
  padding: 15rpx 20rpx;
  border-bottom: 1rpx solid #eee;
}
.type-scroll {
  white-space: nowrap;
}
.type-list {
  display: inline-flex;
  gap: 20rpx;
}
.type-item {
  display: inline-block;
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 30rpx;
}
.type-item.active {
  background-color: #FFE0A8;
  color: #D47836;
}

/* 审核列表 */
.audit-list {
  padding: 20rpx;
  height: calc(100vh - 200rpx);
}
.audit-card {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 25rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #eee;
  margin-bottom: 15rpx;
}
.type-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.status-tag {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.status-pass {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.status-reject {
  background-color: #FFEBEE;
  color: #f44336;
}

.card-content {
  font-size: 26rpx;
}
.info-row {
  display: flex;
  margin-bottom: 12rpx;
}
.info-row .label {
  color: #999;
  width: 140rpx;
  flex-shrink: 0;
}
.info-row .value {
  color: #333;
  flex: 1;
}
.reject-reason {
  color: #f44336;
}

/* 加载状态 */
.loading-more, .no-more, .empty-state {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>