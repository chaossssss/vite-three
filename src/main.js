import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/reset.css'
import router from '@/router/index'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
