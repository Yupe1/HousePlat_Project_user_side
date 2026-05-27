<script setup>
import { ref, onMounted } from 'vue'
import request from '@/axios/index.js'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const agreements = ref([])
const loading = ref(false)

// Load agreements
const loadAgreements = async () => {
    try {
    loading.value = true
    const response = await request.get('/user/agreements')
    const resBody = response && response.data ? response.data : null
    const dataPayload = resBody ? (resBody.data || resBody.result) : null
    if (!dataPayload) {
      console.warn('loadAgreements: 后端返回格式异常', response && response.data)
      agreements.value = []
    } else {
      agreements.value = dataPayload.agreementList || dataPayload.agreements || []
    }
  } catch (error) {
    console.error('Failed to load agreements:', error)
    ElMessage.error('加载签约列表失败')
  } finally {
    loading.value = false
  }
}

// View agreement detail
const viewAgreementDetail = (agreementId) => {
  router.push(`/shell/user/agreement/${agreementId}`)
}

// Format agreement type
const formatAgreementType = (type) => {
  return type === 1 ? '租房合同' : type === 2 ? '二手房买卖合同' : '未知类型'
}

// Format signature status
const formatSignatureStatus = (allSignatured) => {
  return allSignatured === 1 ? '已生效' : '待生效'
}

onMounted(() => {
  loadAgreements()
})
</script>

<template>
  <div class="agreement-container">
    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" style="width: 200px; margin-bottom: 20px;" />
        <el-skeleton-item variant="rect" style="width: 100%; height: 80px; margin-bottom: 15px;" v-for="i in 3" :key="i" />
      </template>
      
      <template #default>
        <div class="agreement-header">
          <h2>我的签约</h2>
          <p>共 {{ agreements.length }} 份合同</p>
        </div>
        
        <div v-if="agreements.length > 0" class="agreement-list">
          <div 
            v-for="agreement in agreements" 
            :key="agreement.id" 
            class="agreement-item"
            @click="viewAgreementDetail(agreement.id)"
          >
            <div class="agreement-info">
              <div class="agreement-type">
                <el-tag :type="agreement.allSignatured === 1 ? 'success' : 'warning'">
                  {{ formatAgreementType(agreement.type) }}
                </el-tag>
                <span class="signature-status">{{ formatSignatureStatus(agreement.allSignatured) }}</span>
              </div>
              <div class="agreement-details">
                <div class="house-info">
                  <span class="house-id">房源ID: {{ agreement.houseId }}</span>
                </div>
                <div class="deal-info">
                  <span class="deal-price">成交价: ¥{{ agreement.dealPrice }}</span>
                  <span class="create-time">{{ agreement.createTime }}</span>
                </div>
              </div>
            </div>
            <div class="agreement-actions">
              <el-button type="primary" size="small">查看详情</el-button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-agreements">
          <el-empty description="暂无签约合同">
            <el-button type="primary" @click="$router.push('/shell/search')">
              去找房
            </el-button>
          </el-empty>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.agreement-container {
  min-height: 400px;
}

.agreement-header {
  margin-bottom: 20px;
}

.agreement-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.agreement-header p {
  color: #909399;
  margin: 0;
}

.agreement-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.agreement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.agreement-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.agreement-info {
  flex: 1;
}

.agreement-type {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.signature-status {
  color: #606266;
  font-size: 14px;
}

.house-info .house-id {
  color: #303133;
  font-weight: bold;
}

.deal-info {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

.deal-info span {
  margin-right: 20px;
}

.agreement-actions .el-button {
  flex-shrink: 0;
}

.empty-agreements {
  text-align: center;
  padding: 40px;
}
</style>