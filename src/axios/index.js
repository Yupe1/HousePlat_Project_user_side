import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router'; 
// 引入C端 用户 Pinia Store
import { useUserStore } from '@/stores/user.js';

const request = axios.create({
    
    baseURL: 'http://localhost:8081',
    // baseURL:'http://192.168.0.115:8081',   //npm run dev -- --host
    timeout: 5000,
    // 支持跨域携带 Cookie，保证你的 HttpSession 登录不失效
    withCredentials: true 
})

// ==========================================
// 1. 请求拦截器 (Request Interceptor)
// ==========================================
request.interceptors.request.use(config => {
    const userStore = useUserStore();
    
    // 从 userStore 里取凭证。
    // 因为咱们目前没接 JWT，登录接口返回了 user 实体，咱们可以暂时把用户的 id 当 token 传回后端。
    // 等以后你们如果加了 JWT，把这里的 userStore.userInfo.id 改成 userStore.token 即可。
    if (userStore.userInfo && userStore.userInfo.id) {
        config.headers['Authorization'] = userStore.userInfo.id; 
    }
    return config;
}, error => {
    return Promise.reject(error);
});


// ==========================================
// 2. 响应拦截器 (Response Interceptor)
// ==========================================
request.interceptors.response.use(res => {
    const method = res.config.method;
    const data = res.data;

    // 适配你的 ResultData：errorCode 为 0 是成功
    if (data && typeof data.errorCode !== 'undefined') {
        if (data.errorCode !== 0) {
            // 弹出后端传过来的错误信息
            ElMessage.error(data.msg || '操作失败');
            
            // 1006: NOT_LOGIN (未登录)
            // 1008: UNAUTHORIZED (未授权/身份失效)
            if (data.errorCode === 1006 || data.errorCode === 1008) { 
                const userStore = useUserStore();
                
                // 执行状态清理逻辑
                userStore.clearUser(); 
                
                // 强制路由重定向至登录组件
                // 此时 Pinia 状态变更会触发 Header.vue 的响应式更新，UI 自动切换回登录/注册
                router.push('/shell/user/login'); 
            }

            return Promise.reject(data);
        }

        // 全局的增删改成功提示 (GET请求默默放行，不打扰用户)
        if (method !== 'get') {
            ElMessage.success(data.msg || '操作成功');
        }

        return res;
    }

    if (res.status >= 200 && res.status < 300) {
        return res;
    }
    return Promise.reject(res);
},(err) => {
    
    let errorMsg = '网络请求失败或服务器异常';
    
    if (err.response && err.response.data) {
        const data = err.response.data;
        errorMsg = data.msg || data.message || errorMsg;

        // 如果 HTTP 状态码本身返回 401，也进行兜底处理
        if (err.response.status === 401) {
            const userStore = useUserStore();
            userStore.clearUser();
            router.push('/shell/user/login');
            errorMsg = '登录已过期，请重新登录';
        }
    }

    ElMessage.error(errorMsg);
    return Promise.reject(err);
})

export default request;