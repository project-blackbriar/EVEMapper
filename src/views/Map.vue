<template>
    <Loading v-if="loading"/>
    <div v-else v-resize:debounce="resetSize">
        <div class="map light" @click="resetFocus" @contextmenu.capture.prevent="$refs.menu.open">
            <svg class="lines" v-for="connection in mappedConnections" :key="`${connection.key}-line`"
                 pointer-events="visible"
            >
                <path v-if="connection.pathString"
                      pointer-events="visibleStroke"
                      :d="connection.pathString"
                      @mouseleave="leaveConnection"
                      @mouseenter="enterConnection(connection, $event)"
                      :style="outerConnectionStyle(connection)"
                      :stroke-dasharray="connectionDashArray(connection.size)"
                      stroke-linecap="round"
                      @contextmenu.stop
                      class="path"
                />
                <path v-if="connection.pathString"
                      :d="connection.pathString"
                      :style="innerConnectionStyle(connection)"
                      pointer-events="visibleStroke"
                      @mouseleave="leaveConnection"
                      @mouseenter="enterConnection(connection, $event)"
                      @contextmenu.stop
                      class="path"
                />
            </svg>
            <svg class="lines2">
                <line v-if="link" :x1="link.start.left" :y1="link.start.top"
                      :x2="link.end.left" :y2="link.end.top"
                      style="stroke:rgba(255, 255, 255, 0.5);stroke-width:6"></line>
            </svg>
            <div v-for="connection in mappedConnections" :key="`${connection.key}-middle`">
                <div class="connection-size" v-if="connection.middle.y"
                     @mouseleave="leaveConnection"
                     @mouseenter="enterConnection(connection, $event)"
                     :style="`top: ${connection.middle.y - 10}px; left: ${connection.middle.x - 10}px;`"
                     @contextmenu.stop.prevent="() => {
                                focusedConnection = connection
                                $refs.connectionMenu.open($event)
                            }"
                >{{connection.size}}
                </div>
            </div>
            <MapLocation ref="location" class="selectable" :map-offset-x="mapOffsetX" :map-offset-y="mapOffsetY"
                         v-for="location in map.locations"
                         :location="location" :key="location.name"
                         :selected="selectedLocation.system_id === location.system_id"
                         @startLink="startLink"
                         @endLink="endLink"
                         @startDrag="isDragging = true"
                         @endDrag="endDrag"
                         @selectThis="selectLocation(location)"
            ></MapLocation>
            <ContextMenu ref="menu"
                         :config="[{title: 'System', icon: 'plus', click: () => $bvModal.show('add-system-modal')}]"></ContextMenu>
            <ContextMenu ref="connectionMenu"
                         :config="[
                              {title: 'Toggle EOL', icon: 'clock', click: toggleEOL},
                             {title: 'Status', endIcon: 'status', click: () => $bvModal.show('set-connection-status-modal')},
                             {title: 'Size', endIcon: 'size', click: () => $bvModal.show('set-connection-size-modal')},
                               {title: 'Unlink', icon: 'link', click: unlink}
                               ]"/>
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
        <b-modal id="set-connection-status-modal" centered title="Connection Status" @ok="setConnectionStatus">
            <form ref="form">
                <b-form-group
                        label="Status"
                        invalid-feedback="Status is required"
                >
                    <b-select v-model="focusedConnection.status">
                        <b-select-option :value="1">Stage 1 (Fresh)</b-select-option>
                        <b-select-option :value="2">Stage 2 (Reduced)</b-select-option>
                        <b-select-option :value="3">Stage 3 (Critical)</b-select-option>
                    </b-select>
                </b-form-group>
            </form>
        </b-modal>
        <b-modal id="set-connection-size-modal" centered title="Connection Size" @ok="setConnectionSize">
            <form ref="form">
                <b-form-group
                        label="Status"
                        invalid-feedback="Size is required"
                >
                    <b-select v-model="focusedConnection.size">
                        <b-select-option value="?" disabled>Unknown (?)</b-select-option>
                        <b-select-option value="S">Smallest Ships (S)</b-select-option>
                        <b-select-option value="M">Medium Ships (M)</b-select-option>
                        <b-select-option value="L">Larger Ships (L)</b-select-option>
                        <b-select-option value="XL">Capital Ships (XL)</b-select-option>
                    </b-select>
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
                isDragging: false,
                loading: false,
                overConnection: {},
                mapOffsetX: 0,
                mapOffsetY: 0,
                name: "J160941",
                isLinking: false,
                startLinkLocation: null,
                selectedLocation: {},
                focusedConnection: {
                    status: 0,
                    size: "?"
                },
                mappedConnections: [],
                link: null,
            };
        },
        computed: {
            ...mapGetters(['map', 'connections']),
        },
        async created() {
            this.loading = true;
            await this.$store.dispatch('loadMap', {id: this.id});
            this.$socket.emit('map', {
                id: this.id
            });
            this.loading = false;
        },
        watch: {
            async 'map.locations'() {
                if (!this.isDragging) {
                    const interval = setInterval(async () => {
                        this.calculateMappedConnections();
                    }, 10);
                    setTimeout(() => {
                        clearInterval(interval);
                    }, 500);
                }
            },
            async 'map.connections'() {
                this.calculateMappedConnections();
            }
        },
        async beforeUpdate() {
            if (this.$refs.location) {
                this.calculateMappedConnections();
            }
        },
        methods: {
            selectLocation(location) {
                this.selectedLocation = location;
            },
            outerConnectionStyle(connection) {
                return {
                    stroke: this.overConnection.from === connection.from && this.overConnection.to === connection.to ? 'var(--white)' : connection.eol ? 'var(--purple)' : 'var(--dark)',
                    'stroke-width': '10',
                    fill: 'none'
                };
            },
            innerConnectionStyle(connection) {
                return {
                    stroke: connection.status === 1 ? 'var(--path-stroke)' : connection.status === 2 ? 'var(--orange)' : 'var(--red)',
                    'stroke-width': '5',
                    fill: 'none'
                };
            },
            connectionDashArray(size) {
                switch (size) {
                    case 'S':
                        return '5 10';
                    case 'M':
                        return '15 10';
                    case 'L':
                        return '25 10';
                    default:
                        return '35 10';
                }
            },
            enterConnection(connection) {
                this.overConnection = connection;
            },
            leaveConnection() {
                this.overConnection = {};
            },
            setConnectionSize() {
                this.$store.dispatch('updateConnection', {
                    ...this.focusedConnection,
                });
            },
            setConnectionStatus() {
                this.$store.dispatch('updateConnection', {
                    ...this.focusedConnection,
                });
            },
            toggleEOL() {
                this.$store.dispatch('updateConnection', {
                    ...this.focusedConnection,
                    eol: !this.focusedConnection.eol
                });
            },
            calculateMappedConnections() {
                if (this.$refs.location) {
                    const bDelta = 75;
                    const bOffsets = {
                        top: {x: 0, y: -bDelta},
                        bottom: {x: 0, y: bDelta},
                        right: {x: bDelta, y: 0},
                        left: {x: -bDelta, y: 0},
                    };
                    this.mappedConnections = this.connections.map(connection => {
                        const startEl = this.$refs.location.find(val => val.location.system_id === connection.from).$el;
                        const endEl = this.$refs.location.find(val => val.location.system_id === connection.to).$el;
                        if (endEl == null) {
                            return {
                                start: null,
                                end: null,
                                middle: {x: null, y: null},
                                pathstring: null,
                            };
                        }
                        const start = this.getConnectionPositions(startEl);
                        const end = this.getConnectionPositions(endEl);
                        const startSide = this.getConnectionSide(startEl, endEl);
                        const endSide = this.getConnectionSide(endEl, startEl);
                        const pathString = 'M ' + start[startSide].x + ',' + start[startSide].y + ' C ' + (start[startSide].x + bOffsets[startSide].x) + ',' + (start[startSide].y + bOffsets[startSide].y) + ' ' + (end[endSide].x + bOffsets[endSide].x) + ',' + (end[endSide].y + bOffsets[endSide].y) + ' ' + end[endSide].x + ',' + end[endSide].y;
                        return {
                            ...connection,
                            key: `${connection.from}:${connection.to}`,
                            start, end, pathString, middle: {
                                x: start[startSide].x + (end[endSide].x - start[startSide].x) / 2,
                                y: start[startSide].y + (end[endSide].y - start[startSide].y) / 2,
                            }
                        };
                    });
                }
                return [];
            },
            getConnectionSide(startEl, endEl) {
                const startRect = startEl.getBoundingClientRect();
                const endRect = endEl.getBoundingClientRect();
                const dX = endRect.x - startRect.x;
                const dY = endRect.y - startRect.y;
                if (dX < dY) {
                    if (Math.abs(dX) < dY) {
                        return 'bottom';
                    } else return 'left';
                } else if (dX < Math.abs(dY)) {
                    return 'top';
                } else return 'right';
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
            async endDrag(location) {
                if (this.isDragging) {
                    this.isDragging = false;
                }
            },
            resetSize() {
                this.mapOffsetX = this.$el.getBoundingClientRect().x;
                this.mapOffsetY = this.$el.getBoundingClientRect().y;
            },
            resetFocus() {
                this.$refs.location?.forEach(el => el.resetFocus());
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

            .path-outer {
                stroke: red !important;
            }
        }
    }

    .path {
        transition: stroke 150ms ease-in-out;
        cursor: pointer;
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
