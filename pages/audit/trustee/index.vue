<template>
  <view class="keeper-cert-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">托管人认证审核</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 认证信息卡片 -->
    <view class="form-card" v-if="certInfo">
      <!-- 基本信息 -->
      <view class="info-section">
        <text class="section-title">基本信息</text>
        
        <!-- 真实姓名 -->
        <view class="form-item row-item">
          <text class="label">真实姓名：</text>
          <text class="value-text">{{ certInfo.realName || '未填写' }}</text>
        </view>
        
        <!-- 身份证号 -->
        <view class="form-item row-item">
          <text class="label">身份证号：</text>
          <text class="value-text">{{ certInfo.idCard || '未填写' }}</text>
        </view>
        
        <!-- 联系方式 -->
        <view class="form-item row-item">
          <text class="label">联系方式：</text>
          <text class="value-text">{{ certInfo.phone || '未填写' }}</text>
        </view>
        
        <!-- 紧急联系人 -->
        <view class="form-item row-item">
          <text class="label">紧急联系人：</text>
          <text class="value-text">{{ certInfo.emergencyContact || '未填写' }}</text>
        </view>
      </view>

      <!-- 认证资料 -->
      <view class="info-section">
        <text class="section-title">认证资料</text>
        
        <!-- 身份证照片 -->
        <view class="form-item">
          <text class="label">身份证照片：</text>
          <view class="photo-row" v-if="certInfo.idPhotos && certInfo.idPhotos.length">
            <image 
              v-for="(photo, idx) in certInfo.idPhotos" 
              :key="idx"
              class="cert-img" 
              :src="photo" 
              mode="aspectFill" 
              @tap="previewImage(photo)"
            />
          </view>
          <text v-else class="empty-text">未上传</text>
        </view>

        <!-- 信用资料 -->
        <view class="form-item">
          <text class="label">信用资料：</text>
          <text class="desc">芝麻信用分/微信支付分（550分以上）或征信报告</text>
          <image 
            v-if="certInfo.creditReport" 
            class="cert-img" 
            :src="certInfo.creditReport" 
            mode="aspectFill" 
            @tap="previewImage(certInfo.creditReport)" 
          />
          <text v-else class="empty-text">未上传</text>
        </view>

        <!-- 无犯罪记录证明 -->
        <view class="form-item">
          <text class="label">无犯罪记录证明：</text>
          <image 
            v-if="certInfo.noCriminalRecord" 
            class="cert-img" 
            :src="certInfo.noCriminalRecord" 
            mode="aspectFill" 
            @tap="previewImage(certInfo.noCriminalRecord)" 
          />
          <text v-else class="empty-text">未上传</text>
        </view>

        <!-- 宠物养护证明 -->
        <view class="form-item">
          <text class="label">宠物养护证明：</text>
          <text class="desc">疫苗本、宠物照片、培训证书等</text>
          <view class="photo-row" v-if="certInfo.petCertPhotos && certInfo.petCertPhotos.length">
            <image 
              v-for="(photo, idx) in certInfo.petCertPhotos" 
              :key="idx"
              class="cert-img" 
              :src="photo" 
              mode="aspectFill" 
              @tap="previewImage(photo)"
            />
          </view>
          <text v-else class="empty-text">未上传</text>
        </view>
      </view>

      <!-- 违规记录（如有） -->
      <view class="info-section" v-if="certInfo.violationCount > 0">
        <text class="section-title">违规记录</text>
        <view class="form-item">
          <text class="label">累计违规次数：</text>
          <text class="value-text violation">{{ certInfo.violationCount }} 次</text>
        </view>
      </view>

      <!-- 审核状态 -->
      <view class="info-section">
        <text class="section-title">审核状态</text>
        <view class="form-item">
          <text class="label">当前状态：</text>
          <text class="status-text" :class="auditStatusClass">{{ auditStatusText }}</text>
        </view>
      </view>
    </view>

    <view class="loading-tip" v-else-if="!loading">
      <text>暂无待审核认证</text>
    </view>
    <view class="loading-tip" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 3. 底部操作栏 -->
    <view class="bottom-bar" v-if="certInfo && certInfo.status === 1">
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
      certInfo: null,
      certId: null,
      loading: false
    }
  },
  computed: {
    auditStatusText() {
      if (!this.certInfo) return ''
      const statusMap = {
        1: '待审核',
        2: '已通过',
        3: '已驳回'
      }
      return statusMap[this.certInfo.status] || '未知'
    },
    auditStatusClass() {
      if (!this.certInfo) return ''
      if (this.certInfo.status === 1) return 'status-pending'
      if (this.certInfo.status === 2) return 'status-pass'
      if (this.certInfo.status === 3) return 'status-reject'
      return ''
    }
  },
  onLoad(options) {
    // 有效 id：存在且不是 '0' 且不是 'null'
    if (options.id && options.id !== '0' && options.id !== 'null') {
      this.certId = parseInt(options.id)
      this.loadCertDetail()
    } else {
      // 没有有效 id 时，加载第一个待审核认证
      this.loadFirstPendingCert()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 加载第一个待审核认证
    async loadFirstPendingCert() {
      this.loading = true
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=foster_certification&status=1&page=1&size=1',
          method: 'GET'
        })
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const firstItem = res.records[0]
          this.certId = firstItem.businessId
          this.loadCertDetail()
        } else {
          this.loading = false
          uni.showToast({ title: '暂无待审核认证', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        this.loading = false
        console.error('加载待审核列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 加载认证详情
    async loadCertDetail() {
      this.loading = true
      try {
        const res = await request({
          url: `/api/foster/certifications/${this.certId}`,
          method: 'GET'
        })
        
        this.certInfo = this.transformCertData(res)
        console.log('认证详情:', this.certInfo)
      } catch (error) {
        console.error('加载失败:', error)
        uni.showToast({ title: error.message || '加载失败', icon: 'none' })
        this.useMockData()
      } finally {
        this.loading = false
      }
    },
    
    // 转换认证数据格式
    transformCertData(data) {
      return {
        id: data.id,
        realName: data.realName,
        idCard: data.idCard,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        idPhotos: data.photos || [],
        creditReport: data.creditReport || data.photos?.[2] || '',
        noCriminalRecord: data.noCriminalRecord || data.photos?.[3] || '',
        petCertPhotos: data.petCertPhotos || data.photos?.slice(4) || [],
        violationCount: data.violationCount || 0,
        status: data.status || 1
      }
    },
    
    // 模拟数据（后端不可用时）
    useMockData() {
      this.certInfo = {
        id: this.certId,
        realName: '张三',
        idCard: '440***********1234',
        phone: '138****1111',
        emergencyContact: '李四 139****2222',
        idPhotos: ['/static/id-front.jpg', '/static/id-back.jpg'],
        creditReport: '/static/credit-report.jpg',
        noCriminalRecord: '/static/no-criminal-record.jpg',
        petCertPhotos: ['/static/pet-cert.jpg'],
        violationCount: 0,
        status: 1
      }
    },
    
    // 预览图片
    previewImage(url) {
      if (url) {
        uni.previewImage({ urls: [url] })
      }
    },
    
    // 人脸识别
    faceRecognition() {
      uni.showToast({ title: '人脸识别功能开发中', icon: 'none' })
    },
    
    // 审核通过
    approveAudit() {
      uni.showModal({
        title: '审核通过',
        content: `确定通过 ${this.certInfo.realName} 的托管人认证申请吗？`,
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
        url: `/pages/audit/reject/index?businessType=foster_certification&businessId=${this.certInfo.id}`,
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
          businessType: 'foster_certification',
          businessId: this.certInfo.id,
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
    
    // 下一个待审核认证
    async nextAudit() {
      uni.showLoading({ title: '加载下一个...' })
      
      try {
        const res = await request({
          url: '/api/admin/audits?businessType=foster_certification&status=1&page=1&size=1',
          method: 'GET'
        })
        
        uni.hideLoading()
        
        if (res && res.records && res.records.length > 0) {
          const nextItem = res.records[0]
          uni.redirectTo({
            url: `/pages/audit/trustee/index?id=${nextItem.businessId}`
          })
        } else {
          uni.showModal({
            title: '提示',
            content: '暂无更多待审核认证',
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
.keeper-cert-page {
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

/* 信息分区 */
.info-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}
.info-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #D47836;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 20rpx;
}
.label {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

/* 不换行样式 */
.row-item {
  display: flex;
  align-items: center;
}
.row-item .label {
  display: inline-block;
  width: 160rpx;
  margin-bottom: 0;
  flex-shrink: 0;
  font-size: 26rpx;
}
.row-item .value-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
}

.value-text {
  font-size: 28rpx;
  color: #666;
}
.value-text.violation {
  color: #E53935;
}

.desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 15rpx;
  line-height: 1.4;
}

/* 照片区域 */
.photo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}
.cert-img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
  background-color: #eee;
  border: 1rpx solid #ddd;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
  padding: 20rpx 0;
  display: inline-block;
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