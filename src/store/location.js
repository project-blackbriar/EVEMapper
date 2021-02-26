import Service from "../services/service";
import EveService from "../services/eveService";

const service = new Service();
const eveService = new EveService();
export default {
    state: {
        location: null
    },
    getters: {
        location: state => state.location,
    },
    actions: {
        async performLocationChange({commit, rootState}, {newLocation, loading}) {
            let location = await service.getSystem(newLocation.solar_system_id);
            if (location) {
                commit('setPilotLocation', location);
            } else {
                const newSystem = await eveService.getSystem(newLocation.solar_system_id);
                let location = await service.createSystem(newSystem);
                commit('setPilotLocation', location);
            }
        }
    },
    mutations: {
        setPilotLocation(state, location) {
            state.location = location;
        }
    }
};
