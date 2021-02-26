import Service from "../services/service";
import Vue from 'vue';
import EveService from "../services/eveService";
import VueInstance from './../main';
import _ from 'lodash';

const service = new Service();
const eveService = new EveService();

export default {
    state: {
        maps: [],
        map: null,
        selectedLocation: null,
        highlightedConnections: [],
        highlightedLocations: [],
        mapScroll: {left: 0, top: 0},
        focusedConnection: {
            status: 0,
            size: "?"
        },
    },
    getters: {
        maps: state => state.maps,
        map: state => state.map,
        selectedLocation: state => state.selectedLocation,
        highlightedConnections: state => state.highlightedConnections,
        highlightedLocations: state => state.highlightedLocations,
        connections: state => state.map.connections,
        focusedConnection: state => state.map.focusedConnection,
        pilots: state => _.groupBy(_.orderBy(state.map?.pilots, 'CharacterName'), 'system_id'),
        mapScroll: state => state.mapScroll,
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
                if (rootState.map.map.locations?.some(val => val.system_id === systemId)) {
                    VueInstance.$bvToast.toast('System already on Map', {
                        title: 'System',
                        variant: 'warning'
                    });
                    return;
                }
                await service.createLocation(rootState.map.map._id, systemId);
                VueInstance.$bvToast.toast('Added System', {
                    title: 'System',
                    variant: 'success'
                });
            } else VueInstance.$bvToast.toast('System not Found', {
                title: 'System',
                variant: 'danger'
            });
        },
        async addConnection({state, rootState}, connection) {
            await service.addConnection(rootState.map.map._id, connection);
        },
        async updateConnection({state, rootState}, connection) {
            await service.updateConnection(rootState.map.map._id, connection);
        },
        async deleteConnection({state, rootState}, connection) {
            await service.deleteConnection(rootState.map.map._id, connection);
        },
        async setMapScroll(state, scroll) {
            state.commit('setMapScroll', scroll)
        },
        async getKills({commit, getters}, system) {
            const response = await eveService.ZKAPI.get(`kills/solarSystemID/${system.system_id}/pastSeconds/86400/`);
            var kills = await Promise.all(response.data.map(async kill => {
                const km = await eveService.ESI.get(`killmails/${kill.killmail_id}/${kill.zkb.hash}/?datasource=tranquility`)
                const victimIds = [
                    km.data.victim.character_id,
                    km.data.victim.corporation_id,
                    km.data.victim.ship_type_id
                ]
                let attackerIds
                if (km.data.attackers[0].faction_id) { // NPC
                    attackerIds = [
                        km.data.attackers[0].faction_id,
                        km.data.attackers[0].ship_type_id
                    ]
                } else { // Player
                    attackerIds = [
                        km.data.attackers[0].character_id,
                        km.data.attackers[0].corporation_id,
                        km.data.attackers[0].ship_type_id
                    ]
                }
                const victimNames = await eveService.ESI.post(`universe/names/?datasource=tranquility`, victimIds).then(names => {
                    let output = {}
                    names.data.forEach(item => {
                        output[item.category] = {id: item.id, name: item.name}
                    })
                    return output
                })
                const attackerNames = await eveService.ESI.post(`universe/names/?datasource=tranquility`, attackerIds).then(names => {
                    let output = {}
                    names.data.forEach(item => {
                        output[item.category] = {id: item.id, name: item.name}
                    })
                    return output
                })
                return {
                    killmail_id: km.data.killmail_id,
                    killmail_time: km.data.killmail_time,
                    victim: {...victimNames},
                    attackers: {
                        ...attackerNames,
                        count: km.data.attackers.length
                    }
                }
            }))
            // Deduplicate kills array (Grrr, zKill! Grrrr!)
            kills = kills.filter((km, idx) => {return kills.indexOf(km) === idx})
            commit('setLocationKills', kills)
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
        setSelectedLocation(state, location) {
            state.selectedLocation = location;
        },
        setLocationKills(state, kills) {
            state.selectedLocation.kills = kills
        },
        setMapScroll(state, scroll) {
            state.mapScroll = scroll
        },
        setHighlightedLocations(state, locations) {
            state.highlightedLocations = locations
        },
        setHighlightedConnections(state, connections) {
            state.highlightedConnections = connections
        },
        setFocusedConnection(state, connection) {
            state.focusedConnection = connection
        },
        SOCKET_updateSystem(state, val) {
            const index = state.map.locations.findIndex(loc => loc.system_id === val.system_id);
            if (index !== -1) {
                Vue.set(state.map.locations, index, val);
            }
            if (val.system_id === state.selectedLocation?.system_id) {
                state.selectedLocation = val;
            }
        },
        SOCKET_addSystem(state, val) {
            if (!state.map.locations) state.map.locations = [];
            state.map.locations.push(val);
        },
        SOCKET_removeSystem(state, val) {
            state.map.locations = state.map.locations.filter(loc => loc.system_id !== parseInt(val));
            if (state.selectedLocation?.system_id === parseInt(val)) {
                state.selectedLocation = null;
            }
        },
        SOCKET_addConnection(state, val) {
            if (!state.map.connections) state.map.connections = [];
            state.map.connections.push(val);
        },
        SOCKET_updateConnection(state, val) {
            const index = state.map.connections.findIndex(connection => connection.from === val.from && connection.to === val.to);
            if (index !== -1) {
                Vue.set(state.map.connections, index, val);
            }
        },
        SOCKET_removeConnection(state, connection) {
            state.map.connections = state.map.connections.filter(conn => !(conn.from === connection.from && conn.to === connection.to))
        },
        SOCKET_delinkSystem(state, systemId) {
            state.map.connections = state.map.connections.filter(val => val.from !== parseInt(systemId) && val.to !== parseInt(systemId));
        },
        SOCKET_addPilot(state, pilot) {
            if (!state.map.pilots) state.map.pilots = {};
            state.map.pilots.push(pilot);
        },
        SOCKET_removePilot(state, name) {
            state.map.pilots = state.map.pilots.filter(pilot => pilot.CharacterName !== name);
        },
        SOCKET_setPilotShip(state, {name, ship}) {
            const index = state.map.pilots.findIndex(val => val.CharacterName === name);
            Vue.set(state.map.pilots, index, {
                ...state.map.pilots[index],
                ship: ship
            });
        },
        SOCKET_setPilotLocation(state, {name, system_id}) {
            const index = state.map.pilots.findIndex(val => val.CharacterName === name);
            Vue.set(state.map.pilots, index, {
                ...state.map.pilots[index],
                system_id: system_id
            });
        }
    }
};
