<template>
    <Loading v-if="loading"/>
    <div v-else v-resize:debounce="resetSize">
        <div class="map light" @click="resetFocus" @contextmenu.capture.prevent="$refs.menu.open">
            <svg class="lines">
                <line class="moving" v-for="connection in mappedConnections"
                      :x1="connection.start[connection.startSide].x"
                      :y1="connection.start[connection.startSide].y"
                      :x2="connection.end[connection.endSide].x" :y2="connection.end[connection.endSide].y"
                      style="stroke:rgba(255, 255, 255, 0.5);stroke-width:6" @contextmenu.stop>
                </line>

                <line v-if="link" :x1="link.start.left" :y1="link.start.top"
                      :x2="link.end.left" :y2="link.end.top"
                      style="stroke:rgba(255, 255, 255, 0.5);stroke-width:6;z-index: 999"></line>
            </svg>
            <div class="connection-size" v-for="connection in mappedConnections"
                 :style="`top: ${connection.middle.y - 10}px; left: ${connection.middle.x - 10}px;`"
                 @contextmenu.stop.prevent="() => {
                          focusedConnection = connection
                          $refs.connectionMenu.open($event)
                      }"
            >?
            </div>
            <MapLocation ref="location" class="selectable" :map-offset-x="mapOffsetX" :map-offset-y="mapOffsetY"
                         v-for="location in map.locations"
                         :location="location" :key="location.name"
                         @startLink="startLink"
                         @endLink="endLink"
                         :el.sync="locationEl[location.system_id]"
            ></MapLocation>
            <ContextMenu ref="menu"
                         :config="[{title: 'System', icon: 'plus', click: () => $bvModal.show('add-system-modal')}]"></ContextMenu>
            <ContextMenu ref="connectionMenu"
                         :config="[{title: 'Unlink', endIcon: 'link', click: unlink}]"></ContextMenu>
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
                locationEl: {},
                loading: false,
                mapOffsetX: 0,
                mapOffsetY: 0,
                name: "J160941",
                isLinking: false,
                startLinkLocation: null,
                focusedConnection: null,
                link: null
            };
        },
        computed: {
            ...mapGetters(['map', 'connections']),
            mappedConnections() {
                return Object.keys(this.locationEl).length === 0 ? [] : this.connections.map(connection => {
                    const startEl = this.locationEl[connection.start];
                    const endEl = this.locationEl[connection.end];
                    const start = this.getConnectionPositions(startEl);
                    const end = this.getConnectionPositions(endEl);
                    const startSide = this.getConnectionSide(startEl, endEl);
                    const endSide = this.getConnectionSide(endEl, startEl);
                    return {
                        start, end, startSide, endSide, middle: {
                            x: start[startSide].x + (end[endSide].x - start[startSide].x) / 2,
                            y: start[startSide].y + (end[endSide].y - start[startSide].y) / 2,
                        }
                    };
                });
            }
        },
        async created() {
            this.loading = true;
            await this.$store.dispatch('loadMap', {id: this.id});
            this.$socket.emit('map', {
                id: this.id
            });
            this.loading = false;
        },
        methods: {
            getConnectionSide(startEl, endEl) {
                return 'middle';
            },
            getConnectionPositions(el) {
                const rect = el.getBoundingClientRect();
                const rectOffset = {
                    width: rect.width,
                    height: rect.height,
                    x: rect.x - this.mapOffsetX,
                    y: rect.y - this.mapOffsetY
                };
                return {
                    top: {
                        x: rectOffset.x + (rectOffset.width / 2),
                        y: rectOffset.y
                    },
                    bottom: {
                        x: rectOffset.x + (rectOffset.width / 2),
                        y: rectOffset.y + rectOffset.height
                    },
                    right: {
                        x: rectOffset.x + rectOffset.width,
                        y: rectOffset.y + (rectOffset.height / 2)
                    },
                    left: {
                        x: rectOffset.x,
                        y: rectOffset.y + (rectOffset.height / 2)
                    },
                    middle: {
                        x: rectOffset.x + (rectOffset.width / 2),
                        y: rectOffset.y + (rectOffset.height / 2)
                    }
                };
            },
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
            },
            updateLink(event) {
                const x = event.pageX - this.mapOffsetX;
                const y = event.pageY - this.mapOffsetY;
                this.link = {
                    ...this.link,
                    end: {
                        top: y,
                        left: x
                    }
                };
            },
            startLink(location) {
                this.isLinking = true;
                this.startLinkLocation = location;
                this.link = {
                    start: {
                        top: location.top,
                        left: location.left
                    },
                    end: {
                        top: location.top,
                        left: location.left
                    }
                };
                window.addEventListener('mousemove', this.updateLink);
            },
            async endLink(location) {
                if (this.isLinking) {
                    if (location.system_id === this.startLinkLocation.system_id) return;
                    window.removeEventListener('mousemove', this.updateLink);
                    this.link = null;
                    if (this.startLinkLocation.connections?.includes(location.system_id)) {
                        this.$bvToast.toast('Already Linked', {
                            title: 'Link',
                            variant: 'warning'
                        });
                        return;
                    }
                    await this.$store.dispatch('updateLocation', {
                        location: {
                            ...this.startLinkLocation,
                            connections: [...(this.startLinkLocation.connections ?? []), location.system_id]
                        }
                    });
                    await this.$store.dispatch('updateLocation', {
                        location: {
                            ...location,
                            connections: [...(location.connections ?? []), this.startLinkLocation.system_id]
                        }
                    });
                    this.startLinkLocation = false;
                    this.isLinking = false;
                }
            },
            async unlink() {
                const startLocation = this.map.locations.find(val => val.system_id === this.focusedConnection.start.system_id);
                const endLocation = this.map.locations.find(val => val.system_id === this.focusedConnection.end.system_id);

                await this.$store.dispatch('updateLocation', {
                    location: {
                        ...startLocation,
                        connections: startLocation.connections.filter(val => val !== this.focusedConnection.end.system_id)
                    }
                });
                await this.$store.dispatch('updateLocation', {
                    location: {
                        ...endLocation,
                        connections: endLocation.connections.filter(val => val !== this.focusedConnection.start.system_id)
                    }
                });
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

    .connection-size {
        position: absolute;
        background-color: var(--dark);
        width: 1.5rem;
        height: 1.5rem;
        text-align: center;
        border-radius: 5px;
        user-select: none;
        cursor: pointer;
    }
</style>
