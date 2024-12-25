import { createApp } from 'vue'
import '@/style.css'
import App from './App.vue'
import { createWebHashHistory, createRouter } from 'vue-router'

import DesignerView from '@/designer/index.vue'

const routes = [
    { path: '/designer', component: DesignerView },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

createApp(App).use(router).mount('#app')
