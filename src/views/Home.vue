<template>
  <l-map :zoom="zoom" :bounds="bounds" :maxBounds="bounds" style="height: 500px; width: 100%">
    <l-tile-layer :url="url" :attribution="attribution" />
    <l-geo-json v-if="reports.length>0" ref="lgeojson" :geojson="geojson" :options="options" />
  </l-map>
</template>

<script lang="ts">
enum MetricType {
  ABSOLUTE = "ABSOLUTE",
  NORMALISED = "NORMALISED"
}

// @ is an alias to /src
import { Report, Region } from "@/api/Report";
import { LMap, LTileLayer, LGeoJson } from "vue2-leaflet";
import { Vue, Component, Watch, Ref } from "vue-property-decorator";
import L, { LatLngBounds } from "leaflet";
import { AppModule } from "@/store/modules/app/AppModule";
import { GeometryModule } from "../store/modules/geometry/GeometryModule";
import { RegionsModule } from "../store/modules/regions/RegionsModule";
import { ReportsModule } from "../store/modules/reports/ReportsModule";

const TOPO_AREA_KEY = "ctyua19cd";

interface LayerWithFeature extends L.Layer {
  feature?: GeoJSON.Feature;
}
// Vue Components.
@Component({
  components: { LMap, LTileLayer, LGeoJson }
})
export default class Home extends Vue {
  // Props.
  // Refs.
  @Ref("lgeojson") readonly lgeojson!: LGeoJson;
  // Data.
  private zoom = 6;
  private loading = false;
  private show = false;
  private metricType: MetricType = MetricType.NORMALISED;
  private url =
    "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png";
  private attribution =
    "Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.";
  // Computed properties (written as getters).
  get geojson(): GeoJSON.GeoJSON {
    return GeometryModule.geojson;
  }
  get regions(): Region[] {
    return RegionsModule.regions;
  }
  get reports(): Report[] {
    return ReportsModule.reports;
  }
  get bounds(): LatLngBounds {
    return GeometryModule.bounds;
  }
  get options() {
    return {
      onEachFeature: this.onEachFeatureFunction
    };
  }

  get onEachFeatureFunction() {
    return (feature: GeoJSON.Feature, layer: L.Layer) => {
      if (feature?.properties?.hasOwnProperty(TOPO_AREA_KEY)) {
        // TODO repeat code
        // https://github.com/TimeBandit/covidapp/projects/1#card-37197001
        const areaCode = feature.properties[TOPO_AREA_KEY];
        const report: Report | undefined = this.reports.find(
          report => report.areaCode === areaCode
        );
        const region: Region | undefined = this.regions.find(
          region => region.areaCode === areaCode
        );

        const value =
          !report || !region ? -1 : this.calculateDisplayValue(report, region);
        layer.bindTooltip(
          "<div><strong>" +
            region?.areaName +
            "</strong><span> " +
            Number(value).toFixed(1) +
            "</span></div>",
          { permanent: false, sticky: true }
        );
      }
    };
  }
  // Custom methods.
  private calculateDisplayValue(report: Report, region: Region): number {
    // should become a factory if it get too large
    switch (this.metricType) {
      case MetricType.NORMALISED:
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

  // Watchers.
  @Watch("reports")
  onChildChanged() {
    if (this.reports.length > 0) {
      this.$nextTick(() => {
        if (this?.lgeojson?.mapObject) {
          this.lgeojson.mapObject.eachLayer((layer: LayerWithFeature) => {
            if (layer.feature?.properties?.hasOwnProperty(TOPO_AREA_KEY)) {
              // TODO search for each area key can be optimized
              const areaCode = layer.feature.properties[TOPO_AREA_KEY];
              const report: Report | undefined = this.reports.find(
                report => report.areaCode === areaCode
              );
              const region: Region | undefined = this.regions.find(
                region => region.areaCode === areaCode
              );
              const value =
                !report || !region
                  ? -1
                  : this.calculateDisplayValue(report, region);

              const fillColor = this.getFillColour(value);
              layer.setStyle({
                weight: 1,
                color: "#ECEFF1",
                opacity: 0.8,
                fillColor,
                fillOpacity: 0.7
              });
            }
          });
        }
      });
    }
  }

  // Hooks (lifecycle, custom, etc...).
  created() {
    AppModule.fetchData();
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
