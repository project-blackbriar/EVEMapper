import Vue from 'vue';
import Vuex from 'vuex';
import map from "./map";
import auth from "./auth";
import location from "./location";
import user from "./user";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {},
    mutations: {},
    actions: {},
    modules: {
        map,
        auth,
        location,
        user
    }
});
