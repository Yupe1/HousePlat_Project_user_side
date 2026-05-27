// src/stores/dict.js
import { defineStore } from 'pinia'
import request from '@/axios/index.js'

export const useDictStore = defineStore('dict', {
  state: () => ({
    regions: [],
    dicts: {}, // 存放如 { house_type: [], house_orientation: [] } 等映射
    communities: [],
    isLoaded: false
  }),
  actions: {
    async fetchInitData(districtId = null) {
      if (this.isLoaded && !districtId) return // 避免重复加载基础数据

      try {
        const res = await request.get('/user/init-data', {
          params: { districtId }
        })

        // 解析后端返回的 names 和 values 数组
        // 支持两种后端返回结构：
        // 1) { errorCode, msg, data: { names: [], values: [] } } （老格式）
        // 2) { errorCode, msg, result: { regions:..., dicts:..., communities:... } } （当前后端）
        const resBody = res && res.data ? res.data : null
        let dataMap = null

        if (!resBody) {
          console.warn('fetchInitData: 后端返回为空', res)
          return
        }

        if (resBody.data && resBody.data.names && resBody.data.values) {
          const { names, values } = resBody.data
          dataMap = {}
          names.forEach((name, index) => {
            dataMap[name] = values[index]
          })
        } else if (resBody.result && typeof resBody.result === 'object') {
          dataMap = resBody.result
        } else {
          console.warn('fetchInitData: 未知的后端返回格式', resBody)
          return
        }

        if (!this.isLoaded) {
          this.regions = dataMap.regions || []
          this.dicts = dataMap.dicts || {}
          this.isLoaded = true
        }
        
        // 如果按片区请求了小区数据，则单独更新小区列表
        if (districtId) {
          this.communities = dataMap.communities || []
        }
      } catch (error) {
        console.error('全局字典初始化失败', error)
      }
    }
  }
})