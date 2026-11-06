import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import router from './router'
import App from './App.vue'
import './assets/main.css'

// Registrasi Service Worker PWA secara langsung
registerSW({ immediate: true })

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
