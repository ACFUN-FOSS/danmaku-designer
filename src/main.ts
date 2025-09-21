import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'


 const bootstrap = async() => {
    let App;
    let router

    // 动态按需加载 router
    if (import.meta.env.MODE != 'use') {
        router = (await import('./router/design')).default;

        ({ default: App } = await import('./App.vue'))
    } else {
        console.log(2)
        router = (await import('./router/use')).default;
        ({ default: App } = await import('./App-use.vue'))
    }
     const app = createApp(App)
     app.use(createPinia())
     app.use(router)
     app.mount('#app')
}

bootstrap()
