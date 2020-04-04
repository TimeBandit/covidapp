<template>
  <div class="home">You are home</div>
</template>

<script lang="ts">
// @ is an alias to /src
import { Report, Region } from "@/api/Report";
import Api from "@/api/Api";
import { Vue, Component, Prop } from "vue-property-decorator";

// Vue Components.
@Component({
  components: {}
})
export default class Home extends Vue {
  // Props.
  // Refs.
  // Data.
  private reports: Report[] = [];
  private regions: Region[] = [];
  // Computed properties (written as getters).
  // Custom methods.
  // Watchers.
  // Hooks (lifecycle, custom, etc...).
  async loadData() {
    this.reports = await Api.getInstance().reports();
    this.regions = await Api.getInstance().regions();
    // console.log(this.reports);
    // this.regions = await Api.getInstance().regions();
  }
  mounted() {
    console.log("mounted");
    this.loadData();
  }
}
</script>
