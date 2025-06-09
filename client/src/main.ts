import './assets/main.css'
import 'vue-sonner/style.css'
import '@mdi/font/css/materialdesignicons.min.css'
import '@fontsource-variable/comfortaa'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)

app.mount('#app')
