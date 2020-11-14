import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import {BootstrapVue, BootstrapVueIcons, IconsPlugin} from 'bootstrap-vue';
import './style.scss';
import VueSession from 'vue-session';
import VueSocketIO from "vue-socket.io";


Vue.config.productionTip = false;

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(BootstrapVueIcons);
Vue.use(require('vue-moment'));
Vue.use(VueSession);

Vue.use(new VueSocketIO({
    debug: true,
    connection: process.env.VUE_APP_API_URL,
    vuex: {
        store,
        actionPrefix: 'SOCKET_',
        mutationPrefix: 'SOCKET_'
    },
}));

export default new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');
