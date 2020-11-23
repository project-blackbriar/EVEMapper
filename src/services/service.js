const axios = require('axios');
import store from './../store/index';
import router from './../router/index';

class Service {
    constructor() {
        this.api = axios.create({
            baseURL: process.env.VUE_APP_API_URL
        });
    }

    async checkToken() {
        if (store.getters.auth?.tokenExpire <= Date.now()) {
            await this.refreshToken();
            console.log('Updated Token');
        }
    }

    async refreshToken() {
        try {
            const response = (await this.api.get('/auth/refresh', {
                params: {
                    token: store.getters.auth.access_token,
                }
            }));
            await store.dispatch('updateToken', {...response.data});
        } catch (ex) {
            console.log(ex);
            if (ex.response.status === 403) {
                await router.push({name: 'Logout'});
            }
        }
    }

    async setActiveMap({_id}) {
        await this.checkToken();
        try {
            return (await this.api.post(`/maps/active/${_id}`, {}, {
                params: {
                    token: store.getters.auth.access_token,
                }
            })).data;
        } catch (ex) {
            return [];
        }
    }

    async getMaps() {
        await this.checkToken();
        try {
            return (await this.api.get(`/maps`, {
                params: {
                    token: store.getters.auth.access_token,
                }
            })).data;
        } catch (ex) {
            return [];
        }
    }

    async getMap(id) {
        await this.checkToken();
        return (await this.api.get(`/maps/${id}`, {
            params: {
                token: store.getters.auth.access_token,
            }
        })).data;
    }

    async createLocation(mapId, systemId) {
        await this.checkToken();
        return (await this.api.post(`/maps/${mapId}/location`, {
            system_id: systemId
        }, {
            params: {
                token: store.getters.auth.access_token,
            }
        }));
    }

    async updateLocation(mapId, location) {
        await this.checkToken();
        return (await this.api.put(`/maps/${mapId}/location`, location, {
            params: {
                token: store.getters.auth.access_token,
            }
        }));
    }

    async removeLocation(mapId, location) {
        await this.checkToken();
        return (await this.api.delete(`/maps/${mapId}/location/${location.system_id}`, {
            params: {
                token: store.getters.auth.access_token,
            }
        }));
    }

    async updateConnection(mapId, connection){
        await this.checkToken();
        return (await this.api.put(`/maps/${mapId}/connection`, connection, {
            params: {
                token: store.getters.auth.access_token,
            }
        }));
    }

    async setPilotLocation({_id}, {system_id}) {
        await this.checkToken();
        return (await this.api.post(`/maps/${_id}/pilot/${system_id}`, {}, {
            params: {
                token: store.getters.auth.access_token,
            }
        }));
    }

    async getSystem(id) {
        await this.checkToken();
        try {
            return (await this.api.get(`/systems/${id}`, {
                params: {
                    token: store.getters.auth.access_token,
                }
            })).data;
        } catch (ex) {
            if (ex.response.status === 404) {
                return null;
            }
        }
    }

    async createSystem(system) {
        await this.checkToken();
        try {
            return (await this.api.post(`/systems/${system.system_id}`, system, {
                params: {
                    token: store.getters.auth.access_token,
                }
            })).data;
        } catch (ex) {
            console.log(ex);
            return system;
        }
    }

}

export default Service;
