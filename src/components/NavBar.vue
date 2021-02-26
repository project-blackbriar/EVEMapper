<template>
    <b-navbar toggleable="lg" type="dark" variant="dark">
        <b-navbar-brand :to="{name : 'Home'}">Artemis - alpha</b-navbar-brand>


        <b-collapse id="nav-collapse" is-nav>
        </b-collapse>

        <b-navbar-nav class="ml-auto">
            <b-nav-item :to="{name: 'SSOLogin'}" v-if="!isLoggedIn">Login</b-nav-item>

            <!--<b-nav-form @submit.prevent="searchThis" v-if="isLoggedIn">
                <b-form-input size="sm" class="mr-sm-2" placeholder="Search" v-model="search"></b-form-input>
                <b-button size="sm" class="my-2 my-sm-0">Search</b-button>
            </b-nav-form>-->
            <b-nav-item v-if="isLoggedIn">
                <span v-if="location">{{location.name}}</span>
                <Loading small v-else>Location</Loading>
            </b-nav-item>


            <b-nav-item-dropdown right v-if="isLoggedIn">
                <!-- Using 'button-content' slot -->
                <template #button-content>
                    <em>{{auth.CharacterName}}</em>
                </template>
                <b-dropdown-item :to="{name: 'Profile'}">Profile</b-dropdown-item>
                <b-dropdown-item :to="{name: 'Logout'}">Logout</b-dropdown-item>
            </b-nav-item-dropdown>
        </b-navbar-nav>
    </b-navbar>
</template>

<script>
    import {mapGetters} from "vuex";
    import Loading from "./Loading";

    export default {
        name: "NavBar",
        components: {Loading},
        computed: {
            ...mapGetters(['isLoggedIn', 'location', 'auth'])
        },
        data() {
            return {
                search: ""
            };
        },
        methods: {
            searchThis() {
                this.$router.push({name: 'Search', params: {query: this.search}});
            }
        }
    };
</script>

<style scoped>

</style>
