<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDictStore } from '@/stores/dict.js'
import { useUserStore } from '@/stores/user.js'
import request from '@/axios/index.js'
import { ElMessage } from 'element-plus'
import { Phone, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const dictStore = useDictStore()
const userStore = useUserStore()

const house = ref(null)
const loading = ref(false)
const isFavorited = ref(false)
const favoriteLoading = ref(false)

// 经纪人相关
const agentInfo = ref(null)
const agentLoading = ref(false)
const contactDialogVisible = ref(false)
const contactMessage = ref('')

// 【新增】图片预览浮窗相关状态
const previewVisible = ref(false)
const previewIndex = ref(0)

const openPreview = (index) => {
  previewIndex.value = index
  previewVisible.value = true
}

const prevImage = () => {
  previewIndex.value = (previewIndex.value - 1 + carouselImages.value.length) % carouselImages.value.length
}

const nextImage = () => {
  previewIndex.value = (previewIndex.value + 1) % carouselImages.value.length
}

// 【核心修改】定义你的 Nginx 图片基础路径
// 优先使用环境变量，如果没有则回退到写死的本地 Nginx 地址
// const imgBaseUrl = import.meta.env.VITE_IMAGE_BASE || 'http://localhost:8080'
const imgBaseUrl = import.meta.env.VITE_IMAGE_BASE || ''

// 辅助函数：将相对路径转为带域名的绝对路径
const formatImageUrl = (path) => {
  if (!path) return null
  path = path.trim()
  // 如果已经是 http 开头，直接返回
  if (/^https?:\/\//i.test(path)) return path
  // 否则拼接 Nginx 地址
  return imgBaseUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
}

// 【核心修改】一次性计算出所有轮播图的真实 URL 数组
const carouselImages = computed(() => {
  if (!house.value) return []

  const list = []

  // 1. 塞入封面图
  if (house.value.coverUrl) {
    list.push(house.value.coverUrl.trim())
  }

  // 2. 塞入多图 (拆分逗号)
  // 注意：你后端实体类里叫 mediaUrl，别写成 media
  if (house.value.mediaUrl) {
    const medias = house.value.mediaUrl.split(',')
    medias.forEach(p => {
      if (p && p.trim()) list.push(p.trim())
    })
  }

  // 3. 去重 (Set) 并拼接上 localhost:8080
  const uniquePaths = Array.from(new Set(list))
  return uniquePaths.map(path => formatImageUrl(path)).filter(Boolean)
})


// Load house detail (keep your original fix)
const loadHouseDetail = async () => {
  try {
    loading.value = true 
    const houseId = route.params.houseId
    const response = await request.get(`/user/house/${houseId}`)
    
    // Simplified data extraction to avoid TypeScript parsing issues
    const responseData = response?.data
    let houseData = null
    
    if (responseData) {
      // Check for different possible response structures
      if (responseData.data) {
        // Handle case where data is in data property
        if (responseData.data.detail !== undefined) {
          houseData = responseData.data.detail
        } else if (responseData.data.house !== undefined) {
          houseData = responseData.data.house
        } else {
          houseData = responseData.data
        }
      } else if (responseData.result) {
        // Handle case where data is in result property
        if (responseData.result.detail !== undefined) {
          houseData = responseData.result.detail
        } else if (responseData.result.house !== undefined) {
          houseData = responseData.result.house
        } else {
          houseData = responseData.result
        }
      } else {
        // Handle case where data is at root level
        houseData = responseData
      }
    }
    
    if (!houseData) {
      console.warn('loadHouseDetail: Backend returned abnormal format', response?.data)
      house.value = null
    } else {
      house.value = houseData
      // 加载经纪人信息
      if (houseData.maintainerId) {
        await loadAgentInfo(houseData.maintainerId)
      }
    }
    
    // If user is logged in, check if this house is favorited
    if (userStore.userInfo) {
      await checkFavoriteStatus(houseId)
    }
  } catch (error) {
    console.error('Failed to load house detail:', error)
  } finally {
    loading.value = false
  }
}

// 加载经纪人信息
const loadAgentInfo = async (agentId) => {
  if (!agentId) return
  
  try {
    agentLoading.value = true
    const response = await request.get(`user/agent/${agentId}`)
    const resultObj = response.data?.result
    
    if (resultObj && resultObj.agent) {
      agentInfo.value = resultObj.agent
    }
  } catch (error) {
    console.error('Failed to load agent info:', error)
    ElMessage.error('获取经纪人信息失败')
  } finally {
    agentLoading.value = false
  }
}

// 打开联系对话框
const openContactDialog = () => {
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录后再联系经纪人')
    router.push('/shell/user/login')
    return
  }
  contactDialogVisible.value = true
}

// 发送联系消息
const handleSendMessage = async () => {
  if (!contactMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  // TODO: 这里预留了发送消息到经纪人的接口
  // 可以根据实际需求实现消息发送逻辑
  
  ElMessage.success('消息已发送，经纪人会尽快回复您')
  contactMessage.value = ''
  contactDialogVisible.value = false
}

// 检查房源是否被收藏
const checkFavoriteStatus = async (houseId) => {
  try {
    const response = await request.get('/user/favorites')
    const resultObj = response.data?.result
    
    // 直接提取 "收藏列表" 数组，若无则默认为空数组
    const favoritesList = resultObj ? (resultObj['收藏列表'] || []) : []
    
    // 遍历比对当前 houseId 是否存在于列表中
    // 注意：确保类型一致，建议双等号 == 或转换后使用 ===
    const favorited = favoritesList.some(houseItem => String(houseItem.id) === String(houseId))
    isFavorited.value = favorited

  } catch (error) {
    console.error('Failed to check favorite status:', error)
    // 如果获取收藏列表失败（例如 token 过期或未登录），保持未收藏状态
    isFavorited.value = false
  }
}

// Get dictionary options
const houseTypeOptions = computed(() => {
  return dictStore.dicts.house_type || []
})

const orientationOptions = computed(() => {
  return dictStore.dicts.house_orientation || []
})

const decorationOptions = computed(() => {
  return dictStore.dicts.house_decoration || []
})

const statusOptions = computed(() => [
  { dictValue: 1, dictLabel: '待租' },
  { dictValue: 2, dictLabel: '待售' },
  { dictValue: 3, dictLabel: '已租' },
  { dictValue: 4, dictLabel: '已售' },
  { dictValue: 5, dictLabel: '下架' }
])

// Format floor display (0 = 低楼层, 1 = 高楼层)
const formatFloor = (floorNo) => {
  return floorNo === 0 ? '低楼层' : floorNo === 1 ? '高楼层' : '未知'
}

// Format house type
const formatHouseType = (houseType) => {
  const option = houseTypeOptions.value.find(opt => parseInt(opt.dictValue) === houseType)
  return option ? option.dictLabel : '未知类型'
}

// Format orientation
const formatOrientation = (orientation) => {
  const option = orientationOptions.value.find(opt => parseInt(opt.dictValue) === orientation)
  return option ? option.dictLabel : '朝向未知'
}

// Format decoration
const formatDecoration = (decoration) => {
  const option = decorationOptions.value.find(opt => parseInt(opt.dictValue) === decoration)
  return option ? option.dictLabel : '装修未知'
}

// Format status
const formatStatus = (status) => {
  const option = statusOptions.value.find(opt => opt.dictValue === status)
  return option ? option.dictLabel : '状态未知'
}

// 处理收藏按钮点击
const handleFavorite = async () => {
  // 1. 未登录状态：直接跳转登录页面
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录后再收藏房源')
    router.push('/shell/user/login')
    return
  }

  try {
    favoriteLoading.value = true
    
    if (isFavorited.value) {
      // 2. 取消收藏 (因为后端改成了收 houseId，这里直接传 id 就行)
      await request.delete('/user/favorites', { 
        params: { houseId: house.value.id } 
      })
      isFavorited.value = false
      
    } else {
      // 3. 添加收藏
      await request.post('/user/favorites', null, { 
        params: { houseId: house.value.id } 
      })
      isFavorited.value = true
      
    }
  } catch (error) {
    console.error('Favorite operation failed:', error)
    
  } finally {
    favoriteLoading.value = false
  }
}

onMounted(async () => {
  await dictStore.fetchInitData()
  await loadHouseDetail()
})
</script>

<template>
  <div class="house-detail-container">
    <el-skeleton :loading="loading" animated>
      <template #template>
        <div class="house-header">
          <el-skeleton-item variant="image" style="width: 100%; height: 300px;" />
        </div>
        <div class="house-content">
          <el-skeleton-item variant="h3" style="width: 60%" />
          <el-skeleton-item variant="text" style="width: 40%; margin-top: 10px;" />
          <el-skeleton-item variant="text" style="width: 80%; margin-top: 20px;" />
          <el-skeleton-item variant="text" style="width: 100%; margin-top: 10px;" />
          <el-skeleton-item variant="text" style="width: 70%; margin-top: 10px;" />
        </div>
      </template>
      
      <template #default>
        <div v-if="house" class="house-detail">
          <!-- 【新增】如果房源已逻辑删除（下架/失效），顶部展示醒目红色警告 -->
          <el-alert
            v-if="house.isDeleted === 1"
            title="⚠️ 该房源已下架或失效，当前页面仅供查看历史记录"
            type="error"
            :closable="false"
            style="margin-bottom: 20px;"
          />
          <!-- 标题和状态 -->
          <div class="house-title">
            <div class="title-left">
              <h2>{{ house.communityName }} {{ house.districtName }}</h2>
              <div class="house-status">
                <el-tag v-if="house.isDeleted === 1" type="danger">已失效</el-tag>
                <el-tag :type="house.status === 1 ? 'success' : house.status === 2 ? 'warning' : 'info'">
                  {{ formatStatus(house.status) }}
                </el-tag>
              </div>
            </div>
            <!-- 价格和按钮 -->
            <div class="house-price-section">
              <div class="price-display">
                <span class="price">{{ house.price }}</span>
                <span class="unit">{{ house.status === 1 ? '元/月' : '万元' }}</span>
              </div>
              <!-- <div class="price-note">
                {{ house.status === 1 ? '租金' : '售价' }}
              </div> -->
            </div>
          
            <div class="house-actions">
              <!-- <el-button type="primary" size="large">立即预约看房</el-button> -->
              <el-button 
                  :type="isFavorited ? 'warning' : 'default'" 
                  :plain="!isFavorited"
                  size="large"
                  :loading="favoriteLoading"
                  :disabled="house.isDeleted === 1"
                  @click="handleFavorite">

                  <span v-if="isFavorited">💛 已收藏</span>
                  <span v-else>🤍 收藏</span>

              </el-button>
            </div>
          </div>
          
          <!-- 图片轮播和经纪人信息 -->
          <div class="house-header-wrapper">
            <!-- 图片区域 -->
            <div class="house-header"> 
              <!-- 情况1：有多张图，显示走马灯轮播 -->
              <template v-if="carouselImages.length > 1">
                <el-carousel height="300px" trigger="click">
                  <el-carousel-item v-for="(img, idx) in carouselImages" :key="idx">
                    <el-image 
                      :src="img" 
                      alt="房源图片" 
                      class="carousel-image"
                      @click="openPreview(idx)"
                      style="cursor: pointer;"
                    />
                  </el-carousel-item>
                </el-carousel>
              </template>
              
              <!-- 情况2：只有1张图（通常是只有封面），单图展示 -->
              <template v-else-if="carouselImages.length === 1">
                <el-image 
                  :src="carouselImages[0]" 
                  alt="房源封面" 
                  class="carousel-image"
                  @click="openPreview(0)"
                  style="cursor: pointer;"
                />
              </template>
              
              <!-- 情况3：后端一张图都没传，显示占位骨架或默认图 -->
              <template v-else>
                <div style="width: 100%; height: 300px; background: #f5f7fa; display: flex; align-items: center; justify-content: center; color: #909399;">
                  暂无房源图片
                </div>
              </template>

              <!-- 【新增】大图预览浮窗 -->
              <el-dialog 
                v-model="previewVisible" 
                title="图片预览"
                width="80%"
                :close-on-click-modal="true"
                center
                class="preview-dialog"
              >
                <div class="preview-container">
                  <img :src="carouselImages[previewIndex]" alt="房源大图" class="preview-image" />
                  
                  <!-- 导航按钮（多图时显示） -->
                  <div v-if="carouselImages.length > 1" class="preview-nav">
                    <el-button type="primary" circle @click="prevImage">
                      <span>❮</span>
                    </el-button>
                    <span class="image-counter">{{ previewIndex + 1 }} / {{ carouselImages.length }}</span>
                    <el-button type="primary" circle @click="nextImage">
                      <span>❯</span>
                    </el-button>
                  </div>
                </div>
              </el-dialog>
            </div>
            
            <!-- 经纪人信息区域 -->
            <div class="agent-section">
              <el-skeleton :loading="agentLoading" animated>
                <template #template>
                  <el-skeleton-item variant="circle" style="width: 80px; height: 80px;" />
                  <el-skeleton-item variant="text" style="width: 60%; margin-top: 10px;" />
                  <el-skeleton-item variant="text" style="width: 80%; margin-top: 10px;" />
                  <el-skeleton-item variant="button" style="width: 100%; margin-top: 20px; height: 40px;" />
                </template>
                
                <template #default>
                  <div v-if="agentInfo" class="agent-info">
                    <div class="agent-avatar">
                      <el-avatar :size="80" :src="agentInfo.avatar || ''">
                        {{ agentInfo.name?.charAt(0) || '经' }}
                      </el-avatar>
                    </div>
                    <div class="agent-details">
                      <h3 class="agent-name">{{ agentInfo.name }}</h3>
                      <div class="agent-phone">
                        <el-icon><Phone /></el-icon>
                        <span>{{ agentInfo.phone }}</span>
                      </div>
                      <el-button 
                        type="primary" 
                        class="contact-btn"
                        @click="openContactDialog"
                        :disabled="house.isDeleted === 1">
                        <el-icon><ChatDotRound /></el-icon>
                        联系经纪人
                      </el-button>
                    </div>
                  </div>
                  <div v-else class="no-agent">
                    <el-empty description="暂无经纪人信息" :image-size="100" />
                  </div>
                </template>
              </el-skeleton>
            </div>
          </div>
          
          
          
          <!-- 基本信息 -->
          <div class="house-content">
            <div class="house-basic-info">
              <div class="info-row">
                <span class="label">类型：</span>
                <span class="value">{{ formatHouseType(house.houseType) }}</span>
              </div>
              <div class="info-row">
                <span class="label">居室厅卫：</span>
                <span class="value">{{ house.roomNum }}室{{ house.hallNum }}厅{{ house.bathroomNum }}卫</span>
              </div>
              <div class="info-row">
                <span class="label">建筑面积：</span>
                <span class="value">{{ house.area }}㎡</span>
              </div>
              <div class="info-row">
                <span class="label">楼层位置：</span>
                <span class="value">{{ formatFloor(house.floorNo) }}</span>
              </div>
              <div class="info-row">
                <span class="label">装修情况：</span>
                <span class="value">{{ formatDecoration(house.decoration) }}</span>
              </div>
              <div class="info-row">
                <span class="label">房屋朝向：</span>
                <span class="value">{{ formatOrientation(house.orientation) }}</span>
              </div>
              <div class="info-row">
                <span class="label">合租情况：</span>
                <span class="value">{{ house.allowShare === 1 ? '可合租' : '不可合租' }}</span>
              </div>
            </div>
            
            
          </div>
        </div>
        
        <div v-else class="no-house">
          <el-empty description="房源不存在或已下架" />
        </div>
      </template>
    </el-skeleton>
    
    <!-- 联系经纪人对话框 -->
    <el-dialog
      v-model="contactDialogVisible"
      title="联系经纪人"
      width="500px"
      :close-on-click-modal="false">
      <div class="contact-dialog-content">
        <div class="agent-contact-header">
          <el-avatar :size="50" :src="agentInfo?.avatar || ''">
            {{ agentInfo?.name?.charAt(0) || '经' }}
          </el-avatar>
          <div class="agent-contact-info">
            <h4>{{ agentInfo?.name }}</h4>
            <p>电话：{{ agentInfo?.phone }}</p>
          </div>
        </div>
        
        <el-form @submit.prevent="handleSendMessage">
          <el-form-item label="留言内容">
            <el-input
              v-model="contactMessage"
              type="textarea"
              :rows="4"
              placeholder="请输入您想了解的内容，例如：房源是否还可以看房、价格是否可以协商等..."
              maxlength="500"
              show-word-limit />
          </el-form-item>
          
          <el-form-item>
            <div class="dialog-actions">
              <el-button @click="contactDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleSendMessage" :loading="false">
                发送消息
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.house-detail-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

/* 1. 最外层容器：固定高度，隐藏超出的左右边缘 */
.house-header-wrapper .house-header {
  flex: 0 0 500px;
  width: 500px;
  height: 300px;
  max-height: 300px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

/* 2. 轮播组件基础撑满 */
.house-header .el-carousel,
.house-header .el-carousel__container,
.house-header .el-carousel__item {
  width: 100%;
  height: 100%;
}

/* 3. 把 el-image 变成一个居中对齐的 Flex 容器 */
.house-header .el-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center; /* 确保图片无论宽窄，永远水平居中 */
  align-items: center;
}

/* 4. 真正控制图片比例的核心逻辑 */
.house-header .el-image__inner,
.house-header img {
  height: 100% !important;     /* 强制要求：上下必须死死顶满 300px 容器 */
  width: auto !important;      /* 强制要求：宽度根据高度等比例自适应，绝不拉伸 */
  max-width: none !important;  /* 解除框架默认的 max-width: 100% 限制，允许图片宽度超过屏幕以实现两边裁切 */
  object-fit: unset !important;/* 删掉原来的 none，恢复浏览器默认的比例渲染 */
}

.house-content {
  padding: 20px 0;
}

.house-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.title-left {
  flex: 1;
}

.house-title h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.house-status {
  display: flex;
  gap: 10px;
}

.house-status .el-tag {
  font-size: 14px;
}

.house-basic-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
  color: #303133;
  width: 100px;
}

.value {
  color: #606266;
}

.house-price-section {
  text-align: center;
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.price-display {
  margin-bottom: 10px;
}

.price {
  font-size: 36px;
  font-weight: bold;
  color: #f56c6c;
}

.unit {
  font-size: 18px;
  color: #909399;
  margin-left: 5px;
}

.price-note {
  color: #909399;
  font-size: 14px;
}

.house-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.no-house {
  text-align: center;
  padding: 40px;
}

.preview-dialog {
  --el-dialog-width: 80%;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 20px !important;
  max-height: 70vh;
  overflow: hidden;
}

.preview-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 60vh;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.preview-nav {
  position: absolute;
  bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 30px;
  z-index: 10;
}

.image-counter {
  color: white;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
  font-size: 14px;
}

/* 新增：图片和经纪人信息容器 */
.house-header-wrapper {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  min-height: 300px;
}

/* 经纪人信息区域 */
.agent-section {
  width: 280px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.agent-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.agent-avatar {
  margin-bottom: 15px;
}

.agent-name {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.agent-phone {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 20px;
}

.contact-btn {
  width: 100%;
  height: 40px;
}

.no-agent {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 联系对话框样式 */
.contact-dialog-content {
  padding: 10px 0;
}

.agent-contact-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.agent-contact-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.agent-contact-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}
</style>