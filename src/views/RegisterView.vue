<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/axios/index.js'
import { ElMessage } from 'element-plus'

const router = useRouter()

const registerForm = ref({
  phone: '',
  name: '',
  password: '',
  confirmPassword: ''
})
const loading = ref(false)

const handleRegister = async () => {
  try {
    loading.value = true
    
    // Validation
    if (!registerForm.value.phone) {
      ElMessage.warning('请输入手机号')
      return
    }
    if (!registerForm.value.name) {
      ElMessage.warning('请输入姓名')
      return
    }
    if (!registerForm.value.password) {
      ElMessage.warning('请输入密码')
      return
    }
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
      ElMessage.warning('两次输入的密码不一致')
      return
    }
    
    const userData = {
      phone: registerForm.value.phone,
      name: registerForm.value.name,
      password: registerForm.value.password
    }
    
    await request.post('/user/register', userData)
    
    ElMessage.success('注册成功，请登录')
    router.push('/shell/user/login')
  } catch (error) {
    console.error('Registration failed:', error)
    // Error handling is already done in axios interceptor
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/shell/user/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-form">
      <h2>用户注册</h2>
      
      <el-form :model="registerForm" label-width="80px">
        <el-form-item label="手机号">
          <el-input 
            v-model="registerForm.phone" 
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>
        
        <el-form-item label="姓名">
          <el-input 
            v-model="registerForm.name" 
            placeholder="请输入姓名"
          />
        </el-form-item>
        
        <el-form-item label="密码">
          <el-input 
            v-model="registerForm.password" 
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleRegister"
            :loading="loading"
            style="width: 100%;"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-link">
        <span>已有账号？</span>
        <el-link type="primary" @click="goToLogin">立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.register-form {
  width: 400px;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.register-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #606266;
}

.login-link .el-link {
  margin-left: 5px;
}
</style>