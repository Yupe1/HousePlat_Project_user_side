<script setup>
import { ref, onMounted } from 'vue'
import request from '@/axios/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const favorites = ref([])
const loading = ref(false)

// 图片路径处理逻辑
// const imgBaseUrl = import.meta.env.VITE_IMAGE_BASE || 'http://localhost:8080'
const imgBaseUrl = import.meta.env.VITE_IMAGE_BASE || ''
const formatImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/200x150?text=暂无图片'
  path = path.trim()
  if (/^https?:\/\//i.test(path)) return path
  return imgBaseUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
}

// 获取收藏列表
const loadFavorites = async () => {
  try {
    loading.value = true
    
    const response = await request.get('/user/favorites')
    
    // 【极简写法】直接精准拿取 result 里的 "收藏列表" 数组，拿不到就给个空数组兜底
    const resultObj = response.data.result
    favorites.value = resultObj ? (resultObj['收藏列表'] || []) : []

  } catch (error) {
    console.error('Failed to load favorites:', error)
    ElMessage.error('加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

// 取消收藏 (传参 houseId)
const removeFavorite = async (houseId) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏该房源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用接口，传参 houseId
    await request.delete('/user/favorites', {
      params: { houseId: houseId }
    })
    
   
    // 重新加载列表
    loadFavorites()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to remove favorite:', error)
      
    }
  }
}

// 跳转详情
const viewHouseDetail = (houseId) => {
  router.push(`/shell/search/${houseId}`)
}

onMounted(() => {
  loadFavorites()
})
</script>

<template>
  <div class="favour-container">
    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" style="width: 200px; margin-bottom: 20px;" />
        <el-skeleton-item variant="image" style="width: 100%; height: 150px; margin-bottom: 15px;" v-for="i in 3" :key="i" />
      </template>
      
      <template #default>
        <div class="favour-header">
          <h2>我的收藏</h2>
          <p>共 {{ favorites.length }} 套房源</p>
        </div>
        
        <div v-if="favorites.length > 0" class="favour-list">
          <div v-for="fav in favorites" :key="fav.id" class="favour-item">
            <div class="favour-image">
              <!-- 使用格式化图片的方法 -->
              <img :src="formatImageUrl(fav.coverUrl)" alt="房源图片" />
            </div>
            <div class="favour-info">
              <div class="house-title">
                <span class="community-name">{{ fav.communityName }}</span>
                <span class="district-name">{{ fav.districtName }}</span>
              </div>
              <div class="house-details">
                <span>{{ fav.roomNum }}室{{ fav.hallNum }}厅</span>
                <span>{{ fav.area }}㎡</span>
                <span>{{ fav.price }}{{ fav.status === 1 ? '元/月' : '万元' }}</span>
              </div>
            </div>
            <div class="favour-actions">
              <el-button type="primary" size="small" @click="viewHouseDetail(fav.id)">查看详情</el-button>
              <el-button type="danger" size="small" plain @click="removeFavorite(fav.id)">取消收藏</el-button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-favourites">
          <el-empty description="暂无收藏房源">
            <el-button type="primary" @click="$router.push('/shell/search')">去找房</el-button>
          </el-empty>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.favour-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-height: 500px;
}
.favour-header { margin-bottom: 20px; }
.favour-item {
  display: flex;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}
.favour-image img {
  width: 160px;
  height: 120px;
  border-radius: 6px;
  object-fit: cover;
}
.favour-info {
  flex: 1;
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}
.house-title { font-size: 18px; font-weight: bold; }
.community-name { margin-right: 10px; }
.house-details span {
  margin-right: 15px;
  color: #606266;
}
.favour-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}
.favour-actions .el-button {
  width: 100px;
  margin: 0px;
}
</style>