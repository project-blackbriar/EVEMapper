<template>
    <div @contextmenu.prevent="$refs.menu.open">
        <SideBarItem :to="{name: 'Map', params: {id: map._id}}">
            <template v-slot:image>
                <b-icon-award></b-icon-award>
            </template>
            <template v-slot:default>
                {{map.name}}
            </template>
            <template v-slot:append v-if="auth.map === map._id ">
                <span class="red">Active</span>
            </template>
        </SideBarItem>

        <ContextMenu v-if="contextConfig && contextConfig.length > 0" ref="menu"
                     :config="contextConfig">
        </ContextMenu>
    </div>
</template>

<script>
    import SideBarItem from "./SideBarItem";
    import ContextMenu from "./ContextMenu";
    import {mapGetters} from "vuex";

    export default {
        name: "MapSideBarItem",
        components: {ContextMenu, SideBarItem},
        props: {
            map: {
                required: true,
                type: Object
            }
        },
        computed: {
            ...mapGetters(['auth']),
            contextConfig() {
                return [this.auth.map !== this.map._id ? {
                    title: 'Set Active',
                    click: this.setActive
                } : undefined].filter(val => val !== undefined);
            }
        },
        methods: {
            setActive() {
                this.$store.dispatch('setActiveMap', this.map);
            }
        }
    };
</script>

<style scoped>

</style>
