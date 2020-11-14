<template>
    <router-link v-if="to" :to="to" class="no-decoration">
        <div @click="$emit('click')" @contextmenu.prevent="toggleContext"
             :class="{'sidebar-item': true, 'active': isActive}">
            <slot name="image"></slot>
            <slot></slot>
            <span class="append">
            <slot name="append"></slot>
        </span>
        </div>
    </router-link>
    <div v-else>
        <div @click="$emit('click')" @contextmenu.prevent="toggleContext"
             :class="{'sidebar-item': true, 'active': isActive}">
            <slot name="image"></slot>
            <slot></slot>
            <span class="append">
                <slot name="append"></slot>
            </span>
        </div>
        <span class="children">
            <slot name="children"></slot>
        </span>
    </div>
</template>

<script>

    export default {
        name: "SideBarItem",
        props: {
            to: {
                required: false,
                type: Object
            }
        },
        data() {
            return {
                showContext: true,
                contextX: 0,
                contextY: 0
            };
        },
        computed: {
            isActive() {
                return this.$router.currentRoute === this.to;
            }
        },
        methods: {
            toggleContext(event) {
                this.showContext = true;
            }
        }
    };
</script>

<style scoped lang="scss">
    .sidebar-item {
        padding: 10px 0 10px 10px;
        cursor: pointer;
        user-select: none;
        text-decoration-line: none !important;
        position: relative;

        &:hover {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 1px;
        }

        .append {
            position: absolute;
            right: 1em
        }
    }

    .children {
        position: absolute;
        left: 1em;
        width: calc(100% - 1em);
    }

    .context {
        position: absolute;
    }

    .no-decoration {
        text-decoration: none;
    }
</style>
