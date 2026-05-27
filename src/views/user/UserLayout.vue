<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = ref('')

// Update active menu based on current route
const updateActiveMenu = () => {
  const path = route.path
  if (path.includes('/favour')) {
    activeMenu.value = 'favour'
  } else if (path.includes('/agreement')) {
    activeMenu.value = 'agreement'
  } else if (path.includes('/mod')) {
    activeMenu.value = 'mod'
  } else {
    activeMenu.value = 'favour' // default
  }
}

// Handle menu click
const handleMenuClick = (menu) => {
  activeMenu.value = menu
  switch (menu) {
    case 'favour':
      router.push('/shell/user/favour')
      break
    case 'agreement':
      router.push('/shell/user/agreement')
      break
    case 'mod':
      router.push('/shell/user/mod')
      break
  }
}

// Logout
const handleLogout = () => {
  userStore.clearUser()
  router.push('/shell/user/login')
}

onMounted(() => {
  updateActiveMenu()
})
</script>

<template>
  <div class="user-layout">
    <div class="user-sidebar">
      <div class="user-info">
        <div class="avatar">
          <img 
            :src="userStore.userInfo?.avatarUrl || 'https://via.placeholder.com/60x60'" 
            alt="头像" 
            @click="handleMenuClick('mod')"
          />
        </div>
        <div class="user-name" @click="handleMenuClick('mod')">
          {{ userStore.userInfo?.name || '未登录用户' }}
        </div>
        <div class="user-phone">
          {{ userStore.userInfo?.phone || '请登录' }}
        </div>
      </div>
      
      <el-menu 
        :default-active="activeMenu" 
        class="user-menu"
        @select="handleMenuClick"
      >
        <el-menu-item index="favour">
          <el-icon><Star /></el-icon>
          <span>我的收藏</span>
        </el-menu-item>
        <el-menu-item index="agreement">
          <el-icon><Document /></el-icon>
          <span>我的签约</span>
        </el-menu-item>
        <el-menu-item index="mod">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </el-menu-item>
        <el-menu-item index="logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span style="margin-top: 200px;font-style: oblique;font-weight: 900;">
            退出登录</span>
        </el-menu-item>
      </el-menu>
    </div>
    
    <div class="user-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.user-layout {
  display: flex;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  min-height: 500px;
}

.user-sidebar {
  width: 220px;
  border-right: 1px solid #ebeef5;
}

.user-info {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
}

.avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  object-fit: cover;
}

.user-name {
  margin-top: 10px;
  font-weight: bold;
  color: #303133;
  cursor: pointer;
}

.user-phone {
  color: #909399;
  font-size: 14px;
  margin-top: 5px;
}

.user-menu {
  border-right: none;
}

.user-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.user-menu .el-menu-item i {
  margin-right: 10px;
}

.user-content {
  flex: 1;
  padding: 20px;
}
</style>