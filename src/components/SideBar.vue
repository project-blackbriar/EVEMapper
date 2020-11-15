<template>
    <div>
        <SideBarItem @click="toggle('maps') || loadMaps()">
            <template v-slot:image>
                <b-icon-map></b-icon-map>
            </template>
            <template v-slot:default>
                Maps
            </template>
            <template v-slot:append>
                <b-icon-arrow-right v-if="!show['maps']"></b-icon-arrow-right>
                <b-icon-arrow-down v-else></b-icon-arrow-down>
            </template>
            <template v-slot:children v-if="show['maps'] && !loading['maps']">
                <MapSideBarItem v-for="map in maps" :map="map" :key="map._id"/>
                <SideBarItem @click="$bvModal.show('add-map-modal')">
                    <template v-slot:default>
                        <b-icon-plus></b-icon-plus>
                    </template>
                    <template v-slot:append>

                    </template>
                </SideBarItem>
            </template>
            <template v-slot:children v-else-if="show['maps']">
                <Loading></Loading>
            </template>
        </SideBarItem>
        <b-modal id="add-map-modal" centered title="Add Map" @ok="addMap">
            <form ref="form">
                <b-form-group
                        label="Name"
                        label-for="name-input"
                        invalid-feedback="Name is required"
                >
                    <b-form-input
                            id="name-input"
                            v-model="name"
                            required
                    ></b-form-input>
                </b-form-group>
            </form>
        </b-modal>
    </div>
</template>

<script>
    import SideBarItem from "./SideBarItem";
    import {mapGetters} from "vuex";
    import Loading from "./Loading";
    import ContextMenu from "./ContextMenu";
    import MapSideBarItem from "./MapSideBarItem";

    export default {
        name: "SideBar",
        components: {MapSideBarItem, ContextMenu, Loading, SideBarItem},
        computed: {
            ...mapGetters(['maps', 'auth'])
        },
        data() {
            return {
                show: {},
                loading: {},
                name: ""
            };
        },
        methods: {
            toggle(menu) {
                this.show = {
                    ...this.show,
                    [menu]: !this.show[menu]
                };
            },
            load(menu, state) {
                this.loading = {
                    ...this.loading,
                    [menu]: state
                };
            },
            async loadMaps() {
                this.load('maps', true);
                await this.$store.dispatch('loadMaps');
                this.load('maps', false);
            },
            async addMap() {

            }
        }
    };
</script>

<style scoped lang="scss">

</style>
