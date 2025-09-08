import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router' // 引入 router

const app = createApp(App)

app.use(ElementPlus)
app.use(router) // 使用 router
app.mount('#app')
