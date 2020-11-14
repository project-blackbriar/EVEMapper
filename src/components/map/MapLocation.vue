<template>
    <b-card @contextmenu.capture.prevent="$refs.menu.open" @mouseup.left="endDrag" :id="location.name"
            class="location"
            :style="`top: ${location.top}px; left: ${location.left}px;`">
        <template #header>
            <h4 @dblclick="showRename = true" @mousedown.left="startDrag" @mouseup.left="endDrag" class="move">
                {{location.alias ?location.alias : location.name}}</h4>
        </template>
        <b-card-sub-title v-if="location.alias">{{location.name}}</b-card-sub-title>
        <div class="statics">
            <StaticDisplay :key="st.code" v-for="st in location.statics" :st="st"></StaticDisplay>
        </div>
        <template #footer v-if="location.pilots && location.pilots.length > 0">
            <div :key="pilot" v-for="pilot in location.pilots">{{pilot}}</div>
        </template>
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

    export default {
        name: "MapLocation",
        components: {StaticDisplay, ContextMenu, SideBar, SideBarItem},
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
        data() {
            return {
                alias: this.location.alias ?? this.location.name,
                mouseOffsetX: 0,
                mouseOffsetY: 0,
                element: null,
                showRename: false,
                showContext: false,
                contextConfig: [
                    {title: 'Remove', endIcon: 'x-square-fill', click: this.remove},
                    {title: 'A Long Word Context', click: () => console.log('Test')}
                ]
            };
        },
        methods: {
            updateLocation(event) {
                const fontSize = parseFloat(getComputedStyle(this.element).fontSize);
                const x = event.pageX - this.mapOffsetX - fontSize - this.mouseOffsetX;
                const y = event.pageY - this.mapOffsetY - (fontSize * 0.6) - this.mouseOffsetY;
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
                if (event.offsetX > this.$el.getBoundingClientRect().x - 5) return;
                else if (event.offsetY > this.$el.getBoundingClientRect().y - 5) return;
                else if (event.offsetX < 5) return;
                else if (event.offsetY < 5) return;
                this.mouseOffsetX = event.offsetX;
                this.mouseOffsetY = event.offsetY;
                this.element = event.target;
                window.addEventListener('mousemove', this.updateLocation);
            },
            endDrag() {
                window.removeEventListener('mousemove', this.updateLocation);
                this.$store.dispatch('updateLocation', {location: this.location});
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

<style scoped>
    .location {
        position: absolute;
        user-select: none;
        width: 200px;
        cursor: pointer;
    }

    .statics {
        position: absolute;
        right: 1em;
        top: 1em;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
