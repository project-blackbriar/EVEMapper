<template>
    <span class="static" :style="style">{{st.goes}}</span>
</template>

<script>
    export default {
        name: "StaticDisplay",
        props: {
            st: {
                required: true,
                type: Object
            }
        },
        computed: {
            style() {
                return {
                    color: this.st.goes === 'C1' || this.st.goes === 'C2' ? '#428bca' : this.st.goes === 'LS' || this.st.goes === 'C4' || this.st.goes === 'C3' ? "#e28a0d" : this.st.goes === 'C5' || this.st.goes === 'C6' || this.st.goes === 'NS' ? '#d9534f' : this.st.goes === 'HS' ? '#5cb85c' : '#000'
                };
            }
        }
    };
</script>

<style scoped>
    .static {

    }
</style>
