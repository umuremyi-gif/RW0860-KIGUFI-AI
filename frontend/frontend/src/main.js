import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Ihuza na router twakoze

const app = createApp(App)

app.use(router) // Yemera router muri app
app.mount('#app')