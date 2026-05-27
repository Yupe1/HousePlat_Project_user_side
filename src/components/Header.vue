<script setup>
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user.js'
import { useRouter } from 'vue-router'
import request from '@/axios/index.js'
// 引入 Element Plus 的铃铛图标
import { Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()

// ===== 原有逻辑 =====
const formatPhone = (phone) => {
  return phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
}

const handleLogout = async () => {
  await request.post('/user/logout')
  userStore.clearUser()
  router.push('/shell/main')
}

// ===== 消息通知核心逻辑 =====
const unreadCount = ref(0)
const messages = ref([])

// 评价弹窗相关状态
const ratingVisible = ref(false)
const ratingValue = ref(0)
const currentRateMsg = ref(null)
const submitLoading = ref(false)

// 加载消息列表 (仅在已登录状态下调用)
const loadMessages = async () => {
  if (!userStore.userInfo) return
  
  try {
    // 假设后端提供了一个获取当前用户消息列表的接口
    const res = await request.get('/user/message')
    // 适配后端 ResultData 结构，提取列表
    const list = res.data?.result.messageList || []
    messages.value = list
    
    // 计算未读数量 (isRead === 0)
    unreadCount.value = list.filter(m => m.isRead === 0).length
  } catch (error) {
    console.error('获取消息列表失败:', error)
  }
}

// 监听登录状态变化：一旦监听到有 userInfo，立刻去拉取消息
watch(() => userStore.userInfo, (newVal) => {
  if (newVal) {
    loadMessages()
  } else {
    // 退出登录时清空数据
    messages.value = []
    unreadCount.value = 0
  }
}, { immediate: true }) // immediate: true 保证页面一刷新就执行一次

// 处理点击具体某条消息
const handleMessageClick = async (msg) => {
  // 1. 如果是未读消息，先调接口告诉后端已读
  if (msg.isRead === 0) {
    try {
      await request.put(`/user/message/${msg.id}`) 
      msg.isRead = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1) // 减去未读红点
    } catch (e) {
      console.error('标记已读失败', e)
    }
  }

  // 2. 根据消息类型(type)执行不同动作
  if (msg.type === 1) {
    // 【系统通知】：点完标为已读即可，不跳转
    return
  } else if (msg.type === 2) {
    // 【带看评价】：弹出打星弹窗
    currentRateMsg.value = msg
    ratingValue.value = 0 // 重置星星数量
    ratingVisible.value = true
  } else if (msg.type === 3) {
    // 【签约进度】：跳转到我的签约页面
    router.push('/shell/user/agreement')
  }
}

// 提交打星评价
const submitRating = async () => {
  if (ratingValue.value === 0) {
    ElMessage.warning('请先点亮星星进行评分')
    return
  }
  
  try {
    submitLoading.value = true
    // 调用之前写的 Patch 接口，更新 showingRecord
    // bizId 存的就是带看记录的 id
    await request.patch('/user/showingRecord', {
      id: currentRateMsg.value.bizId,
      score: ratingValue.value // 注意：这里假设你 ShowingRecord 实体类里用来评分的字段叫 score，需与后端对应
    })
    
    // 从消息列表中删除该条消息
    const msgIndex = messages.value.findIndex(m => m.id === currentRateMsg.value.id)
    if (msgIndex > -1) {
      messages.value.splice(msgIndex, 1)
    }
    
    ratingVisible.value = false // 关掉弹窗
    // 提示成功的弹窗 Axios 拦截器会帮我们做，这里省略
  } catch (error) {
    console.error('评价提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div class="header">
    <div class="left-nav">
      <router-link 
        to="/shell/main"
        custom
        v-slot="{ href, navigate, isActive }"
      >
        <a :href="href" @click="navigate" :class="{ 'router-link-active': isActive }">首页</a>
      </router-link>
      
      <router-link 
        :to="{ path: '/shell/search', query: { status: 2 } }"
        custom
        v-slot="{ href, navigate, isActive }"
      >
        <a :href="href" @click="navigate" :class="{ 'router-link-active': isActive && $route.query.status === '2' }">二手房</a>
      </router-link>
      
      <router-link 
        :to="{ path: '/shell/search', query: { status: 1 } }"
        custom
        v-slot="{ href, navigate, isActive }"
      >
        <a :href="href" @click="navigate" :class="{ 'router-link-active': isActive && $route.query.status === '1' }">租房</a>
      </router-link>
    </div>

    <div class="right-nav">
      <template v-if="userStore.userInfo">
        
        <el-popover placement="bottom" width="320" trigger="click" :popper-style="{ padding: '0' }">
          <template #reference>
            <div class="msg-bell-wrapper">
              <el-badge :value="unreadCount" :max="99" class="msg-badge" :hidden="unreadCount === 0">
                <el-icon class="msg-icon"><Bell /></el-icon>
              </el-badge>
            </div>
          </template>
          
          <div class="msg-panel">
            <div class="msg-panel-header">消息通知</div>
            <div class="msg-list" v-if="messages.length > 0">
              <div 
                v-for="msg in messages" 
                :key="msg.id" 
                class="msg-item"
                :class="{ 'is-unread': msg.isRead === 0 }"
                @click="handleMessageClick(msg)"
              >
                <div class="msg-title">
                  <span class="dot" v-if="msg.isRead === 0"></span>
                  {{ msg.title }}
                </div>
                <div class="msg-content">{{ msg.content }}</div>
                <div class="msg-time">{{ msg.createTime.replace('T', ' ') }}</div>
              </div>
            </div>
            <div class="msg-empty" v-else>暂无消息</div>
          </div>
        </el-popover>

        <el-dropdown>
          <span class="user-info">
            <el-avatar :src="userStore.userInfo.avatarUrl" size="small" />
            <span class="phone">
              {{ formatPhone(userStore.userInfo.phone) }}
            </span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push('/shell/user')">个人中心</el-dropdown-item>
              <el-dropdown-item @click="handleLogout" divided>登出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>

      <template v-else>
        <el-button link @click="$router.push('/shell/user/login')">登录</el-button>
        <el-button type="primary" @click="$router.push('/shell/user/register')">注册</el-button>
      </template>
    </div>

    <el-dialog v-model="ratingVisible" title="带看服务评价" width="400px" destroy-on-close>
      <div class="rating-dialog-content">
        <p class="rating-desc">{{ currentRateMsg?.content }}</p>
        <div class="rating-stars">
          <el-rate v-model="ratingValue" size="large" show-text :texts="['极差', '失望', '一般', '满意', '非常满意']" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="ratingVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitRating">
            提交评价
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header {
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

.left-nav a {
  margin-right: 16px;
  color: #606266;
  text-decoration: none;
}

.left-nav a.router-link-active {
  color: #409eff;
  font-weight: bold;
}

.right-nav {
  display: flex;
  align-items: center;
  gap: 20px; /* 控制铃铛和头像之间的间距 */
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.phone {
  font-size: 14px;
  color: #606266;
}

/* --- 消息铃铛样式 --- */
.msg-bell-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 5px;
  transition: all 0.3s;
}
.msg-bell-wrapper:hover .msg-icon {
  color: #409eff;
}
.msg-icon {
  font-size: 22px;
  color: #606266;
}

/* --- 悬浮窗面板样式 --- */
.msg-panel {
  display: flex;
  flex-direction: column;
  max-height: 400px;
}
.msg-panel-header {
  padding: 12px 16px;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
}
.msg-list {
  overflow-y: auto;
}
.msg-item {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}
.msg-item:hover {
  background-color: #f5f7fa;
}
/* 未读状态加粗并显示小蓝点 */
.msg-item.is-unread .msg-title {
  font-weight: bold;
  color: #303133;
}
.msg-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #f56c6c;
  border-radius: 50%;
  margin-right: 6px;
}
.msg-content {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  margin-bottom: 6px;
  /* 多行文本省略 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
.msg-time {
  font-size: 12px;
  color: #c0c4cc;
}
.msg-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* --- 打星弹窗内部样式 --- */
.rating-dialog-content {
  text-align: center;
  padding: 10px 0;
}
.rating-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}
.rating-stars {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>