<template>
  <b-card class="mt-3">
    <template #header>
      <h4>Pilots</h4>
    </template>
    <b-container>
      <table class="pilots" style="width: 100%;">
        <tr :key="pilot.CharacterName" v-for="pilot in locationPilots">
          <td class="item" style="color: 'inherit'; width: 40%;">
            {{ pilot.CharacterName }}
          </td>
          <td
            class="item"
            style="color: var(--yellow); width: 40%;"
            v-if="pilot.ship"
          >
            {{ pilot.ship.ship_name }}
          </td>
          <td
            class="item"
            style="color: var(--orange); width: 20%;"
            v-if="pilot.ship"
          >
            {{ pilot.ship.type }}
          </td>
        </tr>
      </table>
    </b-container>
  </b-card>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  props: [],
  computed: {
    ...mapGetters(["pilots", "selectedLocation"]),
    locationPilots() {
      return this.pilots[this.selectedLocation.system_id];
    },
  },
};
</script>

<style lang="scss" scoped>
.pilots {
  .item {
    font-size: 0.8rem;
  }
}
</style>
