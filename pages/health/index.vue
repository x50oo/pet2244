<template>
  <view class="health-page">
    <!-- 1. 切换宠物入口（右上角） -->
    <view class="switch-pet-wrapper">
      <view class="switch-pet" @tap="togglePetList">
        <image class="switch-avatar" :src="currentPet.avatar" mode="aspectFill" />
        <text class="switch-text">切换宠物</text>
        <text class="switch-arrow">{{ showPetList ? '▲' : '▼' }}</text>
      </view>
      
      <!-- 宠物下拉列表（在按钮下方） -->
      <view class="pet-dropdown" v-if="showPetList">
        <view class="pet-dropdown-item" v-for="pet in petList" :key="pet.id" @tap="selectPet(pet)">
          <image class="pet-dropdown-avatar" :src="pet.avatar" mode="aspectFill" />
          <view class="pet-dropdown-info">
            <view class="pet-dropdown-name-row">
              <text class="pet-dropdown-name">{{ pet.name }}</text>
              <text class="pet-dropdown-gender" :class="pet.gender === '公' ? 'male' : 'female'">{{ pet.gender === '公' ? '♂' : '♀' }}</text>
            </view>
            <text class="pet-dropdown-type">{{ pet.type }} · {{ pet.breed }}</text>
          </view>
        </view>
        <view class="pet-dropdown-add" @tap="addNewPet">
          <text>+ 添加宠物</text>
        </view>
      </view>
    </view>

    <!-- 2. 宠物档案卡片 -->
    <view class="pet-card">
      <view class="pet-info">
        <image class="pet-avatar" :src="currentPet.avatar" mode="aspectFill" />
        <view class="pet-details">
          <text class="section-title">宠物档案</text>
          <view class="name-row">
            <text class="pet-name">{{ currentPet.name }}</text>
            <text class="gender-icon" :class="currentPet.gender === '公' ? 'male' : 'female'">{{ currentPet.gender === '公' ? '♂' : '♀' }}</text>
          </view>
          <view class="tags">
            <text class="tag">{{ currentPet.type }}</text>
            <text class="tag">{{ currentPet.breed }}</text>
          </view>
        </view>
        <view class="edit-btn" @tap="showEditModal">
          <text class="edit-icon">✎</text>
        </view>
      </view>
      <view class="expand-btn" @tap="toggleExpand">
        <text>{{ isExpanded ? '收起 ▲' : '展开 ▼' }}</text>
      </view>

      <!-- 展开后的详细信息 -->
      <view class="expanded-info" v-if="isExpanded">
        <view class="info-item">
          <text class="label">出生日期：</text>
          <text class="value">{{ currentPet.birthday || '未填写' }}</text>
        </view>
        <view class="info-item">
          <text class="label">健康状态：</text>
          <text class="value">{{ currentPet.healthStatus || '未填写' }}</text>
        </view>
        <view class="info-item">
          <text class="label">体重：</text>
          <text class="value">{{ currentPet.weight ? currentPet.weight + 'kg' : '未填写' }}</text>
        </view>
        <view class="info-item">
          <text class="label">是否绝育：</text>
          <text class="value">{{ currentPet.isNeutered || '未填写' }}</text>
        </view>
        <view class="info-item">
          <text class="label">是否注射疫苗：</text>
          <text class="value">{{ currentPet.isVaccinated || '未填写' }}</text>
        </view>
        <view class="info-item">
          <text class="label">宠物介绍：</text>
          <view class="intro-box">
            <text>{{ currentPet.intro || '暂无介绍' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 编辑档案弹窗 -->
    <view class="modal-overlay" v-if="showEditModalFlag" @tap="closeEditModal">
      <view class="edit-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">编辑档案</text>
          <view class="close-btn" @tap="closeEditModal">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <view class="input-group">
          <input class="modal-input" v-model="editPet.name" placeholder="昵称" />
          <input class="modal-input" v-model="editPet.breed" placeholder="品种" />
          <picker mode="date" :value="editPet.birthday" @change="onBirthdayChange">
            <view class="modal-input picker-input">{{ editPet.birthday || '请选择出生日期' }}</view>
          </picker>
          <input class="modal-input" v-model="editPet.weight" placeholder="体重(kg)" type="digit" />
          <textarea class="modal-textarea" v-model="editPet.intro" placeholder="宠物介绍" />
        </view>
        <button class="submit-btn" @tap="saveEdit">保存修改</button>
      </view>
    </view>

    <!-- 3. 症状自查按钮 -->
    <view class="symptom-btn" @tap="goToSymptom">
      <text>症状自查</text>
    </view>

    <!-- 4. 日历组件（默认收起） -->
    <view class="calendar-section">
      <view class="calendar-header" @tap="toggleCalendar">
        <view class="date-info">
          <text class="current-date">{{ currentYear }}年{{ currentMonth }}月</text>
          <text class="selected-hint" v-if="selectedDayNum">（选中 {{ selectedDayNum }}日）</text>
        </view>
        <text class="arrow-icon">{{ showCalendar ? '▲' : '▼' }}</text>
      </view>
      
      <view class="calendar-content" v-if="showCalendar">
        <view class="week-header">
          <text class="week-day" v-for="day in weekDays" :key="day">{{ day }}</text>
        </view>
        <view class="calendar-body">
          <view class="calendar-row" v-for="(row, rowIndex) in calendarData" :key="rowIndex">
            <view
              class="calendar-day"
              v-for="(day, colIndex) in row"
              :key="colIndex"
              :class="{
                'past-day': day.isPast,
                'selected-day': day.isSelected,
                'marked-day': day.isMarked,
                'today-day': day.isToday
              }"
              @tap="selectDay(day)"
            >
              <text class="day-num">{{ day.num }}</text>
              <text class="day-lunar">{{ day.lunar }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 5. 健康记录区 -->
    <view class="record-section">
      <view class="record-item" v-for="(record, index) in records" :key="index">
        <text class="item-name">{{ record.name }}：</text>
        <text class="item-value" v-if="record.value">{{ record.value }}{{ record.unit }}</text>
        <text class="item-time" v-if="record.time">{{ record.time }}</text>
        <text class="item-note" v-if="record.note">{{ record.note }}</text>
        <text class="delete-icon" @tap="deleteRecord(index, record.id)">🗑️</text>
      </view>

      <view class="action-btns">
        <button class="action-btn add-record" @tap="openRecordModal">
          <text class="btn-icon">➕</text>
          <text>添加记录</text>
        </button>
        <button class="action-btn add-reminder" @tap="openReminderModal">
          <text class="btn-icon">⏰</text>
          <text>添加提醒</text>
        </button>
      </view>
    </view>

    <!-- 添加记录弹窗 -->
    <view class="modal-overlay" v-if="showRecordModal" @tap="closeRecordModal">
      <view class="record-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">添加健康记录</text>
          <view class="close-btn" @tap="closeRecordModal">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <scroll-view class="modal-scroll" scroll-y>
          <view class="input-group">
            <picker :range="recordTypeOptions" @change="onRecordTypeChange">
              <view class="modal-input picker-input">记录类型：{{ recordTypeOptions[recordTypeIndex] }}</view>
            </picker>
            <picker mode="date" :value="recordForm.recordDate" @change="onRecordDateChange">
              <view class="modal-input picker-input">记录日期：{{ recordForm.recordDate || '请选择日期' }}</view>
            </picker>
            <input class="modal-input" v-model="recordForm.title" placeholder="标题（必填）" />
            <textarea class="modal-textarea" v-model="recordForm.content" placeholder="详细内容" />
            <input class="modal-input" v-model="recordForm.weight" placeholder="体重(kg)" type="digit" v-if="recordForm.recordType === 'daily'" />
            <picker mode="date" :value="recordForm.nextDueDate" @change="onNextDueDateChange" v-if="recordForm.recordType === 'vaccine' || recordForm.recordType === 'deworming'">
              <view class="modal-input picker-input">下次提醒日期：{{ recordForm.nextDueDate || '请选择' }}</view>
            </picker>
          </view>
        </scroll-view>
        <button class="submit-btn" @tap="submitRecord">添加记录</button>
      </view>
    </view>

    <!-- 添加提醒弹窗 -->
    <view class="modal-overlay" v-if="showReminderModal" @tap="closeReminderModal">
      <view class="reminder-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">添加提醒</text>
          <view class="close-btn" @tap="closeReminderModal">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <view class="input-group">
          <input class="reminder-input" v-model="reminderForm.title" placeholder="提醒事件（必填）" />
          <input class="reminder-input" v-model="reminderForm.content" placeholder="详细说明" />
          <picker :range="reminderTypeOptions" @change="onReminderTypeChange">
            <view class="reminder-input picker-input">提醒类型：{{ reminderTypeOptions[reminderTypeIndex] }}</view>
          </picker>
          <picker mode="datetime" :value="reminderForm.remindTime" @change="onReminderTimeChange">
            <view class="reminder-input picker-input">提醒时间：{{ reminderForm.remindTime || '请选择时间' }}</view>
          </picker>
          <picker :range="repeatTypeOptions" @change="onRepeatTypeChange">
            <view class="reminder-input picker-input">重复方式：{{ repeatTypeOptions[repeatTypeIndex] }}</view>
          </picker>
        </view>
        <button class="submit-btn" @tap="submitReminder">添加提醒</button>
      </view>
    </view>

    <!-- 6. 底部Tab栏 -->
    <view class="tabbar">
      <view class="tabbar-item" :class="{ active: currentTab === 'home' }" @tap="switchTab('home')">
        <image class="tabbar-icon" :src="currentTab === 'home' ? '/static/tabbar/home-active.png' : '/static/tabbar/home.png'" mode="aspectFit" />
        <text class="tabbar-text">首页</text>
      </view>
      <view class="tabbar-item active" :class="{ active: currentTab === 'health' }" @tap="switchTab('health')">
        <image class="tabbar-icon" :src="currentTab === 'health' ? '/static/tabbar/health-active.png' : '/static/tabbar/health.png'" mode="aspectFit" />
        <text class="tabbar-text">健康</text>
      </view>
      <view class="tabbar-item add-btn" @tap="switchTab('publish')">
        <image class="tabbar-icon add-icon" src="/static/tabbar/add-active.png" mode="aspectFit" />
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'message' }" @tap="switchTab('message')">
        <image class="tabbar-icon" :src="currentTab === 'message' ? '/static/tabbar/message-active.png' : '/static/tabbar/message.png'" mode="aspectFit" />
        <text class="tabbar-text">消息</text>
      </view>
      <view class="tabbar-item" :class="{ active: currentTab === 'profile' }" @tap="switchTab('profile')">
        <image class="tabbar-icon" :src="currentTab === 'profile' ? '/static/tabbar/user-active.png' : '/static/tabbar/user.png'" mode="aspectFit" />
        <text class="tabbar-text">个人中心</text>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

// 宠物类型映射
const typeMap = {
  'dog': '犬类', 'cat': '猫类', 'bird': '鸟类',
  'rabbit': '兔类', 'hamster': '仓鼠', 'other': '其他'
}

const typeReverseMap = {
  '犬类': 'dog', '猫类': 'cat', '鸟类': 'bird',
  '兔类': 'rabbit', '仓鼠': 'hamster', '其他': 'other'
}

export default {
  data() {
    return {
      // UI状态
      currentTab: 'health',
      isExpanded: false,
      showPetList: false,
      showCalendar: false,
      showEditModalFlag: false,
      showReminderModal: false,
      showRecordModal: false,
      loading: false,
      
      // 日历数据
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      selectedDayNum: new Date().getDate(),
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      calendarData: [],
      
      // 宠物数据
      petList: [],
      currentPet: {
        id: null,
        name: '',
        avatar: '/static/default-avatar.png',
        gender: '',
        type: '',
        breed: '',
        birthday: '',
        healthStatus: '',
        weight: '',
        isNeutered: '',
        isVaccinated: '',
        intro: ''
      },
      editPet: {},
      
      // 健康记录
      records: [],
      
      // 提醒表单
      reminderForm: {
        petId: null,
        reminderType: 'other',
        title: '',
        content: '',
        remindTime: '',
        repeatType: 'none'
      },
      reminderTypeOptions: ['疫苗', '驱虫', '医疗', '洗澡', '其他'],
      reminderTypeMap: { '疫苗': 'vaccine', '驱虫': 'deworming', '医疗': 'medical', '洗澡': 'bath', '其他': 'other' },
      reminderTypeIndex: 4,
      repeatTypeOptions: ['不重复', '每天', '每周', '每月'],
      repeatTypeMap: { '不重复': 'none', '每天': 'daily', '每周': 'weekly', '每月': 'monthly' },
      repeatTypeIndex: 0,
      
      // 健康记录表单
      recordForm: {
        petId: null,
        recordType: 'daily',
        recordDate: '',
        title: '',
        content: '',
        weight: null,
        nextDueDate: ''
      },
      recordTypeOptions: ['日常', '喂养', '疫苗', '驱虫', '医疗', '其他'],
      recordTypeMap: { '日常': 'daily', '喂养': 'feeding', '疫苗': 'vaccine', '驱虫': 'deworming', '医疗': 'medical', '其他': 'other' },
      recordTypeIndex: 0
    }
  },
  onLoad() {
    this.loadPetList()
    this.generateCalendar()
  },
  onShow() {
    // 从添加宠物页返回时刷新
    if (this.currentPet?.id) {
      this.loadPetDetail(this.currentPet.id)
      this.loadHealthData()
    }
  },
  methods: {
    // ========== 宠物相关 ==========
    async loadPetList() {
      this.loading = true
      try {
        const res = await request({ url: '/api/pets/mine', method: 'GET' })
        this.petList = (res || []).map(pet => ({
          id: pet.id,
          name: pet.name,
          avatar: pet.avatarUrl || '/static/default-avatar.png',
          gender: pet.gender === 1 ? '公' : '母',
          type: typeMap[pet.petType] || pet.petType,
          breed: pet.breed,
          healthStatus: pet.healthStatus,
          weight: pet.weight,
          birthday: pet.birthDate,
          isNeutered: pet.sterilized ? '是' : '否',
          isVaccinated: pet.vaccinated ? '是' : '否',
          intro: pet.description,
          auditStatus: pet.auditStatus
        }))
        
        if (this.petList.length > 0 && !this.currentPet?.id) {
          this.currentPet = this.petList[0]
          this.loadHealthData()
        } else if (this.petList.length > 0 && this.currentPet?.id) {
          const found = this.petList.find(p => p.id === this.currentPet.id)
          if (found) this.currentPet = found
          else this.currentPet = this.petList[0]
          this.loadHealthData()
        }
      } catch (error) {
        console.error('加载宠物列表失败', error)
        this.useMockPetData()
      } finally {
        this.loading = false
      }
    },
    
    async loadPetDetail(petId) {
      try {
        const res = await request({ url: `/api/pets/${petId}`, method: 'GET' })
        const pet = {
          id: res.id,
          name: res.name,
          avatar: res.avatarUrl || '/static/default-avatar.png',
          gender: res.gender === 1 ? '公' : '母',
          type: typeMap[res.petType] || res.petType,
          breed: res.breed,
          healthStatus: res.healthStatus,
          weight: res.weight,
          birthday: res.birthDate,
          isNeutered: res.sterilized ? '是' : '否',
          isVaccinated: res.vaccinated ? '是' : '否',
          intro: res.description,
          auditStatus: res.auditStatus
        }
        this.currentPet = pet
        // 同步更新列表中的宠物信息
        const index = this.petList.findIndex(p => p.id === petId)
        if (index !== -1) this.petList[index] = pet
      } catch (error) {
        console.error('加载宠物详情失败', error)
      }
    },
    
    async loadHealthData() {
      if (!this.currentPet?.id) return
      await Promise.all([
        this.loadRecords(),
        this.loadReminders()
      ])
    },
    
    // ========== 健康记录 ==========
    async loadRecords() {
      try {
        const res = await request({
          url: `/api/health/records?petId=${this.currentPet.id}`,
          method: 'GET'
        })
        this.records = (res || []).map(record => ({
          id: record.id,
          name: record.title,
          value: record.recordType === 'feeding' ? record.foodAmount : (record.weight || ''),
          unit: record.recordType === 'feeding' ? 'g' : (record.weight ? 'kg' : ''),
          time: record.recordDate,
          note: record.content,
          type: record.recordType
        }))
      } catch (error) {
        console.log('加载记录失败', error)
        this.useMockRecords()
      }
    },
    
    openRecordModal() {
      if (!this.currentPet?.id) {
        uni.showToast({ title: '请先添加宠物', icon: 'none' })
        return
      }
      this.recordForm = {
        petId: this.currentPet.id,
        recordType: 'daily',
        recordDate: new Date().toISOString().split('T')[0],
        title: '',
        content: '',
        weight: null,
        nextDueDate: ''
      }
      this.recordTypeIndex = 0
      this.showRecordModal = true
    },
    
    async submitRecord() {
      if (!this.recordForm.title) {
        uni.showToast({ title: '请输入标题', icon: 'none' })
        return
      }
      
      uni.showLoading({ title: '添加中...' })
      try {
        const data = {
          petId: this.recordForm.petId,
          recordType: this.recordForm.recordType,
          recordDate: this.recordForm.recordDate,
          title: this.recordForm.title,
          content: this.recordForm.content,
          weight: this.recordForm.weight ? parseFloat(this.recordForm.weight) : null,
          nextDueDate: this.recordForm.nextDueDate || null
        }
        
        await request({ url: '/api/health/records', method: 'POST', data })
        
        uni.hideLoading()
        uni.showToast({ title: '添加成功', icon: 'success' })
        this.showRecordModal = false
        this.loadRecords()
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: error.message || '添加失败', icon: 'none' })
      }
    },
    
    async deleteRecord(index, recordId) {
      if (!recordId) {
        this.records.splice(index, 1)
        return
      }
      
      uni.showModal({
        title: '确认删除',
        content: '确定删除该记录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await request({ url: `/api/health/records/${recordId}`, method: 'DELETE' })
              this.records.splice(index, 1)
              uni.showToast({ title: '删除成功', icon: 'success' })
            } catch (error) {
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    // ========== 提醒相关 ==========
    async loadReminders() {
      try {
        const res = await request({
          url: `/api/health/reminders?petId=${this.currentPet.id}`,
          method: 'GET'
        })
        this.reminders = res || []
        this.generateCalendar() // 刷新日历标记
      } catch (error) {
        console.log('加载提醒失败', error)
        this.reminders = []
      }
    },
    
    openReminderModal() {
      if (!this.currentPet?.id) {
        uni.showToast({ title: '请先添加宠物', icon: 'none' })
        return
      }
      this.reminderForm = {
        petId: this.currentPet.id,
        reminderType: 'other',
        title: '',
        content: '',
        remindTime: '',
        repeatType: 'none'
      }
      this.reminderTypeIndex = 4
      this.repeatTypeIndex = 0
      this.showReminderModal = true
    },
    
    async submitReminder() {
      if (!this.reminderForm.title) {
        uni.showToast({ title: '请输入提醒事件', icon: 'none' })
        return
      }
      if (!this.reminderForm.remindTime) {
        uni.showToast({ title: '请选择提醒时间', icon: 'none' })
        return
      }
      
      uni.showLoading({ title: '添加中...' })
      try {
        await request({ url: '/api/health/reminders', method: 'POST', data: this.reminderForm })
        
        uni.hideLoading()
        uni.showToast({ title: '提醒已添加', icon: 'success' })
        this.showReminderModal = false
        this.loadReminders()
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: error.message || '添加失败', icon: 'none' })
      }
    },
    
    // ========== 宠物切换/编辑 ==========
    selectPet(pet) {
      this.currentPet = pet
      this.showPetList = false
      this.loadHealthData()
      uni.showToast({ title: `切换到${pet.name}`, icon: 'success' })
    },
    
    addNewPet() {
      this.showPetList = false
      uni.navigateTo({ url: '/pages/user/pet/edit' })
    },
    
    showEditModal() {
      this.editPet = { ...this.currentPet }
      this.showEditModalFlag = true
    },
    
    closeEditModal() {
      this.showEditModalFlag = false
    },
    
    async saveEdit() {
      if (!this.editPet.name) {
        uni.showToast({ title: '请输入昵称', icon: 'none' })
        return
      }
      
      uni.showLoading({ title: '保存中...' })
      try {
        await request({
          url: `/api/pets/${this.currentPet.id}`,
          method: 'PUT',
          data: {
            name: this.editPet.name,
            gender: this.editPet.gender === '公' ? 1 : 0,
            petType: typeReverseMap[this.editPet.type] || 'other',
            breed: this.editPet.breed,
            birthDate: this.editPet.birthday,
            weight: parseFloat(this.editPet.weight) || 0,
            healthStatus: this.editPet.healthStatus,
            sterilized: this.editPet.isNeutered === '是',
            vaccinated: this.editPet.isVaccinated === '是',
            description: this.editPet.intro
          }
        })
        
        this.currentPet = { ...this.editPet }
        // 更新列表中的宠物信息
        const index = this.petList.findIndex(p => p.id === this.currentPet.id)
        if (index !== -1) this.petList[index] = { ...this.currentPet }
        
        this.closeEditModal()
        uni.hideLoading()
        uni.showToast({ title: '保存成功，等待审核', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: error.message || '保存失败', icon: 'none' })
      }
    },
    
    // ========== 辅助方法 ==========
    goToSymptom() {
      uni.navigateTo({ url: '/pages/pet/symptom' })
    },
    
    onBirthdayChange(e) {
      this.editPet.birthday = e.detail.value
    },
    
    onRecordTypeChange(e) {
      this.recordTypeIndex = parseInt(e.detail.value)
      this.recordForm.recordType = this.recordTypeMap[this.recordTypeOptions[this.recordTypeIndex]]
    },
    
    onRecordDateChange(e) {
      this.recordForm.recordDate = e.detail.value
    },
    
    onNextDueDateChange(e) {
      this.recordForm.nextDueDate = e.detail.value
    },
    
    onReminderTypeChange(e) {
      this.reminderTypeIndex = parseInt(e.detail.value)
      this.reminderForm.reminderType = this.reminderTypeMap[this.reminderTypeOptions[this.reminderTypeIndex]]
    },
    
    onReminderTimeChange(e) {
      this.reminderForm.remindTime = e.detail.value
    },
    
    onRepeatTypeChange(e) {
      this.repeatTypeIndex = parseInt(e.detail.value)
      this.reminderForm.repeatType = this.repeatTypeMap[this.repeatTypeOptions[this.repeatTypeIndex]]
    },
    
    // ========== 模拟数据（后端不可用时）==========
    useMockPetData() {
      this.petList = [
        { id: 1, name: '布丁', avatar: '/static/bird-avatar.jpg', gender: '母', type: '鸟类', breed: '虎皮鹦鹉', healthStatus: '良好', weight: '4.2', birthday: '2024-05-15', isNeutered: '是', isVaccinated: '是', intro: '这是一只蓝白色的鹦鹉，性格温和', auditStatus: 2 },
        { id: 2, name: '旺财', avatar: '/static/pet2.jpg', gender: '公', type: '犬类', breed: '金毛', healthStatus: '健康', weight: '28', birthday: '2023-01-15', isNeutered: '否', isVaccinated: '是', intro: '性格温顺的金毛', auditStatus: 2 }
      ]
      if (!this.currentPet?.id) this.currentPet = this.petList[0]
      this.useMockRecords()
    },
    
    useMockRecords() {
      this.records = [
        { id: 1, name: '喂食', value: '150', unit: 'g', time: '2024-04-10', note: '正常进食' },
        { id: 2, name: '饮水', value: '300', unit: 'ml', time: '2024-04-10', note: '饮水正常' },
        { id: 3, name: '疫苗', value: '', unit: '', time: '2024-03-15', note: '狂犬疫苗' }
      ]
    },
    
    // ========== UI交互 ==========
    toggleExpand() { this.isExpanded = !this.isExpanded },
    togglePetList() { this.showPetList = !this.showPetList },
    toggleCalendar() { this.showCalendar = !this.showCalendar },
    closeReminderModal() { this.showReminderModal = false },
    closeRecordModal() { this.showRecordModal = false },
    
    generateCalendar() {
      const year = this.currentYear
      const month = this.currentMonth
      const firstDay = new Date(year, month - 1, 1).getDay()
      const daysInMonth = new Date(year, month, 0).getDate()
      const today = new Date()
      const todayYear = today.getFullYear()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()
      
      // 获取有提醒的日期
      const markedDates = (this.reminders || []).map(r => {
        if (!r.remindTime) return null
        const d = new Date(r.remindTime)
        return d.getDate()
      }).filter(Boolean)
      
      const calendar = []
      let day = 1
      for (let i = 0; i < 6; i++) {
        const row = []
        for (let j = 0; j < 7; j++) {
          if (i === 0 && j < firstDay) {
            row.push({ num: '', lunar: '', isPast: true, isSelected: false, isMarked: false, isToday: false })
          } else if (day > daysInMonth) {
            row.push({ num: '', lunar: '', isPast: true, isSelected: false, isMarked: false, isToday: false })
          } else {
            const isPast = (year < todayYear) || (year === todayYear && month < todayMonth) || (year === todayYear && month === todayMonth && day < todayDay)
            const isSelected = (day === this.selectedDayNum)
            const isMarked = markedDates.includes(day)
            const isToday = (year === todayYear && month === todayMonth && day === todayDay)
            row.push({ num: day, lunar: '', isPast, isSelected, isMarked, isToday })
            day++
          }
        }
        calendar.push(row)
        if (day > daysInMonth) break
      }
      this.calendarData = calendar
    },
    
    selectDay(day) {
      if (!day.num || day.isPast) return
      for (let row of this.calendarData) {
        for (let d of row) d.isSelected = false
      }
      day.isSelected = true
      this.selectedDayNum = day.num
      uni.showToast({ title: `已选择 ${this.currentMonth}月${day.num}日`, icon: 'none' })
    },
    
    switchTab(tab) {
      this.currentTab = tab
      if (tab === 'home') {
        uni.reLaunch({ url: '/pages/home/index' })
      } else if (tab === 'health') {
        return  // 当前页面
      } else if (tab === 'publish') {
        // 发布按钮 - 显示选择菜单
        uni.showActionSheet({
          itemList: ['发布寻宠', '发布托管'],
          success: (res) => {
            if (res.tapIndex === 0) {
              uni.navigateTo({ url: '/pages/seek/publish' })
            } else if (res.tapIndex === 1) {
              uni.navigateTo({ url: '/pages/foster/publish' })
            }
          }
        })
      } else if (tab === 'message') {
        uni.reLaunch({ url: '/pages/message/list/list' })
      } else if (tab === 'profile') {
        uni.reLaunch({ url: '/pages/user/profile/index' })
      }
    }
  }
}
</script>

<style scoped>
.health-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 120rpx;
}

/* 1. 切换宠物入口 */
.switch-pet-wrapper {
  position: relative;
  display: flex;
  justify-content: flex-end;
  padding: 20rpx 30rpx;
}
.switch-pet {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background-color: #fff;
  padding: 8rpx 18rpx;
  border-radius: 40rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}
.switch-avatar {
  width: 45rpx;
  height: 45rpx;
  border-radius: 50%;
  background-color: #eee;
}
.switch-text {
  font-size: 24rpx;
  color: #D47836;
}
.switch-arrow {
  font-size: 22rpx;
  color: #D47836;
}

/* 宠物下拉列表 */
.pet-dropdown {
  position: absolute;
  top: 70rpx;
  right: 30rpx;
  width: 260rpx;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.15);
  z-index: 100;
}
.pet-dropdown-item {
  display: flex;
  align-items: center;
  padding: 12rpx;
  gap: 10rpx;
  border-bottom: 1rpx solid #eee;
}
.pet-dropdown-avatar {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background-color: #eee;
}
.pet-dropdown-info {
  flex: 1;
}
.pet-dropdown-name-row {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-bottom: 4rpx;
}
.pet-dropdown-name {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
}
.pet-dropdown-gender {
  font-size: 20rpx;
}
.pet-dropdown-gender.male { color: #2196F3; }
.pet-dropdown-gender.female { color: #E91E63; }
.pet-dropdown-type {
  font-size: 20rpx;
  color: #666;
}
.pet-dropdown-add {
  text-align: center;
  padding: 12rpx;
  background-color: #FFF2D6;
  color: #D47836;
  font-size: 24rpx;
}

/* 2. 宠物档案卡片 */
.pet-card {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 16rpx;
}
.pet-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.pet-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background-color: #eee;
}
.pet-details {
  flex: 1;
}
.section-title {
  display: block;
  font-size: 24rpx;
  font-weight: bold;
  color: #D47836;
  margin-bottom: 6rpx;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 6rpx;
}
.pet-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
.gender-icon {
  font-size: 24rpx;
}
.gender-icon.male { color: #2196F3; }
.gender-icon.female { color: #E91E63; }
.tags {
  display: flex;
  gap: 10rpx;
}
.tag {
  background-color: #FFE0A8;
  color: #D47836;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
}
.edit-btn {
  width: 42rpx;
  height: 42rpx;
  background-color: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-icon {
  font-size: 24rpx;
  color: #999;
}
.expand-btn {
  text-align: center;
  color: #D47836;
  font-size: 24rpx;
  padding: 12rpx 0 4rpx;
  border-top: 1rpx solid #eee;
  margin-top: 14rpx;
}
.expanded-info {
  margin-top: 14rpx;
}
.info-item {
  margin-bottom: 14rpx;
}
.label {
  font-size: 24rpx;
  color: #666;
  width: 160rpx;
  display: inline-block;
}
.value {
  font-size: 24rpx;
  color: #333;
}
.intro-box {
  background-color: #E8F5E0;
  padding: 14rpx;
  border-radius: 10rpx;
  margin-top: 6rpx;
}
.intro-box text {
  font-size: 24rpx;
  color: #333;
  line-height: 1.5;
}

/* 3. 症状自查按钮 */
.symptom-btn {
  background-color: #FFFFCC;
  margin: 0 20rpx 20rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  text-align: center;
}
.symptom-btn text {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}

/* 4. 日历组件 */
.calendar-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 20rpx;
  border-radius: 16rpx;
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;
}
.date-info {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}
.current-date {
  font-size: 32rpx;
  color: #D47836;
  font-weight: bold;
}
.selected-hint {
  font-size: 24rpx;
  color: #FF4444;
}
.arrow-icon {
  font-size: 28rpx;
  color: #D47836;
}
.calendar-content {
  margin-top: 15rpx;
}
.week-header {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15rpx;
  background-color: #FFF2D6;
  padding: 10rpx 0;
  border-radius: 30rpx;
}
.week-day {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
  width: 12%;
  text-align: center;
}
.calendar-body {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.calendar-row {
  display: flex;
  justify-content: space-around;
}
.calendar-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12%;
  padding: 10rpx 6rpx;
  border-radius: 50%;
}
.calendar-day:active {
  background-color: #FFF2D6;
}
.day-num {
  font-size: 34rpx;
  font-weight: bold;
  margin-bottom: 6rpx;
  color: #333;
}
.day-lunar {
  font-size: 20rpx;
  color: #999;
}
.past-day {
  opacity: 0.5;
}
.past-day .day-num {
  color: #aaa;
  font-weight: normal;
}
.past-day .day-lunar {
  color: #bbb;
}
.selected-day {
  background-color: #FF4444;
}
.selected-day .day-num,
.selected-day .day-lunar {
  color: #fff;
}
.marked-day {
  background-color: #FFD700;
}
.marked-day .day-num,
.marked-day .day-lunar {
  color: #D47836;
  font-weight: bold;
}
.today-day {
  border: 2rpx solid #D47836;
}
.today-day .day-num {
  color: #D47836;
}

/* 5. 健康记录区 */
.record-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  padding: 20rpx;
  border-radius: 16rpx;
}
.record-item {
  display: flex;
  align-items: center;
  background-color: #FFF6E6;
  padding: 14rpx;
  border-radius: 10rpx;
  margin-bottom: 10rpx;
}
.item-name {
  font-size: 24rpx;
  color: #D47836;
  font-weight: bold;
}
.item-value {
  font-size: 24rpx;
  color: #D47836;
  margin-left: 6rpx;
}
.item-time {
  font-size: 22rpx;
  color: #D47836;
  margin-left: 6rpx;
}
.item-note {
  font-size: 22rpx;
  color: #D47836;
  margin-left: 6rpx;
}
.delete-icon {
  font-size: 26rpx;
  margin-left: auto;
  color: #999;
}
.action-btns {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 14rpx;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background-color: #FFF6E6;
  border: none;
  border-radius: 10rpx;
  padding: 14rpx;
  font-size: 24rpx;
  color: #D47836;
}
.btn-icon {
  font-size: 28rpx;
}
.action-btn::after {
  border: none;
}

/* 弹窗通用样式 */
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
.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 20rpx;
}
.modal-title {
  font-size: 28rpx;
  color: #D47836;
  font-weight: bold;
}
.close-btn {
  position: absolute;
  right: 0;
  top: 0;
}
.close-icon {
  font-size: 34rpx;
  color: #999;
}

/* 编辑弹窗 */
.edit-modal {
  width: 80%;
  max-height: 80%;
  background-color: #FFECC2;
  border-radius: 20rpx;
  padding: 25rpx;
}
.modal-scroll {
  max-height: 500rpx;
}
.modal-input {
  width: 100%;
  height: 55rpx;
  background-color: #fff;
  border-radius: 10rpx;
  padding: 0 15rpx;
  font-size: 24rpx;
  margin-bottom: 12rpx;
}
.picker-input {
  line-height: 55rpx;
  color: #333;
}
.modal-textarea {
  width: 100%;
  height: 100rpx;
  background-color: #fff;
  border-radius: 10rpx;
  padding: 12rpx;
  font-size: 24rpx;
  margin-bottom: 12rpx;
}
.submit-btn {
  width: 100%;
  height: 55rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border: none;
  border-radius: 10rpx;
  font-size: 26rpx;
  margin-top: 8rpx;
}

/* 提醒弹窗 */
.reminder-modal {
  width: 80%;
  background-color: #FFECC2;
  border-radius: 20rpx;
  padding: 25rpx;
}
.reminder-input {
  width: 100%;
  height: 55rpx;
  background-color: #fff;
  border-radius: 10rpx;
  padding: 0 15rpx;
  font-size: 24rpx;
  margin-bottom: 12rpx;
}

/* 记录弹窗 */
.record-modal {
  width: 80%;
  max-height: 80%;
  background-color: #FFECC2;
  border-radius: 20rpx;
  padding: 25rpx;
}

/* 底部Tab栏 */
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #FFF9CC;
  padding: 12rpx 0;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
}
.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.tabbar-icon {
  width: 44rpx;
  height: 44rpx;
}
.tabbar-text {
  font-size: 20rpx;
  color: #666;
}
.tabbar-item.active .tabbar-text {
  color: #D47836;
}
.add-btn {
  position: relative;
  top: -16rpx;
}
.add-icon {
  background-color: #D47836;
  border-radius: 50%;
  padding: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(212, 120, 54, 0.3);
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
</style>