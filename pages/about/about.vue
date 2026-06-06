<template>
	<view class="about">
		<view class="content">
			<!-- 平台Logo -->
			<view class="logo-wrap">
				<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
				<text class="app-name">宠安心</text>
				<text class="version">v{{ version }}</text>
			</view>
			
			<!-- 平台介绍 -->
			<view class="desc">
				<text class="desc-text">{{ aboutInfo.description || '宠安心是一个专业的宠物服务平台，为您提供寻宠、托管、寄养、健康管理等一站式服务。' }}</text>
			</view>
			
			<!-- 联系信息 -->
			<view class="contact">
				<view class="contact-item" v-if="contactInfo.phone">
					<text class="label">客服电话：</text>
					<text class="value" @tap="makeCall(contactInfo.phone)">{{ contactInfo.phone }}</text>
				</view>
				<view class="contact-item" v-if="contactInfo.email">
					<text class="label">客服邮箱：</text>
					<text class="value">{{ contactInfo.email }}</text>
				</view>
				<view class="contact-item" v-if="contactInfo.wechat">
					<text class="label">微信公众号：</text>
					<text class="value">{{ contactInfo.wechat }}</text>
				</view>
			</view>
			
			<!-- 协议链接 -->
			<view class="links">
				<text class="link" @tap="viewAgreement('user')">用户协议</text>
				<text class="separator">|</text>
				<text class="link" @tap="viewAgreement('privacy')">隐私政策</text>
				<text class="separator">|</text>
				<text class="link" @tap="viewAgreement('child')">儿童隐私政策</text>
			</view>
			
			<!-- 分享按钮 -->
			<button type="primary" @tap="shareApp" class="share-btn">分享给好友</button>
		</view>
		
		<!-- 版权信息 -->
		<view class="copyright">
			<text>Copyright © 2024 宠安心</text>
			<text>All Rights Reserved</text>
		</view>
	</view>
</template>

<script>
import request from '@/utils/request.js'

export default {
	data() {
		return {
			version: '1.0.0',
			aboutInfo: {
				description: ''
			},
			contactInfo: {
				phone: '',
				email: '',
				wechat: ''
			}
		}
	},
	onLoad() {
		this.getVersion()
		this.getAboutInfo()
		this.getContactInfo()
	},
	methods: {
		// 获取版本号
		getVersion() {
			// #ifdef APP-PLUS
			this.version = plus.runtime.version
			// #endif
			// #ifdef MP-WEIXIN
			// 小程序可以从后端获取版本
			this.fetchVersionFromApi()
			// #endif
		},
		
		// 从后端获取版本
		async fetchVersionFromApi() {
			try {
				const res = await request({
					url: '/common/version',
					method: 'GET'
				})
				this.version = res.version || '1.0.0'
			} catch (error) {
				console.log('获取版本失败', error)
			}
		},
		
		// 获取关于我们信息
		async getAboutInfo() {
			try {
				const res = await request({
					url: '/common/about',
					method: 'GET'
				})
				this.aboutInfo = res || {}
			} catch (error) {
				console.log('获取关于信息失败，使用默认数据', error)
				// 使用默认数据
				this.aboutInfo = {
					description: '宠安心是一个专业的宠物服务平台，为您提供寻宠、托管、寄养、健康管理等一站式服务。'
				}
			}
		},
		
		// 获取联系信息
		async getContactInfo() {
			try {
				const res = await request({
					url: '/common/contact',
					method: 'GET'
				})
				this.contactInfo = res || {}
			} catch (error) {
				console.log('获取联系信息失败', error)
				// 使用默认数据
				this.contactInfo = {
					phone: '400-888-8888',
					email: 'service@chonganxin.com',
					wechat: '宠安心官方'
				}
			}
		},
		
		// 拨打电话
		makeCall(phone) {
			if (!phone) return
			uni.makePhoneCall({
				phoneNumber: phone
			})
		},
		
		// 查看协议
		async viewAgreement(type) {
			let title = ''
			let url = ''
			
			switch(type) {
				case 'user':
					title = '用户协议'
					url = '/common/agreement/user'
					break
				case 'privacy':
					title = '隐私政策'
					url = '/common/agreement/privacy'
					break
				case 'child':
					title = '儿童隐私政策'
					url = '/common/agreement/child'
					break
			}
			
			try {
				const res = await request({
					url: url,
					method: 'GET'
				})
				// 跳转到协议详情页
				uni.navigateTo({
					url: `/pages/common/webview?title=${title}&content=${encodeURIComponent(res.content || '')}`
				})
			} catch (error) {
				console.log('获取协议失败', error)
				uni.showToast({
					title: '获取协议内容失败',
					icon: 'none'
				})
			}
		},
		
		// 分享应用
		shareApp() {
			// #ifdef APP-PLUS
			this.appShare()
			// #endif
			// #ifdef MP-WEIXIN
			this.mpShare()
			// #endif
		},
		
		// APP分享
		appShare() {
			uni.share({
				provider: 'weixin',
				scene: 'WXSceneSession',
				type: 0,
				title: '宠安心 - 宠物服务平台',
				summary: '专业的宠物服务平台，寻宠、托管、寄养一站式解决',
				imageUrl: 'https://your-domain.com/share-icon.png',
				href: 'https://your-domain.com/download',
				success: () => {
					uni.showToast({
						title: '分享成功',
						icon: 'success'
					})
				},
				fail: (err) => {
					console.log('分享失败', err)
					uni.showToast({
						title: '分享失败',
						icon: 'none'
					})
				}
			})
		},
		
		// 小程序分享
		mpShare() {
			uni.showToast({
				title: '点击右上角分享给好友',
				icon: 'none'
			})
		}
	},
	
	// 小程序分享配置
	onShareAppMessage() {
		return {
			title: '宠安心 - 宠物服务平台',
			path: '/pages/home/index',
			imageUrl: 'https://your-domain.com/share-icon.png'
		}
	}
}
</script>

<style>
page {
	background-color: #FFFFFF;
}

.about {
	min-height: 100vh;
	padding: 60rpx 40rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.content {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.logo-wrap {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 60rpx;
}

.logo {
	width: 160rpx;
	height: 160rpx;
	border-radius: 32rpx;
	margin-bottom: 20rpx;
}

.app-name {
	font-size: 40rpx;
	font-weight: bold;
	color: #D4A036;
	margin-bottom: 10rpx;
}

.version {
	font-size: 24rpx;
	color: #999;
}

.desc {
	margin-bottom: 50rpx;
}

.desc-text {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
}

.contact {
	background-color: #F9F9F9;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 40rpx;
}

.contact-item {
	display: flex;
	margin-bottom: 20rpx;
	font-size: 28rpx;
}

.contact-item:last-child {
	margin-bottom: 0;
}

.contact-item .label {
	color: #999;
	width: 160rpx;
}

.contact-item .value {
	color: #333;
	flex: 1;
}

.links {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 50rpx;
}

.link {
	font-size: 26rpx;
	color: #007AFF;
}

.separator {
	margin: 0 20rpx;
	color: #ccc;
}

.share-btn {
	background-color: #D4A036;
	color: #fff;
	border-radius: 50rpx;
	margin-top: 20rpx;
}

.copyright {
	margin-top: 60rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	font-size: 22rpx;
	color: #ccc;
	line-height: 1.5;
}
</style>