<template>
    <b-card :no-body="!(locationPilots && locationPilots.length > 0)" @contextmenu.capture.prevent="$refs.menu.open"
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
                <div class="names ml-2 mr-2">
                    <h4 @dblclick="showRename = true" class="move">
                        {{location.alias ?location.alias : location.name}}</h4>
                    <h6 class="text-muted" v-if="location.alias && location.alias !== location.name">
                        {{location.name}}</h6>
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
            <tr :key="pilot.CharacterName" v-for="pilot in locationPilots">
                <td class="item"
                    :style="{color : pilot.CharacterName === auth.CharacterName ? 'var(--green)' : 'inherit'}">
                    {{pilot.CharacterName}}
                </td>
                <td class="item" style="color: var(--yellow)" v-if="pilot.ship">{{pilot.ship.ship_name}}</td>
                <td class="item" style="color: var(--orange)" v-if="pilot.ship">{{pilot.ship.type}}</td>
            </tr>
        </table>

        <b-popover :target="location.name" :show.sync="showRename" triggers="manual" placement="top">
            <template #title>Alias</template>
            <b-input name="alias" v-model="alias" @keyup.enter.prevent="rename"/>
        </b-popover>
        <ContextMenu ref="menu" :config="contextConfig"/>
    </b-card>
</template>

<script>
    import SideBarItem from "../SideBarItem";
    import SideBar from "../SideBar";
    import ContextMenu from "../ContextMenu";
    import SecurityDisplay from "./SecurityDisplay";
    import {mapGetters} from "vuex";

    export default {
        name: "MapLocation",
        components: {SecurityDisplay, ContextMenu, SideBar, SideBarItem},
        computed: {
            ...mapGetters(['auth', 'pilots']),
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
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.$emit('startDrag');
                }
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
                this.$store.dispatch('removeLocation', this.location);
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

    .pilots {
        width: 100%;
        font-size: 0.6rem;

        .item {
            padding: 0 0.3rem
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
    }
</style>
