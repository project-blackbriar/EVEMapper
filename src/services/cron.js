import store from './../store/index';
import EveService from "./eveService";

export class CRON {
    constructor() {
        this.running = false;
        this.eveService = new EveService();
        this.locationCron = {
            start: async () => {
                this.interval = setInterval(async () => {
                    const location = await this.eveService.getPilotLocation();
                    if (!store.getters.location) {

                    }
                    if (store.getters.location?.system_id !== location.solar_system_id) {
                        this.locationCron.stop();
                        await store.dispatch('performLocationChange', {
                            newLocation: location,
                            loading: store.getters.location === null
                        });
                        await this.locationCron.start();
                    }
                }, process.env.VUE_APP_EVE_CRON_TIMEOUT);
            },
            stop: () => clearInterval(this.interval)
        };
        this.statusCron = {
            start: () => {
                this.interval = setInterval(async () => {

                }, process.env.VUE_APP_EVE_CRON_TIMEOUT);
            },
            stop: () => clearInterval(this.interval)
        };
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.locationCron.start();
        console.log('CRON: Running');
    }

    stop() {
        this.running = false;
        this.locationCron.stop();
        console.log('CRON: Stopped');
    }
};

