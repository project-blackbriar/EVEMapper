<template>
    <Loading v-if="loading"/>
    <div v-else v-resize:debounce="resetSize">
        <div id="map" class="map light" @click="resetFocus" @contextmenu.capture.prevent="$refs.menu.open">
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
                         :selected="selectedLocation !== null && selectedLocation.system_id === location.system_id"
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
            <ContextMenu ref="leadsToMenu"
                         :config="[
                             {title: 'Leads to', endIcon: 'status', click: () => $bvModal.show('set-leadsto-system-modal')},
                               ]"/>
        </div>
        <b-container v-if="selectedLocation" class="mw-100 mt-3 m-0">
            <b-row>
                <b-col cols="8" class="p-0 pr-1">
                    <b-card class="w-100">
                        <template #header>
                            <div class="d-flex justify-content-between">
                                <h4>Signatures</h4>
                                <div>
                                    <b-input v-model="search" placeholder="Search..."></b-input>
                                </div>
                            </div>
                        </template>

                        <b-table
                                :sort-by.sync="sortBy"
                                :sort-desc.sync="sortDesc"
                                striped :fields="signatureFields" hover small
                                :items="filteredSignatures">
                            <template #cell(percent)="{value}">
                                <div :style="`border-radius: 50%; width: 10px; height: 10px; background-color: var(--${value.match(new RegExp('100')) ? 'green' : 'red'})`"></div>
                            </template>
                            <template #cell(type)="{value, index}">
                                {{value}}
                            </template>
                            <template #cell(name)="{value, index}">
                                {{value}}
                            </template>
                            <template #cell(leads)="row">
                                <div @contextmenu.stop.prevent="() => {
                                    focusedSignature = row.item
                                    $refs.leadsToMenu.open($event)
                                    }">
                                    {{row.item.type == 'Wormhole' ? systemName(row.item.leads) || '--------' : ''}}
                                </div>
                            </template>
                            <template #cell(created)="{value}">
                                <timeago :datetime="new Date(value)" :auto-update="1"></timeago>
                            </template>
                            <template #cell(updated)="{value}">
                                <timeago :datetime="new Date(value)" :auto-update="1"></timeago>
                            </template>
                            <template #cell(options)="{index}">
                                <b-icon-trash class="delete" @click="deleteSig(index)">Delete</b-icon-trash>
                            </template>
                        </b-table>
                    </b-card>
                </b-col>
                <b-col cols="4" class="p-0 pl-1">
                    <b-card>
                        <template #header>
                            <h4>{{selectedLocation.name}}
                                <a target="_blank" :href="`https://evemaps.dotlan.net/system/${selectedLocation.name}`"
                                   v-b-tooltip.hover title="dotlan">
                                    <img
                                            class="ml-1 mr-1 icon-hover"
                                            style="height: 20px; width:20px"
                                            src="../assets/logo_dotlan.png"/></a>
                                <a target="_blank" :href="`https://anoik.is/systems/${selectedLocation.name}`"
                                   v-b-tooltip.hover title="Anoik.is">
                                    <img class="ml-1 mr-1 icon-hover"
                                         style="height: 20px; width:20px"
                                         src="../assets/logo_anoik.png"/></a></h4>
                        </template>
                    </b-card>
                    <b-card class="mt-3">
                        <template #header>
                            <h4>Routes
                                <a class="green float-right ml-2" @click.prevent="$bvModal.show('add-route-modal')"
                                   href="#"
                                   v-b-tooltip.hover title="Add">
                                    <b-icon-plus-circle class="icon-hover"></b-icon-plus-circle>
                                </a>
                            </h4>
                        </template>
                        <b-container>
                            <b-table
                                    striped :fields="routeFields" hover small
                                    :items="routes">
                                <template #cell(systems)="{value}">
                                    <div v-if="typeof value === 'string'">No Route Found</div>
                                    <Security v-else :security="system.security_status" :key="system.system_id"
                                              v-for="system in value">
                                        <template v-slot="{securityColor}">
                                            <a v-b-tooltip.hover
                                               :title="system.name + ' (' + Math.floor(system.security_status * 10) / 10 +')'">
                                                <b-icon-square-fill v-if="system.type === 'K'" :style="{color: securityColor}"
                                                                    class="ml-1"></b-icon-square-fill>
                                                <b-icon-plus-circle-fill v-else :style="{color: securityColor}"
                                                                    class="ml-1"></b-icon-plus-circle-fill>
                                            </a>
                                        </template>
                                    </Security>
                                </template>
                                <template #cell(options)="{index}">
                                    <b-icon-trash class="delete" @click="removeRoute(index)">Delete</b-icon-trash>
                                </template>
                            </b-table>
                        </b-container>
                    </b-card>
                </b-col>
            </b-row>
        </b-container>
        <b-modal id="add-system-modal" centered title="Add System" @ok="lookup">
            <form ref="form" @submit.prevent>
                <b-form-group
                        label="Name"
                        label-for="name-input"
                        invalid-feedback="Name is required"
                >
                    <b-form-input
                            id="name-input"
                            v-model="name"
                            required
                            @keydown.enter="lookup"
                    ></b-form-input>
                </b-form-group>
            </form>
        </b-modal>
        <b-modal id="add-route-modal" centered title="Add System" @ok="addRoute">
            <form ref="form" @submit.prevent>
                <b-form-group
                        label="Name"
                        label-for="name-input"
                        invalid-feedback="Name is required"
                >
                    <b-form-input
                            id="name-input"
                            v-model="routeName"
                            required
                            @keydown.enter="addRoute"
                    ></b-form-input>
                </b-form-group>
                <b-form-group
                        label="Flag"
                        label-for="name-input"
                        invalid-feedback="Flag is required"
                >
                    <b-select v-model="routeFlag">
                        <b-select-option value="shortest">Shortest</b-select-option>
                        <b-select-option value="secure">Secure</b-select-option>
                        <b-select-option value="insecure">Insecure</b-select-option>
                    </b-select>
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
        <b-modal id="set-leadsto-system-modal" centered title="Leads To:" @ok="setLeadsToSystem">
            <form ref="form">
                <b-form-group
                        label="Connection"
                        invalid-feedback="Connection is required"
                >
                    <b-select v-if="selectedLocation" v-model="focusedSignature.leads">
                        <b-select-option v-for="connection in connectionsToID(selectedLocation.system_id)" :value="connection" :key="connection">{{systemName(connection)}}</b-select-option>
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
    import SigPaster from "../mixins/SigPaster";
    import SecurityDisplay from "../components/map/SecurityDisplay";
    import Security from "../components/map/Security";

    export default {
        name: "Map",
        components: {Security, SecurityDisplay, ContextMenu, Loading, MapLocation},
        mixins: [SigPaster],
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
                sortBy: 'code',
                sortDesc: false,
                search: "",
                isDragging: false,
                loading: false,
                overConnection: {},
                mapOffsetX: 0,
                mapOffsetY: 0,
                name: "J160941",
                routeName: "J160941",
                routeFlag: "shortest",
                isLinking: false,
                startLinkLocation: null,
                focusedConnection: {
                    status: 0,
                    size: "?"
                },
                focusedSignature: {},
                mappedConnections: [],
                link: null,
                sigGroup: [
                    "Ore Site", "Combat Site", 'Data Site', 'Relic Site', 'Gas Site', 'Wormhole'
                ],
                routeFields: [
                    {
                        key: 'destination.name',
                        label: "Destination",
                        tdClass: "d-flex align-items-center justify-content-center"
                    }
                    , {
                        key: 'flag',
                        label: "Flag",
                        tdClass: "text-capitalize"
                    }, {
                        key: 'systems',
                        label: "Route",
                    },
                    {
                        key: 'options',
                        label: "",
                        tdClass: "d-flex align-items-center justify-content-center"
                    }
                ],
                signatureFields: [
                    {
                        key: 'percent',
                        label: "",
                        tdClass: "d-flex align-items-center justify-content-center"
                    }, {
                        key: 'code',
                        tdClass: 'code-size',
                        sortable: true
                    }, {
                        key: 'type',
                        tdClass: 'text-center',
                        sortable: true
                    }, {
                        key: 'name',
                        tdClass: 'text-center',
                        sortable: true
                    }, {
                        key: 'leads',
                        label: 'Leads to:',
                        tdClass: 'text-center',
                        sortable: true
                    }, {
                        key: 'created',
                        tdClass: 'text-center',
                        sortable: true
                    }, {
                        key: 'updated',
                        tdClass: 'text-center',
                        sortable: true
                    }, {
                        key: 'options',
                        label: "",
                        tdClass: 'text-center'
                    }
                ]
            };
        },
        computed: {
            ...mapGetters(['map', 'connections', 'selectedLocation', 'routes', 'mapScroll']),
            filteredSignatures() {
                if (this.search !== "") {
                    return this.selectedLocation.signatures.filter(val => val.code.search(new RegExp(this.search, "i")) !== -1);
                } else return this.selectedLocation.signatures;
            }
        },
        async created() {
            window.addEventListener('paste', this.handlePaste);
            window.addEventListener('scroll', this.resetSize);
            this.loading = true;
            await this.$store.dispatch('loadMap', {id: this.id});
            this.$socket.emit('map', {
                id: this.id
            });
            this.loading = false;
        },
        async beforeDestroy() {
            window.removeEventListener('paste', this.handlePaste);
            window.removeEventListener('scroll', this.resetSize);
        },
        watch: {
            async 'selectedLocation'() {
                // Getting cant read property system_id of null
                if (this.selectedLocation){
                    await this.$store.dispatch('getRoutes', {origin: this.selectedLocation.system_id});
                }
            },
            async 'map.locations'() {
                if (!this.isDragging) {
                    const interval = setInterval(async () => {
                        this.calculateMappedConnections();
                        this.setScrollListener()
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
            connectionsToID(id) {
                return this.connections.filter(conn => conn.from == id || conn.to == id).map(connection => {
                    return connection.to == id ? connection.from : connection.to
                })
            },
            systemName(id) {
                const loc = this.map.locations.find(loc => loc.system_id == id)
                return loc ? loc.alias || loc.name : null
            },
            setLeadsToSystem() {
                const idx = this.selectedLocation.signatures.findIndex(sig => sig.code === this.focusedSignature.code)
                this.selectedLocation.signatures[idx] = this.focusedSignature
                this.saveSelectedLocation()
            },
            saveSelectedLocation() {
                this.$store.dispatch("updateLocation", {
                    location: this.selectedLocation
                });
            },
            async removeRoute(index) {
                const route = this.routes[index];
                await this.$store.dispatch('removeRoute', {name: route.destination.system_id, flag: route.flag});
                await this.$store.dispatch('getRoutes', {origin: this.selectedLocation.system_id});
            },
            async addRoute() {
                await this.$store.dispatch('addRoute', {name: this.routeName, flag: this.routeFlag});
                await this.$store.dispatch('getRoutes', {origin: this.selectedLocation.system_id});
            },
            selectLocation(location) {
                this.$store.commit('setSelectedLocation', location);
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
                const idx = this.mappedConnections.findIndex(conn => conn.key == this.focusedConnection.key)
                this.mappedConnections[idx].size = this.focusedConnection.size
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
                    const bDelta = 50;
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
                        x: rectOffset.x + (rectOffset.width / 2) + window.scrollX + this.mapScroll.left,
                        y: rectOffset.y + window.scrollY + this.mapScroll.top
                    },
                    bottom: {
                        x: rectOffset.x + (rectOffset.width / 2) + window.scrollX + this.mapScroll.left,
                        y: rectOffset.y + rectOffset.height + window.scrollY + this.mapScroll.top
                    },
                    right: {
                        x: rectOffset.x + rectOffset.width + window.scrollX + this.mapScroll.left,
                        y: rectOffset.y + (rectOffset.height / 2) + window.scrollY + this.mapScroll.top
                    },
                    left: {
                        x: rectOffset.x + window.scrollX + this.mapScroll.left,
                        y: rectOffset.y + (rectOffset.height / 2) + window.scrollY + this.mapScroll.top
                    },
                    middle: {
                        x: rectOffset.x + (rectOffset.width / 2) + window.scrollX + this.mapScroll.left,
                        y: rectOffset.y + (rectOffset.height / 2) + window.scrollY + this.mapScroll.top
                    }
                };
            },
            async endDrag(location) {
                if (this.isDragging) {
                    this.isDragging = false;
                }
            },
            resetSize(event) {
                this.mapOffsetX = this.$el.getBoundingClientRect().x + window.scrollX;
                this.mapOffsetY = this.$el.getBoundingClientRect().y + window.scrollY;
            },
            resetFocus() {
                this.$refs.location?.forEach(el => el.resetFocus());
                this.$refs.menu.close();
            },
            async lookup() {
                await this.$store.dispatch('addSystem', {name: this.name});
            },
            setScrollListener() {
                const map = this.$el.querySelector("#map");
                map.addEventListener('scroll', this.getMapScroll);
            },
            getMapScroll(event) {
                if (event.target) {
                    this.$store.commit('setMapScroll', {left: event.target.scrollLeft, top: event.target.scrollTop})
                }
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
            height: 1000px;
            width: 2000px;

            .path-outer {
                stroke: red !important;
            }
        }
    }

    .icon-hover {
        cursor: pointer;
        transition: transform 50ms;

        &:hover {
            transform: scale(1.1);
        }
    }

    .path {
        transition: stroke 150ms ease-in-out;
        cursor: pointer;
    }


    .delete {
        color: var(--red);

        &:hover {
            color: red
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
