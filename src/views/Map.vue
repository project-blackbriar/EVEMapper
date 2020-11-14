<template>
    <Loading v-if="loading"/>
    <div v-else v-resize:debounce="resetSize">
        <div class="dark map" @click="resetFocus" @contextmenu.capture.prevent="$refs.menu.open">
            <svg class="lines">
                <line v-for="connection in mappedConnections" :x1="connection.start.left" :y1="connection.start.top"
                      :x2="connection.end.left" :y2="connection.end.top"
                      style="stroke:rgba(255, 255, 255, 0.5);stroke-width:4"/>
            </svg>
            <MapLocation ref="location" class="selectable" :map-offset-x="mapOffsetX" :map-offset-y="mapOffsetY"
                         v-for="location in map.locations"
                         :location="location" :key="location.name"></MapLocation>
            <ContextMenu ref="menu"
                         :config="[{title: 'System', icon: 'plus', click: () => $bvModal.show('add-system-modal')}]"></ContextMenu>
        </div>
        <b-modal id="add-system-modal" centered title="Add System" @ok="lookup">
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
    import MapLocation from "../components/map/MapLocation";
    import {mapGetters} from "vuex";
    import Loading from "../components/Loading";
    import resize from 'vue-resize-directive';
    import ContextMenu from "../components/ContextMenu";

    export default {
        name: "Map",
        components: {ContextMenu, Loading, MapLocation},
        directives: {
            resize,
        },
        props: {
            id: {
                required: true
            }
        },
        data() {
            return {
                loading: false,
                mapOffsetX: 0,
                mapOffsetY: 0,
                name: "Thera"
            };
        },
        computed: {
            ...mapGetters(['map', 'connections']),
            mappedConnections() {
                return this.loading ? [] : this.connections?.map(connection => {
                    const start = this.map.locations.find(val => connection.start === val.system_id);
                    const end = this.map.locations.find(val => connection.end === val.system_id);
                    if (start && end) {
                        return {
                            ...connection,
                            start,
                            end
                        };
                    }
                    return undefined;
                }).filter(val => val);
            }
        },
        async created() {
            this.loading = true;
            await this.$store.dispatch('loadMap', {id: this.id});
            this.loading = false;
            this.$socket.emit('map', {
                id: this.id
            });
        },
        methods: {
            resetSize() {
                this.mapOffsetX = this.$el.getBoundingClientRect().x;
                this.mapOffsetY = this.$el.getBoundingClientRect().y;
            },
            resetFocus() {
                this.$refs.location.forEach(el => el.resetFocus());
                this.$refs.menu.close();
            },
            async lookup() {
                await this.$store.dispatch('addSystem', {name: this.name});
            }
        }
    };
</script>

<style scoped lang="scss">
    .map {
        position: relative;
        height: 80vh;
        overflow: auto;
        border: 1px solid rgba(0, 0, 0, 0.5);

        .lines {
            position: absolute;
            height: 100%;
            width: 100%;
        }
    }
</style>
