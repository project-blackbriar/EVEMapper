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
            const exists = rootState.user.routes.find(route => {return route.destination.name === name && route.flag == flag})
            if (exists) {
                VueInstance.$bvToast.toast('Route already exists', {
                    title: 'System',
                    variant: 'danger'
                })
                return
            }
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
            const procRoutes = []
            routes.forEach((route, ri) => {
                if (route.systems != "No Route Found"){
                    procRoutes.push({
                        destination: route.destination,
                        flag: route.flag,
                        length: route.systems.length - 1,
                        systems: []
                    })
                    route.systems.forEach((system, si) => {
                        procRoutes[ri].systems.push(system)
                        const nextSystem = route.systems[si + 1] ?? null
                        if (nextSystem && (system.type == "J" || nextSystem?.type == "J")) {
                            const connection = rootState.map.map.connections.find(c => {
                                if (c.from === system.system_id && c.to === nextSystem?.system_id) {
                                    return true
                                }
                                if (c.to === system.system_id && c.from === nextSystem?.system_id) {
                                    return true
                                }
                                return false
                            })
                            if (!connection) {
                                console.log('Cannot find connection between:',system.name,nextSystem?.name)
                            }
                            procRoutes[ri].systems.push({
                                key: connection.key,
                                system_id: si,
                                security_status: -1,
                                connection_size: connection.size,
                                name: "Wormhole",
                                type: "WH"
                            })
                        }
                    })
                } else {
                    procRoutes.push({
                        destination: route.destination,
                        flag: route.flag,
                        length: "-",
                        systems: []
                    })
                    procRoutes[ri].systems.push({
                        key: origin + ri,
                        system_id: origin + ri,
                        security_status: -1,
                        connection_size: "-",
                        name: "No Route",
                        type: "WH"
                    })
                }
            });
            commit('setRoutes', procRoutes);
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
