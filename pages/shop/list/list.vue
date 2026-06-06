<template>
  <view class="shop-list-page">
    <!-- 1. 顶部导航栏（无返回箭头） -->
    <view class="nav-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="搜索宠物店..." v-model="keyword" />
      </view>
      <button class="search-btn" @tap="searchShop">搜索</button>
    </view>

    <!-- 2. 筛选栏 -->
    <view class="filter-bar">
      <view class="location">
        <text class="loc-icon">📍</text>
        <text class="loc-text">番禺区贝岗</text>
      </view>
      <view class="sort-tabs">
        <text class="tab-item" :class="{ active: activeSort === 'all' }" @tap="changeSort('all')">综合排序</text>
        <text class="tab-item" :class="{ active: activeSort === 'score' }" @tap="changeSort('score')">评分最高</text>
        <text class="tab-item" :class="{ active: activeSort === 'distance' }" @tap="changeSort('distance')">离我最近</text>
      </view>
    </view>

    <!-- 3. 宠物店列表 -->
    <view class="shop-list">
      <view class="shop-item" v-for="(item, index) in shopList" :key="index" @tap="goShopDetail(item)">
        <image class="shop-avatar" :src="item.avatar" mode="aspectFill" />
        <view class="shop-info">
          <view class="info-top">
            <text class="shop-name">{{ item.name }}</text>
            <text class="score">综合评分：{{ item.score }}</text>
          </view>
          <view class="info-bottom">
            <view class="address-wrap">
              <text class="loc-icon">📍</text>
              <text class="address">{{ item.address }}</text>
            </view>
            <text class="distance">距离 {{ item.distance }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      keyword: '',
      activeSort: 'all',
      shopList: [
        { id: 1, avatar: '/static/shop1.jpg', name: '嘻嘻宠物店', score: 4.8, address: '番禺区贝岗商业街101号', distance: '0.5km' },
        { id: 2, avatar: '/static/shop2.jpg', name: '哈哈宠物店', score: 4.6, address: '番禺区大学城路58号', distance: '1.2km' },
        { id: 3, avatar: '/static/shop3.jpg', name: '嘿嘿宠物店', score: 4.9, address: '番禺区小谷围街15号', distance: '0.8km' }
      ]
    }
  },
  methods: {
    searchShop() {
      uni.showToast({ title: '搜索：' + this.keyword, icon: 'none' })
    },
    changeSort(type) {
      this.activeSort = type
      let sortedList = [...this.shopList]
      if (type === 'score') {
        sortedList.sort((a, b) => b.score - a.score)
      } else if (type === 'distance') {
        sortedList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      }
      this.shopList = sortedList
    },
    goShopDetail(item) {
      uni.navigateTo({
        url: `/pages/shop/detail/detail?id=${item.id}`
      })
    }
  }
}
</script>

<style scoped>
.shop-list-page {
  min-height: 100vh;
  background-color: #FFF9E6;
  padding-bottom: 40rpx;
}

/* 1. 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx;
  gap: 20rpx;
  background-color: #FFF9E6;
}
.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 50rpx;
  padding: 0 20rpx;
}
.search-icon {
  font-size: 30rpx;
  margin-right: 10rpx;
  color: #999;
}
.search-input {
  flex: 1;
  height: 70rpx;
  font-size: 28rpx;
}
.search-btn {
  width: 120rpx;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #FFE0A8;
  color: #D47836;
  border-radius: 50rpx;
  font-size: 28rpx;
  border: none;
}
.search-btn::after {
  border: none;
}

/* 2. 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
}
.location {
  display: flex;
  align-items: center;
}
.loc-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}
.loc-text {
  font-size: 26rpx;
  color: #666;
}
.sort-tabs {
  display: flex;
  gap: 20rpx;
}
.tab-item {
  font-size: 26rpx;
  color: #666;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  background-color: #f5f5f5;
}
.tab-item.active {
  background-color: #FFE0A8;
  color: #D47836;
}

/* 3. 宠物店列表 */
.shop-list {
  padding: 0 20rpx;
}
.shop-item {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}
.shop-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #eee;
  flex-shrink: 0;
}
.shop-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 15rpx;
}
.info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.shop-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.score {
  font-size: 26rpx;
  color: #D47836;
}
.info-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.address-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.address {
  font-size: 24rpx;
  color: #666;
}
.distance {
  font-size: 24rpx;
  color: #2E8B57;
}
</style>