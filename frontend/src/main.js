import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { registerWebMcpTools } from './webmcp';
import './styles.css';

createApp(App).use(router).mount('#app');
registerWebMcpTools(router);
