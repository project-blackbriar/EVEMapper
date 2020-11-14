import Service from "../services/service";
import Vue from 'vue';
import EveService from "../services/eveService";
import VueInstance from './../main';

const service = new Service();
const eveService = new EveService();

export default {
    state: {
        maps: [],
        map: null
    },
    getters: {
        maps: state => state.maps,
        map: state => state.map,
        connections: state => state.map?.locations.map(location => {
            return location.connections?.map(connection => {
                return {
                    start: location.system_id,
                    end: connection
                };
            });
        }).flat().filter(val => val).reduce((a, b) => {
            return a.findIndex(val => val.end === b.start && val.start === b.end) !== -1 ? a : [...a, b];
        }, [])
    },
    actions: {
        async loadMaps({commit}) {
            const maps = await service.getMaps();
            commit('setMaps', maps);
        },
        async loadMap({commit}, {id}) {
            const map = await service.getMap(id);
            commit('setMap', map);
        },
        async updateLocation({state}, {location}) {
            await service.updateLocation(state.map._id, location);
        },
        async removeLocation({state, commit}, location) {
            await service.removeLocation(state.map._id, location);
        },
        async addSystem({state, commit, rootState}, {name}) {
            const ids = await eveService.getUniverseIds([name]);
            if (ids.systems?.length > 0) {
                const systemId = ids.systems[0].id;
                if (rootState.map.map.locations.some(val => val.system_id === systemId)) {
                    VueInstance.$bvToast.toast('System already on Map', {
                        title: 'System',
                        variant: 'warning'
                    });
                    return;
                }
                const location = await service.getSystem(systemId);
                //await service.createLocation(rootState.map.map, location);
                VueInstance.$bvToast.toast('Added System', {
                    title: 'System',
                    variant: 'success'
                });
            } else VueInstance.$bvToast.toast('System not Found', {
                title: 'System',
                variant: 'danger'
            });
        }
    },
    mutations: {
        setMap(state, map) {
            state.map = map;
        },
        setMaps(state, maps) {
            state.maps = maps;
        },
        updateLocation(state, {location}) {
            const index = state.map.locations.findIndex(loc => loc.name === location.name);
            Vue.set(state.map.locations, index, location);
        },
        SOCKET_updatePilot(state, {name, from, to}) {
            const indexFrom = state.map.locations.findIndex(val => val.system_id === from);
            const pilots = state.map.locations[indexFrom].pilots?.filter(val => val !== name) ?? [];
            Vue.set(state.map.locations, indexFrom, {
                ...state.map.locations[indexFrom],
                pilots: pilots
            });
            const indexTo = state.map.locations.findIndex(val => val.system_id === to);
            if (!state.map.locations[indexTo].pilots) {
                state.map.locations[indexTo].pilots = [];
            }
            state.map.locations[indexTo].pilots.push(name);
        },
        SOCKET_updateLocation(state, val) {
            const index = state.map.locations.findIndex(loc => loc.system_id === val.system_id);
            if (index !== -1) {
                Vue.set(state.map.locations, index, val);
            }
        },
        SOCKET_addLocation(state, val) {
            state.map.locations.push(val.system);
        },
        SOCKET_removeLocation(state, val) {
            state.map.locations = state.map.locations.filter(loc => loc.system_id !== val);
        }
    }
};
