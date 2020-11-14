<template>
    <div class="dark app">
        <NavBar></NavBar>
        <div v-if="isLoggedIn" class="container no-margin no-padding">
            <div class="row no-margin no-padding">
                <div class="col-lg-2 d-sm-none d-lg-block no-margin no-padding">
                    <SideBar/>
                </div>
                <div class="col-lg-10 no-padding">
                    <router-view/>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    .no-margin {
        margin: 0 !important;
        width: 100vw;
    }

    .app {
        min-height: 100vh
    }

    .no-padding {
        padding: 0 !important;
    }
</style>
<script>
    import NavBar from "./components/NavBar";
    import SideBar from "./components/SideBar";
    import {mapGetters} from "vuex";
    import {CRON} from "./services/cron";

    export default {
        components: {NavBar, SideBar},
        data() {
            return {
                cronService: new CRON()
            };
        },
        computed: {
            ...mapGetters(['isLoggedIn'])
        },
        created() {
            this.setCron(this.isLoggedIn);
        },
        watch: {
            isLoggedIn(value) {
                this.setCron(value);
            }
        },
        methods: {
            setCron(value) {
                value ? this.cronService.start() : this.cronService.stop();
            }
        }
    };
</script>
