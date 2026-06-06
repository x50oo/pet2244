<template>
  <view class="container">
    <!-- 普通用户卡片 -->
    <view class="card" @tap="goUserLogin">
      <view class="avatar">
        <image class="user-icon" src="/static/user-icon.png" mode="aspectFit"></image>
      </view>
      <view class="btn">普通用户</view>
    </view>

    <!-- 管理员卡片 -->
    <view class="card" @tap="goAdminLogin">
      <view class="avatar">
        <image class="admin-icon" src="/static/admin-icon.png" mode="aspectFit"></image>
      </view>
      <view class="btn">管理员</view>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goUserLogin() {
      uni.navigateTo({
        url: "/pages/auth/login/login"
      })
    },
    goAdminLogin() {
      uni.navigateTo({
        url: "/pages/auth/adminLogin/adminLogin"
      })
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #FFF9E6;
  padding: 40rpx;
  padding-top: calc(100vh / 8);
  gap: 80rpx;
}

.card {
  width: 85%;
  background-color: #FFEBCD;
  border-radius: 60rpx;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 50rpx;
}

.avatar {
  width: 220rpx;
  height: 220rpx;
  background-color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-icon, .admin-icon {
  width: 120rpx;
  height: 120rpx;
}

.btn {
  width: 300rpx;
  height: 90rpx;
  line-height: 90rpx;
  background-color: #FFFFFF;
  color: #FFB94E;
  text-align: center;
  border-radius: 45rpx;
  font-size: 34rpx;
  font-weight: bold;
}
</style>修改对接后端