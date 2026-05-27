<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useDictStore } from '@/stores/dict.js'
import request from '@/axios/index.js'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'

const dictStore = useDictStore()
const router = useRouter()
const route = useRoute()

// Search form data
const searchForm = ref({
  keyword: '',
  districtId: null,
  houseType: null,
  status: null,
  roomNum: null,
  auditStatus: 1, // Default to approved houses
  minPrice: null,
  maxPrice: null,
  minArea: null,
  maxArea: null,
  sortField: 'createTime',
  sortOrder: 'desc'
})

// Pagination
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// House list
const houseList = ref([])

// 级联选择器的选中值（数组形式）
const selectedDistrict = ref([])

// Load initial data
onMounted(async () => {
  await dictStore.fetchInitData()
  
  // 从URL query参数中读取所有搜索条件
  if (route.query.status) {
    searchForm.value.status = parseInt(route.query.status)
  }
  if (route.query.districtId) {
    searchForm.value.districtId = parseInt(route.query.districtId)
    // 同时更新级联选择器的选中值
    selectedDistrict.value = findDistrictPath(searchForm.value.districtId)
  }
  if (route.query.keyword) {
    searchForm.value.keyword = route.query.keyword
  }
  if (route.query.minPrice) {
    searchForm.value.minPrice = parseInt(route.query.minPrice)
  }
  if (route.query.maxPrice) {
    searchForm.value.maxPrice = parseInt(route.query.maxPrice)
  }
  
  await fetchHouses()
})

watch(() => route.query, async (newQuery) => {
  // 当 query 参数变化时重新读取
  if (newQuery.status) {
    searchForm.value.status = parseInt(newQuery.status)
  } else {
    searchForm.value.status = null
  }
  if (newQuery.districtId) {
    searchForm.value.districtId = parseInt(newQuery.districtId)
    selectedDistrict.value = findDistrictPath(searchForm.value.districtId)
  } else {
    searchForm.value.districtId = null
    selectedDistrict.value = []
  }
  if (newQuery.keyword) {
    searchForm.value.keyword = newQuery.keyword
  } else {
    searchForm.value.keyword = ''
  }
  if (newQuery.minPrice) {
    searchForm.value.minPrice = parseInt(newQuery.minPrice)
  }
  if (newQuery.maxPrice) {
    searchForm.value.maxPrice = parseInt(newQuery.maxPrice)
  }
  
  pagination.value.currentPage = 1
  await fetchHouses()
})


// Fetch houses based on search criteria
const fetchHouses = async () => {
  try {
    const params = {
      ...searchForm.value,
      pageNo: pagination.value.currentPage,
      pageSize: pagination.value.pageSize
    }

    // Remove null/undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })

    const response = await request.get('/user/houses', { params })

    // 支持后端两种返回结构：response.data.data 或 response.data.result
    const resBody = response && response.data ? response.data : null
    const dataPayload = resBody ? (resBody.data || resBody.result) : null
    if (!dataPayload) {
      console.warn('fetchHouses: 后端返回格式异常', response && response.data)
      return
    }

    const { total, houseList: houses } = dataPayload

    houseList.value = houses || []
    pagination.value.total = total || 0
  } catch (error) {
    console.error('Failed to fetch houses:', error)
  }
}

// Handle pagination change
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  fetchHouses()
}

// Handle search
const handleSearch = () => {
  pagination.value.currentPage = 1
  fetchHouses()
}

// Reset search form
const resetSearch = () => {
  searchForm.value = {
    keyword: '',
    districtId: null,
    houseType: null,
    status: null,
    roomNum: null,
    auditStatus: 1,
    minPrice: null,
    maxPrice: null,
    minArea: null,
    maxArea: null,
    sortField: 'createTime',
    sortOrder: 'desc'
  }
  selectedDistrict.value = []
  pagination.value.currentPage = 1
  fetchHouses()
}

// View house detail
const viewHouseDetail = (houseId) => {
  router.push(`/shell/search/${houseId}`)
}

// Parse cover field which may be a comma-separated string or array
const parseCover = (cover) => {
  if (!cover) return null
  const s = String(cover)
  return 'http://localhost:8080' + s.trim()
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
  { dictValue: 2, dictLabel: '待售' }
])

const roomNumOptions = computed(() => [
  { dictValue: 1, dictLabel: '一居室' },
  { dictValue: 2, dictLabel: '二居室' },
  { dictValue: 3, dictLabel: '三居室' },
  { dictValue: 4, dictLabel: '四居室' },
  { dictValue: 5, dictLabel: '五居室以上' }
])

// Format floor display (0 = 低楼层, 1 = 高楼层)
const formatFloor = (floorNo) => {
  return floorNo === 0 ? '低楼层' : floorNo === 1 ? '高楼层' : '未知'
}

// 构建级联数据结构（省->市->区）
const cascaderData = computed(() => {
  const regions = dictStore.regions || []
  
  // 获取所有省级数据（level=1）
  const provinces = regions.filter(r => r.level === 1)
  
  // 构建树形结构
  return provinces.map(province => {
    const cities = regions.filter(r => r.level === 2 && r.parentId === province.id)
    return {
      value: province.id,
      label: province.name,
      children: cities.map(city => {
        const districts = regions.filter(r => r.level === 3 && r.parentId === city.id)
        return {
          value: city.id,
          label: city.name,
          children: districts.map(district => ({
            value: district.id,
            label: district.name
          }))
        }
      })
    }
  })
})

// 级联选择器改变时，获取最后一级（区级）的id
const handleDistrictChange = (value) => {
  if (value && value.length > 0) {
    // value是数组，最后一个元素是选中的区级id
    searchForm.value.districtId = value[value.length - 1]
  } else {
    searchForm.value.districtId = null
  }
}

// 根据区级id找到对应的完整路径 (用于初始化级联选择器)
const findDistrictPath = (districtId) => {
  if (!districtId) return []
  
  const regions = dictStore.regions || []
  const regionMap = new Map()
  regions.forEach(r => regionMap.set(r.id, r))
  
  const district = regionMap.get(districtId)
  if (!district || district.level !== 3) return []
  
  const city = regionMap.get(district.parentId)
  if (!city || city.level !== 2) return []
  
  const province = regionMap.get(city.parentId)
  if (!province || province.level !== 1) return []
  
  return [province.id, city.id, district.id]
}
</script>

<template>
  <div class="search-container">
    <div class="search-filters">
      <el-form :model="searchForm" label-width="80px" size="small">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="关键词">
              <el-input v-model="searchForm.keyword" placeholder="楼号/小区名" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="区域">
              <el-cascader 
                v-model="selectedDistrict" 
                :options="cascaderData"
                placeholder="选择省/市/区"
                clearable
                @change="handleDistrictChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房屋类型">
              <el-select v-model="searchForm.houseType" placeholder="请选择类型" clearable>
                <el-option
                  v-for="option in houseTypeOptions"
                  :key="option.dictValue"
                  :label="option.dictLabel"
                  :value="parseInt(option.dictValue)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option
                  v-for="option in statusOptions"
                  :key="option.dictValue"
                  :label="option.dictLabel"
                  :value="option.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="居室">
              <el-select v-model="searchForm.roomNum" placeholder="请选择居室" clearable>
                <el-option
                  v-for="option in roomNumOptions"
                  :key="option.dictValue"
                  :label="option.dictLabel"
                  :value="option.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="价格范围">
              <el-input-number v-model="searchForm.minPrice" :min="0" placeholder="最低价" style="width: 45%" />
              <span style="display: inline-block; width: 10%; text-align: center;">-</span>
              <el-input-number v-model="searchForm.maxPrice" :min="0" placeholder="最高价" style="width: 45%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="面积范围">
              <el-input-number v-model="searchForm.minArea" :min="0" placeholder="最小面积" style="width: 45%" />
              <span style="display: inline-block; width: 10%; text-align: center;">-</span>
              <el-input-number v-model="searchForm.maxArea" :min="0" placeholder="最大面积" style="width: 45%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="排序">
              <el-select v-model="searchForm.sortField" style="width: 60%">
                <el-option label="创建时间" value="createTime" />
                <el-option label="价格" value="price" />
                <el-option label="面积" value="area" />
              </el-select>
              <el-select v-model="searchForm.sortOrder" style="width: 35%; margin-left: 5px;">
                <el-option label="降序" value="desc" />
                <el-option label="升序" value="asc" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="search-results">
      <div class="result-header">
        <h3>找到 {{ pagination.total }} 套房源</h3>
      </div>
      
      <div class="house-list">
        <div 
          v-for="house in houseList" 
          :key="house.id" 
          class="house-item"
          @click="viewHouseDetail(house.id)"
        >
          <div class="house-image">
            <img :src="parseCover(house.coverUrl) || 'http://localhost:8080/uploaded/house/cover/default.jpg'" alt="房源图片" />
          </div>
          <div class="house-info">
            <div class="house-title">
              <span class="community-name">{{ house.communityName }}</span>
              <span class="district-name">{{ house.districtName }}</span>
            </div>
            <div class="house-details">
              <span>{{ house.houseType === 1 ? '住宅' : house.houseType === 2 ? '商铺' : '写字楼' }}</span>
              <span>{{ house.roomNum }}室{{ house.hallNum }}厅</span>
              <span>{{ house.area }}㎡</span>
              <span>{{ formatFloor(house.floorNo) }}</span>
            </div>
            <div class="house-price">
              <span class="price">{{ house.price }}</span>
              <span class="unit">{{ house.status === 1 ? '元/月' : '万元' }}</span>
            </div>
            <div class="house-tags">
              <el-tag v-if="house.decorationName" size="small">{{ house.decorationName }}</el-tag>
              <el-tag v-if="house.orientation" size="small">
                {{ orientationOptions.find(o => o.dictValue === house.orientation.toString())?.dictLabel || '朝向未知' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.search-filters {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-results {
  min-height: 400px;
}

.result-header h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.house-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.house-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.house-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.house-image img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.house-info {
  padding: 15px;
}

.house-title {
  margin-bottom: 10px;
}

.community-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.district-name {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

.house-details {
  color: #606266;
  margin-bottom: 10px;
  font-size: 14px;
}

.house-details span {
  margin-right: 15px;
}

.house-price {
  margin-bottom: 10px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

.unit {
  color: #909399;
  margin-left: 5px;
}

.house-tags {
  margin-top: 10px;
}

.house-tags .el-tag {
  margin-right: 5px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
</style>