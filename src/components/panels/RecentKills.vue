<template>
  <b-card class="mt-3">
    <template #header>
      <h4>Recent Kills (last 24h)</h4>
    </template>
    <b-container>
      <table class="killmails" style="width: 100%;">
        <tr>
          <th class="km-header">Victim</th>
          <th class="km-header" style="text-align: center;">Killmail</th>
          <th class="km-header" style="text-align: right;">Attacker</th>
        </tr>
        <tr :key="kill.killmail_id" v-for="kill in selectedLocation.kills">
          <td class="km-row" style="width: 40%; text-align: right;">
            <a
              v-b-tooltip.hover
              :title="kill.victim.corporation.name"
              :href="
                `https://zkillboard.com/corporation/${kill.victim.corporation.id}/`
              "
            >
              <img
                class="ml-1 mr-1 icon-hover km-thumb"
                :src="
                  `https://images.evetech.net/corporations/${kill.victim.corporation.id}/logo?size=64`
                "
              />
            </a>
            <a
              v-b-tooltip.hover
              :title="kill.victim.character.name"
              :href="
                `https://zkillboard.com/character/${kill.victim.character.id}/`
              "
            >
              <img
                class="ml-1 mr-1 icon-hover km-thumb"
                :src="
                  `https://images.evetech.net/characters/${kill.victim.character.id}/portrait?size=64`
                "
              />
            </a>
            <a
              v-b-tooltip.hover
              :title="kill.victim.inventory_type.name"
              :href="
                `https://zkillboard.com/ship/${kill.victim.inventory_type.id}/`
              "
            >
              <img
                class="ml-1 mr-1 icon-hover km-thumb"
                :src="
                  `https://images.evetech.net/types/${kill.victim.inventory_type.id}/render?size=64`
                "
              />
            </a>
          </td>
          <td style="color: var(--yellow); width: 10%; text-align: center;">
            <a
              v-b-tooltip.hover
              title="Killmail"
              :href="`https://zkillboard.com/kill/${kill.killmail_id}/`"
            >
              <i
                class="fas fa-skull-crossbones fa-3x"
                style="color: #a52521"
              ></i>
            </a>
          </td>
          <td
            class="km-row"
            style="color: var(--orange); width: 40%;"
            v-if="kill.attackers.faction"
          >
            <a
              v-b-tooltip.hover
              :title="
                `${kill.attackers.inventory_type.name} - ${kill.attackers.faction.name}`
              "
              :href="
                `https://zkillboard.com/ship/${kill.attackers.inventory_type.id}/`
              "
            >
              <img
                class="ml-1 mr-1 icon-hover km-thumb"
                :src="
                  `https://images.evetech.net/types/${kill.attackers.inventory_type.id}/render?size=64`
                "
              />
            </a>
          </td>
          <td class="km-row" style="color: var(--orange); width: 40%;" v-else>
            <a
              v-b-tooltip.hover
              :title="kill.attackers.inventory_type.name"
              :href="
                `https://zkillboard.com/ship/${kill.attackers.inventory_type.id}/`
              "
            >
              <img
                class="ml-1 mr-1 icon-hover km-thumb"
                :src="
                  `https://images.evetech.net/types/${kill.attackers.inventory_type.id}/render?size=64`
                "
              />
            </a>
            <a
              v-b-tooltip.hover
              :title="kill.attackers.character.name"
              :href="
                `https://zkillboard.com/character/${kill.attackers.character.id}/`
              "
            >
              <img
                class="ml-1 mr-1 icon-hover km-thumb"
                :src="
                  `https://images.evetech.net/characters/${kill.attackers.character.id}/portrait?size=64`
                "
              />
            </a>
            <a
              v-b-tooltip.hover
              :title="kill.attackers.corporation.name"
              :href="
                `https://zkillboard.com/corporation/${kill.attackers.corporation.id}/`
              "
            >
              <img
                class="ml-1 mr-1 icon-hover km-thumb"
                :src="
                  `https://images.evetech.net/corporations/${kill.attackers.corporation.id}/logo?size=64`
                "
              />
            </a>
          </td>
        </tr>
      </table>
    </b-container>
  </b-card>
</template>

<script>
import {mapGetters} from "vuex";

export default {
    props: [],
    computed: {
        ...mapGetters(['selectedLocation'])
    }
}
</script>

<style lang="scss" scoped>
.km-header {
    border-bottom: 1px solid black;
}
.km-row {
    height: 74px;
    min-width: 180px;
}
.km-thumb {
    height: 50px; width:50px;
}

</style>