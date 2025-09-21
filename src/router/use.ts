import { createRouter, createWebHistory } from 'vue-router'
import DanmukuView from '@/views/danmuku/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DanmukuView,
    }
  ],
})

export default router
