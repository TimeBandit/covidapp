<template>
  <div class="home">You are home</div>
</template>

<script lang="ts">
enum MetricType {
  ABSOLUTE = "ABSOLUTE",
  NORMALISED = "NORMALISED"
}

// @ is an alias to /src
import { Report, Region } from "@/api/Report";
import Api from "@/api/Api";
import L, { LatLngBounds, latLngBounds } from "leaflet";
import * as topoClient from "topojson-client";
import { Topology, TopoJSON } from "topojson-specification";
import { Vue, Component, Prop } from "vue-property-decorator";

const TOPO_JSON_FILE_AND_OBJECT_NAME =
  "Counties_and_Unitary_Authorities_April_2019_Boundaries_EW_BGC";
const TOPO_AREA_KEY = "ctyua19cd";
const api = Api.getInstance();

// Vue Components.
@Component({
  components: {}
})
export default class Home extends Vue {
  // Props.
  // Refs.
  // Data.
  private loading = false;
  private reportsCount = 0;
  private regionsCount = 0;
  private reports: Report[] = [];
  private regions: Region[] = [];
  private geojson: any | null = null;
  private bounds: LatLngBounds | null = null;
  private maxBounds: LatLngBounds | null = null;
  private metricType: MetricType = MetricType.NORMALISED;

  // Computed properties (written as getters).
  get regionsMap(): Map<string, Region> {
    console.log("generating map");

    const result = new Map<string, Region>();
    this.regions.forEach(region => {
      result.set(region.areaCode, region);
    });
    return result;
  }
  get reportsMap(): Map<string, Report> {
    const result = new Map<string, Report>();
    this.reports.forEach(report => {
      result.set(report.areaCode, report);
    });
    return result;
  }
  get choroplethGeoJsonData() {
    const geoJson = JSON.parse(JSON.stringify(this.geojson));
    if (!this.regionsCount) {
      return {};
    }
    geoJson.features.forEach(feature => {
      const oldFeatureProperties = feature.properties;
      let report: Report | undefined;
      let region: Region | undefined;

      if (TOPO_AREA_KEY in oldFeatureProperties) {
        report = this.reportsMap.get(oldFeatureProperties[TOPO_AREA_KEY]);
        region = this.regionsMap.get(oldFeatureProperties[TOPO_AREA_KEY]);
      }

      if (!report) {
        console.warn(
          `${1586084051}: no report found for ${
            oldFeatureProperties[TOPO_AREA_KEY]
          }`
        );
        return;
      }
      if (!region) {
        console.warn(
          `${1586087764}: no region found for ${
            oldFeatureProperties[TOPO_AREA_KEY]
          }`
        );
        return;
      }

      // TODO make an interface here that combines the interfaces
      const newFeatureProperties = {
        areaCode: report.areaCode,
        areaName: region.areaName,
        metricValue: this.getMetricValue(
          this.metricType,
          oldFeatureProperties[TOPO_AREA_KEY]
        )
      };
      feature.properties = newFeatureProperties;
    });

    return geoJson;
  }

  // Custom methods.
  private getMetricValue(type: MetricType, areaCode: string): string {
    // switch statements to get the
    // this should become a factory if it get too large
    const report = this.reportsMap.get(areaCode);
    const region = this.regionsMap.get(areaCode);
    if (!report) {
      throw new Error(`${1586086552}: report not found`);
    }
    if (!region) {
      throw new Error(`${1586087212}: region not found`);
    }

    switch (type) {
      case MetricType.NORMALISED:
        return (
          (Number(report.metricValue) * 100) / Number(region.population) + ""
        );
      case MetricType.ABSOLUTE:
        return report.metricValue;
      default:
        throw new Error(
          `${1586083073}: an error occoured when trying to calculate a value`
        );
    }
  }
  private async loadData() {
    this.loading = true;

    this.reports = await api.reports();
    this.reportsCount = this.reports.length;

    this.regions = await api.regions();
    this.regionsCount = this.regions.length;

    this.loading = false;
    console.log("finished loading data");
  }

  async generateGeoJson() {
    this.loading = true;
    // set geojson
    // TODO remove the use of 'any' type
    const topoJson: any = await import(
      `../assets/${TOPO_JSON_FILE_AND_OBJECT_NAME}.json`
    );
    let geo;
    try {
      // conver the topo to a geojson for leaflet to use
      geo = topoClient.feature(
        topoJson,
        topoJson.objects[TOPO_JSON_FILE_AND_OBJECT_NAME]
      );
    } catch (error) {
      console.log(`${1586000371}: ${error}`);
    }
    this.geojson = geo;

    // set bounds
    const [west, south, east, north] = topoClient.bbox(topoJson);
    this.bounds = this.maxBounds = latLngBounds([
      [south, west],
      [north, east]
    ]);
    this.loading = false;
    console.log("finished parsing geojson");
  }

  // Watchers.
  // Hooks (lifecycle, custom, etc...).

  mounted() {
    console.log("mounted");
    this.generateGeoJson();
    this.loadData();
  }
}
</script>
