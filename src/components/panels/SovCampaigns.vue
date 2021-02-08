<template>
  <b-card class="w-100 mt-3">
    <template #header>
      <div class="d-flex justify-content-between">
        <h4>Sov Campaigns</h4>
      </div>
    </template>

    <b-table striped :fields="tableFields" hover small :items="campaigns">
      <template #cell(location)="{index, value}">
        <div @click="plotRoute(value.name)">
        {{ value.name }}
        </div>
      </template>
      <template #cell(distance)="{index, value, item}">
        <div @click="plotRoute(item.location.name)">
          {{ value }}
        </div>
      </template>
      <template #cell(start_time)="{value}">
        {{ value }}
      </template>
      <template #cell(event_type)="{value}">
        {{ value }}
      </template>
      <template #cell(defender)="{value}">
        <div @click="defenderZkill(value)">
          {{ value.name }}
        </div>
      </template>
    </b-table>
  </b-card>
</template>

<script>
import { mapGetters } from "vuex";
import axios from "axios";
const eveUrl = "https://esi.evetech.net/latest/";
const ESI = axios.create({
  baseURL: eveUrl,
});

export default {
  data() {
    return {
      campaigns: [],
      tableFields: [
        {
          key: "location",
          label: "Location",
          tdClass: "code-size",
          sortable: true,
        },
        {
          key: "distance",
          label: "Distance",
          tdClass: "code-size",
          sortable: true,
        },
        {
          key: "start_time",
          label: "Event Time",
          tdClass: "code-size",
          sortable: true,
        },
        {
          key: "event_type",
          label: "Event Type",
          tdClass: "code-size",
          sortable: true,
        },
        {
          key: "defender",
          label: "Defenders",
          tdClass: "code-size",
          sortable: true,
        },
      ],
    };
  },
  watch: {
    campaigns(newVal) {
      console.log(newVal);
    },
  },
  computed: {
    ...mapGetters(["selectedLocation", 'connections']),
  },
  watch: {
    selectedLocation() {
      this.getCampaigns();
    },
  },
  methods: {
    async getCampaigns() {
      ESI.get("sovereignty/campaigns/?datasource=tranquility").then(
        async (response) => {
          const camps = await Promise.all(
            response.data.map(async (item) => {
              //console.log(item);
              const ids = [item.defender_id, item.solar_system_id];
              var processed = {};
              const res = await ESI.post(`universe/names/`, ids);
              const flag = 'shortest'
              let route
              try {
                route = await ESI.get(`/route/${this.selectedLocation.system_id}/${item.solar_system_id}/`, {
                    params: {
                        flag,
                        connections: this.connections.map(con => `${con.from}|${con.to},${con.to}|${con.from}`).join(',')
                    }
                })
              } catch (err) {
                console.log(err.message)
              }
              const distance = route ? `${route.data.length} Jumps` : 'No Route'
              processed = {
                ...item,
                defender: res.data[0],
                location: res.data[1],
                distance: distance
              };
              return processed;
            })
          );
          this.campaigns = camps;
        }
      );
    },
    defenderZkill(defender) {
      if (defender.category === 'alliance') {
        window.open(`https://zkillboard.com/alliance/${defender.id}`, "_blank"); 
      }
      if (defender.category === 'corporation') {
        window.open(`https://zkillboard.com/corporation/${defender.id}`, "_blank"); 
      }
    },
    async plotRoute(destination) {
      await this.$store.dispatch("addRoute", {
        name: destination,
        flag: 'shortest',
      });
      await this.$store.dispatch("getRoutes", {
        origin: this.selectedLocation.system_id,
      });
    }
  },
};
</script>
