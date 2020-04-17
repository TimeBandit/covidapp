<template>
  <l-map :zoom="zoom" :bounds="bounds" style="height: 500px; width: 100%">
    <l-tile-layer :url="url" :attribution="attribution" />
    <l-geo-json v-if="show" :geojson="geojson" :options="options" :options-style="styleFunction" />
  </l-map>
</template>

<script lang="ts">
enum MetricType {
  ABSOLUTE = "ABSOLUTE",
  NORMALISED = "NORMALISED"
}

// @ is an alias to /src
import Api from "@/api/Api";
import { Report, Region } from "@/api/Report";
import * as topoClient from "topojson-client";
import { Topology, TopoJSON } from "topojson-specification";
import * as geojson from "geojson";
import { latLng } from "leaflet";
import { LMap, LTileLayer, LGeoJson } from "vue2-leaflet";
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import L, { LatLngBounds, latLngBounds, FeatureGroup } from "leaflet";

const TOPO_JSON_FILE_AND_OBJECT_NAME =
  "Counties_and_Unitary_Authorities_April_2019_Boundaries_EW_BGC";
const TOPO_AREA_KEY = "ctyua19cd";
const api = Api.getInstance();

// Vue Components.
@Component({
  components: { LMap, LTileLayer, LGeoJson }
})
export default class Home extends Vue {
  // Props.
  // Refs.
  // Data.
  private zoom = 6;
  private loading = false;
  private show = false;
  private reports: { [key: string]: Report } = {};
  private regions: { [key: string]: Region } = {};
  private geojson: geojson.FeatureCollection = {
    type: "FeatureCollection",
    features: []
  };
  private bounds: LatLngBounds | null = null;
  private maxBounds: LatLngBounds | null = null;
  private metricType: MetricType = MetricType.NORMALISED;
  private url =
    "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png";
  private attribution =
    "Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.";

  // Computed properties (written as getters).
  get options() {
    return {
      // onEachFeature: this.onEachFeatureFunction
    };
  }
  get styleFunction() {
    return f => {
      const areaCode = f.properties[TOPO_AREA_KEY];
      const value = this.calculateDisplayValue(areaCode);
      const fillColor = this.getFillColour(value);

      return {
        weight: 1,
        color: "#ECEFF1",
        opacity: 0.8,
        fillColor,
        fillOpacity: 0.7
      };
    };
  }
  get onEachFeatureFunction() {
    return (feature, layer) => {
      const value = this.calculateDisplayValue(
        this.regions[feature.properties[TOPO_AREA_KEY]]?.areaCode
      );

      layer.bindTooltip(
        "<div><strong>" +
          this.regions[feature.properties[TOPO_AREA_KEY]]?.areaName +
          "</strong><span> " +
          Number(value).toFixed(1) +
          "</span></div>",
        { permanent: false, sticky: true }
      );
    };
  }
  // Custom methods.
  private calculateDisplayValue(areaCode: string): number {
    // should become a factory if it get too large
    const report = this.reports[areaCode];
    const region = this.regions[areaCode];
    if (!report) {
      console.warn(`${1586086552}: report not found for ${areaCode}`);
      return -1;
    }

    switch (this.metricType) {
      case MetricType.NORMALISED:
        if (!region) {
          console.warn(`${1586087212}: region not found for ${areaCode}`);
          return -1;
        }
        return (Number(report.metricValue) * 100) / Number(region.population);
      case MetricType.ABSOLUTE:
        return Number(report.metricValue);
      default:
        throw new Error(
          `${1586083073}: an error occoured when trying to calculate a value`
        );
    }
  }
  private getFillColour(metricValue: number) {
    return metricValue > 500
      ? "#d73027"
      : metricValue > 200
      ? "#fc8d59"
      : metricValue > 100
      ? "#fee08b"
      : metricValue > 50
      ? "#ffffbf"
      : metricValue > 20
      ? "#d9ef8b"
      : metricValue > 10
      ? "#91cf60"
      : metricValue >= 0
      ? "#1a9850"
      : "#f0f0f0"; // grey for no data
  }

  private async loadData() {
    console.info("loading data from the web...");
    this.loading = true;

    const reports = await api.getReports();
    reports.forEach(report => {
      this.$set(this.reports, report.areaCode, report);
    });

    const regions = await api.getRegions();
    regions.forEach(region => {
      this.$set(this.regions, region.areaCode, region);
    });
    this.show = true;
    this.loading = false;
  }
  private async generateGeoJson() {
    this.loading = true;
    // set geojson
    // TODO remove the use of 'any' type
    console.info("parsing topo files...");
    const topoJson: any = await import(
      `../assets/${TOPO_JSON_FILE_AND_OBJECT_NAME}.json`
    );

    try {
      // conver the topo to a geojson for leaflet to use
      const geo: geojson.FeatureCollection = topoClient.feature(
        topoJson,
        topoJson.objects[TOPO_JSON_FILE_AND_OBJECT_NAME]
      );
      this.geojson = geo;
    } catch (error) {
      console.error(`${1586000371}: ${error}`);
    }

    // set bounds
    const [west, south, east, north] = topoClient.bbox(topoJson);
    // TODO remove maxBounds in favour of bounds
    this.bounds = this.maxBounds = latLngBounds([
      [south, west],
      [north, east]
    ]);
    this.loading = false;
  }
  // Watchers.

  // Hooks (lifecycle, custom, etc...).
  created() {
    this.generateGeoJson();
    this.loadData();
  }
}
</script>
<style lang="css">
html,
body {
  height: 100%;
  margin: 0;
}

#map {
  width: 600px;
  height: 400px;
}
</style>
