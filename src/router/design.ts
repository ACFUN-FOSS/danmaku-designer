import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/home/index.vue'
import ManualView from '../views/manual/index.vue'
import DanmukuView from '../views/Danmuku/index.vue'
import DesignerView from '../views/designer/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/manual',
      name: 'manual',
      component: ManualView,
    },
    {
      path: '/danmuku',
      name: 'danmuku',
      component: DanmukuView,
    },
    {
      path: '/designer',
      name: 'designer',
      component: DesignerView,
    },
  ],
})

export default router
