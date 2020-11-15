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
                await service.createLocation(rootState.map.map._id, location);
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
        SOCKET_addPilot(state, {pilot, to}) {
            state.map.locations.find(val => val.system_id === to).pilots.push(pilot);
        },
        SOCKET_removePilot(state, {pilot, from}) {
            console.log(pilot);
            console.log(from);
            const fromIndex = state.map.locations.findIndex(val => val.system_id === from);
            const pilotIndex = state.map.locations[fromIndex].pilots.findIndex(val => val.name === pilot.name);
            state.map.locations[fromIndex].pilots.splice(pilotIndex, 1);
        },
        SOCKET_updatePilotShip(state, {name, ship}) {
            const indexFrom = state.map.locations.findIndex(val => val.pilots.findIndex(val => val.name === name) !== -1);
            const pilotIndex = state.map.locations[indexFrom].pilots.findIndex(val => val.name === name);
            Vue.set(state.map.locations[indexFrom].pilots, pilotIndex, {
                ...state.map.locations[indexFrom].pilots[pilotIndex],
                ship
            });
        },
        SOCKET_updateLocation(state, val) {
            const index = state.map.locations.findIndex(loc => loc.system_id === val.system_id);
            if (index !== -1) {
                Vue.set(state.map.locations, index, val);
            }
        },
        SOCKET_addLocation(state, val) {
            if (!state.map.locations) state.map.locations = [];
            state.map.locations.push(val.system);
        },
        SOCKET_removeLocation(state, val) {
            state.map.locations = state.map.locations.filter(loc => loc.system_id !== parseInt(val));
        }
    }
};
