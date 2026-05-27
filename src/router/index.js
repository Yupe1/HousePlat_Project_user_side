import { createRouter, createWebHistory } from 'vue-router'

// 建议提前引入包含 Header 的总布局组件
import MainLayout from '../layout/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 1. 用户访问根目录 '/' 时，直接自动跳转到你的首页
      path: '/',
      redirect: '/shell/main'
    },
    {
      // 2. 咱们项目的主入口
      path: '/shell',
      name: 'shell',
      component: MainLayout, // 这个组件里装着 Header 和 <router-view />
      children: [
        {
          // 访问 /shell/main 时，HomeView 会被塞进 MainLayout 的 router-view 里
          path: 'main',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          // 搜索与筛选列表页
          // 对应图左：/shell/search
          path: 'search',
          name: 'search',
          component: () => import('../views/SearchView.vue'),
        },
        {
          // 房源详情页 (动态路由)
          // 对应图右：/shell/search/123
          path: 'search/:houseId',
          name: 'houseDetail',
          component: () => import('../views/HouseDetailView.vue'),
        },
        {
          // 访问 /shell/user/register 时，注册页会被塞进去
          path: 'user/register',
          name: 'register',
          component: () => import('../views/RegisterView.vue'),
        },
        {
          // 登录页
          path: 'user/login',
          name: 'login',
          component: () => import('../views/LoginView.vue'),
        },
        {
          // 3. 用户中心（这里又嵌套了一层！）
          // 访问 /shell/user 时，展示左边菜单、右边内容的 UserLayout
          path: 'user',
          name: 'userCenter',
          redirect: '/shell/user/favour',
          meta: { requiresAuth: true }, // 打上需要权限的标记
          component: () => import('../views/user/UserLayout.vue'),
          children: [
            {
              // 访问 /shell/user/favour 时，我的关注列表会被塞进 UserLayout 的 router-view 里
              path: 'favour',
              name: 'favour',
              component: () => import('../views/user/FavourView.vue'),
            },
            {
              path: 'agreement',
              name: 'agreement',
              component: () => import('../views/user/AgreementView.vue'),
            },
            {
              path: 'agreement/:agreementId',
              name: 'agreementDetail',
              component: () => import('../views/user/AgreementDetailView.vue'),
            },
            {
              path: 'mod',
              name: 'modProfile',
              component: () => import('../views/user/ModProfileView.vue'),
            }
          ]
        }
      ]
    }
  ],
})

router.beforeEach(async (to, from) => {
  // 必须在路由守卫内部引入 Pinia store，否则会报 Pinia 未初始化的错误
  const { useUserStore } = await import('@/stores/user.js')
  const userStore = useUserStore()
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth) {
    if (!userStore.userInfo) {
      ElMessage.warning('请先登录后再访问此页面')
      // 拦截并重定向
      return { name: 'login' } 
    }
    // 已登录，允许通行 (return true 或 return undefined 都可以)
    return true 
  }
  
  // 不需要权限的页面，允许通行
  return true
})

export default router