<template>
    <b-card no-body
            v-show="isVisible"
            class="lil-context-menu"
            :style="style"
            tabindex="-1"
            @blur="close"
            @click="close"
            :title="title"
            @contextmenu.capture.prevent>
        <div :class="{
                'context-menu-item' : true,
                [child.class] : true
             }" @contextmenu.stop v-for="child in config" @click="child.click">
            <b-icon v-if="child.icon" :icon="child.icon"/>
            <span> {{child.title}}</span>
            <b-icon v-if="child.endIcon" class="append" :icon="child.endIcon"/>
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
            },
            inverted: false
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
                const offset = this.inverted ? this.config.length * 29 : 0
                this.x = (evt.pageX || evt.clientX) - window.scrollX;
                this.y = (evt.pageY || evt.clientY) - window.scrollY - offset;
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
        min-width: 120px;
        font-size: 0.8rem;

        .context-menu-item {
            cursor: pointer;
            user-select: none;
            padding: 5px 10px;
            border-radius: 2px;

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
