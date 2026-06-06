<template>
  <view class="splash-container">
    <image class="bg-image" src="/static/splash.jpg" mode="aspectFill"></image>
  </view>
</template>

<script>
export default {
  onLoad() {
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/auth/choose/choose'
      })
    }, 2000)
  }
}
</script>

<style scoped>
.splash-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #fff;
}

.bg-image {
  width: 100%;
  height: 100%;
}
</style>