<template>
    <b-card
            v-show="isVisible"
            class="lil-context-menu"
            :style="style"
            tabindex="-1"
            @blur="close"
            @click="close"
            :title="title"
            @contextmenu.capture.prevent>
        <div class="context-menu-item" @contextmenu.stop v-for="child in config" @click="child.click">
            <b-icon :icon="child.icon"/>
            <span> {{child.title}}</span>
            <b-icon class="append" :icon="child.endIcon"/>
        </div>
    </b-card>
</template>

<script>
    import Vue from 'vue';

    export default {
        name: 'ContextMenu', props: {
            title: {},
            config: {
                type: Array,
                required: true
            }
        },
        data() {
            return {
                x: null,
                y: null,
                userData: null
            };
        },
        computed: {
            style() {
                return this.isVisible ? {
                    top: this.y - document.body.scrollTop + 'px',
                    left: this.x + 'px'
                } : {};
            },
            isVisible() {
                return this.x !== null && this.y !== null;
            }
        },
        methods: {
            open(evt, userData) {
                this.x = evt.pageX || evt.clientX;
                this.y = evt.pageY || evt.clientY;
                this.userData = userData;
                Vue.nextTick(() => this.$el.focus());
            },
            close(evt) {
                this.x = null;
                this.y = null;
                this.userData = null;
            }
        }
    };
</script>

<style scoped lang="scss">

    .card-body {
        padding: 0;
    }

    .lil-context-menu {
        position: fixed;
        z-index: 999;


        .context-menu-item {
            cursor: pointer;
            user-select: none;
            padding: 10px;
            border-radius: 2px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            &:hover {
                background-color: rgba(0, 0, 0, 0.2);
            }

            .append {
                text-align: right;
            }
        }
    }

    .lil-context-menu:focus {
        outline: none;
    }
</style>
