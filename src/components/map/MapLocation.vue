<template>
    <b-card :no-body="true" @contextmenu.capture.prevent="$refs.menu.open"
            @click.left="() => {
                endDrag()
                $emit('endLink', location)
            }"
            :id="location.name"
            :class="{location : true, in:isPilotIn , moving: !isDragging, selected : selected}"
            :style="`top: ${location.top}px; left: ${location.left}px;`">
        <template #header>
            <div class="header"
                 @mousedown.left="startDrag">
                <SecurityDisplay :security="location.security">
                    <template v-slot="{securityColor}">
                        <h4 :style="{color: securityColor}">{{location.security}}</h4>
                    </template>
                </SecurityDisplay>
                <EffectsDisplay v-if="location.effect" :effect="location.effect">
                    <template v-slot="{effectColor}">
                        <a v-b-tooltip.hover :title="camelCaseToWords(location.effect)">
                            <b-icon-square-fill :style="{color: effectColor}" class="ml-1" scale="0.8"></b-icon-square-fill>
                        </a>
                    </template>
                </EffectsDisplay>
                <div class="names ml-2 mr-2">
                    <h4 @dblclick="showRename = true" class="move">
                        {{location.alias ?location.alias : location.name}}</h4>
                    <h6 class="text-muted" v-if="location.alias && location.alias !== location.name">
                        {{location.name}}</h6>
                </div>
                <div class="pilots">
                    <p v-if="locationPilots" class="text-muted" style="color: var(--green);">{{locationPilots.length}}</p>
                </div>
                <div>
                    <SecurityDisplay :security="st.goes" v-for="st in location.statics" :key="st.code">
                        <template v-slot="{securityColor}">
                            <h6 :style="{
                        marginRight: '0.2em',
                        color: securityColor
                    }">{{st.goes}}</h6>
                        </template>
                    </SecurityDisplay>
                </div>
            </div>
        </template>

        <b-popover :target="location.name" :show.sync="showRename" triggers="manual" placement="top">
            <template #title>Alias</template>
            <b-input name="alias" v-model="alias" @keyup.enter.prevent="rename"/>
        </b-popover>
        <ContextMenu ref="menu" :config="contextConfig"/>
        <b-modal :id="'delconfirm' + location.system_id" centered title="Are you sure?" @ok="confirmRemoveChain" @cancel="clearQ" @close="clearQ">
            <form ref="form" @submit.prevent>
                <h6>This will delete the following systems:</h6>
                <ul>
                    <li v-for="item in deleteQ" :key="item.system_id">
                        {{item.name}} - {{item.alias}}
                    </li>
                </ul>
            </form>
        </b-modal>
    </b-card>
</template>

<script>
    import SideBarItem from "../SideBarItem";
    import SideBar from "../SideBar";
    import ContextMenu from "../ContextMenu";
    import SecurityDisplay from "./SecurityDisplay";
    import EffectsDisplay from "./EffectsDisplay";
    import {mapGetters} from "vuex";

    export default {
        name: "MapLocation",
        components: {SecurityDisplay, ContextMenu, SideBar, SideBarItem, EffectsDisplay},
        computed: {
            ...mapGetters(['auth', 'pilots', 'mapScroll', 'map']),
            locationPilots() {
                return this.pilots[this.location.system_id];
            },
            isPilotIn() {
                return this.locationPilots?.find(val => val.CharacterName === this.auth.CharacterName);
            }
        },
        props: {
            location: {
                type: Object,
                required: true
            },
            selected: {
                type: Boolean,
                required: true
            },
            mapOffsetX: {
                type: Number,
                required: true
            },
            mapOffsetY: {
                type: Number,
                required: true
            }
        },
        data() {
            return {
                isDragging: false,
                updated: false,
                clicked: false,
                alias: this.location.alias ?? this.location.name,
                mouseOffsetX: 0,
                mouseOffsetY: 0,
                element: null,
                showRename: false,
                showContext: false,
                deleteQ: [],
                contextConfig: [
                    {
                        title: 'Link',
                        endIcon: 'link',
                        click: () => this.$emit('startLink', this.location),
                        class: "remove",
                    },
                    {title: 'Remove', endIcon: 'trash', click: this.remove, class: "remove",},
                    {title: 'Remove Chain', endIcon: 'trash', click: this.removeChain, class: "remove",},
                ]
            };
        },
        methods: {
            updateLocation(event) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.$emit('startDrag');
                }
                this.updated = true;
                const offSetX = this.$el.getBoundingClientRect().x - this.element.getBoundingClientRect().x;
                const offSetY = this.$el.getBoundingClientRect().y - this.element.getBoundingClientRect().y;
                const x = event.pageX - this.mapOffsetX - this.mouseOffsetX + offSetX + this.mapScroll.left;
                const y = event.pageY - this.mapOffsetY - this.mouseOffsetY + offSetY + this.mapScroll.top;
                if (x <= 0) return;
                if (y <= 0) return;
                const loc = {
                    ...this.location,
                    top: y,
                    left: x
                };
                this.$store.commit('updateLocation', {location: loc});
            },
            rename() {
                const loc = {
                    ...this.location,
                    alias: this.alias
                };
                this.$store.dispatch('updateLocation', {
                    location: loc
                });
                this.$store.commit('updateLocation', {location: loc});
                this.showRename = false;
            },
            startDrag(event) {
                this.mouseOffsetX = event.offsetX;
                this.mouseOffsetY = event.offsetY;
                this.element = event.target;
                window.addEventListener('mousemove', this.updateLocation);
            },
            endDrag() {
                if (!this.isDragging) {
                    this.$emit('selectThis');
                }
                this.isDragging = false;
                window.removeEventListener('mousemove', this.updateLocation);
                if (this.updated) {
                    this.updated = false;
                    this.$store.dispatch('updateLocation', {location: this.location});
                    this.$emit('endDrag');
                }
            },
            resetFocus() {
                this.showRename = false;
                this.showContext = false;
                this.$refs.menu.close();
            },
            remove() {
                if (this.location.system_id != this.map.home) {
                    this.$store.dispatch('removeLocation', this.location);
                } else {
                    this.$bvToast.toast('Cannot delete home system', {
                        title: 'Not allowed',
                        variant: 'danger'
                    });
                }
            },
            removeChain() {
                // Find route home
                const locations = [...this.map.locations]
                const connections = [...this.map.connections]
                var chains = this.findConnectedTo(this.location.system_id, connections)
                const origin = locations.find(l => l.system_id === this.location.system_id)
                origin.searched = true
                var searched = {}
                let homeChain = []
                var Q = []
                searched[origin.system_id] = true
                chains.forEach(chain => {
                    Q = [] // Reset Q
                    Q.push(locations.find(l => l.system_id === chain)) // Push chain origin
                    Q[0].searched = true
                    while (Q.length > 0) {
                        const node = Q.shift()
                        if (node.system_id === this.map.home) {
                            homeChain.push(chain)
                            break
                        }
                        for (const id of this.findConnectedTo(node.system_id, connections)) {
                            const conn = locations.find(l => l.system_id === id)
                            if (!(conn.system_id in searched)) {
                                searched[conn.system_id] = true
                                Q.push(conn)
                            }
                        }
                    }
                })
                // Delete all other links
                var delQ = []
                Q = []
                searched = {}
                Q.push(origin)
                searched[origin.system_id] = true
                while (Q.length > 0) {
                    const node = Q.shift()
                    this.deleteQ.push(node)
                    for (const id of this.findConnectedTo(node.system_id, connections)) {
                        const conn = locations.find(l => l.system_id === id)
                        if (homeChain.includes(conn.system_id)) {
                            continue
                        }
                        if (searched[conn.system_id] == false || !(conn.system_id in searched)) {
                            searched[conn.system_id] = true
                            Q.push(conn)
                        }
                    }
                }
                this.$bvModal.show(`delconfirm${this.location.system_id}`)
            },
            confirmRemoveChain() {
                this.deleteQ.forEach(system => {
                    this.$store.dispatch('removeLocation', system)
                })
            },
            clearQ() {
                this.deleteQ = []
            },
            findConnectedTo(system_id, connections) {
                let connected = []
                connections.forEach(connection => {
                    if (connection.from === system_id) {
                        connected.push(connection.to)
                    }
                    if (connection.to === system_id) {
                        connected.push(connection.from)
                    }
                })
                return connected
            },
            camelCaseToWords(str) {
                return str.match(/^[a-z]+|[A-Z][a-z]*/g).map(function(x){
                    return x[0].toUpperCase() + x.substr(1).toLowerCase();
                }).join(' ');
            }

        }
    };
</script>

<style scoped lang="scss">

    .card-header {
        padding: 0.2rem 0.5rem;
    }

    .card-body {
        padding: 0.2rem;
    }

    .location {
        position: absolute;
        user-select: none;
        min-width: 8rem;
        border-radius: 0.5rem;
        border: var(--dark) 0.2rem solid;
        transition: box-shadow 500ms;

        &.moving {
            transition: top 500ms, left 500ms, box-shadow 200ms;
        }

        &.in {
            border-radius: 0.5rem;
            border: var(--orange) 0.2rem solid;
        }

        &.selected {
            box-shadow: 0px 0px 5px 2px var(--blue)
        }

    }


    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        cursor: pointer;

        h4 {
            font-size: 0.9rem;
            margin-bottom: 0;
        }

        h6 {
            font-size: 0.6rem;
            margin-bottom: 0;
        }

        .names {
            display: flex;
            align-items: center;
            width: 100%;
            height: 100%;
            justify-content: space-between;
            flex-direction: column;
        }
        .pilots {
            display: flex;
            align-items: center;
            width: 3rem;
            height: 100%;
            justify-content: space-between;
            flex-direction: column;
            font-size: 0.9rem;

            p {
                margin: 0 0.2rem;
                min-width: 21px;
                border-style: solid;
                border-color: rgba(158, 158, 158, 0.95);
                border-width: 1px;
                text-align: center;
            }
        }
    }
</style>
