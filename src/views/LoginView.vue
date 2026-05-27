<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import request from '@/axios/index.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
  phone: '',
  password: ''
})
const loading = ref(false)

const handleLogin = async () => {
  try {
    loading.value = true
    
    // Basic validation
    if (!loginForm.value.phone) {
      ElMessage.warning('请输入手机号')
      return
    }
    if (!loginForm.value.password) {
      ElMessage.warning('请输入密码')
      return
    }
    
    const response = await request.post('/user/login', loginForm.value)
    const userData = response.data.result?.user;
    // Save user info to store
    userStore.setUser(userData)
    
    // Redirect to home page

    router.push('/shell/main')
  } catch (error) {
    console.error('Login failed:', error)
    // Error handling is already done in axios interceptor
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/shell/user/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-form">
      <h2>用户登录</h2>
      
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="手机号">
          <el-input 
            v-model="loginForm.phone" 
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>
        
        <el-form-item label="密码">
          <el-input 
            v-model="loginForm.password" 
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin"
            :loading="loading"
            style="width: 100%;"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-link">
        <span>还没有账号？</span>
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.login-form {
  width: 400px;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #606266;
}

.register-link .el-link {
  margin-left: 5px;
}
</style>