<template>

</template>

<script>

    import {mapGetters} from "vuex";

    export default {
        name: 'Home',
        methods: {},
        computed: {
            ...mapGetters(['isLoggedIn'])
        }
    };
</script>
