<script setup>
import Header from '@/components/Header.vue'
</script>

<template>
  <div class="main-layout">
    <!-- 顶部导航（统一由 Header 组件渲染） -->
    <Header />

    <!-- 核心区域：这里是子路由（首页、搜索页）展示的地方 -->
    <main class="main-content">
      <!-- 添加一个过渡动画让页面切换更丝滑（可选） -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 底部区域 (可选) -->
    <footer class="site-footer">
      <p>© 2023 房产中介系统 - 提供最优质的找房体验</p>
    </footer>
  </div>
</template>

<style scoped>
/* 整个布局的基础样式 */
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 顶部导航栏样式 */
.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 64px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
}

.nav-links a {
  text-decoration: none;
  color: #606266;
  margin: 0 20px;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #409eff; /* 激活时的颜色 */
}

.user-actions .login-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-actions .login-btn:hover {
  background-color: #66b1ff;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
  display: flex;
  align-items: center;
}

/* 主体内容区域撑满剩余空间 */
.main-content {
  flex: 1;
  padding: 20px 40px;
}

/* 底部样式 */
.site-footer {
  text-align: center;
  padding: 20px;
  background-color: #ffffff;
  color: #909399;
  font-size: 14px;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>