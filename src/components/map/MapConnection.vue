<template>
  <div>
    <svg class="lines" pointer-events="visible">
      <path
        v-if="connection.pathString"
        pointer-events="visibleStroke"
        :d="connection.pathString"
        @mouseleave="leaveConnection"
        @mouseenter="enterConnection"
        :style="outerConnectionStyle()"
        :stroke-dasharray="connectionDashArray()"
        stroke-linecap="round"
        @contextmenu.stop
        class="path"
      />

      <path
        v-if="connection.pathString"
        :d="connection.pathString"
        :style="innerConnectionStyle()"
        pointer-events="visibleStroke"
        @mouseleave="leaveConnection"
        @mouseenter="enterConnection"
        @contextmenu.stop
        class="path"
      />
    </svg>
    <div
      class="connection-size"
      v-if="connection.middle.y"
      @mouseleave="leaveConnection"
      @mouseenter="enterConnection"
      :style="
        `top: ${connection.middle.y - 10}px; left: ${connection.middle.x -
          10}px;`
      "
      @contextmenu.stop.prevent="$refs.connectionMenu.open($event)"
    >
      {{ connection.size }}
    </div>

    <ContextMenu
      ref="connectionMenu"
      :config="[
        { title: 'Toggle EOL', icon: 'clock', click: toggleEOL },
        {
          title: 'Status',
          endIcon: 'status',
          click: () => $bvModal.show(`set-connection-status-modal-${connection.key}`),
        },
        {
          title: 'Size',
          endIcon: 'size',
          click: () => $bvModal.show(`set-connection-size-modal-${connection.key}`),
        },
        { title: 'Unlink', icon: 'link', click: unlink },
      ]"
    />

    <b-modal
      :id="`set-connection-status-modal-${connection.key}`"
      centered
      title="Connection Status"
      @ok="setConnectionStatus"
    >
      <form ref="form">
        <b-form-group label="Status" invalid-feedback="Status is required">
          <b-select v-model="connection.status">
            <b-select-option :value="1">Stage 1 (Fresh)</b-select-option>
            <b-select-option :value="2">Stage 2 (Reduced)</b-select-option>
            <b-select-option :value="3">Stage 3 (Critical)</b-select-option>
          </b-select>
        </b-form-group>
      </form>
    </b-modal>
    <b-modal
      :id="`set-connection-size-modal-${connection.key}`"
      centered
      title="Connection Size"
      @ok="setConnectionSize"
    >
      <form ref="form">
        <b-form-group label="Status" invalid-feedback="Size is required">
          <b-select v-model="connection.size">
            <b-select-option value="?" disabled>Unknown (?)</b-select-option>
            <b-select-option value="S">Smallest Ships (S)</b-select-option>
            <b-select-option value="M">Medium Ships (M)</b-select-option>
            <b-select-option value="L">Larger Ships (L)</b-select-option>
            <b-select-option value="XL">Capital Ships (XL)</b-select-option>
          </b-select>
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import ContextMenu from "../ContextMenu";

export default {
  props: ["connection"],
  components: { ContextMenu },
  computed: {
    ...mapGetters(["focusedConnection", "highlightedConnections"]),
  },
  data() {
    return {
      isMouseOver: false,
    };
  },
  methods: {
    outerConnectionStyle() {
      var stroke = this.isMouseOver
        ? "var(--white)"
        : this.connection.eol
        ? "var(--purple)"
        : "#666";
      var strokeW = "10";
      if (this.highlightedConnections.includes(this.connection.key)) {
        stroke = "#ffb10f";
        strokeW = "15";
      }
      return {
        stroke: stroke,
        "stroke-width": strokeW,
        fill: "none",
      };
    },
    innerConnectionStyle() {
      var stroke =
        this.connection.status === 1
          ? "var(--path-stroke)"
          : this.connection.status === 2
          ? "var(--orange)"
          : "var(--red)";
      if (this.highlightedConnections.includes(this.connection.key)) {
        stroke = "var(--orange)";
      }
      return {
        stroke: stroke,
        "stroke-width": "5",
        fill: "none",
      };
    },
    connectionDashArray() {
      switch (this.connection.size) {
        case "S":
          return "5 10";
        case "M":
          return "15 10";
        case "L":
          return "25 10";
        default:
          return "35 10";
      }
    },
    enterConnection() {
      this.isMouseOver = true;
    },
    leaveConnection() {
      this.isMouseOver = false;
    },
    setConnectionSize() {
      this.$store.dispatch("updateConnection", {
        ...this.connection,
      });
      //const idx = this.mappedConnections.findIndex(conn => conn.key == this.focusedConnection.key)
      //this.mappedConnections[idx].size = this.focusedConnection.size
    },
    setConnectionStatus() {
      this.$store.dispatch("updateConnection", {
        ...this.connection,
      });
    },
    toggleEOL() {
      this.$store.dispatch("updateConnection", {
        ...this.connection,
        eol: !this.connection.eol,
        eol_time: this.connection.eol ? null : new Date(),
      });
    },
    async unlink() {
      await this.$store.dispatch("deleteConnection", {
        connection: this.connection,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.lines {
  position: absolute;
  height: 1000px;
  width: 2000px;

  .path-outer {
    stroke: red !important;
  }
}

.path {
  transition: stroke 150ms ease-in-out;
  cursor: pointer;
}

.connection-size {
  position: absolute;
  background-color: var(--dark);
  width: 1.5rem;
  height: 1.5rem;
  text-align: center;
  border-radius: 5px;
  user-select: none;
  cursor: pointer;
}
</style>
