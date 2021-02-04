<template>
  <div>
    <b-card class="mt-3">
      <template #header>
        <h4>
          Routes
          <a
            class="green float-right ml-2"
            @click.prevent="$bvModal.show('add-route-modal')"
            href="#"
            v-b-tooltip.hover
            title="Add"
          >
            <b-icon-plus-circle class="icon-hover"></b-icon-plus-circle>
          </a>
        </h4>
      </template>
      <b-container>
        <b-table
          striped
          :fields="routeFields"
          hover
          small
          :items="routes"
          @row-clicked="routeClick"
        >
          <template #cell(systems)="{value}">
            <div v-if="typeof value === 'string'">No Route Found</div>
            <Security
              v-else
              :security="system.security_status"
              :key="system.system_id"
              v-for="system in value"
            >
              <template v-slot="{ securityColor }">
                <a
                  v-if="system.type === 'WH'"
                  v-b-tooltip.hover
                  :title="system.name + ' (' + system.connection_size + ')'"
                >
                  <b-icon-distribute-vertical
                    class="ml-1"
                    :style="{ color: sizeColor(system.connection_size) }"
                  ></b-icon-distribute-vertical>
                </a>
                <a
                  v-else
                  v-b-tooltip.hover
                  :title="
                    system.name +
                      ' (' +
                      Math.floor(system.security_status * 10) / 10 +
                      ')'
                  "
                >
                  <b-icon-square-fill
                    v-if="system.type === 'K'"
                    :style="{ color: securityColor }"
                    class="ml-1"
                  ></b-icon-square-fill>
                  <b-icon-plus-circle-fill
                    v-else
                    :style="{ color: securityColor }"
                    class="ml-1"
                  ></b-icon-plus-circle-fill>
                </a>
              </template>
            </Security>
          </template>
          <template #cell(options)="{index}">
            <b-icon-trash class="delete" @click="removeRoute(index)"
              >Delete</b-icon-trash
            >
          </template>
        </b-table>
      </b-container>
    </b-card>
    <b-modal id="add-route-modal" centered title="Add System" @ok="addRoute">
      <form ref="form" @submit.prevent>
        <b-form-group
          label="Name"
          label-for="name-input"
          invalid-feedback="Name is required"
        >
          <b-form-input
            id="name-input"
            v-model="routeName"
            required
            @keydown.enter="addRoute"
          ></b-form-input>
        </b-form-group>
        <b-form-group
          label="Flag"
          label-for="name-input" 
          invalid-feedback="Flag is required"
        >
          <b-select v-model="routeFlag">
            <b-select-option value="shortest">Shortest</b-select-option>
            <b-select-option value="secure">Secure</b-select-option>
            <b-select-option value="insecure">Insecure</b-select-option>
          </b-select>
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Security from "../map/Security";

export default {
  components: { Security },
  props: [],
  computed: {
    ...mapGetters(["routes", 'selectedLocation']),
  },
  data() {
    return {
      routeName: "J160941",
      routeFlag: "shortest",
      routeFields: [
        {
          key: "destination.name",
          label: "Destination",
          tdClass: "d-flex align-items-center justify-content-center",
        },
        {
          key: "flag",
          label: "Flag",
          tdClass: "text-capitalize",
        },
        {
          key: "systems",
          label: "Route",
        },
        {
          key: "options",
          label: "",
          tdClass: "d-flex align-items-center justify-content-center",
        },
      ],
    };
  },
  methods: {
    sizeColor(size) {
      if (size == "XL") {
        return "#DC3201";
      } else if (size == "L") {
        return "#F5F501";
      } else if (size == "M") {
        return "#00FF00";
      } else if (size == "S") {
        return "#33F9F9";
      } else {
        return "#888";
      }
    },
    routeClick(row, idx) {
      const highlightedConnections = row.systems
        .filter((sys) => sys.type == "WH")
        .map((sys) => sys.key);
      const highlightedLocations = row.systems
        .filter((sys) => sys.type == "K" || sys.type == "J")
        .map((sys) => sys.system_id);
      this.$store.commit("setHighlightedLocations", highlightedConnections);
      this.$store.commit("setHighlightedConnections", highlightedConnections);
      setTimeout(() => {
        window.addEventListener("click", this.clearHighlight);
      }, 500);
    },
    clearHighlight() {
      this.$store.commit("setHighlightedLocations", []);
      this.$store.commit("setHighlightedConnections", []);
      window.removeEventListener("click", this.clearHighlight);
    },
    async removeRoute(index) {
      const route = this.routes[index];
      await this.$store.dispatch("removeRoute", {
        name: route.destination.system_id,
        flag: route.flag,
      });
      await this.$store.dispatch("getRoutes", {
        origin: this.selectedLocation.system_id,
      });
    },
    async addRoute() {
      await this.$store.dispatch("addRoute", {
        name: this.routeName,
        flag: this.routeFlag,
      });
      await this.$store.dispatch("getRoutes", {
        origin: this.selectedLocation.system_id,
      });
    },
  },
};
</script>

<style scoped lang="scss">
.delete {
  color: var(--red);

  &:hover {
    color: red;
  }
}
</style>
