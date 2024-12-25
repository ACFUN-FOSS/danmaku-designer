import { createApp } from 'vue'
import '@/style.css'
import App from './App.vue'
import { createWebHashHistory, createRouter } from 'vue-router'

/*import HomeView from '@index.vue'*/
import ManualView from '@/manual/index.vue'
import DanmukuView from '@/danmuku/index.vue'
import DesignerView from '@/designer/index.vue'

const routes = [
    /*{ path: '/', component: HomeView },*/
    { path: '/manual', component: ManualView },
    { path: '/danmuku', component: DanmukuView },
    { path: '/designer', component: DesignerView },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

createApp(App).use(router).mount('#app')
