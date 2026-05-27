// stores/user.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

const imgBaseUrl = import.meta.env.VITE_IMAGE_BASE || 'http://localhost:8080'
const formatImageUrl = (path) => {
  if (!path) return null
  path = path.trim()
  if (/^https?:\/\//i.test(path)) return path
  return imgBaseUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
}

export const useUserStore = defineStore('user', () => {
  // 初始化时，直接去 localStorage 捞一把（捞不到就是 null）
  const storedUser = localStorage.getItem('userInfo')
  const userInfo = ref(storedUser ? JSON.parse(storedUser) : null)

  // 登录成功后调用这个方法存数据
  const setUser = (data) => {
    if (data) {
      // 拦截：如果返回的用户数据中包含 avatarUrl，统一转换为绝对路径
      if (data.avatarUrl) {
        data.avatarUrl = formatImageUrl(data.avatarUrl)
      }
    }
  
    // 赋值给响应式变量
    userInfo.value = data
    // 存入本地缓存，此时存入的也是拼接好 http://localhost:8080 的完整路径
    localStorage.setItem('userInfo', JSON.stringify(data))
  }

  // 登出时调用这个方法清空数据
  const clearUser = () => {
    userInfo.value = null
    localStorage.removeItem('userInfo')
  }

  return { userInfo, setUser, clearUser }
})