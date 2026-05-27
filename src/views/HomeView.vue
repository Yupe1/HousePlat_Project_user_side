<script setup>
import { reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDictStore } from '@/stores/dict.js'

const router = useRouter()
const dictStore = useDictStore()

// 搜索表单状态
const searchForm = reactive({
  districtId: null,
  minPrice: null,
  maxPrice: null,
  keyword: ''
})

// 级联选择器的选中值（数组形式）
const selectedDistrict = reactive([])

// 挂载时触发字典加载
onMounted(() => {
  dictStore.fetchInitData()
})

// 构建级联数据结构（省->市->区）
const cascaderData = computed(() => {
  const regions = dictStore.regions || []
  
  // 建立id到region的映射
  const regionMap = new Map()
  regions.forEach(r => regionMap.set(r.id, r))
  
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
    searchForm.districtId = value[value.length - 1]
  } else {
    searchForm.districtId = null
  }
}

// 执行搜索，将参数通过路由传递给 /shell/search
const handleSearch = () => {
  // 过滤掉空值参数，保持 URL 整洁
  const query = {}
  Object.keys(searchForm).forEach(key => {
    if (searchForm[key] !== null && searchForm[key] !== '') {
      query[key] = searchForm[key]
    }
  })
  
  router.push({ path: '/shell/search', query })
}
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="search-box">
        <h2>聚合搜索框 【小区名/片区】</h2>
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="按区域">
            <el-cascader 
              v-model="selectedDistrict" 
              :options="cascaderData"
              placeholder="选择省/市/区"
              clearable
              @change="handleDistrictChange"
            />
          </el-form-item>
          
          <el-form-item label="按价格">
            <el-input-number v-model="searchForm.minPrice" :controls="false" placeholder="最低价" />
            <span class="separator">-</span>
            <el-input-number v-model="searchForm.maxPrice" :controls="false" placeholder="最高价" />
          </el-form-item>

          <el-form-item class="full-width">
            <el-input 
              v-model="searchForm.keyword" 
              placeholder="请输入小区名或房源特征..." 
              clearable 
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button type="primary" @click="handleSearch">开始找房</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="recommend-section">
      <h3>为你推荐</h3>
      </div>
  </div>
</template>

<style scoped>
  .hero-section {
    height: 400px;
    background-color: #f5f7fa;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .search-box {
    width: 800px;
    padding: 30px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  .separator {
    margin: 0 10px;
  }
  .full-width {
    width: 100%;
    margin-top: 20px;
  }
</style>
