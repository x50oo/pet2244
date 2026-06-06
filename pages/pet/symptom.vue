<template>
  <view class="symptom-check-page">
    <!-- 1. 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="title">症状自查</text>
      <view class="placeholder"></view>
    </view>

    <!-- 2. 免责声明 -->
    <view class="disclaimer">
      <text>{{ disclaimerText }}</text>
    </view>

    <!-- 3. 宠物选择器（可选） -->
    <view class="pet-selector" v-if="petList.length > 0" @tap="showPetSelector">
      <text class="pet-label">当前宠物：</text>
      <text class="pet-name">{{ currentPet?.name || '未选择' }}</text>
      <text class="switch-icon">▼</text>
    </view>

    <!-- 4. 助手欢迎区 -->
    <view class="welcome-section" v-if="!chatVisible">
      <view class="assistant-avatar">
        <view class="avatar-bg">
          <text class="paw-icon">🐾</text>
          <text class="bone-icon">🦴</text>
        </view>
        <image class="avatar-img" src="/static/assistant-icon.png" mode="aspectFit" />
      </view>
      <view class="welcome-text">
        <text>我是症状自查助手，</text>
        <text>今天能帮你做什么吗？</text>
      </view>
    </view>

    <!-- 5. 聊天记录区 -->
    <scroll-view class="chat-area" scroll-y :scroll-into-view="scrollToView" v-if="chatVisible">
      <view class="message-list">
        <view class="message-item" v-for="(msg, index) in messages" :key="index" :id="'msg-' + index">
          <view class="assistant-message" v-if="msg.type === 'assistant'">
            <view class="assistant-avatar-small">
              <image class="small-avatar-img" src="/static/assistant-icon.png" mode="aspectFit" />
            </view>
            <view class="message-bubble assistant-bubble">
              <text>{{ msg.content }}</text>
              <view class="triage-tag" v-if="msg.triageLevel">
                <text :class="getTriageClass(msg.triageLevel)">{{ getTriageText(msg.triageLevel) }}</text>
              </view>
            </view>
          </view>
          <view class="user-message" v-else>
            <view class="message-bubble user-bubble">
              <text>{{ msg.content }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 6. 底部输入区 -->
    <view class="input-area">
      <view class="voice-icon" @tap="voiceInput">
        <text class="voice-emoji">🎤</text>
      </view>
      <input class="message-input" v-model="inputText" placeholder="请输入症状描述..." confirm-type="send" @confirm="sendMessage" />
      <view class="plus-icon" @tap="openMenu">
        <text class="plus-emoji">➕</text>
      </view>
    </view>

    <!-- 快捷选项弹窗 -->
    <view class="menu-overlay" v-if="showMenu" @tap="closeMenu">
      <view class="menu-popup" @tap.stop>
        <view class="menu-item" v-for="item in quickOptions" :key="item" @tap="selectQuick(item)">
          {{ item }}
        </view>
      </view>
    </view>

    <!-- 宠物选择弹窗 -->
    <view class="menu-overlay" v-if="showPetMenu" @tap="closePetMenu">
      <view class="menu-popup" @tap.stop>
        <view class="menu-item" v-for="pet in petList" :key="pet.id" @tap="selectPet(pet)">
          {{ pet.name }}（{{ getPetTypeText(pet.petType) }}）
        </view>
        <view class="menu-item" @tap="selectPet(null)">不选择宠物</view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-mask" v-if="isLoading">
      <view class="loading-content">
        <text class="loading-icon">🐾</text>
        <text>AI正在分析中...</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      inputText: '',
      chatVisible: false,
      messages: [],
      scrollToView: '',
      showMenu: false,
      showPetMenu: false,
      isLoading: false,
      disclaimerText: '本建议仅供参考，不能替代专业兽医诊断',
      
      // 宠物相关
      petList: [],
      currentPet: null,
      
      // 快捷选项
      quickOptions: ['食欲不振', '精神萎靡', '呕吐腹泻', '皮肤问题', '呼吸困难', '咳嗽', '发烧', '抽搐']
    }
  },
  onLoad() {
    this.loadPetList()
    this.loadWelcomeMessage()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 加载宠物列表
    async loadPetList() {
      try {
        const res = await request({
          url: '/api/pets/mine',
          method: 'GET'
        })
        this.petList = res || []
        if (this.petList.length > 0) {
          this.currentPet = this.petList[0]
        }
      } catch (error) {
        console.log('加载宠物列表失败', error)
      }
    },
    
    // 加载欢迎消息
    loadWelcomeMessage() {
      this.messages = [
        { 
          type: 'assistant', 
          content: '你好！我是症状自查助手。请描述一下你家宠物的症状，我会帮你初步分析可能的原因。\n\n温馨提示：本服务仅提供参考，不能替代专业兽医诊断。'
        }
      ]
    },
    
    // 显示宠物选择器
    showPetSelector() {
      this.showPetMenu = true
    },
    
    closePetMenu() {
      this.showPetMenu = false
    },
    
    selectPet(pet) {
      this.currentPet = pet
      this.showPetMenu = false
      if (pet) {
        uni.showToast({ title: `已切换到${pet.name}`, icon: 'success' })
      }
    },
    
    getPetTypeText(type) {
      const map = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'rabbit': '兔子', 'hamster': '仓鼠', 'other': '其他' }
      return map[type] || '宠物'
    },
    
    getTriageText(level) {
      const map = { 1: '居家观察', 2: '建议就医', 3: '紧急就医' }
      return map[level] || ''
    },
    
    getTriageClass(level) {
      const map = { 1: 'triage-level1', 2: 'triage-level2', 3: 'triage-level3' }
      return map[level] || ''
    },
    
    voiceInput() {
      uni.showToast({ title: '语音输入开发中', icon: 'none' })
    },
    
    openMenu() {
      this.showMenu = true
    },
    
    closeMenu() {
      this.showMenu = false
    },
    
    selectQuick(text) {
      this.showMenu = false
      this.inputText = text
      this.sendMessage()
    },
    
    // 发送消息
    async sendMessage() {
      if (!this.inputText.trim()) return
      
      const userMessage = this.inputText.trim()
      this.inputText = ''
      
      // 显示聊天区域
      this.chatVisible = true
      
      // 添加用户消息
      this.messages.push({
        type: 'user',
        content: userMessage
      })
      
      this.scrollToBottom()
      
      // 调用API
      this.isLoading = true
      
      try {
        let response
        // 优先使用AI诊断接口
        try {
          response = await request({
            url: '/api/health/diagnosis',
            method: 'POST',
            data: {
              petId: this.currentPet?.id || null,
              petType: this.currentPet?.petType || 'other',
              symptom: userMessage,
              healthRecords: []
            }
          })
          
          // 格式化AI响应
          let content = response.content || response.advice || ''
          const triageLevel = response.triageLevel
          const disclaimer = response.disclaimer
          
          if (disclaimer) {
            this.disclaimerText = disclaimer
          }
          
          this.messages.push({
            type: 'assistant',
            content: content,
            triageLevel: triageLevel
          })
          
        } catch (apiError) {
          // 如果AI接口失败，尝试使用症状自查接口
          try {
            response = await request({
              url: '/api/health/symptom-check',
              method: 'POST',
              data: {
                petId: this.currentPet?.id || null,
                symptomName: userMessage,
                symptomDescription: userMessage
              }
            })
            
            let content = response.suggestion || ''
            const triageLevel = response.triageLevel
            const triageText = response.triageText
            const disclaimer = response.disclaimer
            
            if (triageText) {
              content = `【${triageText}】\n${content}`
            }
            if (disclaimer) {
              this.disclaimerText = disclaimer
            }
            
            this.messages.push({
              type: 'assistant',
              content: content,
              triageLevel: triageLevel
            })
            
          } catch (innerError) {
            // 都失败时使用本地响应
            this.messages.push({
              type: 'assistant',
              content: this.getLocalResponse(userMessage)
            })
          }
        }
        
      } catch (error) {
        console.error('API调用失败', error)
        this.messages.push({
          type: 'assistant',
          content: this.getLocalResponse(userMessage)
        })
      } finally {
        this.isLoading = false
        this.scrollToBottom()
      }
    },
    
    // 本地响应（兜底方案）
    getLocalResponse(symptom) {
      if (symptom.includes('食欲') || symptom.includes('不吃')) {
        return '【建议就医】\n食欲不振可能的原因：\n1. 消化不良或肠胃不适\n2. 口腔问题（牙结石、口腔溃疡）\n3. 应激反应（环境变化、惊吓）\n4. 疾病初期症状\n\n建议：观察24小时，如持续不吃请及时就医。\n\n⚠️ 本建议仅供参考，请以兽医诊断为准。'
      } else if (symptom.includes('精神') || symptom.includes('萎靡')) {
        return '【建议就医】\n精神萎靡可能的原因：\n1. 感冒发烧\n2. 寄生虫感染\n3. 营养不良\n4. 传染病早期\n\n建议：测量体温，观察是否有其他症状，必要时送医检查。\n\n⚠️ 本建议仅供参考，请以兽医诊断为准。'
      } else if (symptom.includes('呕吐') || symptom.includes('腹泻')) {
        return '【紧急就医】\n呕吐/腹泻可能的原因：\n1. 饮食不当或吃坏东西\n2. 肠胃炎\n3. 寄生虫感染\n4. 病毒性感染（细小、冠状等）\n\n建议：先禁食4-6小时，提供充足饮水，如症状持续请立即就医。\n\n⚠️ 本建议仅供参考，请以兽医诊断为准。'
      } else if (symptom.includes('皮肤') || symptom.includes('掉毛')) {
        return '【建议就医】\n皮肤问题可能的原因：\n1. 真菌感染（猫癣等）\n2. 细菌感染\n3. 寄生虫（跳蚤、螨虫）\n4. 过敏反应\n\n建议：保持环境清洁，避免抓挠，及时就医检查。\n\n⚠️ 本建议仅供参考，请以兽医诊断为准。'
      } else if (symptom.includes('呼吸') || symptom.includes('咳嗽')) {
        return '【紧急就医】\n呼吸问题可能的原因：\n1. 感冒或呼吸道感染\n2. 支气管炎\n3. 心脏病\n4. 气管塌陷（小型犬常见）\n\n建议：保持环境安静，避免剧烈运动，尽快就医检查。\n\n⚠️ 本建议仅供参考，请以兽医诊断为准。'
      } else if (symptom.includes('发烧') || symptom.includes('发热')) {
        return '【紧急就医】\n发烧可能的原因：\n1. 感染（细菌、病毒）\n2. 炎症反应\n3. 中暑\n\n建议：测量体温，正常犬猫体温为38-39.2℃，超过39.5℃需立即就医。\n\n⚠️ 本建议仅供参考，请以兽医诊断为准。'
      } else if (symptom.includes('抽搐') || symptom.includes('癫痫')) {
        return '【紧急就医】\n抽搐/癫痫是紧急情况！\n可能的原因：\n1. 癫痫\n2. 中毒\n3. 脑部疾病\n4. 低血糖\n\n建议：保持环境安静，移开周围危险物品，立即送医！\n\n⚠️ 本建议仅供参考，请以兽医诊断为准。'
      } else {
        return '感谢您的描述。由于症状描述不够详细，建议您补充更多信息（如持续时间、伴随症状等），或直接咨询专业兽医进行诊断。\n\n分诊建议：居家观察\n\n温馨提示：AI助手仅提供参考，最终诊断请以兽医为准。'
      }
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollToView = 'msg-' + (this.messages.length - 1)
      })
    }
  }
}
</script>

<style scoped>
.symptom-check-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  display: flex;
  flex-direction: column;
  padding-bottom: 20rpx;
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

/* 2. 免责声明 */
.disclaimer {
  text-align: center;
  padding: 15rpx 0;
  background-color: #FFF9E6;
}
.disclaimer text {
  font-size: 22rpx;
  color: #999;
}

/* 3. 宠物选择器 */
.pet-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15rpx 30rpx;
  background-color: #fff;
  margin: 0 20rpx;
  border-radius: 40rpx;
}
.pet-label {
  font-size: 26rpx;
  color: #666;
}
.pet-name {
  font-size: 26rpx;
  color: #D47836;
  font-weight: bold;
  margin-left: 10rpx;
}
.switch-icon {
  font-size: 24rpx;
  color: #999;
  margin-left: 10rpx;
}

/* 4. 助手欢迎区 */
.welcome-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  background-color: transparent;
}
.assistant-avatar {
  width: 180rpx;
  height: 180rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 30rpx;
}
.avatar-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}
.paw-icon {
  font-size: 45rpx;
  opacity: 0.3;
  transform: rotate(-15deg);
}
.bone-icon {
  font-size: 45rpx;
  opacity: 0.3;
  transform: rotate(15deg);
}
.avatar-img {
  width: 110rpx;
  height: 110rpx;
  position: relative;
  z-index: 1;
}
.welcome-text {
  text-align: center;
}
.welcome-text text {
  display: block;
  font-size: 30rpx;
  color: #D47836;
  line-height: 1.5;
}

/* 5. 聊天记录区 */
.chat-area {
  flex: 1;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
  max-height: 500rpx;
  min-height: 300rpx;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.message-item {
  display: flex;
}
.assistant-message {
  display: flex;
  gap: 12rpx;
  align-items: flex-start;
}
.assistant-avatar-small {
  width: 60rpx;
  height: 60rpx;
  background-color: #FFF2CC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.small-avatar-img {
  width: 40rpx;
  height: 40rpx;
}
.user-message {
  display: flex;
  justify-content: flex-end;
}
.message-bubble {
  max-width: 500rpx;
  padding: 16rpx 22rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  line-height: 1.4;
}
.assistant-bubble {
  background-color: #fff;
  color: #333;
  border-top-left-radius: 6rpx;
}
.user-bubble {
  background-color: #FFE0A8;
  color: #D47836;
  border-top-right-radius: 6rpx;
}
.triage-tag {
  margin-top: 10rpx;
}
.triage-tag text {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}
.triage-level1 {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.triage-level2 {
  background-color: #FFF3E0;
  color: #FF9800;
}
.triage-level3 {
  background-color: #FFEBEE;
  color: #F44336;
}

/* 6. 底部输入区 */
.input-area {
  display: flex;
  align-items: center;
  background-color: #fff;
  margin: 20rpx;
  padding: 12rpx 20rpx;
  border-radius: 40rpx;
  border: 1rpx solid #D47836;
}
.voice-icon {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.voice-emoji {
  font-size: 36rpx;
}
.message-input {
  flex: 1;
  font-size: 28rpx;
  height: 70rpx;
  padding: 0 15rpx;
}
.plus-icon {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plus-emoji {
  font-size: 36rpx;
}

/* 快捷选项弹窗 */
.menu-overlay {
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
.menu-popup {
  width: 60%;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  max-height: 60%;
  overflow-y: auto;
}
.menu-item {
  text-align: center;
  padding: 25rpx;
  border-bottom: 1rpx solid #eee;
  font-size: 28rpx;
  color: #333;
}
.menu-item:active {
  background-color: #FFF2D6;
}

/* 加载状态 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}
.loading-content {
  background-color: #fff;
  padding: 40rpx 60rpx;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}
.loading-icon {
  font-size: 50rpx;
  animation: bounce 1s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}
.loading-content text:last-child {
  font-size: 28rpx;
  color: #D47836;
}
</style>