<template>
    <div style="text-align: center;">
        <b-spinner variant="dark" type="grow" label="Spinning" :small="small"></b-spinner>
    </div>
</template>

<script>
    export default {
        name: "Loading",
        props: {
            small: {
                type: Boolean
            }
        }
    };
</script>

<style scoped>

</style>
