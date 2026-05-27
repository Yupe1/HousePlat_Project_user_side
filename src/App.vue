<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- 整个 Vue 项目的顶级路由出口 -->
  <!-- 当你访问 /shell/main 时，咱们的 MainLayout 就会被无缝塞进这里 -->
  <RouterView />
</template>

<style>
/* 
  注意这里我去掉了 scoped 属性，让它变成全局样式。
  因为这是最顶层的重置，确保页面撑满全屏，并且去掉浏览器默认的白边。
*/
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  /* 给你配个大多数企业后台和 C端 都在用的高级浅灰底色 */
  background-color: #f5f7fa; 
}

/* 去除所有 router-link 默认的下划线 */
a {
  text-decoration: none;
}
</style>