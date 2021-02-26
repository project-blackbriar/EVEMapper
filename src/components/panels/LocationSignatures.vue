<template>
  <b-card class="w-100">
    <template #header>
      <div class="d-flex justify-content-between">
        <h4>Signatures</h4>
        <div>
          <b-input v-model="search" placeholder="Search..."></b-input>
        </div>
      </div>
    </template>

    <b-table
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      striped
      :fields="signatureFields"
      hover
      small
      :items="filteredSignatures"
    >
      <template #cell(percent)="{value}">
        <div
          :style="
            `border-radius: 50%; width: 10px; height: 10px; background-color: var(--${
              value.match(new RegExp('100')) ? 'green' : 'red'
            })`
          "
        ></div>
      </template>
      <template #cell(type)="row">
        <div
          @contextmenu.capture.prevent="
            () => {
              focusedSignature = row.item;
              $refs.sigTypeMenu.open($event);
            }
          "
          class="sig-item"
        >
          {{ row.item.type }}
        </div>
      </template>
      <template #cell(name)="{value}">
        {{ value }}
      </template>
      <template #cell(leads)="row">
        <div
          @contextmenu.stop.prevent="
            () => {
              focusedSignature = row.item;
              $refs.leadsToMenu.open($event);
            }
          "
        >
          {{
            row.item.type == "Wormhole"
              ? systemName(row.item.leads) || "--------"
              : ""
          }}
        </div>
      </template>
      <template #cell(created)="{value}">
        <timeago :datetime="new Date(value)" :auto-update="1"></timeago>
      </template>
      <template #cell(updated)="{value}">
        <timeago :datetime="new Date(value)" :auto-update="1"></timeago>
      </template>
      <template #cell(options)="{index}">
        <b-icon-trash class="delete" @click="deleteSig(index)"
          >Delete</b-icon-trash
        >
      </template>
    </b-table>
    <ContextMenu
      ref="leadsToMenu"
      :config="[
        {
          title: 'Leads to',
          endIcon: 'status',
          click: () => $bvModal.show('set-leadsto-system-modal'),
        },
      ]"
    />
    <ContextMenu
      ref="sigTypeMenu"
      inverted="true"
      :config="[
        { title: ' ', icon: 'minus', click: setSigType },
        { title: 'Combat Site', icon: '', click: setSigType },
        { title: 'Relic Site', icon: '', click: setSigType },
        { title: 'Data Site', icon: '', click: setSigType },
        { title: 'Gas Site', icon: '', click: setSigType },
        { title: 'Wormhole', icon: '', click: setSigType },
        { title: 'Ore Site', icon: '', click: setSigType },
        { title: 'Ghost Site', icon: '', click: setSigType },
      ]"
    />
    <b-modal
      id="set-leadsto-system-modal"
      centered
      title="Leads To:"
      @ok="setLeadsToSystem"
    >
      <form ref="form">
        <b-form-group
          label="Connection"
          invalid-feedback="Connection is required"
        >
          <b-select v-if="selectedLocation" v-model="focusedSignature.leads">
            <b-select-option
              v-for="connection in connectionsToID(selectedLocation.system_id)"
              :value="connection"
              :key="connection"
              >{{ systemName(connection) }}</b-select-option
            >
          </b-select>
        </b-form-group>
      </form>
    </b-modal>
  </b-card>
</template>

<script>
import { mapGetters } from "vuex";
import ContextMenu from "../ContextMenu";

export default {
  props: [],
  components: { ContextMenu },
  computed: {
    ...mapGetters(["map", "connections", "selectedLocation"]),
    filteredSignatures() {
      if (this.search !== "") {
        return this.selectedLocation.signatures.filter(
          (val) => val.code.search(new RegExp(this.search, "i")) !== -1
        );
      } else return this.selectedLocation.signatures;
    },
  },
  data() {
    return {
      sortBy: "code",
      sortDesc: false,
      search: "",
      focusedSignature: {},
      sigGroup: [
        "Ore Site",
        "Combat Site",
        "Data Site",
        "Relic Site",
        "Gas Site",
        "Wormhole",
      ],
      signatureFields: [
        {
          key: "percent",
          label: "",
          tdClass: "d-flex align-items-center justify-content-center",
        },
        {
          key: "code",
          tdClass: "code-size",
          sortable: true,
        },
        {
          key: "type",
          tdClass: "text-center",
          sortable: true,
        },
        {
          key: "name",
          tdClass: "text-center",
          sortable: true,
        },
        {
          key: "leads",
          label: "Leads to:",
          tdClass: "text-center",
          sortable: true,
        },
        {
          key: "created",
          tdClass: "text-center",
          sortable: true,
        },
        {
          key: "updated",
          tdClass: "text-center",
          sortable: true,
        },
        {
          key: "options",
          label: "",
          tdClass: "text-center",
        },
      ],
    };
  },
  methods: {
    systemName(id) {
      const loc = this.map.locations.find((loc) => loc.system_id == id);
      return loc ? loc.alias || loc.name : null;
    },
    connectionsToID(id) {
      return this.connections
        .filter((conn) => conn.from == id || conn.to == id)
        .map((connection) => {
          return connection.to == id ? connection.from : connection.to;
        });
    },
    setLeadsToSystem() {
      const idx = this.selectedLocation.signatures.findIndex(
        (sig) => sig.code === this.focusedSignature.code
      );
      this.selectedLocation.signatures[idx] = this.focusedSignature;
      this.saveSelectedLocation();
    },
    setSigType(event) {
      console.log(event.srcElement.outerText);
      this.focusedSignature.type = event.srcElement.outerText.trim();
      const idx = this.selectedLocation.signatures.findIndex(
        (sig) => sig.code === this.focusedSignature.code
      );
      this.selectedLocation.signatures[idx] = this.focusedSignature;
      this.saveSelectedLocation();
    },
    saveSelectedLocation() {
      this.$store.dispatch("updateLocation", {
        location: this.selectedLocation,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.sig-item {
    min-height: 18px;
}
</style>