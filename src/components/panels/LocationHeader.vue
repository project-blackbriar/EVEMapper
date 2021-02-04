<template>
  <b-card>
    <template #header>
      <h4>
        {{ selectedLocation.name }}
        <a
          target="_blank"
          :href="`https://evemaps.dotlan.net/system/${selectedLocation.name}`"
          v-b-tooltip.hover
          title="dotlan"
        >
          <img
            class="ml-1 mr-1 icon-hover"
            style="height: 20px; width:20px"
            src="../../assets/logo_dotlan.png"
        /></a>
        <a
          target="_blank"
          :href="`https://anoik.is/systems/${selectedLocation.name}`"
          v-b-tooltip.hover
          title="Anoik.is"
        >
          <img
            class="ml-1 mr-1 icon-hover"
            style="height: 20px; width:20px"
            src="../../assets/logo_anoik.png"
        /></a>
        <a
          target="_blank"
          :href="`https://zkillboard.com/system/${selectedLocation.system_id}`"
          v-b-tooltip.hover
          title="zKillboard"
        >
          <img
            class="ml-1 mr-1 icon-hover"
            style="height: 20px; width:20px"
            src="../../assets/logo_zkill.png"
        /></a>
      </h4>
    </template>
    <b-container>
      <div>
        <div
          v-for="st in selectedLocation.statics"
          :key="st.code"
          style="float: left; margin: 0 0.5rem;"
        >
          <SecurityDisplay :security="st.goes">
            <template v-slot="{ securityColor }">
              <h6 style="color: white;">
                {{ st.code }}:
                <span :style="{ color: securityColor }">{{ st.goes }} </span>
              </h6>
            </template>
          </SecurityDisplay>
        </div>
      </div>
    </b-container>
  </b-card>
</template>

<script>
import {mapGetters} from "vuex";
import SecurityDisplay from "../map/SecurityDisplay";

export default {
    components: {SecurityDisplay},
    computed: {
        ...mapGetters(['selectedLocation'])
    }
}
</script>
