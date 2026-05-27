<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/axios/index.js'

const router = useRouter()
const route = useRoute()

const agreement = ref(null)
const loading = ref(false)
const signLoading = ref(false)

const agreementId = computed(() => route.params.agreementId)

// Format agreement type
const formatAgreementType = (type) => {
  return type === 1 ? '租房合同' : type === 2 ? '二手房买卖合同' : '未知类型'
}

// Format signature status
const formatSignatureStatus = (allSignatured) => {
  return allSignatured === 1 ? '已生效' : '待生效'
}

// Get status tag type
const getStatusType = (status) => {
  return status === 1 ? 'success' : 'warning'
}

// Check if can sign
const canSign = computed(() => {
  return agreement.value && agreement.value.allSignatured === 0
})

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// Fetch agreement detail
const fetchAgreementDetail = async () => {
  try {
    loading.value = true
    const response = await request.get(`/user/agreement/${agreementId.value}`)
    const resBody = response && response.data ? response.data : null
    const dataPayload = resBody ? (resBody.data || resBody.result) : null
    
    if (!dataPayload) {
      console.warn('fetchAgreementDetail: 后端返回格式异常', response && response.data)
      agreement.value = null
      ElMessage.error('协议信息加载失败')
    } else {
      agreement.value = dataPayload.agreement || dataPayload
    }
  } catch (error) {
    console.error('Failed to load agreement detail:', error)
    ElMessage.error('加载协议详情失败')
  } finally {
    loading.value = false
  }
}

// Sign agreement
const signAgreement = async () => {
  if (!agreement.value) return

  try {
    await ElMessageBox.confirm(
      '确认要签署此协议吗？',
      '签署确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    signLoading.value = true
    const response = await request.patch(`/user/sign/${agreementId.value}`)
    const resBody = response && response.data ? response.data : null
    
    if (resBody) {
      ElMessage.success('签署成功')
      // Reload agreement detail
      await fetchAgreementDetail()
    } else {
      ElMessage.error('签署失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to sign agreement:', error)
      ElMessage.error('签署协议失败')
    }
  } finally {
    signLoading.value = false
  }
}

// Go back
const goBack = () => {
  router.push('/shell/user/agreement')
}

onMounted(() => {
  fetchAgreementDetail()
})
</script>

<template>
  <div class="agreement-detail-container">
    <el-button @click="goBack" style="margin-bottom: 20px;">← 返回</el-button>

    <el-empty v-if="!agreement && !loading" description="协议不存在" />

    <el-skeleton v-else-if="loading" :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" style="width: 200px; margin-bottom: 20px;" />
        <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 15px;" v-for="i in 5" :key="i" />
      </template>
    </el-skeleton>

    <div v-else class="agreement-detail">
      <div class="detail-header">
        <h2>协议详情</h2>
        <div class="basic-info">
          <span>协议ID: {{ agreement.id }}</span>
          <span>
            状态:
            <el-tag :type="getStatusType(agreement.allSignatured)">
              {{ formatSignatureStatus(agreement.allSignatured) }}
            </el-tag>
          </span>
          <span>创建时间: {{ formatDate(agreement.createTime) }}</span>
        </div>
      </div>

      <el-divider />

      <!-- 协议信息 -->
      <div class="section">
        <h3>协议信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>协议类型：</label>
              <span>{{ formatAgreementType(agreement.type) }}</span>
            </div>
            <div class="info-item">
              <label>房源ID：</label>
              <span>{{ agreement.houseId }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>成交价格：</label>
              <span>¥{{ Number(agreement.dealPrice).toLocaleString('zh-CN') }}</span>
            </div>
            <div class="info-item">
              <label>签约时间：</label>
              <span>{{ formatDate(agreement.createTime) }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button
          v-if="canSign"
          type="primary"
          :loading="signLoading"
          @click="signAgreement"
        >
          签约
        </el-button>
        <el-button @click="goBack">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agreement-detail-container {
  padding: 20px;
}

.agreement-detail {
  background: white;
  border-radius: 4px;
  padding: 20px;
}

.detail-header {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.detail-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.basic-info {
  display: flex;
  gap: 30px;
  color: #606266;
  font-size: 14px;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.info-item label {
  font-weight: bold;
  width: 120px;
  color: #303133;
}

.info-item span {
  color: #606266;
}

.actions {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
