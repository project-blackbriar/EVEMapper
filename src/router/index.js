import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import axios from 'axios';
import Vue from 'vue';
import store from './../store/index';
import Loading from "../components/Loading";
import Map from "../views/Map";

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/map/:id',
        name: 'Map',
        component: Map,
        props: true
    },
    {
        path: "/sso",
        children: [
            {
                name: 'SSOLogin',
                path: 'login',
                async beforeEnter() {
                    const url = encodeURI(process.env.VUE_APP_API_CALLBACK);
                    const clientId = process.env.VUE_APP_EVE_CLIENT_ID;
                    const scope = encodeURI('publicData esi-location.read_location.v1 esi-location.read_ship_type.v1 esi-universe.read_structures.v1 esi-ui.open_window.v1 esi-location.read_online.v1');
                    location.href = `https://login.eveonline.com/oauth/authorize?response_type=code&redirect_uri=${url}&client_id=${clientId}&scope=${scope}&state=abcd`;
                },
                component: Loading
            },
            {
                name: 'SSOCallback',
                path: 'callback',
                beforeEnter: async (to, from, next) => {
                    const response = await axios.post(`${process.env.VUE_APP_API_URL}/auth/login`, {
                        code: to.query.code
                    }).catch(ex => {
                        if (ex.response.status === 403) {
                            next('/login?failed=true');
                        }
                    });
                    if (response.status === 200) {
                        await store.dispatch('storeAuth', {auth: response.data});
                        next('/');
                    }
                },
                component: Loading
            },
            {
                name: 'Logout',
                path: '/logout',
                beforeEnter: async (to, from, next) => {
                    localStorage.clear();
                    await store.commit('clearAuth');
                    next('/');
                }
            }
        ]
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;
