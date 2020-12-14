import Service from './../services/service';
import EveService from "../services/eveService";
import VueInstance from './../main';

const service = new Service();
const eveService = new EveService();

export default {
    state: {
        routes: []
    },
    getters: {
        routes: state => state.routes
    },
    actions: {
        async addRoute({commit, rootState, dispatchs}, {name, flag}) {
            const ids = await eveService.getUniverseIds([name]);
            if (ids.systems?.length > 0) {
                const systemId = ids.systems[0].id;
                await service.addRoute(systemId, flag);
                VueInstance.$bvToast.toast('Route Added To System', {
                    title: 'System',
                    variant: 'success'
                });
            } else VueInstance.$bvToast.toast('System not Found', {
                title: 'System',
                variant: 'danger'
            });
        },
        async getRoutes({commit, rootState}, {origin}) {
            const routes = await service.getRoutes(rootState.map.map._id, origin);
            commit('setRoutes', routes);
        },
        async removeRoute({commit, dispatch}, {name, flag}) {
            await service.removeRoute(name, flag);
        }
    },
    mutations: {
        setRoutes(state, routes) {
            state.routes = routes;
        },
        addRoute(state, route) {
            state.routes = [
                ...state.routes,
                route
            ];
        }
    }
};
