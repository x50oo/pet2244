const request = require('../request.js')

// 发送验证码
const sendCode = (phone) => {
  return request.post('/api/auth/send-code', { phone })
}

// 手机号登录
const phoneLogin = (phone, code) => {
  return request.post('/api/auth/phone-login', { phone, code })
}

// 微信登录
const wechatLogin = (code) => {
  return request.post('/api/auth/wechat-login', { code })
}

// 获取当前用户信息
const getUserInfo = () => {
  return request.get('/api/user/me')
}

// 编辑用户资料
const updateUserProfile = (nickname, avatarUrl) => {
  return request.put('/api/user/profile', { nickname, avatarUrl })
}

module.exports = {
  sendCode,
  phoneLogin,
  wechatLogin,
  getUserInfo,
  updateUserProfile
}