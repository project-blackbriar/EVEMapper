<template>
    <span>
    <slot :securityColor="color"></slot>
    </span>
</template>

<script>
    export default {
        name: "Security",
        props: {
            security: {}
        },
        computed: {
            color() {
                if (this.security === 1) {
                    return '#33F9F9';
                } else if (this.security > 0.9) {
                    return '#4BF3C3';
                } else if (this.security > 0.8) {
                    return '#02F34B';
                } else if (this.security > 0.7) {
                    return '#00FF00';
                } else if (this.security > 0.6) {
                    return '#96F933';
                } else if (this.security > 0.5) {
                    return '#F5F501';
                } else if (this.security > 0.4) {
                    return '#E58000';
                } else if (this.security > 0.3) {
                    return '#F66301';
                } else if (this.security > 0.2) {
                    return '#EB4903';
                } else if (this.security > 0.1) {
                    return '#DC3201';
                } else {
                    return '#F30202';
                }
            }
        }
    };
</script>

<style scoped>

</style>
