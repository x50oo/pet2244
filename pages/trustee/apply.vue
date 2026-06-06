<template>
  <view class="certification-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">托管人认证</text>
      <view class="placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 已有申请提示 -->
    <view class="existing-tip" v-else-if="existingCert">
      <text class="tip-icon">📋</text>
      <text class="tip-text">您已提交认证申请</text>
      <text class="tip-desc">当前状态：{{ getCertStatusText(existingCert.status) }}</text>
      <text class="tip-desc" v-if="existingCert.status === 3">驳回理由：{{ existingCert.rejectReason || '无' }}</text>
      <button class="view-status-btn" v-if="existingCert.status === 3" @tap="resubmit">重新提交</button>
    </view>

    <template v-else>
      <!-- 2. 基本信息 -->
      <view class="section">
        <text class="section-title">基本信息：</text>
        <view class="input-item">
          <text class="label">真实姓名：</text>
          <input class="input-box" v-model="realName" placeholder="请输入真实姓名" />
        </view>
        <view class="input-item">
          <text class="label">身份证号：</text>
          <input class="input-box" v-model="idCard" placeholder="请输入身份证号" />
        </view>
        <view class="input-item">
          <text class="label">联系方式：</text>
          <input class="input-box" v-model="phone" placeholder="请输入手机号" type="number" maxlength="11" />
        </view>
        <view class="input-item">
          <text class="label">紧急联系人：</text>
          <input class="input-box" v-model="emergencyContact" placeholder="请输入紧急联系人及电话" />
        </view>
      </view>

      <!-- 3. 身份证正反面上传区 -->
      <view class="section">
        <text class="section-title">身份证正反面：</text>
        <view class="upload-group">
          <view class="upload-btn" @tap="uploadIdFront">
            <image v-if="!idFrontImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
            <image v-else class="uploaded-img" :src="idFrontImg" mode="aspectFill" />
            <text class="upload-text">{{ idFrontImg ? '重新上传' : '上传正面' }}</text>
          </view>
          <view class="upload-btn" @tap="uploadIdBack">
            <image v-if="!idBackImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
            <image v-else class="uploaded-img" :src="idBackImg" mode="aspectFill" />
            <text class="upload-text">{{ idBackImg ? '重新上传' : '上传反面' }}</text>
          </view>
          <button class="face-btn" @tap="faceRecognition">人脸识别</button>
        </view>
      </view>

      <!-- 4. 信用资料上传区 -->
      <view class="section">
        <text class="section-title">信用资料：</text>
        <text class="section-desc">芝麻信用分/微信支付分（550分以上）或征信报告</text>
        <view class="upload-btn center" @tap="uploadCredit">
          <image v-if="!creditImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
          <image v-else class="uploaded-img" :src="creditImg" mode="aspectFill" />
          <text class="upload-text">{{ creditImg ? '重新上传' : '上传图片' }}</text>
        </view>
      </view>

      <!-- 5. 无犯罪记录证明上传区 -->
      <view class="section">
        <text class="section-title">无犯罪记录（派出所开具证明）：</text>
        <view class="upload-btn center" @tap="uploadNoCrime">
          <image v-if="!noCrimeImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
          <image v-else class="uploaded-img" :src="noCrimeImg" mode="aspectFill" />
          <text class="upload-text">{{ noCrimeImg ? '重新上传' : '上传图片' }}</text>
        </view>
      </view>

      <!-- 6. 宠物养护证明上传区 -->
      <view class="section">
        <text class="section-title">宠物养护证明：</text>
        <text class="section-desc">疫苗本、宠物照片（证明确实养宠且状态良好）、培训证书（宠物急救、宠物行为学等课程结业证）</text>
        <view class="upload-btn center" @tap="uploadPetCert">
          <image v-if="!petCertImg" class="upload-icon" src="/static/image-placeholder.png" mode="aspectFit" />
          <image v-else class="uploaded-img" :src="petCertImg" mode="aspectFill" />
          <text class="upload-text">{{ petCertImg ? '重新上传' : '上传图片' }}</text>
        </view>
      </view>

      <!-- 7. 底部提交按钮 -->
      <button class="submit-btn" @tap="submitApplication" :disabled="submitting">
        {{ submitting ? '提交中...' : '完成' }}
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
      existingCert: null,
      
      // 基本信息
      realName: '',
      idCard: '',
      phone: '',
      emergencyContact: '',
      
      // 身份证图片
      idFrontImg: '',
      idBackImg: '',
      idFrontUrl: '',
      idBackUrl: '',
      
      // 信用资料
      creditImg: '',
      creditUrl: '',
      
      // 无犯罪记录
      noCrimeImg: '',
      noCrimeUrl: '',
      
      // 宠物养护证明
      petCertImg: '',
      petCertUrl: ''
    }
  },
  onLoad() {
    this.checkExistingCertification()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // ========== 工具方法 ==========
    getCertStatusText(status) {
      const map = { 1: '待审核', 2: '已通过', 3: '已驳回' }
      return map[status] || '未知'
    },
    
    validateIdCard(idCard) {
      const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
      return reg.test(idCard)
    },
    
    // ========== 检查已有认证 ==========
    async checkExistingCertification() {
      this.loading = true
      try {
        const res = await request({
          url: '/api/foster/certifications/mine',
          method: 'GET'
        })
        if (res && res.id) {
          this.existingCert = res
        }
      } catch (error) {
        console.log('检查已有认证失败', error)
      } finally {
        this.loading = false
      }
    },
    
    // ========== 图片上传 ==========
   // 修改 uploadImage 方法（如果有多个，每个都需要改）
   async uploadImage(type) {
     uni.chooseImage({
       count: 1,
       success: async (res) => {
         const tempFilePath = res.tempFilePaths[0]
         this[type + 'Img'] = tempFilePath
         
         uni.showLoading({ title: '上传中...' })
         try {
           const uploadedUrl = await this.uploadToServer(tempFilePath)
           this[type + 'Url'] = uploadedUrl
           uni.hideLoading()
           uni.showToast({ title: '上传成功', icon: 'success' })
         } catch (error) {
           uni.hideLoading()
           console.error('上传失败', error)
           uni.showToast({ title: '上传失败', icon: 'none' })
           this[type + 'Img'] = ''
         }
       }
     })
   },
   
   // 修改 uploadToServer 方法
   async uploadToServer(filePath) {
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
    
    uploadIdFront() {
      this.uploadImage('idFront')
    },
    uploadIdBack() {
      this.uploadImage('idBack')
    },
    uploadCredit() {
      this.uploadImage('credit')
    },
    uploadNoCrime() {
      this.uploadImage('noCrime')
    },
    uploadPetCert() {
      this.uploadImage('petCert')
    },
    
    // 人脸识别
    faceRecognition() {
      uni.showToast({ title: '人脸识别功能开发中', icon: 'none' })
    },
    
    // ========== 提交申请 ==========
    async submitApplication() {
      // 表单验证
      if (!this.realName) {
        uni.showToast({ title: '请输入真实姓名', icon: 'none' })
        return
      }
      if (!this.idCard) {
        uni.showToast({ title: '请输入身份证号', icon: 'none' })
        return
      }
      if (!this.validateIdCard(this.idCard)) {
        uni.showToast({ title: '请输入正确的身份证号', icon: 'none' })
        return
      }
      if (!this.phone) {
        uni.showToast({ title: '请输入联系方式', icon: 'none' })
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      if (!this.emergencyContact) {
        uni.showToast({ title: '请输入紧急联系人', icon: 'none' })
        return
      }
      
      if (!this.idFrontImg || !this.idBackImg) {
        uni.showToast({ title: '请上传身份证正反面', icon: 'none' })
        return
      }
      if (!this.creditImg) {
        uni.showToast({ title: '请上传信用资料', icon: 'none' })
        return
      }
      if (!this.noCrimeImg) {
        uni.showToast({ title: '请上传无犯罪记录证明', icon: 'none' })
        return
      }
      if (!this.petCertImg) {
        uni.showToast({ title: '请上传宠物养护证明', icon: 'none' })
        return
      }
      
      this.submitting = true
      uni.showLoading({ title: '提交中...' })
      
      try {
        // 收集所有图片URL
        const photos = [
          this.idFrontUrl,
          this.idBackUrl,
          this.creditUrl,
          this.noCrimeUrl,
          this.petCertUrl
        ].filter(Boolean)
        
        const data = {
          realName: this.realName,
          idCard: this.idCard,
          phone: this.phone,
          emergencyContact: this.emergencyContact,
          photos: photos
        }
        
        await request({
          url: '/api/foster/certifications',
          method: 'POST',
          data: data
        })
        
        uni.hideLoading()
        uni.showToast({ title: '申请已提交，等待审核', icon: 'success' })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交失败', error)
        
        if (error.code === 409) {
          uni.showToast({ title: '您已提交过认证申请', icon: 'none' })
        } else {
          uni.showToast({ title: error.message || '提交失败，请重试', icon: 'none' })
        }
      } finally {
        this.submitting = false
      }
    },
    
    // 重新提交（被驳回后）
    resubmit() {
      this.existingCert = null
      // 清空表单
      this.realName = ''
      this.idCard = ''
      this.phone = ''
      this.emergencyContact = ''
      this.idFrontImg = ''
      this.idBackImg = ''
      this.creditImg = ''
      this.noCrimeImg = ''
      this.petCertImg = ''
    }
  }
}
</script>

<style scoped>
.certification-page {
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

/* 已有申请提示 */
.existing-tip {
  background-color: #fff;
  margin: 20rpx;
  padding: 60rpx 40rpx;
  border-radius: 20rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.tip-icon {
  font-size: 80rpx;
}
.tip-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #D47836;
}
.tip-desc {
  font-size: 26rpx;
  color: #666;
}
.view-status-btn {
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 40rpx;
  padding: 15rpx 40rpx;
  font-size: 28rpx;
  margin-top: 20rpx;
}
.view-status-btn::after {
  border: none;
}

/* 通用样式 */
.section {
  margin: 20rpx;
  background-color: #fff;
  padding: 25rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
.section-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 15rpx;
}
.section-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
  margin-bottom: 20rpx;
  display: block;
}

/* 输入框 */
.input-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.label {
  font-size: 28rpx;
  color: #333;
  width: 140rpx;
  flex-shrink: 0;
}
.input-box {
  flex: 1;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 26rpx;
  background-color: #f9f9f9;
}

/* 上传按钮组 */
.upload-group {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-wrap: wrap;
}
.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 130rpx;
  height: 130rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  border: 1rpx dashed #ccc;
}
.upload-btn.center {
  margin: 0 auto;
}
.upload-icon {
  width: 50rpx;
  height: 50rpx;
  opacity: 0.5;
}
.uploaded-img {
  width: 110rpx;
  height: 110rpx;
  border-radius: 8rpx;
}
.upload-text {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}
.face-btn {
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 10rpx;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
}
.face-btn::after {
  border: none;
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
  margin: 40rpx auto;
  display: block;
  font-weight: bold;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.submit-btn::after {
  border: none;
}
</style>