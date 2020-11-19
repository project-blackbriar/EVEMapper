<template>
    <b-card @contextmenu.capture.prevent="$refs.menu.open" @click="$emit('endLink', location)" @mouseup.left="endDrag"
            :id="location.name"
            :class="{location : true, in: location.pilots.findIndex(val => val.name === auth.CharacterName) !== -1, moving: !this.isDragging}"
            :style="`top: ${location.top}px; left: ${location.left}px;`">
        <template #header>
            <div class="header"
                 @mousedown.left="startDrag"
                 @mouseup.left="endDrag">
                <SecurityDisplay :security="location.security">
                    <template v-slot="{securityColor}">
                        <h5 :style="{color: securityColor}">{{location.security}}</h5>
                    </template>
                </SecurityDisplay>
                <div class="names ml-2 mr-2">
                    <h5 @dblclick="showRename = true" class="move">
                        {{location.alias ?location.alias : location.name}}</h5>
                    <span style="font-size: 0.7rem" class="text-muted" v-if="(location.alias !== location.name) && (location.alias)">{{location.name}}</span>
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
        <table class="pilots">
            <tr :key="pilot.name" v-for="pilot in location.pilots">
                <td class="item">{{pilot.name}}</td>
                <td class="item" style="color: var(--yellow)" v-if="pilot.ship">{{pilot.ship.name}}</td>
                <td class="item" style="color: var(--orange)" v-if="pilot.ship">{{pilot.ship.type}}</td>
            </tr>
        </table>

        <b-popover :target="location.name" :show.sync="showRename" triggers="manual" placement="top">
            <template #title>Alias</template>
            <b-input name="alias" v-model="alias" @keyup.enter="rename"/>
        </b-popover>
        <ContextMenu ref="menu" :config="contextConfig"/>
    </b-card>
</template>

<script>
    import SideBarItem from "../SideBarItem";
    import SideBar from "../SideBar";
    import ContextMenu from "../ContextMenu";
    import StaticDisplay from "./StaticDisplay";
    import SecurityDisplay from "./SecurityDisplay";
    import {mapGetters} from "vuex";

    export default {
        name: "MapLocation",
        components: {SecurityDisplay, StaticDisplay, ContextMenu, SideBar, SideBarItem},
        computed: {
            ...mapGetters(['auth']),
        },
        props: {
            location: {
                type: Object,
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
        mounted() {
            this.$emit('update:el', this.$el);
        },
        data() {
            return {
                isDragging: false,
                updated: false,
                alias: this.location.alias ?? this.location.name,
                mouseOffsetX: 0,
                mouseOffsetY: 0,
                element: null,
                showRename: false,
                showContext: false,
                contextConfig: [
                    {
                        title: 'Link',
                        endIcon: 'link',
                        click: () => this.$emit('startLink', this.location),
                        class: "remove",
                    },
                    {title: 'Remove', endIcon: 'trash', click: this.remove, class: "remove",},
                ]
            };
        },
        methods: {
            updateLocation(event) {
                this.updated = true;
                const offSetX = this.$el.getBoundingClientRect().x - this.element.getBoundingClientRect().x;
                const offSetY = this.$el.getBoundingClientRect().y - this.element.getBoundingClientRect().y;
                const x = event.pageX - this.mapOffsetX - this.mouseOffsetX + offSetX;
                const y = event.pageY - this.mapOffsetY - this.mouseOffsetY + offSetY;
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
                this.isDragging = true;
                this.mouseOffsetX = event.offsetX;
                this.mouseOffsetY = event.offsetY;
                this.element = event.target;
                window.addEventListener('mousemove', this.updateLocation);
            },
            endDrag() {
                if (this.isDragging) {
                    this.isDragging = false;
                    window.removeEventListener('mousemove', this.updateLocation);
                    if (this.updated) {
                        this.updated = false;
                        this.$store.dispatch('updateLocation', {location: this.location});
                    }
                }
            },
            resetFocus() {
                this.showRename = false;
                this.showContext = false;
                this.$refs.menu.close();
            },
            remove() {
                this.$store.dispatch('removeLocation', this.location);
            }
        }
    };
</script>

<style scoped lang="scss">
    .location {
        position: absolute;
        user-select: none;
        min-width: 200px;
        border-radius: 0.5rem;
        border: var(--dark) 0.2rem solid;

        &.moving {
            transition: top 500ms, left 500ms;
        }

        &.in {
            border-radius: 0.5rem;
            border: var(--orange) 0.2rem solid;
        }
    }

    .pilots {
        width: 100%;
        font-size: 0.7rem;

        .item {
            padding: 0 0.3rem
        }
    }
    .card-header {
        padding: 0.5rem 0.75rem;
    }
    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        cursor: pointer;

        .names {
            display: flex;
            align-items: center;
            width: 100%;
            height: 100%;
            justify-content: space-between;
            flex-direction: column;
        }
    }
</style>
