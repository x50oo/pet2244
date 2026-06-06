// utils/request.js
import config from './config.js'

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    // 公开接口列表（精确匹配，不含 /mine）
    const publicApis = [
      '/api/auth/phone-login',
      '/api/auth/send-code',
      '/api/auth/register',
      '/api/auth/wechat-login',
      '/api/admin/login',
      '/api/banners',
      '/api/lost-pet/posts',
      '/api/boarding/shops',
      '/api/health/symptoms',
      '/api/health/symptom-check',
      '/api/health/diagnosis',
      '/api/search',
      '/api/member/packages'
    ]
    
    // 判断是否是公开接口（精确匹配，且排除 /mine）
    let isPublicApi = false
    for (let api of publicApis) {
      // 如果请求的URL包含公开接口路径
      if (options.url.includes(api)) {
        // 特殊处理：如果请求的是 /mine 结尾的接口，不是公开接口
        if (options.url.includes('/mine')) {
          isPublicApi = false
        } else {
          isPublicApi = true
        }
        break
      }
    }
    
    // 单独处理 /api/foster/orders 广场接口（公开），但 /mine 除外
    if (options.url.includes('/api/foster/orders')) {
      if (options.url.includes('/mine')) {
        isPublicApi = false
      } else {
        isPublicApi = true
      }
    }
    
    console.log('请求URL:', config.baseUrl + options.url)
    console.log('是否公开接口:', isPublicApi)
    console.log('当前token:', token ? token.substring(0, 30) + '...' : '无')
    
    const header = {
      'Content-Type': 'application/json'
    }
    
    if (!isPublicApi && token) {
      // 确保 token 格式正确
      const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
      header['Authorization'] = cleanToken
      console.log('已添加 Authorization header')
    }
    
    uni.request({
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      success: (res) => {
        console.log('接口响应:', options.url, res.statusCode, res.data)
        
        if (res.data.code === 200 && res.data.success === true) {
          resolve(res.data.data)
        } else if (res.data.code === 401) {
          if (!isPublicApi) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            setTimeout(() => {
              uni.reLaunch({ url: '/pages/auth/login/login' })
            }, 1500)
          }
          reject(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export default request