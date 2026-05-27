<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user.js'
import request from '@/axios/index.js'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const userInfo = ref({
  name: '',
  phone: ''
})
const loading = ref(false)
const avatarFile = ref(null)
const avatarPreview = ref('')

// Load current user info
const loadUserInfo = () => {
  if (userStore.userInfo) {
    userInfo.value = {
      name: userStore.userInfo.name || '',
      phone: userStore.userInfo.phone || ''
    }
    avatarPreview.value = userStore.userInfo.avatarUrl || ''
  }
}

// Handle avatar file selection
const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    avatarFile.value = file
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Upload avatar
const uploadAvatar = async () => {
  if (!avatarFile.value) {
    ElMessage.warning('请选择要上传的头像')
    return
  }
  
  try {
    const formData = new FormData()
    formData.append('avatar', avatarFile.value)
    
    const response = await request.patch('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    const resBody = response && response.data ? response.data : null
    const dataPayload = resBody ? (resBody.data || resBody.result) : null
    const newAvatarUrl = dataPayload ? (dataPayload.avatarUrl || dataPayload.data?.avatarUrl) : null
    if (newAvatarUrl) {
      userStore.userInfo.avatarUrl = newAvatarUrl
      ElMessage.success('头像更新成功')
    } else {
      console.warn('uploadAvatar: 后端返回格式异常', response && response.data)
      ElMessage.success('头像上传成功（但未返回新 URL）')
    }
  } catch (error) {
    console.error('Avatar upload failed:', error)
    ElMessage.error('头像上传失败')
  }
}

// Update profile
const updateProfile = async () => {
  // Note: The backend doesn't have a direct endpoint for updating user profile
  // This is a placeholder implementation
  ElMessage.info('个人资料更新功能暂未实现')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="profile-container">
    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" style="width: 200px; margin-bottom: 20px;" />
        <el-skeleton-item variant="image" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px;" />
        <el-skeleton-item variant="rect" style="width: 100%; height: 40px; margin-bottom: 15px;" v-for="i in 2" :key="i" />
      </template>
      
      <template #default>
        <div class="profile-header">
          <h2>个人资料</h2>
        </div>
        
        <div class="profile-content">
          <div class="avatar-section">
            <div class="avatar-preview">
              <img :src="avatarPreview || 'https://via.placeholder.com/100x100'" alt="头像预览" />
            </div>
            <div class="avatar-upload">
              <input 
                type="file" 
                accept="image/*" 
                @change="handleAvatarChange"
                style="display: none;"
                ref="avatarInput"
              />
              <el-button 
                type="primary" 
                @click="$refs.avatarInput.click()"
              >
                选择头像
              </el-button>
              <el-button 
                type="success" 
                @click="uploadAvatar"
                :disabled="!avatarFile"
                style="margin-left: 10px;"
              >
                上传头像
              </el-button>
            </div>
          </div>
          
          <el-form :model="userInfo" label-width="80px" style="margin-top: 30px;">
            <el-form-item label="姓名">
              <el-input v-model="userInfo.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="userInfo.phone" placeholder="手机号码" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateProfile">保存修改</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 400px;
}

.profile-header h2 {
  margin: 0 0 20px 0;
  color: #303133;
}

.profile-content {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.avatar-preview img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-upload .el-button {
  margin-right: 10px;
}
</style>