import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { registerWebMcpTools } from './webmcp';
import './styles.css';
import './editorial.css';
import './art-deco.css';
import './curio-cabinet.css';

createApp(App).use(router).mount('#app');
registerWebMcpTools(router);
