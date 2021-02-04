<template>
    <Loading v-if="loading"/>
    <div v-else v-resize:debounce="resetSize">
        <div id="map" class="map light" @click="resetFocus" @contextmenu.capture.prevent="$refs.menu.open">
            <svg class="lines2">
                <line
                    v-if="link"
                    :x1="link.start.left"
                    :y1="link.start.top"
                    :x2="link.end.left"
                    :y2="link.end.top"
                    style="stroke:rgba(255, 255, 255, 0.5);stroke-width:6"
                ></line>
            </svg>
            <MapConnection v-for="connection in mappedConnections" :key="connection.key" :connection="connection" />
            <MapLocation ref="location" class="selectable" :map-offset-x="mapOffsetX" :map-offset-y="mapOffsetY"
                         v-for="location in map.locations"
                         :location="location" :key="location.name"
                         :selected="selectedLocation !== null && selectedLocation.system_id === location.system_id"
                         :highlighted="highlightedLocations.includes(location.system_id)"
                         @startLink="startLink"
                         @endLink="endLink"
                         @startDrag="isDragging = true"
                         @endDrag="endDrag"
                         @selectThis="selectLocation(location)"
            ></MapLocation>
            <ContextMenu ref="menu"
                         :config="[{title: 'System', icon: 'plus', click: () => $bvModal.show('add-system-modal')}]"></ContextMenu>
        </div>
        <b-container v-if="selectedLocation" class="mw-100 mt-3 m-0">
            <b-row>
                <b-col cols="8" class="p-0 pr-1">
                    <LocationSignatures />
                </b-col>
                <b-col cols="4" class="p-0 pl-1">
                    <LocationHeader />
                    <LocationPilots />
                    <LocationRoutes />
                    <RecentKills />
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
    import RecentKills from "../components/panels/RecentKills";
    import LocationRoutes from "../components/panels/LocationRoutes";
    import LocationPilots from "../components/panels/LocationPilots"
    import LocationSignatures from "../components/panels/LocationSignatures"
    import LocationHeader from "../components/panels/LocationHeader"
    import MapConnection from "../components/map/MapConnection"

    export default {
        name: "Map",
        components: {Security, SecurityDisplay, ContextMenu, Loading, MapLocation, MapConnection, RecentKills, LocationRoutes, LocationPilots, LocationSignatures, LocationHeader},
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
                isDragging: false,
                loading: false,
                mapOffsetX: 0,
                mapOffsetY: 0,
                name: "J160941",
                isLinking: false,
                startLinkLocation: null,
                mappedConnections: [],
                link: null,
            };
        },
        computed: {
            ...mapGetters(['map', 'connections', 'selectedLocation', 'routes', 'mapScroll', 'pilots', 'highlightedConnections', 'highlightedLocations']),
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
            sizeColor(size) {
                if (size == "XL") {
                    return '#DC3201';
                } else if (size == "L") {
                    return '#F5F501';
                } else if (size == "M") {
                    return '#00FF00';
                } else if (size == "S") {
                    return '#33F9F9';
                } else {
                    return '#888';
                }
            },
            selectLocation(location) {
                this.$store.commit('setSelectedLocation', {...location, kills: []});
                this.$store.dispatch('getKills', location);
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
                        const startEl = this.$refs.location.find(val => val.location.system_id === connection.from)?.$el;
                        const endEl = this.$refs.location.find(val => val.location.system_id === connection.to)?.$el;
                        if (endEl == null || startEl == null) {
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
                    const fromID = this.startLinkLocation.system_id;
                    const toID = location.system_id;
                    if (fromID === toID) return;
                    window.removeEventListener('mousemove', this.updateLink);
                    this.link = null;
                    const existing = this.map.connections.filter(c => {
                        if ((c.from === fromID && c.to === toID) || (c.from === toID && c.to === fromID)) {
                            return true
                        } return false
                    })
                    if (existing.length != 0) {
                        this.$bvToast.toast('Already Linked', {
                            title: 'Link',
                            variant: 'warning'
                        });
                        return;
                    }

                    await this.$store.dispatch('addConnection', {
                        connection: {
                            from: fromID,
                            to: toID,
                            size: "?",
                            eol: false,
                            status:1
                        }
                    })
                    this.startLinkLocation = false;
                    this.isLinking = false;
                }
            },
        }
    };
</script>

<style scoped lang="scss">
.card-small {
    min-width: 600px;
}

.lines2 {
  position: absolute;
  height: 1000px;
  width: 2000px;
}

.map {
    position: relative;
    height: 75vh;
    overflow: auto;
    border: 1px solid rgba(0, 0, 0, 0.5);
}

.icon-hover {
    cursor: pointer;
    transition: transform 50ms;

    &:hover {
        transform: scale(1.1);
    }
}

::-webkit-scrollbar { width: 8px; height: 8px;}
::-webkit-scrollbar-button {  background-color: #666; }
::-webkit-scrollbar-track {  background-color: #646464;}
::-webkit-scrollbar-track-piece { background-color: #000;}
::-webkit-scrollbar-thumb { height: 50px; background-color: #666; border-radius: 3px;}
::-webkit-scrollbar-corner { background-color: #646464;}
::-webkit-resizer { background-color: #666;}
</style>
