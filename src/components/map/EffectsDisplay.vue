<template>
    <span>
    <slot :effectColor="color"></slot>
    </span>
</template>

<script>
    export default {
        name: "EffectsDisplay",
        props: {
            effect: {}
        },
        computed: {
            color() {
                if (this.effect === "blackHole") {
                    return '#000';
                } else if (this.effect === "cataclysmic") {
                    return '#ffb';
                } else if (this.effect === "magnetar") {
                    return '#e06fdf';
                } else if (this.effect === "wolfRayet") {
                    return '#e28a0d';
                } else if (this.effect === "pulsar") {
                    return '#428bca';
                } else if (this.effect === "redGiant") {
                    return '#d9534f';
                } else {
                    return '#777';
                }
            }
        }
    };
</script>

<style scoped>

</style>
