<template>
    <span>
    <slot :securityColor="color"></slot>
    </span>

</template>

<script>
    export default {
        name: "SecurityDisplay",
        props: {
            security: {}
        },
        computed: {
            color() {
                return this.security === 'C1' || this.security === 'C2' ? '#428bca' : this.security === 'LS' || this.security === 'C4' || this.security === 'C3' ? "#e28a0d" : this.security === 'C5' || this.security === 'C6' || this.security === 'NS' ? '#d9534f' : this.security === 'HS' ? '#5cb85c' : '#000';
            }
        }
    };
</script>

<style scoped>

</style>
