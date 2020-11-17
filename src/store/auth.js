import Service from './../services/service';

const service = new Service();

export default {
    state: {
        auth: localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')) : null,
        tokenExpire: Date.now()
    },
    getters: {
        auth: state => state.auth,
        isLoggedIn: state => state.auth != null,
        tokenExpire: state => state.tokenExpire
    },
    actions: {
        async storeAuth({commit, store}, {auth}) {
            auth = {
                ...auth,
                tokenExpire: Date.now() + (auth.expires_in - 10) * 1000
            };
            await commit('setAuth', auth);
            localStorage.setItem('auth', JSON.stringify(auth));
        },
        async updateToken({commit, state}, token) {
            const auth = {
                ...state.auth,
                access_token: token.access_token,
                tokenExpire: Date.now() + (token.expires_in - 10) * 1000
            };
            await commit('setAuth', auth);
            localStorage.setItem('auth', JSON.stringify(auth));
        },
        async setActiveMap({commit, state}, map) {
            await service.setActiveMap(map);
            const auth = {
                ...state.auth,
                map: map._id
            };
            commit('setAuth', auth);
            localStorage.setItem('auth', JSON.stringify(auth));
        }
    },
    mutations: {
        setAuth(state, auth) {
            state.auth = auth;
        },
        clearAuth(state) {
            state.auth = undefined;
        },
    }
};
